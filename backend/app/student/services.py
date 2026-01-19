from app.utils.firebase import init_firebase
from app.models.user_model import User
from app.models.group_model import Group
from app.models.complaint_model import Complaint
from app.models.calendar_model import CalendarEvent
from datetime import datetime, timedelta
from app.prof.services import ProfService
from google.cloud.firestore_v1.base_query import FieldFilter

# =========================
# INIT FIREBASE
# =========================
db = init_firebase()

class StudentService:
    def __init__(self):
        self.groups = []
        self.documents = []
        self.calendar = []

    def get_dashboard(self):
        return {"message": "Dashboard étudiant"}

    def get_dashboard_stats(self, uid):
        from datetime import datetime, timezone

        today = datetime.now(timezone.utc).date()

        # Get student's group
        groups_ref = db.collection('groups').where(filter=FieldFilter('studentIds', 'array_contains', uid)).limit(1)
        groups = groups_ref.stream()
        group_list = list(groups)
        if not group_list:
            return {"error": "No group found for student"}

        group_id = group_list[0].id

        # Total complaints sent by the student
        complaints = db.collection('complaints').where('fromId', '==', uid).stream()
        total_complaints = len(list(complaints))

        # Total tasks today
        total_tasks_today = 0
        tasks = (
            db.collection("calendar")
            .where(filter=FieldFilter("groupId", "==", group_id))
            .where(filter=FieldFilter("type", "==", "task"))
            .stream()
        )
        for task in tasks:
            task_data = task.to_dict()
            task_date = task_data.get("date")
            if task_date:
                # Assuming date is in YYYY-MM-DD format
                if isinstance(task_date, str):
                    task_date_parsed = datetime.fromisoformat(task_date).date()
                else:
                    task_date_parsed = task_date.date()
                if task_date_parsed == today:
                    total_tasks_today += 1

        # Total messages today - retrieve from stored daily counts
        total_messages_today = 0
        today_str = today.isoformat()
        daily_count_ref = db.collection('daily_message_counts').where(filter=FieldFilter('userId', '==', uid)).where(filter=FieldFilter('date', '==', today_str)).limit(1)
        daily_counts = daily_count_ref.stream()
        for count_doc in daily_counts:
            count_data = count_doc.to_dict()
            total_messages_today = count_data.get('count', 0)
            break  # Should be only one

        # Total messages received by prof today for this group - calculate in real-time
        total_messages_received_by_prof_today = 0
        group_doc = db.collection('groups').document(group_id).get()
        if group_doc.exists:
            group_data = group_doc.to_dict()
            prof_id = group_data.get('profId')
            if prof_id:
                messages = db.collection("chats").document(group_id).collection("messages").stream()
                for msg in messages:
                    msg_data = msg.to_dict()
                    sender_id = msg_data.get('senderId')
                    if sender_id != prof_id:  # Messages from students (received by prof)
                        timestamp = msg_data.get("timestamp")
                        if timestamp:
                            try:
                                if hasattr(timestamp, 'to_datetime'):
                                    # Firestore Timestamp
                                    msg_date = timestamp.to_datetime().date()
                                elif hasattr(timestamp, 'date'):
                                    msg_date = timestamp.date()
                                else:
                                    # Assume it's a string in ISO format
                                    from datetime import datetime
                                    msg_date = datetime.fromisoformat(timestamp).date()
                                if msg_date == today:
                                    total_messages_received_by_prof_today += 1
                            except (AttributeError, ValueError):
                                # If timestamp is not parseable, skip
                                pass

        # Total messages from professor today for this group
        messages_from_professor_today = 0
        group_doc = db.collection('groups').document(group_id).get()
        if group_doc.exists:
            group_data = group_doc.to_dict()
            prof_id = group_data.get('profId')
            if prof_id:
                messages = db.collection("chats").document(group_id).collection("messages").stream()
                for msg in messages:
                    msg_data = msg.to_dict()
                    sender_id = msg_data.get('senderId')
                    if sender_id == prof_id:  # Messages from professor
                        timestamp = msg_data.get("timestamp")
                        if timestamp:
                            try:
                                if hasattr(timestamp, 'to_datetime'):
                                    # Firestore Timestamp
                                    msg_date = timestamp.to_datetime().date()
                                elif hasattr(timestamp, 'date'):
                                    msg_date = timestamp.date()
                                else:
                                    # Assume it's a string in ISO format
                                    from datetime import datetime
                                    msg_date = datetime.fromisoformat(timestamp).date()
                                if msg_date == today:
                                    messages_from_professor_today += 1
                            except (AttributeError, ValueError):
                                # If timestamp is not parseable, skip
                                pass

        return {
            "totalComplaints": total_complaints,
            "totalTasksToday": total_tasks_today,
            "totalMessagesFromProfToday": total_messages_received_by_prof_today,
            "messagesFromProfessorToday": messages_from_professor_today
        }

    def get_documents(self):
        return self.documents

    def get_calendar(self):
        return self.calendar
