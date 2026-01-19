from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Note(BaseModel):
    text: str
    timestamp: str  # ISO string

class Group(BaseModel):
    groupId: str
    name: str
    profId: str
    studentIds: List[str] = []
    projectTitle: Optional[str] = None
    progress: int = 0  # Progress percentage 0-100
    notes: List[Note] = []  # List of progress notes
    createdAt: datetime = datetime.utcnow()
