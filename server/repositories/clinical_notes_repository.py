from typing import Optional
from .base_repository import BaseRepository


class ClinicalNoteRepository(BaseRepository):
    def __init__(self):
        super().__init__("clinical_notes")

    def create_clinical_note(self, visit_id: str, doctor_serial_number: str,
                           note_type: str, note_text: str, summary: str) -> Optional[str]:
        """Create a new clinical note record"""
        note_id = self._execute_insert("""
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

        return str(note_id) if note_id else None

    def get_notes_by_visit(self, visit_id: str):
        """Get all clinical notes for a visit"""
        return self._execute_query("""
            SELECT
                cn.*,
                d.first_name AS doctor_first_name,
                d.last_name AS doctor_last_name
            FROM clinical_notes cn
            LEFT JOIN doctors d ON cn.doctor_serial_number = d.doctor_serial_number
            WHERE cn.visit_id = %s
            ORDER BY cn.created_at ASC
        """, (visit_id,))

clinical_note_repository = ClinicalNoteRepository()
