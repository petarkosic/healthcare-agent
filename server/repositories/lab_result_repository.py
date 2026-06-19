from typing import List, Dict, Any, Optional
from .base_repository import BaseRepository

class LabResultRepository(BaseRepository):
    def __init__(self):
        super().__init__("lab_results")
    
    def get_patient_lab_results(self, patient_serial_number: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get lab results for a patient"""
        with self.db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        l.*,
                        d.first_name AS ordering_doctor_first_name,
                        d.last_name AS ordering_doctor_last_name
                    FROM lab_results l
                    LEFT JOIN doctors d ON l.ordering_doctors_serial_number = d.doctor_serial_number
                    WHERE l.patient_serial_number = %s
                    ORDER BY l.tested_date DESC
                    LIMIT %s
                """, (patient_serial_number, limit))
                
                lab_columns = [desc[0] for desc in cur.description]

                return [dict(zip(lab_columns, row)) for row in cur.fetchall()]
    
    def create_lab_result(self, patient_serial_number: str, visit_id: str,
                         test_name: str, result_value: str, unit: Optional[str],
                         reference_range: str, result_status: str,
                         ordering_doctors_serial_number: str,
                         tested_date: str, received_date: str) -> Optional[str]:
        """Create a new lab result record"""
        with self.db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
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
                
                lab_id = cur.fetchone()[0]

                conn.commit()

                return str(lab_id)

    def get_labs_by_visit(self, visit_id: str):
        """Get all lab results linked to a visit"""
        with self.db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        l.*,
                        d.first_name AS ordering_doctor_first_name,
                        d.last_name AS ordering_doctor_last_name
                    FROM lab_results l
                    LEFT JOIN doctors d ON l.ordering_doctors_serial_number = d.doctor_serial_number
                    WHERE l.visit_id = %s
                    ORDER BY l.tested_date ASC
                """, (visit_id,))

                columns = [desc[0] for desc in cur.description]
                
                return [dict(zip(columns, row)) for row in cur.fetchall()]

lab_result_repository = LabResultRepository()
