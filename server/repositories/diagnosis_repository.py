from typing import Optional
from .base_repository import BaseRepository

class DiagnosisRepository(BaseRepository):
    def __init__(self):
        super().__init__("diagnoses")

    def create_diagnosis(self, patient_serial_number: str, visit_id: str,
                        diagnosis_code: str, diagnosis_name: str, diagnosis_type: str,
                        status: str, diagnosed_date: str,
                        diagnosing_doctors_serial_number: str,
                        resolved_date: Optional[str] = None) -> Optional[str]:
        """Create a new diagnosis record"""
        diagnosis_id = self._execute_insert("""
            INSERT INTO diagnoses
            (diagnosis_id, patient_serial_number, visit_id, diagnosis_code, diagnosis_name,
             diagnosis_type, status, diagnosed_date, resolved_date,
             diagnosing_doctors_serial_number, created_at)
            VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    DATE_TRUNC('second', now()))
            RETURNING diagnosis_id
        """, (
            patient_serial_number,
            visit_id,
            diagnosis_code,
            diagnosis_name,
            diagnosis_type,
            status,
            diagnosed_date,
            resolved_date,
            diagnosing_doctors_serial_number
        ))

        return str(diagnosis_id) if diagnosis_id else None

    def get_diagnoses_by_visit(self, visit_id: str):
        """Get all diagnoses linked to a visit"""
        return self._execute_query("""
            SELECT
                diag.*,
                d.first_name AS diagnosing_doctor_first_name,
                d.last_name AS diagnosing_doctor_last_name
            FROM diagnoses diag
            LEFT JOIN doctors d ON diag.diagnosing_doctors_serial_number = d.doctor_serial_number
            WHERE diag.visit_id = %s
            ORDER BY diag.diagnosed_date DESC
        """, (visit_id,))

diagnosis_repository = DiagnosisRepository()
