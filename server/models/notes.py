from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field

from models.enums import NoteType


class Note(BaseModel):
    visit_id: UUID
    note_type: NoteType
    note_text: str = Field(max_length=10_000)
    summary: Optional[str] = None
