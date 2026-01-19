import os
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth

BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # backend/
SERVICE_ACCOUNT = os.path.join(BASE_DIR, "firebase-admin.json")

if not firebase_admin._apps:
    cred = credentials.Certificate(SERVICE_ACCOUNT)
    firebase_admin.initialize_app(cred)

db = firestore.client()
auth = firebase_auth
