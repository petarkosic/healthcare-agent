from datetime import datetime

from fastapi import APIRouter, Depends

from repositories.dashboard_repository import dashboard_repository
from utils.auth import get_current_doctor

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_stats(start: datetime, end: datetime, doctor: dict = Depends(get_current_doctor)):
    return dashboard_repository.get_dashboard_stats(doctor["serial"], start, end)


@router.get("/schedule")
async def get_schedule(start: datetime, end: datetime, doctor: dict = Depends(get_current_doctor)):
    return dashboard_repository.get_schedule_for_date(doctor["serial"], start, end)


@router.get("/breakdown")
async def get_breakdown(doctor: dict = Depends(get_current_doctor)):
    return dashboard_repository.get_visit_type_breakdown(doctor["serial"])
