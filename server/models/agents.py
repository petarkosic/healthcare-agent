from typing import Literal
from pydantic import BaseModel, Field


class ActiveDiagnoses(BaseModel):
	code: str = Field(description="Standard diagnosis code (e.g., ICD-10)")
	name: str = Field(description="Name of the diagnosis")
	type: Literal['primary', 'secondary', 'chronic', 'acute']
	status: Literal['active', 'resolved', 'chronic']

class ActiveMedications(BaseModel):
	name: str
	dosage: str
	frequency: str
	reason: str

class LatestLab(BaseModel):
	date: str
	reference_range: str
	result: str
	status: Literal['normal', 'abnormal', 'critical', 'pending']
	test_name: str
	unit: str

class LatestVisit(BaseModel):
	chief_complaint: str
	date: str
	doctor: str
	specialty: str
	status: Literal['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show']
	type: Literal['checkup', 'followup', 'emergency', 'specialist', 'vaccination', 'routine', 'urgent_care', 'surgical', 'telehealth']
	visit_id: str

class LatestVitals(BaseModel):
	blood_pressure: str = Field(pattern=r'^\d{2,3}\/\d{2,3}$')
	bmi: float = Field(ge=5, le=80)
	heart_rate: int = Field(ge=30, le=250)
	measured_at: str
	oxygen_saturation: int = Field(ge=70, le=100)
	pain_level: int = Field(ge=0, le=10)
	temperature: float = Field(ge=30, le=45)

class AIOverview(BaseModel):
	critical_alerts: list[str]
	overview: str
	stability: str
	suggested_questions: list[str]

class RawData(BaseModel):
	active_diagnoses: list[ActiveDiagnoses]
	active_medications: list[ActiveMedications]
	alergies: list[str] = None
	blood_type: str
	chronic_conditions: list[str] = None
	full_name: str
	gender: str
	latest_lab: LatestLab
	latest_visit: LatestVisit
	latest_vitals: LatestVitals
	patient_serial_number: str

class AIOverviewResponse(BaseModel):
    patient_serial: str
    ai_overview: AIOverview
    raw_data: RawData
    chroma_sources: int