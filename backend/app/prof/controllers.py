from app.prof.services import ProfService

service = ProfService()

def get_students_with_details(user):
    return service.get_students_with_details(user["uid"])

def get_dashboard_stats(user):
    return service.get_dashboard_stats(user["uid"])

def get_messages_from_prof_today_for_group(user, group_id):
    return service.get_messages_from_prof_today_for_group(user["uid"], group_id)
