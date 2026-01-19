from app.utils.firebase import init_firebase
from google.cloud.firestore_v1.base_query import FieldFilter
db = init_firebase()

class GroupService:
    def __init__(self):
        self.groups = db.collection("groups")
        self.users = db.collection("users")

    def _get_students_details(self, student_ids):
        """Helper method to fetch student details from user IDs."""
        students = []
        for uid in student_ids:
            user_doc = self.users.document(uid).get()
            if user_doc.exists:
                u = user_doc.to_dict()
                students.append({
                    "uid": uid,
                    "name": u.get("displayName", "Étudiant"),
                    "email": u.get("email")
                })
        return students

    # 👨‍🎓 ÉTUDIANT → récupérer automatiquement SON groupe
    def get_my_group(self, user):
        docs = self.groups.where(
            filter=FieldFilter("studentIds", "array_contains", user["uid"])
        ).stream()

        for d in docs:
            data = d.to_dict()
            data["groupId"] = d.id
            data["students"] = self._get_students_details(data.get("studentIds", []))
            return data

        return None

    # 👨‍🏫 PROF → récupérer ses groupes
    def get_prof_groups(self, user):
        docs = self.groups.where("profId", "==", user["uid"]).stream()
        res = []

        for d in docs:
            data = d.to_dict()
            data["groupId"] = d.id
            data["students"] = self._get_students_details(data.get("studentIds", []))
            res.append(data)

        return res

    # 🔄 UPDATE PROGRESS (PROF + ÉTUDIANTS DU GROUPE)
    def update_group_progress(self, group_id, progress, user):
        ref = self.groups.document(group_id)
        doc = ref.get()

        if not doc.exists:
            raise Exception("Group not found")

        group = doc.to_dict()

        # permissions
        if user["role"] == "student":
            if user["uid"] not in group.get("studentIds", []):
                raise Exception("Forbidden")

        if user["role"] == "prof":
            if group.get("profId") != user["uid"]:
                raise Exception("Forbidden")

        ref.update({"progress": progress})
        return {"message": "Progress updated", "progress": progress}

    # ➕ ADD NOTE (ÉTUDIANTS DU GROUPE)
    def add_group_note(self, group_id, note_data, user):
        ref = self.groups.document(group_id)
        doc = ref.get()

        if not doc.exists:
            raise Exception("Group not found")

        group = doc.to_dict()

        # permissions: only students in the group can add notes
        if user["role"] != "student" or user["uid"] not in group.get("studentIds", []):
            raise Exception("Forbidden")

        # Get current notes or initialize empty list
        notes = group.get("notes", [])

        # Append new note
        notes.append(note_data)

        # Update the document
        ref.update({"notes": notes})
        return {"message": "Note added", "note": note_data}

    # ✏️ UPDATE NOTE (ÉTUDIANTS DU GROUPE)
    def update_group_note(self, group_id, note_data, user):
        ref = self.groups.document(group_id)
        doc = ref.get()

        if not doc.exists:
            raise Exception("Group not found")

        group = doc.to_dict()

        # permissions: only students in the group can update notes
        if user["role"] != "student" or user["uid"] not in group.get("studentIds", []):
            raise Exception("Forbidden")

        # Get current notes
        notes = group.get("notes", [])

        # Find and update the note by timestamp
        for i, note in enumerate(notes):
            if note.get("timestamp") == note_data.get("timestamp"):
                notes[i] = note_data
                break
        else:
            raise Exception("Note not found")

        # Update the document
        ref.update({"notes": notes})
        return {"message": "Note updated", "note": note_data}

    # 🗑️ DELETE NOTE (ÉTUDIANTS DU GROUPE)
    def delete_group_note(self, group_id, timestamp, user):
        ref = self.groups.document(group_id)
        doc = ref.get()

        if not doc.exists:
            raise Exception("Group not found")

        group = doc.to_dict()

        # permissions: only students in the group can delete notes
        if user["role"] != "student" or user["uid"] not in group.get("studentIds", []):
            raise Exception("Forbidden")

        # Get current notes
        notes = group.get("notes", [])

        # Find and remove the note by timestamp
        for i, note in enumerate(notes):
            if note.get("timestamp") == timestamp:
                deleted_note = notes.pop(i)
                break
        else:
            raise Exception("Note not found")

        # Update the document
        ref.update({"notes": notes})
        return {"message": "Note deleted", "note": deleted_note}
