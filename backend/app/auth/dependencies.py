from fastapi import Header, HTTPException
from firebase_admin import auth, firestore

db = firestore.client()

def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token manquant")

    token = authorization.replace("Bearer ", "")

    try:
        decoded = auth.verify_id_token(token)
        uid = decoded["uid"]

        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")

        user = user_doc.to_dict()
        user["uid"] = uid
        return user

    except Exception:
        raise HTTPException(status_code=401, detail="Token invalide")
