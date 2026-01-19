from fastapi import APIRouter, Depends, Form, HTTPException, File, UploadFile
from ..middleware.auth_middleware import verify_token
from .controllers import (
    create_complaint,
    get_prof_complaints,
    get_student_complaints,
    get_my_complaints
)
from .services import ComplaintService

router = APIRouter(
    prefix="/complaints",
    tags=["complaints"]
)

# =====================================================
# CREATE COMPLAINT (STUDENT / PROF)
# =====================================================
@router.post("/")
def send_complaint(
    title: str = Form(...),
    message: str = Form(...),
    toProfId: str | None = Form(None),
    toStudentId: str | None = Form(None),
    groupId: str | None = Form(None),
    file: UploadFile | None = File(None),
    user=Depends(verify_token)
):
    """
    STUDENT:
      - toProfId obligatoire
    PROF:
      - toStudentId OU groupId obligatoire
    """

    # 🔐 VALIDATION
    # Student can send either to a professor OR to their group (but at least one)
    if user["role"] == "student":
        if not toProfId and not groupId:
            raise HTTPException(
                status_code=400,
                detail="Student must target a professor or a group"
            )
        if toProfId and groupId:
            raise HTTPException(
                status_code=400,
                detail="Provide only one target: professor OR group"
            )

    if user["role"] == "prof" and not toStudentId and not groupId:
        raise HTTPException(
            status_code=400,
            detail="Professor must target a student or a group"
        )

    return create_complaint(
        title=title,
        message=message,
        user=user,
        to_prof_id=toProfId,
        to_student_id=toStudentId,
        group_id=groupId,
        file=file
    )

# =====================================================
# MARK COMPLAINT AS READ
# =====================================================
@router.put("/{complaint_id}/read")
def mark_complaint_read(
    complaint_id: str,
    user=Depends(verify_token)
):
    """
    Mark complaint as read by current user
    """
    service = ComplaintService()
    return service.mark_complaint_read(
        complaint_id=complaint_id,
        user_uid=user["uid"]
    )

# =====================================================
# PROFESSOR → RECEIVED COMPLAINTS
# =====================================================
@router.get("/prof")
def prof_complaints(user=Depends(verify_token)):
    if user["role"] != "prof":
        raise HTTPException(status_code=403, detail="Access forbidden")
    return get_prof_complaints(user)

# =====================================================
# STUDENT → RECEIVED COMPLAINTS
# =====================================================
@router.get("/student")
def student_complaints(user=Depends(verify_token)):
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Access forbidden")
    return get_student_complaints(user)

# =====================================================
# MY COMPLAINTS (SENT)
# =====================================================
@router.get("/my")
def my_complaints(user=Depends(verify_token)):
    return get_my_complaints(user)

# =====================================================
# UPDATE COMPLAINT (TITLE/MESSAGE) - ONLY SENDER
# =====================================================
@router.put("/{complaint_id}")
def update_complaint_route(
    complaint_id: str,
    title: str | None = Form(None),
    message: str | None = Form(None),
    user=Depends(verify_token)
):
    """
    Update title/message of a complaint (only by the sender)
    """
    service = ComplaintService()
    return service.update_complaint(
        complaint_id=complaint_id,
        user_uid=user["uid"],
        title=title,
        message=message
    )

# =====================================================
# DELETE COMPLAINT
# =====================================================
@router.delete("/{complaint_id}")
def delete_complaint(
    complaint_id: str,
    user=Depends(verify_token)
):
    """
    Only sender can delete complaint
    """
    service = ComplaintService()
    return service.delete_complaint(complaint_id)

# =====================================================
# STUDENT → GET HIS PROFESSORS
# =====================================================
@router.get("/student/professors")
def get_student_professors(user=Depends(verify_token)):
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Access forbidden")

    service = ComplaintService()
    return service.get_student_professors(user["uid"])
