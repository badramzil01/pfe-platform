from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class User(BaseModel):
    uid: str
    email: str
    displayName: str
    role: str  # admin | prof | student
    groupId: Optional[str] = None
    createdAt: datetime = datetime.utcnow()
