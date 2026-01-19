from app.utils.firebase import init_firebase

db = init_firebase()


class ProfService:
    def __init__(self):
        self.groups = db.collection("groups")
        self.users = db.collection("users")
        self.documents = db.collection("documents")
        self.complaints = db.collection("complaints")

    def get_students_with_details(self, prof_uid: str):
        students_details = []

        # 🔹 récupérer les groupes du prof
        groups = self.groups.where("profId", "==", prof_uid).stream()
        groups_list = list(groups)
        print(f"DEBUG: Found {len(groups_list)} groups for prof {prof_uid}")

        for group in groups_list:
            g = group.to_dict()
            group_id = group.id
            project_title = g.get("projectTitle", "Sans projet")

            student_ids = g.get("studentIds", [])
            print(f"DEBUG: Group {group_id} has students: {student_ids}")

            for uid in student_ids:
                user_doc = self.users.document(uid).get()
                if not user_doc.exists:
                    continue

                u = user_doc.to_dict()

                # 📄 nombre de documents
                docs = (
                    self.documents
                    .where("uploadedBy", "==", uid)
                    .where("groupId", "==", group_id)
                    .stream()
                )
                doc_count = len(list(docs))

                # 💬 nombre de messages
                msgs = (
                    db.collection("chats")
                    .document(group_id)
                    .collection("messages")
                    .where("senderId", "==", uid)
                    .stream()
                )
                msg_count = len(list(msgs))

                students_details.append({
                    "uid": uid,
                    "name": u.get("displayName", "Étudiant"),
                    "email": u.get("email"),
                    "projectTitle": project_title,
                    "documentCount": doc_count,
                    "messageCount": msg_count
                })

        return students_details

    def get_dashboard_stats(self, prof_uid: str):
        from datetime import datetime, timezone

        today = datetime.now(timezone.utc).date()

        # Total complaints
        complaints = self.complaints.where("toProfId", "==", prof_uid).stream()
        total_complaints = len(list(complaints))

        # Total tasks today
        total_tasks_today = 0
        total_tasks = 0
        groups = self.groups.where("profId", "==", prof_uid).stream()
        for group in groups:
            group_id = group.id
            tasks = (
                db.collection("calendar")
                .where("groupId", "==", group_id)
                .where("type", "==", "task")
                .stream()
            )
            for task in tasks:
                task_data = task.to_dict()
                total_tasks += 1  # Count all tasks
                task_date = task_data.get("date")
                if task_date:
                    # Assuming date is in YYYY-MM-DD format
                    if isinstance(task_date, str):
                        task_date_parsed = datetime.fromisoformat(task_date).date()
                    else:
                        task_date_parsed = task_date.date()
                    if task_date_parsed == today:
                        total_tasks_today += 1

        # Total messages today from students and prof
        total_messages_from_students_today = 0
        total_messages_from_prof_today = 0
        groups = self.groups.where("profId", "==", prof_uid).stream()
        for group in groups:
            group_id = group.id
            messages = db.collection("chats").document(group_id).collection("messages").stream()
            for msg in messages:
                msg_data = msg.to_dict()
                timestamp = msg_data.get("timestamp")
                sender_id = msg_data.get("senderId")
                if timestamp:
                    msg_date = timestamp.date()
                    if msg_date == today:
                        if sender_id == prof_uid:
                            total_messages_from_prof_today += 1
                        else:
                            total_messages_from_students_today += 1

        return {
            "totalComplaints": total_complaints,
            "totalTasksToday": total_tasks_today,
            "totalMessagesFromStudentsToday": total_messages_from_students_today,
            "totalMessagesFromProfToday": total_messages_from_prof_today
        }

    def get_messages_from_prof_today_for_group(self, prof_uid: str, group_id: str):
        from datetime import datetime, timezone

        today = datetime.now(timezone.utc).date()

        # Total messages from prof today for this group
        total_messages_from_prof_today = 0
        messages = db.collection("chats").document(group_id).collection("messages").where('senderId', '==', prof_uid).stream()
        for msg in messages:
            msg_data = msg.to_dict()
            timestamp = msg_data.get("timestamp")
            if timestamp:
                msg_date = timestamp.date()
                if msg_date == today:
                    total_messages_from_prof_today += 1

        return {"totalMessagesFromProfToday": total_messages_from_prof_today}
