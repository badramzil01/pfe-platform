from pydantic import BaseModel

class ChatMessageIn(BaseModel):
    text: str
