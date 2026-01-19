from fastapi import APIRouter, Depends
from .controllers import get_students_with_details, get_dashboard_stats, get_messages_from_prof_today_for_group
from ..middleware.auth_middleware import verify_token

router = APIRouter(
    prefix="/prof",
    tags=["prof"]
)

# =========================
# ÉTUDIANTS DU PROF
# =========================
@router.get("/students-details")
def students_details(user=Depends(verify_token)):
    return get_students_with_details(user)

# =========================
# DASHBOARD STATS
# =========================
@router.get("/dashboard-stats")
def dashboard_stats(user=Depends(verify_token)):
    return get_dashboard_stats(user)

# =========================
# MESSAGES FROM PROF TODAY FOR GROUP
# =========================
@router.get("/messages-from-prof-today/{group_id}")
def messages_from_prof_today(group_id: str, user=Depends(verify_token)):
    return get_messages_from_prof_today_for_group(user, group_id)
