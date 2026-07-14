from datetime import date, datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field

from models.enums import (
    BloodType, DiagnosisStatus, DiagnosisType, Gender, MedicationStatus,
    NoteType, ResultStatus, VisitLocation, VisitStatus, VisitType,
)


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
    visit_type: VisitType
    chief_complaint: str
    status: VisitStatus
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
    temperature: float = Field(ge=30.0, le=45.0)
    respiratory_rate: int = Field(ge=5, le=60)
    oxygen_saturation: float = Field(ge=70.0, le=100.0)
    weight_kg: float
    height_cm: float
    bmi: float = Field(ge=5, le=80)
    pain_level: int
    notes: str
    visit_date: datetime

class AddMedication(BaseModel):
    doctor_serial_number: str
    medication_name: str
    generic_name: str
    dosage: str
    frequency: str
    start_date: str
    prescribed_for: str
    instructions: str
    end_date: Optional[str] = None
    status: MedicationStatus = 'active'

class UpdateMedication(BaseModel):
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[MedicationStatus] = None
    prescribed_for: Optional[str] = None
    instructions: Optional[str] = None

class AddVitalSigns(BaseModel):
    visit_id: str
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    respiratory_rate: Optional[int] = None
    oxygen_saturation: Optional[float] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    pain_level: Optional[int] = None
    notes: Optional[str] = ''

class AddLabResult(BaseModel):
    visit_id: str
    ordering_doctors_serial_number: str
    test_name: str
    result_value: str
    unit: Optional[str] = None
    reference_range: str
    result_status: ResultStatus
    tested_date: str
    received_date: str

class AddDiagnosis(BaseModel):
    visit_id: str
    diagnosing_doctors_serial_number: str
    diagnosis_code: str
    diagnosis_name: str
    diagnosis_type: DiagnosisType
    status: DiagnosisStatus
    diagnosed_date: str
    resolved_date: Optional[str] = None

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
    status: MedicationStatus
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
    unit: Optional[str] = None
    reference_range: str
    result_status: ResultStatus
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
    note_type: NoteType
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
    diagnosis_type: DiagnosisType
    status: DiagnosisStatus
    diagnosed_date: datetime
    resolved_date: Optional[datetime] = None
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

class CreatePatient(BaseModel):
    doctor_serial_number: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: Gender
    blood_type: BloodType
    email: str
    phone: str
    address: str
    emergency_contact_name: str
    emergency_contact_phone: str
    allergies: list[str] = []
    chronic_conditions: list[str] = []

class SetVisit(BaseModel):
    patient_serial_number: str
    doctor_serial_number: str
    visit_type: VisitType
    location: Optional[VisitLocation] = 'Clinic'
    visit_date: Optional[str] = None
    status: Optional[VisitStatus] = 'in-progress'
    chief_complaint: Optional[str] = ""

class UpdateVisit(BaseModel):
    chief_complaint: str
    status: VisitStatus
    duration_minutes: int
    visit_id: UUID

class UpdateAllergies(BaseModel):
    allergies: list[str]