from typing import List, Dict, Any, Optional
from .base_repository import BaseRepository

class MedicationRepository(BaseRepository):
    def __init__(self):
        super().__init__("medications")
    
    def get_patient_medications(self, patient_serial_number: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get medications for a patient"""
        with self.db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                if status:
                    cur.execute("""
                        SELECT 
                            m.*,
                            d.first_name AS prescriber_first_name,
                            d.last_name AS prescriber_last_name
                        FROM medications m
                        LEFT JOIN doctors d ON m.doctor_serial_number = d.doctor_serial_number
                        WHERE m.patient_serial_number = %s AND m.status = %s
                        ORDER BY m.start_date DESC
                    """, (patient_serial_number, status))
                else:
                    cur.execute("""
                        SELECT 
                            m.*,
                            d.first_name AS prescriber_first_name,
                            d.last_name AS prescriber_last_name
                        FROM medications m
                        LEFT JOIN doctors d ON m.doctor_serial_number = d.doctor_serial_number
                        WHERE m.patient_serial_number = %s
                        ORDER BY m.start_date DESC
                    """, (patient_serial_number,))
                
                med_columns = [desc[0] for desc in cur.description]
                return [dict(zip(med_columns, row)) for row in cur.fetchall()]
    
    def create_medication(self, patient_serial_number: str, doctor_serial_number: str, 
                         medication_name: str, generic_name: str, dosage: str, frequency: str,
                         start_date: str, prescribed_for: str, instructions: str,
                         end_date: Optional[str] = None, status: str = 'active') -> Optional[str]:
        """Create a new medication record"""
        with self.db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO medications 
                    (medication_id, patient_serial_number, doctor_serial_number, medication_name, 
                     generic_name, dosage, frequency, start_date, end_date, status, 
                     prescribed_for, instructions, created_at, updated_at)
                    VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                            DATE_TRUNC('second', now()), DATE_TRUNC('second', now()))
                    RETURNING medication_id
                """, (
                    patient_serial_number,
                    doctor_serial_number,
                    medication_name,
                    generic_name,
                    dosage,
                    frequency,
                    start_date,
                    end_date,
                    status,
                    prescribed_for,
                    instructions
                ))
                
                medication_id = cur.fetchone()[0]

                conn.commit()

                return str(medication_id)

medication_repository = MedicationRepository()