import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // <-- ajouter Firestore

const firebaseConfig = {
  apiKey: "AIzaSyDa5KZPk5Wd_R_6LFbD8bjui9IoNKWvUII",
  authDomain: "pfeprojet-1e7e7.firebaseapp.com",
  projectId: "pfeprojet-1e7e7",
  storageBucket: "pfeprojet-1e7e7.appspot.com",
  messagingSenderId: "754127744426",
  appId: "1:754127744426:web:cb40329cb8dd6360f60fd3",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);       // ✅ Exporter auth
export const db = getFirestore(app);    // ✅ Exporter db

// Fonction de login
export const loginWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};
