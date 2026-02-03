from typing import Literal, Optional
from uuid import UUID
from pydantic import BaseModel


class Note(BaseModel):
    visit_id: UUID
    note_type: Literal['soap_subjective', 'soap_objective', 'soap_assessment', 'soap_plan','progress_note', 'consult_note', 'discharge_summary', 'procedure_note']
    note_text: str
    doctor_serial_number: str
    summary: Optional[str] = None
