from app.groups.services import GroupService

service = GroupService()

def get_my_group(user):
    return service.get_my_group(user)

def get_prof_groups(user):
    return service.get_prof_groups(user)

def update_group_progress(group_id, progress, user):
    return service.update_group_progress(group_id, progress, user)

def add_group_note(group_id, note_data, user):
    return service.add_group_note(group_id, note_data, user)

def update_group_note(group_id, note_data, user):
    return service.update_group_note(group_id, note_data, user)

def delete_group_note(group_id, timestamp, user):
    return service.delete_group_note(group_id, timestamp, user)
