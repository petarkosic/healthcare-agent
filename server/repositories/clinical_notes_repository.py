from typing import List, Dict, Any, Optional
from .base_repository import BaseRepository


class ClinicalNoteRepository(BaseRepository):
    def __init__(self):
        super().__init__("clinical_notes")
    
    def get_patient_clinical_notes(self, patient_serial_number: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get clinical notes for a patient"""
        with self.db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        cn.*,
                        d.first_name AS doctor_first_name,
                        d.last_name AS doctor_last_name,
                        v.visit_date
                    FROM clinical_notes cn
                    JOIN doctors d ON cn.doctor_serial_number = d.doctor_serial_number
                    JOIN visits v ON cn.visit_id = v.visit_id
                    WHERE v.patient_serial_number = %s
                    ORDER BY cn.created_at DESC
                    LIMIT %s
                """, (patient_serial_number, limit))
                
                note_columns = [desc[0] for desc in cur.description]

                return [dict(zip(note_columns, row)) for row in cur.fetchall()]
    
    def create_clinical_note(self, visit_id: str, doctor_serial_number: str,
                           note_type: str, note_text: str, summary: str) -> Optional[str]:
        """Create a new clinical note record"""
        with self.db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO clinical_notes 
                    (note_id, visit_id, doctor_serial_number, note_type, note_text, summary, 
                     created_at, updated_at)
                    VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, 
                            DATE_TRUNC('second', now()), DATE_TRUNC('second', now()))
                    RETURNING note_id
                """, (
                    visit_id,
                    doctor_serial_number,
                    note_type,
                    note_text,
                    summary
                ))
                
                note_id = cur.fetchone()[0]

                conn.commit()

                return str(note_id)
    
    def update_clinical_note_summary(self, note_id: str, summary: str) -> bool:
        """Update the summary of a clinical note"""
        with self.db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE clinical_notes 
                    SET summary = %s, updated_at = DATE_TRUNC('second', now())
                    WHERE note_id = %s
                """, (summary, note_id))
                
                affected_rows = cur.rowcount

                conn.commit()

                return affected_rows > 0
            
clinical_note_repository = ClinicalNoteRepository()
