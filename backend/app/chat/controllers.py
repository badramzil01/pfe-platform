from fastapi import UploadFile
from app.chat.services import ChatService

service = ChatService()

# =========================
# GET
# =========================
def get_messages(group_id: str):
    return service.get_messages(group_id)

# =========================
# SEND MESSAGE (TEXT + FILE)
# =========================
def send_chat_message(
    group_id: str,
    text: str | None,
    file: UploadFile | None,
    user: dict
):
    return service.send_chat_message(group_id, text, file, user)

# =========================
# UPDATE
# =========================
def update_message(group_id: str, message_id: str, user: dict, text: str):
    return service.update_message(group_id, message_id, user, text)

# =========================
# DELETE
# =========================
def delete_message(group_id: str, message_id: str, user: dict):
    return service.delete_message(group_id, message_id, user)
