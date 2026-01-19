from firebase_admin import firestore, storage
from fastapi import UploadFile, HTTPException
from datetime import datetime, timedelta
from uuid import uuid4
from app.utils.firebase import init_firebase

# =========================
# INIT FIREBASE
# =========================
db = init_firebase()
bucket = storage.bucket()


# =========================
# TIMESTAMP SERIALIZER
# =========================
def serialize_timestamp(ts):
    if ts is None:
        return None
    if isinstance(ts, datetime):
        return ts.isoformat()
    if hasattr(ts, "seconds"):
        return datetime.fromtimestamp(ts.seconds).isoformat()
    return None


# =========================
# CHAT SERVICE
# =========================
class ChatService:
    def __init__(self):
        self.chats = db.collection("chats")

    # =========================
    # GET MESSAGES
    # =========================
    def get_messages(self, group_id: str):
        ref = (
            self.chats
            .document(group_id)
            .collection("messages")
            .order_by("timestamp")
        )

        messages = []
        for doc in ref.stream():
            data = doc.to_dict()
            data["id"] = doc.id
            data["timestamp"] = serialize_timestamp(data.get("timestamp"))
            data["editedAt"] = serialize_timestamp(data.get("editedAt"))
            messages.append(data)

        return messages

    # =========================
    # SEND MESSAGE (TEXT + FILE)
    # =========================
    def send_chat_message(
        self,
        group_id: str,
        text: str | None,
        file: UploadFile | None,
        user: dict
    ):
        if not text and not file:
            raise HTTPException(status_code=400, detail="Message vide")

        message = {
            "senderId": user["uid"],
            "senderEmail": user["email"],
            "senderRole": user["role"],
            "timestamp": firestore.SERVER_TIMESTAMP,
            "edited": False,
            "type": "text"
        }

        # 📝 TEXTE
        if text:
            message["text"] = text

        # 📎 FICHIER
        if file:
            try:
                # 🔒 reset pointeur fichier
                file.file.seek(0)

                safe_name = file.filename.replace(" ", "_")
                filename = f"chat-files/{group_id}/{uuid4()}_{safe_name}"

                blob = bucket.blob(filename)

                blob.upload_from_file(
                    file.file,
                    content_type=file.content_type
                )

                file_url = blob.generate_signed_url(
                    expiration=timedelta(days=3650)
                )

                message.update({
                    "type": "document",
                    "fileName": file.filename,
                    "filePath": filename,
                    "fileUrl": file_url,
                    "mimeType": file.content_type,
                    "fileSize": file.size if hasattr(file, "size") else None
                })

            except Exception as e:
                # 🔥 on garde la trace même si upload échoue
                message.update({
                    "type": "document",
                    "fileName": file.filename,
                    "mimeType": file.content_type,
                    "uploadFailed": True,
                    "errorMessage": str(e)
                })

        self.chats.document(group_id).collection("messages").add(message)

        return {"message": "Message envoyé"}

    # =========================
    # UPDATE MESSAGE (TEXT ONLY)
    # =========================
    def update_message(
        self,
        group_id: str,
        message_id: str,
        user: dict,
        text: str
    ):
        if not text:
            raise HTTPException(status_code=400, detail="Message vide")

        ref = (
            self.chats
            .document(group_id)
            .collection("messages")
            .document(message_id)
        )

        doc = ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Message introuvable")

        data = doc.to_dict()

        if data.get("senderId") != user["uid"]:
            raise HTTPException(status_code=403, detail="Action interdite")

        # Allow editing text in both text messages and document messages with text
        if data.get("type") not in ["text", "document"]:
            raise HTTPException(
                status_code=400,
                detail="Type de message non supporté"
            )

        ref.update({
            "text": text,
            "edited": True,
            "editedAt": firestore.SERVER_TIMESTAMP
        })

        return {"message": "Message modifié"}

    # =========================
    # DELETE MESSAGE (+ FILE)
    # =========================
    def delete_message(
        self,
        group_id: str,
        message_id: str,
        user: dict
    ):
        ref = (
            self.chats
            .document(group_id)
            .collection("messages")
            .document(message_id)
        )

        doc = ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Message introuvable")

        data = doc.to_dict()

        if data.get("senderId") != user["uid"]:
            raise HTTPException(status_code=403, detail="Action interdite")

        # 🗑️ supprimer le fichier Firebase si existant
        if data.get("type") == "document" and data.get("filePath"):
            try:
                bucket.blob(data["filePath"]).delete()
            except Exception:
                pass  # on ne bloque pas la suppression

        ref.delete()
        return {"message": "Message supprimé"}
