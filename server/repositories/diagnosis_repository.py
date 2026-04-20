from typing import List, Dict, Any, Optional
from .base_repository import BaseRepository

class DiagnosisRepository(BaseRepository):
    def __init__(self):
        super().__init__("diagnoses")
    
    def get_patient_diagnoses(self, patient_serial_number: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get diagnoses for a patient"""
        with self.db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                if status:
                    cur.execute("""
                        SELECT 
                            diag.*,
                            d.first_name AS diagnosing_doctor_first_name,
                            d.last_name AS diagnosing_doctor_last_name
                        FROM diagnoses diag
                        LEFT JOIN doctors d ON diag.diagnosing_doctors_serial_number = d.doctor_serial_number
                        WHERE diag.patient_serial_number = %s AND diag.status = %s
                        ORDER BY diag.diagnosed_date DESC
                    """, (patient_serial_number, status))
                else:
                    cur.execute("""
                        SELECT 
                            diag.*,
                            d.first_name AS diagnosing_doctor_first_name,
                            d.last_name AS diagnosing_doctor_last_name
                        FROM diagnoses diag
                        LEFT JOIN doctors d ON diag.diagnosing_doctors_serial_number = d.doctor_serial_number
                        WHERE diag.patient_serial_number = %s
                        ORDER BY diag.diagnosed_date DESC
                    """, (patient_serial_number,))
                
                diag_columns = [desc[0] for desc in cur.description]

                return [dict(zip(diag_columns, row)) for row in cur.fetchall()]
    
    def create_diagnosis(self, patient_serial_number: str, visit_id: str,
                        diagnosis_code: str, diagnosis_name: str, diagnosis_type: str,
                        status: str, diagnosed_date: str,
                        diagnosing_doctors_serial_number: str,
                        resolved_date: Optional[str] = None) -> Optional[str]:
        """Create a new diagnosis record"""
        with self.db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
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
                
                diagnosis_id = cur.fetchone()[0]

                conn.commit()
                
                return str(diagnosis_id)

diagnosis_repository = DiagnosisRepository()
