import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

from langfuse import observe

from models.agents import FollowUpRequest
from utils.auth import get_current_doctor
from utils.openai_client import openai_client
from rag.rag_service import RAGService
from models.agents import AIOverviewResponse, MedicationsRequest, OverviewPromptResponse, OverviewRequest
from utils.cache import cache, hash_key
from utils.limiter import limiter
from services.agent_service import agent_service
from services.patient_service import visit_repository
from services.google_calendar_service import create_event as create_calendar_event_for_doctor

load_dotenv()

rag = RAGService()

@observe(as_type="span")
def schedule_visit_db(
    patient_serial_number: str,
    doctor_serial_number: str,
    visit_date: str,
    visit_type: str,
    chief_complaint: str,
    duration_minutes: int = 30,
):
    # Use the visit repository to create the visit with specific date and status
    visit_id = visit_repository.create_visit(
        patient_serial_number=patient_serial_number,
        doctor_serial_number=doctor_serial_number,
        visit_type=visit_type,
        location="Clinic A",  # Hardcoded to maintain existing behavior
        visit_date=visit_date,
        status="scheduled",   # As per original implementation
        chief_complaint=chief_complaint
    )
    
    # Note: duration_minutes is not currently used in the visit creation
    # In a full implementation, we would update the visit duration after creation
    # or modify the repository to accept this parameter
    return str(visit_id) if visit_id else None


tools = [
    {
        "type": "function",
        "function": {
            "name": "schedule_visit_db",
            "description": "Save the scheduled visit to the PostgreSQL database",
            "parameters": {
                "type": "object",
                "properties": {
                    "patient_serial_number": {
                        "type": "string",
                        "description": "Patient serial number",
                    },
                    "doctor_serial_number": {
                        "type": "string",
                        "description": "Doctor serial number",
                    },
                    "visit_date": {
                        "type": "string",
                        "description": "Visit date and time in ISO 8601 format",
                    },
                    "visit_type": {
                        "type": "string",
                        "description": "Type of visit (e.g., followup, checkup)",
                    },
                    "chief_complaint": {
                        "type": "string",
                        "description": "Chief complaint or reason for visit",
                    },
                    "duration_minutes": {
                        "type": "integer",
                        "description": "Duration of visit in minutes (default 30)",
                    },
                },
                "required": [
                    "patient_serial_number",
                    "doctor_serial_number",
                    "visit_date",
                    "visit_type",
                    "chief_complaint",
                ],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_calendar_event",
            "description": "Create a Google Calendar event for the follow-up appointment",
            "parameters": {
                "type": "object",
                "properties": {
                    "summary": {"type": "string", "description": "Patient serial number"},
                    "start_time": {
                        "type": "string",
                        "description": "Start time in ISO 8601 format",
                    },
                    "end_time": {
                        "type": "string",
                        "description": "End time in ISO 8601 format",
                    },
                    "description": {
                        "type": "string",
                        "description": "Event description",
                    },
                },
                "required": ["summary", "start_time", "end_time"],
            },
        },
    },
]

router = APIRouter(
    prefix="/agents",
    tags=["agents"],
)


@router.get("/overview/{patient_serial}", response_model=AIOverviewResponse)
@observe()
@limiter.limit("2/minute")
async def get_overview(http_request: Request, patient_serial: str, doctor: dict = Depends(get_current_doctor)):
    cache_key = f"overview:{patient_serial}"
    cached = cache.get(cache_key)

    if cached:
        return cached

    docs = rag.get_patient_overview(patient_serial=patient_serial)

    # Get patient overview data using the service layer
    patient_data = agent_service.get_patient_overview_data(patient_serial)
    
    if not patient_data:
        raise ValueError(
            f"Patient with serial number {patient_serial} not found in database."
        )

    prompt = build_prompt(patient_data, docs)

    response = openai_client.chat.completions.create(
        model="gemini-3.1-flash-lite",
        messages=[
            {
                "role": "system",
                "content": "You are a clinical briefing assistant. Provide concise, accurate overviews for patients. Return only valid JSON.",
            },
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.0,
    )

    llm_output = json.loads(response.choices[0].message.content)

    result = {
        "patient_serial": patient_serial,
        "ai_overview": llm_output,
        "chroma_sources": len(docs),
    }

    cache.set(cache_key, result)

    return result


@router.post("/recommendations")
@observe()
@limiter.limit("2/minute")
async def get_recommendations(http_request: Request, request: OverviewRequest, doctor: dict = Depends(get_current_doctor)):
    if not request.overview:
        raise HTTPException(status_code=400, detail="Overview is required")

    cache_key = f"recommendations:{hash_key(request.overview)}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    prompt = f"""
        Based on this overview, provide patient recommendations: {request.overview}.

        Return only valid JSON with the following format:
        {{
            "recommendations": [
                {{
                    "recommendation": "string",
                    "reason": "string",
                    "priority": "string",
                    "follow_up": {{
                        "offset_days": "int",
                        "reason": "string",
                    }}
                }},
                {{
                    "recommendation": "string",
                    "reason": "string",
                    "priority": "string",
                    "follow_up": null
                }}
            ]
        }}

        Guidelines:
        1. Recommendation Format:
            - MUST be specific, executable instructions starting with an action verb
            - GOOD: "Start lisinopril 10 mg daily for blood pressure control"
            - GOOD: "Schedule follow-up appointment in 4 weeks"
            - BAD: "Consider blood pressure management" (too vague)
            - BAD: "Patient needs better medication adherence" (not actionable)

        2. Reason Format:
            - Briefly cite the clinical justification from the overview
            - Include relevant metrics if available (e.g., "BP 150/95", "HbA1c 8.2%")
            - Maximum 1-2 sentences

        3. Priority Levels (choose one):
            - "urgent": Requires immediate attention (next 24-48 hours)
            - "high": Important for next visit/update
            - "routine": Standard care or maintenance

        4. Follow-up Format:
            - If applicable, include a follow-up date and reason
            - followup.offset_days = "int" (e.g. 14, 28) (if the recommendation says "follow up in 2 weeks" then offset_days = 14, if "follow up in 4 weeks" then offset_days = 28, etc.)
            - followup.reason = "string"
            - If not applicable, return null

        5. Additional Rules:
            - Generate 3-5 recommendations maximum unless critical issues require more
            - Do NOT include patient names or identifiers
            - Prioritize urgency and importance
            - Base ALL recommendations ONLY on information in the overview
            - If no clear recommendations can be made, return an empty array instead
    """

    try:
        response = openai_client.chat.completions.create(
            model="gemini-3.1-flash-lite",
            messages=[
                {
                    "role": "system",
                    "content": "You are a clinical briefing assistant. Provide concise recommendations for patients. Return only valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.0,
        )

        llm_output = json.loads(response.choices[0].message.content)

        cache.set(cache_key, llm_output)

        return llm_output
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/medications")
@observe()
@limiter.limit("2/minute")
async def get_medications(http_request: Request, request: MedicationsRequest, doctor: dict = Depends(get_current_doctor)):
    if not request.overview:
        raise HTTPException(status_code=400, detail="Overview is required")

    meds_key = ":".join(f"{m.name}:{m.dosage}:{m.frequency}" for m in request.current_medications)
    cache_key = f"medications:{hash_key(request.overview + meds_key)}"
    cached = cache.get(cache_key)

    if cached:
        return cached

    meds_list = "\n".join(
        f"- {m.name}: {m.dosage}, {m.frequency}" for m in request.current_medications
    ) or "None provided"

    prompt = f"""
        Based on this overview, provide patient medications alternatives: {request.overview}.

        Current medications (accurate, from patient record):
        {meds_list}

        Return only valid JSON with the following format:
        {{
            "medications": [
                "current_medications": [
                    {{
                        "name": "string",
                        "dosage": "string",
                        "frequency": "string"
                    }}
                ],
                "prescribed_changes": [
                    {{
                        "action": "string",
                        "name": "string",
                        "dosage": "string",
                        "frequency": "string",
                        "reason": "string"
                    }}
                ]
            ],
        }}

        Guidelines:
        - Action must be: "add", "increase", "decrease", "continue", "discontinue", or "change"
            - "add" to add a new medication
            - "increase" to increase the dosage of an existing medication
            - "decrease" to decrease the dosage of an existing medication
            - "continue" to continue an existing medication
            - "discontinue" to discontinue an existing medication
            - "change" to change the frequency of an existing medication
        - Dosage format: "1000mg", "20mg", "500mg/5ml", "1 capsule", "10 units", etc.
        - Frequency format: "daily", "twice daily", "weekly", "as needed", etc.
        - For reasons, summarize briefly from the note
    """

    try:
        response = openai_client.chat.completions.create(
            model="gemini-3.1-flash-lite",
            messages=[
                {
                    "role": "system",
                    "content": "You are a clinical briefing assistant. Provide concise, accurate overviews for patients. Return only valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.0,
        )

        llm_output = json.loads(response.choices[0].message.content)

        cache.set(cache_key, llm_output)

        return llm_output
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/schedule-followup")
@observe(as_type="chain")
@limiter.limit("3/minute")
async def schedule_visit(http_request: Request, follow_up: FollowUpRequest, doctor: dict = Depends(get_current_doctor)):
    prompt = f"""You are a medical scheduling assistant. A doctor wants to schedule a follow-up visit for a patient.

        Patient Serial: {follow_up.patient_serial_number}
        Doctor Serial: {follow_up.doctor_serial_number}
        Visit Date: {follow_up.visit_date}
        Visit Type: {follow_up.visit_type}
        Summary: {follow_up.summary}
        Description: {follow_up.description}
        Start Time: {follow_up.start_time}
        End Time: {follow_up.end_time}

        Please execute the following tools to schedule this visit:
        1. First, call schedule_visit_db to save the visit to the PostgreSQL database
        2. Then, call create_calendar_event to create a Google Calendar event

        Make sure to call both tools with the provided information."""

    try:
        response = openai_client.chat.completions.create(
            model="gemini-3.1-flash-lite",
            messages=[
                {
                    "role": "system",
                    "content": "You are a medical scheduling assistant. Execute the tools to schedule patient visits.",
                },
                {"role": "user", "content": prompt},
            ],
            tools=tools,
            tool_choice="required",
        )

        tool_calls = response.choices[0].message.tool_calls
        results = []

        if tool_calls:
            for tool_call in tool_calls:
                function_name = tool_call.function.name
                arguments = json.loads(tool_call.function.arguments)

                if function_name == "schedule_visit_db":
                    result = schedule_visit_db(
                        patient_serial_number=arguments.get("patient_serial_number"),
                        doctor_serial_number=arguments.get("doctor_serial_number"),
                        visit_date=arguments.get("visit_date"),
                        visit_type=arguments.get("visit_type"),
                        chief_complaint=arguments.get("chief_complaint"),
                        duration_minutes=arguments.get("duration_minutes", 30),
                    )
                    results.append({"tool": "schedule_visit_db", "result": result})

                elif function_name == "create_calendar_event":
                    result = create_calendar_event_for_doctor(
                        doctor_serial=doctor["serial"],
                        summary=arguments.get("summary"),
                        start_time=arguments.get("start_time"),
                        end_time=arguments.get("end_time"),
                        description=arguments.get("description") or "",
                    )
                    results.append({"tool": "create_calendar_event", "result": result})

        return {
            "success": True,
            "message": "Visit scheduled successfully",
            "tools_executed": results,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@observe(as_type="span")
def build_prompt(pg_data: dict, chroma_context: list) -> OverviewPromptResponse:
    meds = pg_data.get("active_medications", []) or []
    meds_str = (
        "\n".join([f"- {m['name']}: {m['dosage']} {m['frequency']}" for m in meds])
        if meds
        else "No active medications"
    )

    chroma_text = (
        "\n".join(chroma_context)
        if chroma_context
        else "No previous summaries available."
    )

    return f"""
            Provide a clinical briefing for this patient:

            DEMOGRAPHICS: {pg_data['full_name']}, {pg_data['age']}yo {pg_data['gender']}, Blood: {pg_data['blood_type']}
            ALLERGIES: {pg_data['allergies'] or 'None'}
            CHRONIC CONDITIONS: {pg_data['chronic_conditions'] or 'None'}

            LAST VISIT: {pg_data['latest_visit']}

            CURRENT VITALS: {pg_data['latest_vitals']}

            RECENT LAB: {pg_data['latest_lab']}

            ACTIVE MEDICATIONS:
            {meds_str}

            PREVIOUS VISIT NOTES:
            {chroma_text}

            Return only valid JSON with the following format:
            {{
                "overview": "string",
                "critical_alerts": ["string"],
                "suggested_questions": ["string"],
            }}

            Guidelines:
            - Overview must be a summary of the patient's last visit, previous visit notes, any relevant medications and any critical alerts.
            - Critical alerts must be a list of alerts that require immediate attention, such as pain, fever, or blood pressure.
            - Suggested questions must be a list of questions that the doctor could ask the patient to better understand the patient's condition.
            """