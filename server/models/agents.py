from typing import Literal, Optional
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
	unit: Optional[str] = None

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
	oxygen_saturation: float = Field(ge=70.0, le=100.0)
	pain_level: int = Field(ge=0, le=10)
	temperature: float = Field(ge=30.0, le=45.0)

class AIOverview(BaseModel):
	critical_alerts: list[str]
	overview: str
	suggested_questions: list[str]

class AIOverviewResponse(BaseModel):
    patient_serial: str
    ai_overview: AIOverview
    chroma_sources: int

class OverviewRequest(BaseModel):
    overview: str

class OverviewPromptResponse(BaseModel):
    overview: str
    critical_alerts: list[str]
    suggested_questions: list[str]
