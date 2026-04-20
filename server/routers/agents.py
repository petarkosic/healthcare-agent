import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv

from langfuse import observe

from models.agents import FollowUpRequest
from utils.openai_client import openai_client
from rag.rag_service import RAGService
from models.agents import AIOverviewResponse, OverviewPromptResponse, OverviewRequest
from utils.cache import cache, hash_key
from services.agent_service import agent_service
from services.patient_service import visit_repository

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


@observe(as_type="span")
def create_calendar_event(
    summary: str, start_time: str, end_time: str, description: str = None
):
    service = authenticate_google_calendar()

    event = {
        "summary": summary,
        "description": description or "",
        "start": {"dateTime": start_time, "timeZone": "GMT+01:00"},
        "end": {"dateTime": end_time, "timeZone": "GMT+01:00"},
    }

    try:
        created_event = (
            service.events().insert(calendarId="primary", body=event).execute()
        )

        return {
            "htmlLink": created_event.get("htmlLink"),
            "eventId": created_event.get("id"),
        }

    except Exception as e:
        return {"error": str(e)}


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

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/calendar"]

BASE_DIR = Path(__file__).resolve().parent
CREDENTIALS_PATH = BASE_DIR / "credentials.json"
TOKEN_PATH = BASE_DIR / "token.json"

def authenticate_google_calendar():
    creds = None

    if TOKEN_PATH.exists():
        with open(TOKEN_PATH, "rb") as token:
            creds = Credentials.from_authorized_user_info(
                info=json.load(token), scopes=SCOPES
            )

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                str(CREDENTIALS_PATH), SCOPES
            )
            creds = flow.run_local_server(port=0)

        with open(TOKEN_PATH, "wb") as token:
            token.write(creds.to_json())

    return build("calendar", "v3", credentials=creds)

postgres_query = """
WITH 
latest_visit AS (
    -- Most recent visit (1 row)
    SELECT 
        v.visit_id,
        v.visit_date,
        v.visit_type,
        v.chief_complaint,
        v.status,
        d.first_name || ' ' || d.last_name as doctor_name,
        d.specialty
    FROM visits v
    JOIN doctors d ON v.doctor_serial_number = d.doctor_serial_number
    WHERE v.patient_serial_number = %(pid)s
    ORDER BY v.visit_date DESC
    LIMIT 1
),

latest_vitals AS (
    -- Most recent vital signs measurement (1 row)
    SELECT 
        vs.blood_pressure_systolic,
        vs.blood_pressure_diastolic,
        vs.heart_rate,
        vs.temperature,
        vs.oxygen_saturation,
        vs.bmi,
        vs.pain_level,
        vs.measurement_time
    FROM vital_signs vs
    JOIN visits v ON vs.visit_id = v.visit_id
    WHERE v.patient_serial_number = %(pid)s
    ORDER BY vs.measurement_time DESC
    LIMIT 1
),

latest_lab AS (
    -- Most recent lab result (1 row)
    SELECT 
        test_name,
        result_value,
        unit,
        reference_range,
        result_status,
        tested_date
    FROM lab_results
    WHERE patient_serial_number = %(pid)s
    ORDER BY tested_date DESC
    LIMIT 1
),

latest_note AS (
    -- Most recent clinical note (1 row)
    SELECT 
        cn.note_type,
        cn.note_text,
        cn.created_at,
        d.first_name || ' ' || d.last_name as doctor_name
    FROM clinical_notes cn
    JOIN visits v ON cn.visit_id = v.visit_id
    JOIN doctors d ON cn.doctor_serial_number = d.doctor_serial_number
    WHERE v.patient_serial_number = %(pid)s
    ORDER BY cn.created_at DESC
    LIMIT 1
),

active_meds AS (
    -- All current medications (not just latest 1, since patients usually have multiple)
    SELECT 
        medication_name,
        dosage,
        frequency,
        prescribed_for,
        status
    FROM medications
    WHERE patient_serial_number = %(pid)s 
    AND status = 'active'
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    ORDER BY start_date DESC
),

active_diagnoses AS (
    -- All active diagnoses (not just latest 1)
    SELECT 
        diagnosis_name,
        diagnosis_code,
        diagnosis_type,
        status
    FROM diagnoses
    WHERE patient_serial_number = %(pid)s
    AND status IN ('active', 'chronic')
    ORDER BY diagnosed_date DESC
)

SELECT 
    p.patient_serial_number,
    p.first_name || ' ' || p.last_name as full_name,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth))::int as age,
    p.gender,
    p.blood_type,
    p.allergies,
    p.chronic_conditions,
    
    -- Latest visit as JSON object (single row)
    json_build_object(
        'visit_id', lv.visit_id,
        'date', lv.visit_date,
        'type', lv.visit_type,
        'chief_complaint', lv.chief_complaint,
        'doctor', lv.doctor_name,
        'specialty', lv.specialty,
        'status', lv.status
    ) as latest_visit,
    
    -- Latest vitals as JSON object (single row)
    json_build_object(
        'measured_at', lvs.measurement_time,
        'blood_pressure', lvs.blood_pressure_systolic || '/' || lvs.blood_pressure_diastolic,
        'heart_rate', lvs.heart_rate,
        'temperature', lvs.temperature,
        'oxygen_saturation', lvs.oxygen_saturation,
        'bmi', lvs.bmi,
        'pain_level', lvs.pain_level
    ) as latest_vitals,
    
    -- Latest lab as JSON object (single row)
    json_build_object(
        'test_name', ll.test_name,
        'result', ll.result_value,
        'unit', ll.unit,
        'status', ll.result_status,
        'reference_range', ll.reference_range,
        'date', ll.tested_date
    ) as latest_lab,
    
    -- Active medications as JSON array
    COALESCE(
        (SELECT json_agg(
            json_build_object(
                'name', medication_name,
                'dosage', dosage,
                'frequency', frequency,
                'reason', prescribed_for
            ) ORDER BY medication_name
        ) FROM active_meds),
        '[]'::json
    ) as active_medications,
    
    -- Active diagnoses as JSON array
    COALESCE(
        (SELECT json_agg(
            json_build_object(
                'name', diagnosis_name,
                'code', diagnosis_code,
                'type', diagnosis_type,
                'status', status
            ) ORDER BY diagnosis_name
        ) FROM active_diagnoses),
        '[]'::json
    ) as active_diagnoses

FROM patients p
LEFT JOIN latest_visit lv ON true
LEFT JOIN latest_vitals lvs ON true
LEFT JOIN latest_lab ll ON true
WHERE p.patient_serial_number = %(pid)s;
"""


router = APIRouter(
    prefix="/agents",
    tags=["agents"],
)


@router.get("/overview/{patient_serial}", response_model=AIOverviewResponse)
@observe()
async def get_overview(patient_serial: str):
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
        model="gemini-2.5-flash",
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
async def get_recommendations(request: OverviewRequest):
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
            model="gemini-2.5-flash",
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
async def get_medications(request: OverviewRequest):
    if not request.overview:
        raise HTTPException(status_code=400, detail="Overview is required")

    cache_key = f"medications:{hash_key(request.overview)}"
    cached = cache.get(cache_key)

    if cached:
        return cached

    prompt = f"""
        Based on this overview, provide patient medications alternatives: {request.overview}.

        Return only valid JSON with the following format:
        {{
            "medications": [
                "current_medications": [
                    {{
                        "name": "string",
                        "generic_name": "string",
                        "dosage": "string",
                        "frequency": "string"
                    }}
                ],
                "prescribed_changes": [
                    {{
                        "action": "string",
                        "name": "string",
                        "generic_name": "string",
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
            model="gemini-2.5-flash",
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
async def schedule_visit(follow_up: FollowUpRequest):
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
            model="gemini-2.5-flash",
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
                    result = create_calendar_event(
                        summary=arguments.get("summary"),
                        start_time=arguments.get("start_time"),
                        end_time=arguments.get("end_time"),
                        description=arguments.get("description"),
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