from pydantic import BaseModel
from datetime import datetime

class CalendarEvent(BaseModel):
    eventId: str
    title: str
    description: str
    type: str  # Réunion | Taches | finich taches | problem | presentation
    startDate: datetime
    endDate: datetime
    groupId: str
    createdBy: str
    createdAt: datetime = datetime.utcnow()
