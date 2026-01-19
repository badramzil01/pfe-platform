from fastapi import Header, HTTPException
from firebase_admin import auth
from ..utils.firebase import init_firebase

# 🔥 Firestore initialisé UNE SEULE FOIS
db = init_firebase()

def verify_token(authorization: str = Header(None)):
    # ⚠️ IMPORTANT : Header(None) pour laisser passer OPTIONS (CORS)
    if authorization is None:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")

    token = authorization.replace("Bearer ", "").strip()

    # ================= ADMIN SESSION =================
    if token == "ADMIN_SESSION":
        return {
            "uid": "admin",
            "email": "admin@platform.local",
            "role": "admin"
        }

    # ================= FIREBASE TOKEN =================
    try:
        decoded = auth.verify_id_token(token)
        uid = decoded["uid"]

        doc = db.collection("users").document(uid).get()
        if not doc.exists:
            raise HTTPException(status_code=401, detail="User not found")

        user = doc.to_dict()
        user["uid"] = uid
        user.setdefault("role", "student")

        return user

    except Exception as e:
        print("❌ AUTH ERROR:", e)
        raise HTTPException(status_code=401, detail="Invalid or expired token")
