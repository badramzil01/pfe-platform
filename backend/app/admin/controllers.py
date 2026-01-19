from app.admin.services import AdminService

service = AdminService()

def get_users():
    return service.get_users()

def create_user(user: dict):
    return service.create_user(user)

def update_user(uid: str, user: dict):
    return service.update_user(uid, user)

def delete_user(uid: str):
    return service.delete_user(uid)
