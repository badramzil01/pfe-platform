from fastapi import APIRouter, Depends, Form
from ..middleware.auth_middleware import verify_token
from .controllers import (
    get_my_group,
    get_prof_groups,
    update_group_progress,
    add_group_note,
    update_group_note,
    delete_group_note
)

router = APIRouter(prefix="/groups", tags=["Groups"])

# 👨‍🎓 ÉTUDIANT → SON GROUPE AUTO
@router.get("/my-group")
def my_group(user=Depends(verify_token)):
    return get_my_group(user)

# 👨‍🏫 PROF → SES GROUPES
@router.get("/prof")
def prof_groups(user=Depends(verify_token)):
    return get_prof_groups(user)

# 🔄 UPDATE PROGRESS (PROF + ÉTUDIANTS)
@router.put("/{group_id}/progress")
def update_progress(
    group_id: str,
    progress: int = Form(...),
    user=Depends(verify_token)
):
    return update_group_progress(group_id, progress, user)

# ➕ ADD NOTE (ÉTUDIANTS)
@router.post("/{group_id}/notes")
def add_note(
    group_id: str,
    text: str = Form(...),
    timestamp: str = Form(...),
    user=Depends(verify_token)
):
    note_data = {"text": text, "timestamp": timestamp}
    return add_group_note(group_id, note_data, user)

# ✏️ UPDATE NOTE (ÉTUDIANTS)
@router.put("/{group_id}/notes/{timestamp}")
def update_note(
    group_id: str,
    timestamp: str,
    text: str = Form(...),
    user=Depends(verify_token)
):
    note_data = {"text": text, "timestamp": timestamp}
    return update_group_note(group_id, note_data, user)

# 🗑️ DELETE NOTE (ÉTUDIANTS)
@router.delete("/{group_id}/notes/{timestamp}")
def delete_note(
    group_id: str,
    timestamp: str,
    user=Depends(verify_token)
):
    return delete_group_note(group_id, timestamp, user)
