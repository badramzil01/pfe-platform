from fastapi import APIRouter, Depends, Form, Body
from ..middleware.auth_middleware import verify_token
from .services import CalendarService

router = APIRouter(prefix="/calendar", tags=["Calendar"])
service = CalendarService()

@router.post("/")
def add_event(
    title: str = Form(...),
    date: str = Form(...),
    description: str = Form(""),
    groupId: str = Form(...),
    type: str = Form("task"),
    user=Depends(verify_token)
):
    return service.create_event({
        "title": title,
        "description": description,
        "date": date,
        "groupId": groupId,
        "type": type
    }, user)

@router.get("/")
def list_events(
    groupId: str,
    user=Depends(verify_token)
):
    return service.get_events(user, groupId)

@router.put("/{event_id}")
def edit_event(
    event_id: str,
    data: dict = Body(...),
    user=Depends(verify_token)
):
    return service.update_event(event_id, data, user)

@router.delete("/{event_id}")
def remove_event(event_id: str, user=Depends(verify_token)):
    return service.delete_event(event_id, user)
