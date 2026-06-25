from datetime import datetime
from typing import Any

from .base_repository import BaseRepository


class DashboardRepository(BaseRepository):
    def __init__(self):
        super().__init__("visits")

    def get_dashboard_stats(self, doctor_serial: str, start: datetime, end: datetime) -> dict[str, Any]:
        rows = self._execute_query(
            """
            SELECT
                COUNT(*) FILTER (WHERE status = 'scheduled') AS today_scheduled,
                COUNT(*) FILTER (WHERE status = 'completed') AS today_completed,
                COUNT(*) FILTER (WHERE status = 'cancelled') AS today_cancelled,
                COUNT(*) FILTER (WHERE status = 'no-show')   AS today_no_show,
                (
                    SELECT COUNT(*)
                    FROM medications
                    WHERE doctor_serial_number = %s
                      AND status = 'active'
                      AND (end_date IS NULL OR end_date >= CURRENT_DATE)
                ) AS active_medications_total
            FROM visits
            WHERE doctor_serial_number = %s
              AND visit_date >= %s
              AND visit_date < %s
            """,
            (doctor_serial, doctor_serial, start, end),
        )
        row = rows[0] if rows else {}
        return {
            "today_scheduled": int(row.get("today_scheduled", 0)),
            "today_completed": int(row.get("today_completed", 0)),
            "today_cancelled": int(row.get("today_cancelled", 0)),
            "today_no_show": int(row.get("today_no_show", 0)),
            "active_medications_total": int(row.get("active_medications_total", 0)),
        }

    def get_schedule_for_date(self, doctor_serial: str, start: datetime, end: datetime) -> list[dict]:
        rows = self._execute_query(
            """
            SELECT visit_id, visit_date, visit_type, status, duration_minutes, location
            FROM visits
            WHERE doctor_serial_number = %s
              AND visit_date >= %s
              AND visit_date < %s
            ORDER BY visit_date ASC
            """,
            (doctor_serial, start, end),
        )
        for row in rows:
            if hasattr(row.get("visit_date"), "isoformat"):
                row["visit_date"] = row["visit_date"].isoformat()
        return rows


dashboard_repository = DashboardRepository()
