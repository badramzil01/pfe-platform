from pydantic import BaseModel
from datetime import datetime

class Document(BaseModel):
    docId: str
    filename: str
    originalName: str
    size: int
    type: str
    uploadedBy: str
    groupId: str
    downloadUrl: str
    uploadedAt: datetime = datetime.utcnow()
