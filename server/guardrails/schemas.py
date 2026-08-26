from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class OverviewOutput(BaseModel):
    """What the LLM returns for GET /agents/overview/{serial}."""

    model_config = ConfigDict(extra="forbid")

    overview: str = Field(min_length=1, max_length=4000)
    critical_alerts: list[str] = Field(default_factory=list)
    suggested_questions: list[str] = Field(default_factory=list)


class FollowUp(BaseModel):
    model_config = ConfigDict(extra="forbid")

    offset_days: int = Field(gt=0, le=365)
    reason: str = Field(min_length=1, max_length=500)


class RecommendationItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    recommendation: str = Field(min_length=1, max_length=500)
    reason: str = Field(min_length=1, max_length=500)
    priority: Literal["urgent", "high", "routine"]
    follow_up: Optional[FollowUp] = None


class RecommendationsOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    recommendations: list[RecommendationItem] = Field(default_factory=list)


class CurrentMedicationItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=200)
    dosage: str = Field(default="", max_length=100)
    frequency: str = Field(default="", max_length=100)


class MedicationChangeItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    action: Literal[
        "add", "increase", "decrease", "continue", "discontinue", "change"
    ]
    name: str = Field(min_length=1, max_length=200)
    dosage: str = Field(default="", max_length=100)
    frequency: str = Field(default="", max_length=100)
    reason: str = Field(default="", max_length=500)


class MedicationsBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_medications: list[CurrentMedicationItem] = Field(default_factory=list)
    prescribed_changes: list[MedicationChangeItem] = Field(default_factory=list)


class MedicationsOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    medications: MedicationsBody
