from app.calendar.services import CalendarService

service = CalendarService()

def create_event(title, description, date, groupId, user, type="task"):
    data = {
        "title": title,
        "description": description,
        "date": date,
        "groupId": groupId,
        "type": type
    }
    return service.create_event(data, user)

def get_events(user, groupId=None):
    return service.get_events(user, groupId)

def update_event(event_id, data, user):
    return service.update_event(event_id, data, user)

def delete_event(event_id, user):
    return service.delete_event(event_id, user)
