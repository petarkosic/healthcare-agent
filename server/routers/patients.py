import os
from fastapi import APIRouter, HTTPException
import psycopg
from dotenv import load_dotenv
from langfuse import observe

from rag.rag_service import RAGService
from models.notes import Note
from models.patients import PatientFullResponse, SetVisit, UpdateVisit
from utils.openai_client import openai_client


load_dotenv()

rag = RAGService()

DB_CONFIG = {
    "host": os.getenv("POSTGRES_HOST"),
    "port": os.getenv("POSTGRES_PORT"),
    "dbname": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD"),
}



router = APIRouter(
    prefix="/patients",
    tags=["patients"],
)

@router.get("/")
async def get_patients():
    with psycopg.connect(**DB_CONFIG) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM patient_summary")

            columns = [desc[0] for desc in cur.description]
            
            patients = [dict(zip(columns, row)) for row in cur.fetchall()]
    
    return patients



@router.get("/{patient_serial_number}", response_model=PatientFullResponse)
async def get_patient(patient_serial_number: str):
    try:
        with psycopg.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT * FROM patients WHERE patient_serial_number = %s", 
                    (patient_serial_number,)
                )
        
                patient_row = cur.fetchone()
                
                if not patient_row:
                    raise HTTPException(
                        status_code=404, 
                        detail=f"Patient with serial number {patient_serial_number} not found"
                    )
                
                patient_columns = [desc[0] for desc in cur.description]
                patient = dict(zip(patient_columns, patient_row))

            visits = []
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        v.*,
                        d.first_name AS doctor_first_name,
                        d.last_name AS doctor_last_name,
                        d.specialty
                    FROM visits v
                    JOIN doctors d ON v.doctor_serial_number = d.doctor_serial_number
                    WHERE v.patient_serial_number = %s
                    ORDER BY v.visit_date DESC
                """, (patient_serial_number,))
                
                visit_columns = [desc[0] for desc in cur.description]
                visits = [dict(zip(visit_columns, row)) for row in cur.fetchall()]

            vital_signs = []
            if visits:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT 
                            vs.*,
                            v.visit_date
                        FROM vital_signs vs
                        JOIN visits v ON vs.visit_id = v.visit_id
                        WHERE v.patient_serial_number = %s
                        ORDER BY vs.measurement_time DESC
                    """, (patient_serial_number,))
                    
                    vital_columns = [desc[0] for desc in cur.description]
                    vital_signs = [dict(zip(vital_columns, row)) for row in cur.fetchall()]

            medications = []
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        m.*,
                        d.first_name AS prescriber_first_name,
                        d.last_name AS prescriber_last_name
                    FROM medications m
                    LEFT JOIN doctors d ON m.doctor_serial_number = d.doctor_serial_number
                    WHERE m.patient_serial_number = %s
                    ORDER BY m.start_date DESC, m.status
                """, (patient_serial_number,))
                
                med_columns = [desc[0] for desc in cur.description]
                medications = [dict(zip(med_columns, row)) for row in cur.fetchall()]

            lab_results = []
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        l.*,
                        d.first_name AS ordering_doctor_first_name,
                        d.last_name AS ordering_doctor_last_name
                    FROM lab_results l
                    LEFT JOIN doctors d ON l.ordering_doctors_serial_number = d.doctor_serial_number
                    WHERE l.patient_serial_number = %s
                    ORDER BY l.tested_date DESC
                """, (patient_serial_number,))
                
                lab_columns = [desc[0] for desc in cur.description]
                lab_results = [dict(zip(lab_columns, row)) for row in cur.fetchall()]

            clinical_notes = []
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        cn.*,
                        d.first_name AS doctor_first_name,
                        d.last_name AS doctor_last_name,
                        v.visit_date
                    FROM clinical_notes cn
                    JOIN doctors d ON cn.doctor_serial_number = d.doctor_serial_number
                    JOIN visits v ON cn.visit_id = v.visit_id
                    WHERE v.patient_serial_number = %s
                    ORDER BY cn.created_at DESC
                """, (patient_serial_number,))
                
                note_columns = [desc[0] for desc in cur.description]
                clinical_notes = [dict(zip(note_columns, row)) for row in cur.fetchall()]

            diagnoses = []
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        diag.*,
                        d.first_name AS diagnosing_doctor_first_name,
                        d.last_name AS diagnosing_doctor_last_name
                    FROM diagnoses diag
                    LEFT JOIN doctors d ON diag.diagnosing_doctors_serial_number = d.doctor_serial_number
                    WHERE diag.patient_serial_number = %s
                    ORDER BY diag.diagnosed_date DESC, diag.status
                """, (patient_serial_number,))
                
                diag_columns = [desc[0] for desc in cur.description]
                diagnoses = [dict(zip(diag_columns, row)) for row in cur.fetchall()]

            response = {
                "patient": patient,
                "visits": visits,
                "vital_signs": vital_signs,
                "medications": medications,
                "lab_results": lab_results,
                "clinical_notes": clinical_notes,
                "diagnoses": diagnoses
            }
            
            return response
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error fetching patient data: {str(e)}"
        )

@router.post("/{patient_serial}/notes", )
@observe()
async def set_note(patient_serial: str, note: Note):
    if not note.visit_id or not note.note_type or not note.note_text or not note.doctor_serial_number:
        raise HTTPException(
            status_code=400, 
            detail="Visit ID, Note type, note text, and doctor serial number are required"
        )

    prompt = f"""
    Generate a concise medical summary of this clinical note: 

    {note.note_text}
    
    Keep it brief and professional, focusing on key findings and recommendations.
    """

    try:
        rag.upsert_patient_note(
            patient_serial=str(patient_serial),
            note_summary=note.note_text
        )

        resp = openai_client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[
                {"role": "user", "content": prompt}
            ],
        )

        summary = resp.choices[0].message.content.strip()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating summary: {str(e)}"
        )

    try:
        with psycopg.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO clinical_notes 
                    (note_id, visit_id, doctor_serial_number, note_type, note_text, summary)
                    VALUES (gen_random_uuid(), %s, %s, %s, %s, %s)
                    RETURNING note_id
                """, (
                    str(note.visit_id), 
                    note.doctor_serial_number, 
                    note.note_type, 
                    note.note_text,
                    summary
                ))
                
                note_id = cur.fetchone()[0]
                conn.commit()
                
                return {
                    "message": "Note added successfully",
                    "note_id": note_id,
                    "summary": summary
                }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error adding note: {str(e)}"
        )
    

@router.post('/visits')
async def set_visit(visit: SetVisit):
    try:
        with psycopg.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO visits 
                    (visit_id, patient_serial_number, doctor_serial_number, visit_date, visit_type, status, location, created_at)
                    VALUES (gen_random_uuid(), %s, %s, DATE_TRUNC('second', now()), %s, 'in-progress', %s, DATE_TRUNC('second', now()))
                    RETURNING visit_id
                """, (
                    visit.patient_serial_number,
                    visit.doctor_serial_number,
                    visit.visit_type,
                    visit.location
                ))
                
                visit_id = cur.fetchone()[0]
                conn.commit()
                
                return {
                    "message": "Visit added successfully",
                    "visit_id": visit_id
                }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error adding visit: {str(e)}"
        )
    
@router.put('/visits')
async def update_visit(visit: UpdateVisit):
    try:
        with psycopg.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE visits 
                    SET 
                        chief_complaint = %s, 
                        status = %s, 
                        duration_minutes = %s
                    WHERE visit_id = %s
                """, (
                    visit.chief_complaint,
                    visit.status,
                    visit.duration_minutes,
                    visit.visit_id
                ))
                
                conn.commit()
                
                return {
                    "message": "Visit updated successfully"
                }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error updating visit: {str(e)}"
        )
    