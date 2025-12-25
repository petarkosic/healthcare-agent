import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
import psycopg
from uuid import UUID
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("POSTGRES_HOST"),
    "port": os.getenv("POSTGRES_PORT"),
    "dbname": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD"),
}


class PatientBase(BaseModel):
    patient_id: UUID
    patient_serial_number: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    allergies: Optional[List[str]] = None
    chronic_conditions: Optional[List[str]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class VisitResponse(BaseModel):
    visit_id: UUID
    patient_serial_number: str
    doctor_serial_number: str
    visit_date: datetime
    visit_type: str
    chief_complaint: Optional[str] = None
    status: str
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    doctor_first_name: Optional[str] = None
    doctor_last_name: Optional[str] = None
    specialty: Optional[str] = None

class VitalSignsResponse(BaseModel):
    vital_id: UUID
    visit_id: UUID
    measurement_time: datetime
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    respiratory_rate: Optional[int] = None
    oxygen_saturation: Optional[float] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    bmi: Optional[float] = None
    pain_level: Optional[int] = None
    notes: Optional[str] = None
    visit_date: Optional[datetime] = None

class MedicationResponse(BaseModel):
    medication_id: UUID
    patient_serial_number: str
    doctor_serial_number: Optional[str] = None
    medication_name: str
    generic_name: Optional[str] = None
    dosage: str
    frequency: str
    start_date: date
    end_date: Optional[date] = None
    status: str
    prescribed_for: Optional[str] = None
    instructions: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    prescriber_first_name: Optional[str] = None
    prescriber_last_name: Optional[str] = None

class LabResultResponse(BaseModel):
    lab_id: UUID
    patient_serial_number: str
    visit_id: Optional[UUID] = None
    test_name: str
    result_value: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    result_status: Optional[str] = None
    tested_date: datetime
    received_date: Optional[datetime] = None
    ordering_doctors_serial_number: Optional[str] = None
    created_at: Optional[datetime] = None
    ordering_doctor_first_name: Optional[str] = None
    ordering_doctor_last_name: Optional[str] = None

class ClinicalNoteResponse(BaseModel):
    note_id: UUID
    visit_id: UUID
    doctor_serial_number: str
    note_type: str
    note_text: str
    summary: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    doctor_first_name: Optional[str] = None
    doctor_last_name: Optional[str] = None
    visit_date: Optional[datetime] = None

class DiagnosisResponse(BaseModel):
    diagnosis_id: UUID
    patient_serial_number: str
    visit_id: Optional[UUID] = None
    diagnosis_code: Optional[str] = None
    diagnosis_name: str
    diagnosis_type: Optional[str] = None
    status: str
    diagnosed_date: date
    resolved_date: Optional[date] = None
    diagnosing_doctors_serial_number: Optional[str] = None
    created_at: Optional[datetime] = None
    diagnosing_doctor_first_name: Optional[str] = None
    diagnosing_doctor_last_name: Optional[str] = None

class PatientFullResponse(BaseModel):
    patient: PatientBase
    visits: List[VisitResponse]
    vital_signs: List[VitalSignsResponse]
    medications: List[MedicationResponse]
    lab_results: List[LabResultResponse]
    clinical_notes: List[ClinicalNoteResponse]
    diagnoses: List[DiagnosisResponse]

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