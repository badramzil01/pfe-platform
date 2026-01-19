from app.complaint.services import ComplaintService

service = ComplaintService()

def create_complaint(title, message, user, to_prof_id=None, to_student_id=None, group_id=None, file=None):
    return service.create_complaint(
        title, message, user, to_prof_id, to_student_id, group_id, file
    )

def get_prof_complaints(user):
    return service.get_prof_complaints(user["uid"])

def get_student_complaints(user):
    return service.get_student_complaints(user["uid"])

def get_my_complaints(user):
    return service.get_my_complaints(user["uid"])
