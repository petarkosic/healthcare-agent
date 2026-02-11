import os
import json
from fastapi import APIRouter, HTTPException
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv
from openai import OpenAI

from rag.rag_service import RAGService
from models.agents import AIOverviewResponse, OverviewPromptResponse, OverviewRequest

load_dotenv()

client = OpenAI(api_key=os.getenv("API_KEY"), base_url=os.getenv("BASE_URL"))

rag = RAGService()

DB_CONFIG = {
    "host": os.getenv("POSTGRES_HOST"),
    "port": os.getenv("POSTGRES_PORT"),
    "dbname": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD"),
}


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
async def get_overview(patient_serial: str):

    docs = rag.get_patient_overview(patient_serial=patient_serial)

    with psycopg.connect(**DB_CONFIG, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(postgres_query, {"pid": patient_serial})

            patient_data = cur.fetchone()

            if not patient_data:
                raise ValueError(f"Patient with serial number {patient_serial} not found in database.")
        
    prompt = build_prompt(patient_data, docs)

    response = client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[
                {"role": "system", "content": "You are a clinical briefing assistant. Provide concise, accurate overviews for patients. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        
    llm_output = json.loads(response.choices[0].message.content)

    return {
            "patient_serial": patient_serial,
            "ai_overview": llm_output,
            "chroma_sources": len(docs)
        }


@router.post('/recommendations')
async def get_recommendations(request: OverviewRequest):
    if not request.overview:
        raise HTTPException(status_code=400, detail="Overview is required")

    prompt = f"""
        Based on this overview, provide patient recommendations: {request.overview}. 
        
        Return only valid JSON with the following format:
        {{
            "recommendations": [
                {{
                    "recommendation": "string",
                    "reason": "string",
                    "priority": "string"
                }},
                {{
                    "recommendation": "string",
                    "reason": "string",
                    "priority": "string"
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

        4. Additional Rules:
            - Generate 3-5 recommendations maximum unless critical issues require more
            - Do NOT include patient names or identifiers
            - Prioritize urgency and importance
            - Base ALL recommendations ONLY on information in the overview
            - If no clear recommendations can be made, return an empty array instead
    """


    try:
        response = client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[
                {"role": "system", "content": "You are a clinical briefing assistant. Provide concise recommendations for patients. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )

        llm_output = json.loads(response.choices[0].message.content)

        return llm_output
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/medications')
async def get_medications(request: OverviewRequest):
    if not request.overview:
        raise HTTPException(status_code=400, detail="Overview is required")

    prompt = f"""
        Based on this overview, provide patient medications alternatives: {request.overview}. 
        
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
        response = client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[
                {"role": "system", "content": "You are a clinical briefing assistant. Provide concise, accurate overviews for patients. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )

        llm_output = json.loads(response.choices[0].message.content)

        return llm_output
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def build_prompt(pg_data: dict, chroma_context: list) -> OverviewPromptResponse:
    meds = pg_data.get('active_medications', []) or []
    meds_str = "\n".join([f"- {m['name']}: {m['dosage']} {m['frequency']}" for m in meds]) if meds else "No active medications"
    
    chroma_text = "\n".join(chroma_context) if chroma_context else "No previous summaries available."
    
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

            CLINICAL HISTORY SUMMARIES:
            {chroma_text}

            Return only valid JSON with the following format:
            {{
                "overview": "string",
                "critical_alerts": ["string"],
                "suggested_questions": ["string"],
            }}

            Guidelines:
            - Overview must be a summary of the patient's last visit, including any relevant medications and any critical alerts.
            - Critical alerts must be a list of alerts that require immediate attention, such as pain, fever, or blood pressure.
            - Suggested questions must be a list of questions that the doctor could ask the patient to better understand the patient's condition.
            """