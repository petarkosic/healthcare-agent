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
                COUNT(*) FILTER (WHERE status = 'scheduled')  AS today_scheduled,
                COUNT(*) FILTER (WHERE status = 'completed')  AS today_completed,
                COUNT(*) FILTER (WHERE status = 'cancelled')  AS today_cancelled,
                COUNT(*) FILTER (WHERE status = 'no-show')    AS today_no_show,
                (
                    SELECT COUNT(*)
                    FROM medications
                    WHERE doctor_serial_number = %s
                      AND status = 'active'
                      AND (end_date IS NULL OR end_date >= CURRENT_DATE)
                ) AS active_medications_total,
                (
                    SELECT COUNT(DISTINCT patient_serial_number)
                    FROM visits
                    WHERE doctor_serial_number = %s
                      AND visit_date >= NOW() - INTERVAL '180 days'
                ) AS active_patients,
                (
                    SELECT COUNT(*)
                    FROM lab_results
                    WHERE ordering_doctors_serial_number = %s
                      AND result_status = 'critical'
                      AND received_date >= NOW() - INTERVAL '30 days'
                ) AS critical_labs_recent,
                (
                    SELECT COUNT(*)
                    FROM visits
                    WHERE doctor_serial_number = %s
                      AND visit_date >= NOW()
                      AND visit_date < NOW() + INTERVAL '7 days'
                      AND status = 'scheduled'
                ) AS upcoming_7_days
            FROM visits
            WHERE doctor_serial_number = %s
              AND visit_date >= %s
              AND visit_date < %s
            """,
            (doctor_serial, doctor_serial, doctor_serial, doctor_serial, doctor_serial, start, end),
        )
        row = rows[0] if rows else {}
        return {
            "today_scheduled": int(row.get("today_scheduled", 0)),
            "today_completed": int(row.get("today_completed", 0)),
            "today_cancelled": int(row.get("today_cancelled", 0)),
            "today_no_show": int(row.get("today_no_show", 0)),
            "active_medications_total": int(row.get("active_medications_total", 0)),
            "active_patients": int(row.get("active_patients", 0)),
            "critical_labs_recent": int(row.get("critical_labs_recent", 0)),
            "upcoming_7_days": int(row.get("upcoming_7_days", 0)),
        }

    def get_visit_type_breakdown(self, doctor_serial: str) -> list[dict]:
        """Visit count by type for the last 90 days."""
        return self._execute_query(
            """
            SELECT visit_type AS name, COUNT(*) AS value
            FROM visits
            WHERE doctor_serial_number = %s
              AND visit_date >= NOW() - INTERVAL '90 days'
            GROUP BY visit_type
            ORDER BY value DESC
            """,
            (doctor_serial,),
        )

    def get_lab_alerts(self, doctor_serial: str) -> list[dict]:
        """Critical and abnormal labs ordered by this doctor, last 30 days, newest first."""
        rows = self._execute_query(
            """
            SELECT
                lr.lab_id,
                lr.test_name,
                lr.result_value,
                lr.unit,
                lr.reference_range,
                lr.result_status,
                lr.tested_date,
                p.first_name || ' ' || p.last_name AS patient_name,
                p.patient_serial_number
            FROM lab_results lr
            JOIN patients p ON lr.patient_serial_number = p.patient_serial_number
            WHERE lr.ordering_doctors_serial_number = %s
              AND lr.result_status IN ('critical', 'abnormal')
              AND lr.tested_date >= NOW() - INTERVAL '30 days'
            ORDER BY
                CASE lr.result_status WHEN 'critical' THEN 0 ELSE 1 END,
                lr.tested_date DESC
            LIMIT 20
            """,
            (doctor_serial,),
        )
        for row in rows:
            if hasattr(row.get("tested_date"), "isoformat"):
                row["tested_date"] = row["tested_date"].isoformat()
            row["lab_id"] = str(row["lab_id"])
        return rows

    def get_schedule_for_date(self, doctor_serial: str, start: datetime, end: datetime) -> list[dict]:
        rows = self._execute_query(
            """
            SELECT visit_id, visit_date, visit_type, status, duration_minutes, location, chief_complaint
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
