from fastapi import APIRouter, Depends
from ..middleware.auth_middleware import verify_token

router = APIRouter(prefix="/auth", tags=["auth"])

# 🔹 Récupérer utilisateur connecté
@router.get("/me")
def get_me(user=Depends(verify_token)):
    return user
