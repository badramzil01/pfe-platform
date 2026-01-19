from datetime import datetime
from app.utils.firebase import init_firebase
from google.cloud.firestore_v1.base_query import FieldFilter

db = init_firebase()


class ComplaintService:
    def __init__(self):
        self.complaints = db.collection("complaints")
        self.groups = db.collection("groups")
        self.users = db.collection("users")

    # =====================================================
    # CREATE COMPLAINT (STUDENT / PROF)
    # =====================================================
    def create_complaint(
        self,
        title: str,
        message: str,
        user: dict,
        to_prof_id: str | None = None,
        to_student_id: str | None = None,
        group_id: str | None = None,
        file=None
    ):
        # =========================
        # VALIDATIONS
        # =========================

        # Étudiant → Prof : UNIQUEMENT si lié par PFE
        if user["role"] == "student" and to_prof_id:
            groups = (
                self.groups
                .where(filter=FieldFilter("studentIds", "array_contains", user["uid"]))
                .where(filter=FieldFilter("profId", "==", to_prof_id))
                .stream()
            )
            if not list(groups):
                raise Exception("Ce professeur n'est pas lié à votre PFE")

        # Étudiant → Groupe : UNIQUEMENT si appartient au groupe
        if user["role"] == "student" and group_id:
            group_doc = self.groups.document(group_id).get()
            if not group_doc.exists:
                raise Exception("Groupe introuvable")
            if user["uid"] not in group_doc.to_dict().get("studentIds", []):
                raise Exception("Vous ne faites pas partie de ce groupe")

        data = {
            "title": title,
            "message": message,
            "fromUserId": user["uid"],
            "fromRole": user["role"],
            "toProfId": to_prof_id,
            "toStudentId": to_student_id,
            "groupId": group_id,
            "type": "group" if group_id else "individual",
            "readBy": [],
            "createdAt": datetime.utcnow()
        }

        self.complaints.add(data)
        return {"message": "Réclamation envoyée avec succès"}

    # =====================================================
    # GET COMPLAINTS RECEIVED BY PROF
    # =====================================================
    def get_prof_complaints(self, prof_uid: str):
        docs = self.complaints.where(filter=FieldFilter("toProfId", "==", prof_uid)).stream()
        complaints = []

        for d in docs:
            c = d.to_dict()
            c["id"] = d.id

            # Status
            c["status"] = "open" if prof_uid in c.get("readBy", []) else "not open"

            # Sender name
            sender = self.users.document(c["fromUserId"]).get()
            c["fromName"] = (
                sender.to_dict().get("displayName", "Utilisateur")
                if sender.exists else "Utilisateur"
            )

            complaints.append(c)

        return sorted(complaints, key=lambda x: x["createdAt"], reverse=True)

    # =====================================================
    # GET COMPLAINTS RECEIVED BY STUDENT
    # =====================================================
    def get_student_complaints(self, student_uid: str):
        complaints = []

        # 🔹 Individuelles
        docs = self.complaints.where(filter=FieldFilter("toStudentId", "==", student_uid)).stream()
        for d in docs:
            c = d.to_dict()
            c["id"] = d.id
            c["status"] = "open" if student_uid in c.get("readBy", []) else "not open"
            complaints.append(c)

        # 🔹 Groupes
        groups = self.groups.where("studentIds", "array_contains", student_uid).stream()
        group_ids = [g.id for g in groups]

        for gid in group_ids:
            docs = self.complaints.where(filter=FieldFilter("groupId", "==", gid)).stream()
            for d in docs:
                c = d.to_dict()
                c["id"] = d.id
                c["status"] = "open" if student_uid in c.get("readBy", []) else "not open"
                complaints.append(c)

        return sorted(complaints, key=lambda x: x["createdAt"], reverse=True)

    # =====================================================
    # GET COMPLAINTS SENT BY USER
    # =====================================================
    def get_my_complaints(self, user_uid: str):
        docs = self.complaints.where("fromUserId", "==", user_uid).stream()
        complaints = []

        for d in docs:
            c = d.to_dict()
            c["id"] = d.id

            if c.get("type") == "group":
                group_id = c.get("groupId")
                if group_id:
                    group_doc = self.groups.document(group_id).get()
                    if group_doc.exists:
                        students = group_doc.to_dict().get("studentIds", [])
                        c["status"] = "open" if len(c.get("readBy", [])) >= len(students) else "not open"
                    else:
                        c["status"] = "not open"
                else:
                    c["status"] = "not open"
            else:
                target = c.get("toProfId") or c.get("toStudentId")
                c["status"] = "open" if target in c.get("readBy", []) else "not open"

            complaints.append(c)

        return sorted(complaints, key=lambda x: x["createdAt"], reverse=True)

    # =====================================================
    # UPDATE COMPLAINT (only sender)
    # =====================================================
    def update_complaint(self, complaint_id: str, user_uid: str, title: str | None = None, message: str | None = None):
        ref = self.complaints.document(complaint_id)
        doc = ref.get()

        if not doc.exists:
            raise Exception("Réclamation introuvable")

        data = doc.to_dict()
        if data.get("fromUserId") != user_uid:
            raise Exception("Vous n'êtes pas autorisé à modifier cette réclamation")

        updates = {}
        if title is not None and title.strip() != "":
            updates["title"] = title.strip()
        if message is not None and message.strip() != "":
            updates["message"] = message.strip()

        if not updates:
            return {"message": "Aucune modification"}

        ref.update(updates)
        return {"message": "Réclamation mise à jour"}

    # =====================================================
    # MARK AS READ
    # =====================================================
    def mark_complaint_read(self, complaint_id: str, user_uid: str):
        ref = self.complaints.document(complaint_id)
        doc = ref.get()

        if not doc.exists:
            raise Exception("Réclamation introuvable")

        data = doc.to_dict()
        read_by = data.get("readBy", [])

        if user_uid not in read_by:
            read_by.append(user_uid)
            ref.update({"readBy": read_by})

        return {"message": "Réclamation marquée comme lue"}

    # =====================================================
    # DELETE COMPLAINT
    # =====================================================
    def delete_complaint(self, complaint_id: str):
        ref = self.complaints.document(complaint_id)
        if not ref.get().exists:
            raise Exception("Réclamation introuvable")

        ref.delete()
        return {"message": "Réclamation supprimée"}

    # =====================================================
    # GET STUDENT PROFESSORS (PFE)
    # =====================================================
    def get_student_professors(self, student_uid: str):
        groups = self.groups.where(filter=FieldFilter("studentIds", "array_contains", student_uid)).stream()
        prof_ids = set()

        for g in groups:
            prof_ids.add(g.to_dict().get("profId"))

        professors = []
        for pid in prof_ids:
            doc = self.users.document(pid).get()
            if doc.exists:
                professors.append({"id": pid, **doc.to_dict()})

        return professors
