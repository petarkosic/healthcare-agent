import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

from langfuse import observe, propagate_attributes

from models.agents import AIOverviewResponse, FollowUpRequest
from utils import CurrentDoctor, get_current_doctor, limiter, verify_patient_access
from services import agent_service, scheduling_service

load_dotenv()

router = APIRouter(
    prefix="/agents",
    tags=["agents"],
)


@router.get("/overview/{patient_serial}", response_model=AIOverviewResponse)
@observe()
@limiter.limit("2/minute")
def get_overview(
    request: Request,
    patient_serial: str,
    doctor: CurrentDoctor = Depends(get_current_doctor),
    _: None = Depends(verify_patient_access),
):
    with propagate_attributes(
        user_id=doctor.serial,
        metadata={"patient_serial": patient_serial},
        tags=["overview"],
    ):
        pass

    return agent_service.get_or_generate_overview(patient_serial)


@router.post("/recommendations/{patient_serial}")
@observe()
@limiter.limit("2/minute")
def get_recommendations(
    request: Request,
    patient_serial: str,
    doctor: CurrentDoctor = Depends(get_current_doctor),
    _: None = Depends(verify_patient_access),
):
    with propagate_attributes(
        user_id=doctor.serial,
        metadata={"patient_serial": patient_serial},
        tags=["recommendations"],
    ):
        pass

    return agent_service.generate_recommendations_for_patient(patient_serial)


@router.post("/medications/{patient_serial}")
@observe()
@limiter.limit("2/minute")
def get_medications(
    request: Request,
    patient_serial: str,
    doctor: CurrentDoctor = Depends(get_current_doctor),
    _: None = Depends(verify_patient_access),
):
    with propagate_attributes(
        user_id=doctor.serial,
        metadata={"patient_serial": patient_serial},
        tags=["medications"],
    ):
        pass

    return agent_service.generate_medications_for_patient(patient_serial)


@router.post("/schedule-followup")
@observe()
@limiter.limit("3/minute")
def schedule_visit(request: Request, follow_up: FollowUpRequest, doctor: CurrentDoctor = Depends(get_current_doctor)):
    verify_patient_access(follow_up.patient_serial_number, doctor)

    for field in ("visit_date", "start_time"):
        raw = getattr(follow_up, field)
        try:
            parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=422, detail=f"Invalid {field}")
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        if parsed <= datetime.now(timezone.utc):
            raise HTTPException(status_code=422, detail="Visit date must be in the future")

    with propagate_attributes(
        user_id=doctor.serial,
        metadata={"patient_serial": follow_up.patient_serial_number},
        tags=["schedule-followup"],
    ):
        pass

    return scheduling_service.schedule_followup(follow_up, doctor.serial)
