from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    Form,
    HTTPException
)
from .controllers import (
    get_messages,
    send_chat_message,
    update_message,
    delete_message
)
from ..middleware.auth_middleware import verify_token

router = APIRouter(
    prefix="/chat",
    tags=["chat"]
)

# =========================
# GET MESSAGES
# =========================
@router.get("/{group_id}/messages")
def read_messages(
    group_id: str,
    user=Depends(verify_token)
):
    return get_messages(group_id)


# =========================
# SEND MESSAGE (TEXT + FILE)
# =========================
@router.post("/{group_id}/messages")
def create_message(
    group_id: str,
    text: str | None = Form(None),
    file: UploadFile | None = File(None),
    user=Depends(verify_token)
):
    if not text and not file:
        raise HTTPException(
            status_code=400,
            detail="Message vide"
        )

    return send_chat_message(
        group_id=group_id,
        text=text,
        file=file,
        user=user
    )


# =========================
# UPDATE MESSAGE (TEXT ONLY)
# =========================
@router.put("/{group_id}/messages/{message_id}")
def edit_message(
    group_id: str,
    message_id: str,
    text: str = Form(...),
    user=Depends(verify_token)
):
    return update_message(
        group_id=group_id,
        message_id=message_id,
        user=user,
        text=text
    )


# =========================
# DELETE MESSAGE
# =========================
@router.delete("/{group_id}/messages/{message_id}")
def remove_message(
    group_id: str,
    message_id: str,
    user=Depends(verify_token)
):
    return delete_message(
        group_id=group_id,
        message_id=message_id,
        user=user
    )
