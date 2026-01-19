from app.student.services import StudentService

service = StudentService()

def get_dashboard():
    return service.get_dashboard()

def get_documents():
    return service.get_documents()

def get_calendar():
    return service.get_calendar()

def get_dashboard_stats(user):
    return service.get_dashboard_stats(user)
