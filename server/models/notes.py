from typing import Optional
from uuid import UUID
from pydantic import BaseModel

from models.enums import NoteType


class Note(BaseModel):
    visit_id: UUID
    note_type: NoteType
    note_text: str
    summary: Optional[str] = None
