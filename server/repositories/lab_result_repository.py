from typing import Optional
from .base_repository import BaseRepository

class LabResultRepository(BaseRepository):
    def __init__(self):
        super().__init__("lab_results")

    def create_lab_result(self, patient_serial_number: str, visit_id: str,
                         test_name: str, result_value: str, unit: Optional[str],
                         reference_range: str, result_status: str,
                         ordering_doctors_serial_number: str,
                         tested_date: str, received_date: str) -> Optional[str]:
        """Create a new lab result record"""
        lab_id = self._execute_insert("""
            INSERT INTO lab_results
            (lab_id, patient_serial_number, visit_id, test_name, result_value,
             unit, reference_range, result_status, tested_date, received_date,
             ordering_doctors_serial_number, created_at)
            VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, DATE_TRUNC('second', now()))
            RETURNING lab_id
        """, (
            patient_serial_number,
            visit_id,
            test_name,
            result_value,
            unit,
            reference_range,
            result_status,
            tested_date,
            received_date,
            ordering_doctors_serial_number
        ))

        return str(lab_id) if lab_id else None

    def get_labs_by_visit(self, visit_id: str):
        """Get all lab results linked to a visit"""
        return self._execute_query("""
            SELECT
                l.*,
                d.first_name AS ordering_doctor_first_name,
                d.last_name AS ordering_doctor_last_name
            FROM lab_results l
            LEFT JOIN doctors d ON l.ordering_doctors_serial_number = d.doctor_serial_number
            WHERE l.visit_id = %s
            ORDER BY l.tested_date ASC
        """, (visit_id,))

lab_result_repository = LabResultRepository()
