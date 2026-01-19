from typing import List, Dict, Optional
from datetime import datetime, timedelta
import random
import string

from fastapi import HTTPException
from firebase_admin import auth, firestore
from firebase_admin.auth import EmailAlreadyExistsError

from ..utils.firebase import init_firebase
from ..utils.mailer import send_activation_email


# 🔥 Initialisation Firebase UNE SEULE FOIS
db = init_firebase()


# =========================
# Utils
# =========================
def _to_iso(ts):
    try:
        if hasattr(ts, "to_datetime"):
            return ts.to_datetime().isoformat()
        if hasattr(ts, "seconds"):
            return datetime.fromtimestamp(ts.seconds).isoformat()
        if isinstance(ts, str):
            return ts
    except Exception:
        pass
    return None


# =========================
# SERVICE ADMIN
# =========================
class AdminService:
    def __init__(self):
        self.users_coll = db.collection("users")
        self.groups_coll = db.collection("groups")
        self.codes_coll = db.collection("adminCodes")

    # =====================================================
    # USERS
    # =====================================================

    def get_users(self) -> List[Dict]:
        users = []
        for doc in self.users_coll.stream():
            u = doc.to_dict()
            u["uid"] = doc.id
            if "createdAt" in u:
                u["createdAt"] = _to_iso(u["createdAt"])
            users.append(u)
        return users

    def create_user(self, user: Dict) -> Dict:
        email = user.get("email")
        display_name = user.get("displayName", "")
        role = user.get("role", "student")

        if not email:
            raise HTTPException(status_code=400, detail="Email requis")

        temp_password = "".join(
            random.choices(string.ascii_letters + string.digits, k=10)
        )

        try:
            fb_user = auth.create_user(
                email=email,
                password=temp_password,
                display_name=display_name
            )
        except EmailAlreadyExistsError:
            raise HTTPException(status_code=409, detail="Cet email existe déjà")

        uid = fb_user.uid

        self.users_coll.document(uid).set({
            "email": email,
            "displayName": display_name,
            "role": role,
            "groupId": None,
            "createdAt": firestore.SERVER_TIMESTAMP
        })

        email_sent = True
        try:
            send_activation_email(email=email, password=temp_password)
        except Exception as e:
            print("SMTP ERROR:", e)
            email_sent = False

        return {
            "uid": uid,
            "email": email,
            "displayName": display_name,
            "role": role,
            "emailSent": email_sent
        }

    def update_user(self, uid: str, user: Dict) -> Dict:
        auth.update_user(
            uid,
            email=user.get("email"),
            display_name=user.get("displayName")
        )

        self.users_coll.document(uid).set({
            "email": user.get("email"),
            "displayName": user.get("displayName"),
            "role": user.get("role"),
            "groupId": user.get("groupId")
        }, merge=True)

        doc = self.users_coll.document(uid).get().to_dict()
        doc["uid"] = uid
        return doc

    def delete_user(self, uid: str) -> Dict:
        try:
            auth.delete_user(uid)
        except Exception:
            pass

        self.users_coll.document(uid).delete()
        return {"message": "Utilisateur supprimé"}

    # =====================================================
    # GROUPS (ADMIN)
    # =====================================================

    def get_groups(self) -> List[Dict]:
        groups = []
        for doc in self.groups_coll.stream():
            g = doc.to_dict()
            g["groupId"] = doc.id
            groups.append(g)
        return groups

    def create_group(self, group: Dict) -> Dict:
        try:
            name = group.get("name")
            prof_id = group.get("profId")
            student_ids = group.get("studentIds", [])
            project_title = group.get("projectTitle", "")

            if not name or not prof_id:
                raise HTTPException(
                    status_code=400,
                    detail="Nom du groupe et encadrant requis"
                )

            ref = self.groups_coll.document()
            payload = {
                "name": name,
                "profId": prof_id,
                "studentIds": student_ids,
                "projectTitle": project_title,
                "createdAt": firestore.SERVER_TIMESTAMP
            }

            ref.set(payload)
            group_id = ref.id

            # 🔗 Lier encadrant
            self.users_coll.document(prof_id).set(
                {"groupId": group_id}, merge=True
            )

            # 🔗 Lier étudiants (sécurisé)
            for sid in student_ids:
                if sid:
                    self.users_coll.document(sid).set(
                        {"groupId": group_id}, merge=True
                    )

            payload["groupId"] = group_id
            # Remove non-serializable fields
            del payload["createdAt"]
            return payload

        except Exception as e:
            print("❌ CREATE GROUP ERROR:", e)
            raise HTTPException(status_code=500, detail=str(e))

    def update_group(self, groupId: str, group: Dict) -> Dict:
        ref = self.groups_coll.document(groupId)
        ref.set(group, merge=True)

        out = ref.get().to_dict()
        out["groupId"] = groupId
        return out

    def delete_group(self, groupId: str) -> Dict:
        ref = self.groups_coll.document(groupId)
        data = ref.get().to_dict() or {}

        if data.get("profId"):
            self.users_coll.document(data["profId"]).set(
                {"groupId": None}, merge=True
            )

        for sid in data.get("studentIds", []):
            if sid:
                self.users_coll.document(sid).set(
                    {"groupId": None}, merge=True
                )

        ref.delete()
        return {"message": "Groupe supprimé"}

    # =====================================================
    # GROUPS (PROF / STUDENT – CHAT)
    # =====================================================

    def get_user_groups(self, user: Dict) -> List[Dict]:
        uid = user["uid"]
        role = user["role"]

        if role == "prof":
            query = self.groups_coll.where("profId", "==", uid)
        else:
            query = self.groups_coll.where("studentIds", "array_contains", uid)

        groups = []
        for doc in query.stream():
            g = doc.to_dict()
            g["groupId"] = doc.id
            groups.append(g)

        return groups

    def get_group_students(self, group_id: str) -> List[Dict]:
        group_doc = self.groups_coll.document(group_id).get()
        if not group_doc.exists:
            raise HTTPException(status_code=404, detail="Groupe introuvable")

        group_data = group_doc.to_dict()
        student_ids = group_data.get("studentIds", [])

        students = []
        for sid in student_ids:
            user_doc = self.users_coll.document(sid).get()
            if user_doc.exists:
                u = user_doc.to_dict()
                u["uid"] = sid
                students.append(u)

        return students

    # =====================================================
    # ADMIN CODES
    # =====================================================

    def generate_admin_code(
        self,
        expires_in_hours: int = 24,
        created_by: Optional[str] = None
    ) -> Dict:
        code = "".join(
            random.choices(string.ascii_uppercase + string.digits, k=8)
        )
        expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)

        doc = {
            "code": code,
            "createdBy": created_by,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "expiresAt": expires_at.isoformat()
        }

        self.codes_coll.document(code).set(doc)
        return doc
