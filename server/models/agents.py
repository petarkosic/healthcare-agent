from typing import Literal, Optional
from pydantic import BaseModel, Field

from models.enums import DiagnosisStatus, DiagnosisType, ResultStatus, VisitStatus, VisitType


class ActiveDiagnoses(BaseModel):
	code: str = Field(description="Standard diagnosis code (e.g., ICD-10)")
	name: str = Field(description="Name of the diagnosis")
	type: DiagnosisType
	status: DiagnosisStatus

class LatestLab(BaseModel):
	date: str
	reference_range: str
	result: str
	status: ResultStatus
	test_name: str
	unit: Optional[str] = None

class LatestVisit(BaseModel):
	chief_complaint: str
	date: str
	doctor: str
	specialty: str
	status: VisitStatus
	type: VisitType
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

class OverviewPromptResponse(BaseModel):
    overview: str
    critical_alerts: list[str]
    suggested_questions: list[str]

class FollowUp(BaseModel):
    offset_days: int
    reason: str

class RecommendationItem(BaseModel):
    recommendation: str
    reason: str
    priority: Literal["urgent", "high", "routine"]
    follow_up: Optional[FollowUp] = None

class RecommendationsOutput(BaseModel):
    recommendations: list[RecommendationItem] = []

class CurrentMedicationItem(BaseModel):
    name: str
    dosage: str
    frequency: str

class MedicationChangeItem(BaseModel):
    action: Literal["add", "increase", "decrease", "continue", "discontinue", "change"]
    name: str
    dosage: str
    frequency: str
    reason: str

class MedicationsBody(BaseModel):
    current_medications: list[CurrentMedicationItem] = []
    prescribed_changes: list[MedicationChangeItem] = []

class MedicationsOutput(BaseModel):
    medications: MedicationsBody

class FollowUpRequest(BaseModel):
	patient_serial_number: str = Field(description='Patient serial number')
	visit_date: str = Field(description='Visit date in ISO 8601 format')
	visit_type: VisitType = Field(default='followup', description='Type of visit')
	summary: str = Field(description='Visit summary/title')
	start_time: str = Field(description='Start time in ISO 8601 format')
	end_time: str = Field(description='End time in ISO 8601 format')
	description: str = Field(default='', description='Visit description')