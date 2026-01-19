from app.utils.firebase import init_firebase
from datetime import datetime, timedelta
from collections import defaultdict

# Initialize Firebase
db = init_firebase()

def calculate_daily_message_counts():
    """
    Calculate and store daily message counts for all users from today's messages.
    """
    # Determine today's date
    today = datetime.now().date()
    today_str = today.isoformat()  # YYYY-MM-DD

    # Get all groups
    groups_ref = db.collection('groups')
    groups = groups_ref.stream()

    # Dictionary to hold counts: (userId, groupId) -> count
    message_counts = defaultdict(int)

    for group in groups:
        group_id = group.id
        # Query messages from today in this group's chat
        messages_ref = db.collection('chats').document(group_id).collection('messages')
        # Filter by timestamp >= start of today and < start of tomorrow
        start_today = datetime.combine(today, datetime.min.time())
        start_tomorrow = datetime.combine(today + timedelta(days=1), datetime.min.time())

        # Firestore query: where timestamp >= start_today and timestamp < start_tomorrow
        messages = messages_ref.where('timestamp', '>=', start_today).where('timestamp', '<', start_tomorrow).stream()

        for msg in messages:
            msg_data = msg.to_dict()
            sender_id = msg_data.get('senderId')
            if sender_id:
                message_counts[(sender_id, group_id)] += 1

    # Store the counts in 'daily_message_counts' collection
    for (user_id, group_id), count in message_counts.items():
        doc_ref = db.collection('daily_message_counts').document(f"{user_id}_{group_id}_{today_str}")
        doc_ref.set({
            'userId': user_id,
            'groupId': group_id,
            'date': today_str,
            'count': count
        })

    print(f"Daily message counts calculated and stored for {today_str}. Total users: {len(message_counts)}")
