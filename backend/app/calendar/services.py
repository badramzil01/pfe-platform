from datetime import datetime
from fastapi import HTTPException
from app.utils.firebase import init_firebase

db = init_firebase()

class CalendarService:
    def __init__(self):
        self.events = db.collection("calendar_events")
        self.groups = db.collection("groups")

    def _get_user_groups(self, user):
        group_ids = []

        if user["role"] == "admin":
            # Admin can access all groups
            docs = self.groups.stream()
        elif user["role"] == "prof":
            docs = self.groups.where("profId", "==", user["uid"]).stream()
        else:
            docs = self.groups.where("studentIds", "array_contains", user["uid"]).stream()

        for d in docs:
            group_ids.append(d.id)

        return group_ids

    # ✅ CREATE
    def create_event(self, data, user):
        groupId = data.get("groupId")
        if not groupId:
            raise HTTPException(status_code=400, detail="groupId required")

        user_groups = self._get_user_groups(user)
        if groupId not in user_groups:
            raise HTTPException(status_code=403, detail="Access denied")

        event = {
            "title": data["title"],
            "description": data.get("description", ""),
            "date": data["date"],
            "type": data.get("type", "task"),
            "groupId": groupId,
            "createdBy": user["uid"],
            "creatorRole": user["role"],
            "createdAt": datetime.utcnow(),
        }

        self.events.add(event)
        return {"message": "Event created"}

    # ✅ READ (shared)
    def get_events(self, user, groupId):
        user_groups = self._get_user_groups(user)
        if groupId not in user_groups:
            raise HTTPException(status_code=403, detail="Access denied")

        docs = self.events.where("groupId", "==", groupId).stream()
        return [{**d.to_dict(), "id": d.id} for d in docs]

    # ✏️ UPDATE
    def update_event(self, event_id, data, user):
        ref = self.events.document(event_id)
        doc = ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Event not found")

        event = doc.to_dict()
        if event["createdBy"] != user["uid"]:
            raise HTTPException(status_code=403, detail="Forbidden")

        allowed = ["title", "description", "date", "type"]
        ref.update({k: v for k, v in data.items() if k in allowed})

        return {"message": "Event updated"}

    # 🗑️ DELETE
    def delete_event(self, event_id, user):
        ref = self.events.document(event_id)
        doc = ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Event not found")

        event = doc.to_dict()
        if event["createdBy"] != user["uid"]:
            raise HTTPException(status_code=403, detail="Forbidden")

        ref.delete()
        return {"message": "Event deleted"}
