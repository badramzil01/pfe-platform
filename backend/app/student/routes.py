from fastapi import APIRouter, Depends
from .controllers import (
    get_dashboard, get_dashboard_stats, get_documents, get_calendar
)
from ..middleware.auth_middleware import verify_token

router = APIRouter(
    tags=["student"]
)

@router.get("/dashboard")
def dashboard():
    return get_dashboard()

@router.get("/dashboard-stats")
def dashboard_stats(user=Depends(verify_token)):
    return get_dashboard_stats(user)

@router.get("/documents")
def documents():
    return get_documents()

@router.get("/calendar")
def calendar():
    return get_calendar()
