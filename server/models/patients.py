from datetime import date, datetime
from typing import List, Literal, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class PatientBase(BaseModel):
    patient_id: UUID
    patient_serial_number: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    blood_type: str
    email: str
    phone: str
    address: str
    emergency_contact_name: str
    emergency_contact_phone: str
    allergies: list[str] = None
    chronic_conditions: list[str] = None
    created_at: datetime
    updated_at: datetime

class VisitResponse(BaseModel):
    visit_id: UUID
    patient_serial_number: str
    doctor_serial_number: str
    visit_date: datetime
    visit_type: Literal['checkup', 'followup', 'emergency', 'specialist', 'vaccination', 'routine', 'urgent_care', 'surgical', 'telehealth']
    chief_complaint: str
    status: Literal['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show']
    duration_minutes: int
    location: str
    created_at: datetime
    updated_at: datetime
    doctor_first_name: str
    doctor_last_name: str
    specialty: str

class VitalSignsResponse(BaseModel):
    vital_id: UUID
    visit_id: UUID
    measurement_time: datetime
    blood_pressure_systolic: int = Field(ge=50, le=250)
    blood_pressure_diastolic: int = Field(ge=30, le=200)
    heart_rate: int = Field(ge=30, le=250)
    temperature: float = Field(ge=30, le=45)
    respiratory_rate: int = Field(ge=5, le=60)
    oxygen_saturation: float = Field(ge=70, le=100)
    weight_kg: float
    height_cm: float
    bmi: float = Field(ge=5, le=80)
    pain_level: int
    notes: str
    visit_date: datetime

class MedicationResponse(BaseModel):
    medication_id: UUID
    patient_serial_number: str
    doctor_serial_number: str
    medication_name: str
    generic_name: str
    dosage: str
    frequency: str
    start_date: date
    end_date: Optional[date] = None
    status: Literal['active', 'discontinued', 'completed', 'hold']
    prescribed_for: str
    instructions: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    prescriber_first_name: str
    prescriber_last_name: str

class LabResultResponse(BaseModel):
    lab_id: UUID
    patient_serial_number: str
    visit_id: UUID
    test_name: str
    result_value: str
    unit: str
    reference_range: str
    result_status: Literal['normal', 'abnormal', 'critical', 'pending']
    tested_date: datetime
    received_date: datetime
    ordering_doctors_serial_number: str
    created_at: datetime
    ordering_doctor_first_name: str
    ordering_doctor_last_name: str

class ClinicalNoteResponse(BaseModel):
    note_id: UUID
    visit_id: UUID
    doctor_serial_number: str
    note_type: Literal['soap_subjective', 'soap_objective', 'soap_assessment', 'soap_plan','progress_note', 'consult_note', 'discharge_summary', 'procedure_note']
    note_text: str
    summary: str
    created_at: datetime
    updated_at: datetime
    doctor_first_name: str
    doctor_last_name: str
    visit_date: datetime

class DiagnosisResponse(BaseModel):
    diagnosis_id: UUID
    patient_serial_number: str
    visit_id: UUID
    diagnosis_code: str
    diagnosis_name: str
    diagnosis_type: Literal['primary', 'secondary', 'chronic', 'acute']
    status: Literal['active', 'resolved', 'chronic']
    diagnosed_date: date
    resolved_date: Optional[date] = None
    diagnosing_doctors_serial_number: str
    created_at: datetime
    diagnosing_doctor_first_name: str
    diagnosing_doctor_last_name: str

class PatientFullResponse(BaseModel):
    patient: PatientBase
    visits: List[VisitResponse]
    vital_signs: List[VitalSignsResponse]
    medications: List[MedicationResponse]
    lab_results: List[LabResultResponse]
    clinical_notes: List[ClinicalNoteResponse]
    diagnoses: List[DiagnosisResponse]