import os
import firebase_admin
from firebase_admin import credentials, firestore, storage

def init_firebase():
    if not firebase_admin._apps:
        base_dir = os.path.dirname(
            os.path.dirname(
                os.path.dirname(__file__)
            )
        )

        cred_path = os.path.join(base_dir, "firebase-admin.json")

        cred = credentials.Certificate(cred_path)

        firebase_admin.initialize_app(
            cred,
            {
                "storageBucket": "pfeprojet-1e7e7.appspot.com"  # ⚠️ OBLIGATOIRE
            }
        )

    return firestore.client()
