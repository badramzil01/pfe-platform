from fastapi import APIRouter, Body, Depends, HTTPException
from typing import Dict
from .services import AdminService
from ..middleware.auth_middleware import verify_token

router = APIRouter(prefix="/admin", tags=["admin"])
service = AdminService()

# 🔒 ADMIN GUARD
def admin_guard(user=Depends(verify_token)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user

# ================= USERS =================

@router.get("/users")
def get_users(admin=Depends(admin_guard)):
    return service.get_users()

@router.post("/users")
def create_user(user_data: Dict = Body(...), admin=Depends(admin_guard)):
    return service.create_user(user_data)

@router.put("/users/{uid}")
def update_user(uid: str, user_data: Dict = Body(...), admin=Depends(admin_guard)):
    return service.update_user(uid, user_data)

@router.delete("/users/{uid}")
def delete_user(uid: str, admin=Depends(admin_guard)):
    return service.delete_user(uid)

# ================= GROUPS =================

@router.get("/groups")
def get_groups(admin=Depends(admin_guard)):
    return service.get_groups()

@router.post("/groups")
def create_group(group: Dict = Body(...), admin=Depends(admin_guard)):
    return service.create_group(group)

@router.put("/groups/{groupId}")
def update_group(groupId: str, group: Dict = Body(...), admin=Depends(admin_guard)):
    return service.update_group(groupId, group)

@router.delete("/groups/{groupId}")
def delete_group(groupId: str, admin=Depends(admin_guard)):
    return service.delete_group(groupId)
@router.get("/my-groups")
def my_groups(user=Depends(verify_token)):
    return service.get_user_groups(user)

@router.get("/groups/{groupId}/students")
def get_group_students(groupId: str, user=Depends(verify_token)):
    return service.get_group_students(groupId)
