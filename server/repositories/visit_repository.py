from typing import Optional

from .base_repository import BaseRepository


class VisitRepository(BaseRepository):
    def __init__(self):
        super().__init__("visits")

    def create_visit(self, patient_serial_number: str, doctor_serial_number: str,
                     visit_type: str, location: str, visit_date: str = None,
                     status: str = 'in-progress', chief_complaint: str = "",
                     duration_minutes: int = 30) -> Optional[str]:
        """Create a new visit and return the visit ID"""
        if visit_date:
            visit_id = self._execute_insert("""
                INSERT INTO visits
                (visit_id, patient_serial_number, doctor_serial_number, visit_date, visit_type, status, location, chief_complaint, duration_minutes, created_at)
                VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, DATE_TRUNC('second', now()))
                RETURNING visit_id
            """, (
                patient_serial_number,
                doctor_serial_number,
                visit_date,
                visit_type,
                status,
                location,
                chief_complaint,
                duration_minutes
            ))
        else:
            visit_id = self._execute_insert("""
                INSERT INTO visits
                (visit_id, patient_serial_number, doctor_serial_number, visit_date, visit_type, status, location, chief_complaint, duration_minutes, created_at)
                VALUES (gen_random_uuid(), %s, %s, DATE_TRUNC('second', now()), %s, %s, %s, %s, %s, DATE_TRUNC('second', now()))
                RETURNING visit_id
            """, (
                patient_serial_number,
                doctor_serial_number,
                visit_type,
                status,
                location,
                chief_complaint,
                duration_minutes
            ))

        return str(visit_id) if visit_id else None

    def update_visit(self, visit_id: str, chief_complaint: str, status: str, duration_minutes: int) -> bool:
        """Update visit details"""
        affected_rows = self._execute_command("""
            UPDATE visits
            SET chief_complaint = %s, status = %s, duration_minutes = %s
            WHERE visit_id = %s
        """, (
            chief_complaint,
            status,
            duration_minutes,
            visit_id
        ))

        return affected_rows > 0

    def get_visit_by_id(self, visit_id: str):
        """Get a single visit with doctor info by visit_id"""
        results = self._execute_query("""
            SELECT
                v.*,
                d.first_name AS doctor_first_name,
                d.last_name AS doctor_last_name,
                d.specialty
            FROM visits v
            JOIN doctors d ON v.doctor_serial_number = d.doctor_serial_number
            WHERE v.visit_id = %s
        """, (visit_id,))

        return results[0] if results else None

    def get_next_scheduled_visit(self, patient_serial_number: str):
        """Get the earliest future scheduled visit for a patient"""
        results = self._execute_query("""
            SELECT
                v.*,
                d.first_name AS doctor_first_name,
                d.last_name AS doctor_last_name,
                d.specialty
            FROM visits v
            JOIN doctors d ON v.doctor_serial_number = d.doctor_serial_number
            WHERE v.patient_serial_number = %s
              AND v.status = 'scheduled'
              AND v.visit_date > NOW()
            ORDER BY v.visit_date ASC
            LIMIT 1
        """, (patient_serial_number,))

        return results[0] if results else None

visit_repository = VisitRepository()
