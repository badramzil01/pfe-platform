from pydantic import BaseModel
from datetime import datetime

class Complaint(BaseModel):
    complaintId: str
    title: str
    description: str
    fromUid: str
    groupId: str
    status: str = "pending"  # pending | resolved
    createdAt: datetime = datetime.utcnow()
