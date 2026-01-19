import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import "../styles/Login.css";
import LoginImage from "../images/PFE.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [remember, setRemember] = useState(false);

  const navigate = useNavigate();
  const { setSession } = useAuth();

  // ================= LOGIN =================
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    try {
      // 1️⃣ Firebase Auth
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();

      // 2️⃣ Backend → rôle
      const res = await fetch("http://localhost:8000/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Auth backend failed");

      const user = await res.json();

      // 3️⃣ Sauvegarder session
      setSession(user, token);

      // 4️⃣ REDIRECTION
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "prof") navigate("/prof/dashboard");
      else navigate("/student/dashboard");

    } catch (err) {
      console.error(err);
      setError("❌ Email ou mot de passe incorrect");
    }
  };

  // ================= FORGOT PASSWORD =================
  const handleForgotPassword = async () => {
    setError("");
    setInfo("");

    if (!email) {
      setError("⚠️ Entrez votre email d’abord");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setInfo("📧 Email de réinitialisation envoyé");
    } catch {
      setError("❌ Impossible d’envoyer l’email");
    }
  };

  return (
    <div className="login-container">
      {/* ================= LEFT : IMAGE ================= */}
      <div className="login-left">
        <img src={LoginImage} alt="Login visual" />
      </div>

      {/* ================= RIGHT : FORM ================= */}
      <div className="login-right">
        <div className="form-box">
          <h1 className="title">WELCOME</h1>
          <p className="subtitle">
            Welcome back! Please enter your details.
          </p>

          <form onSubmit={handleLogin} className="form">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="**********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* ===== OPTIONS ===== */}
            <div className="form-options">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="forgot"
                onClick={handleForgotPassword}
              >
                Forgot password
              </button>
            </div>

            {/* ===== MESSAGES ===== */}
            {error && <div className="error">{error}</div>}
            {info && <div className="info">{info}</div>}

            <button className="btn-sign">Sign in</button>
          </form>

          {/* ===== ADMIN LOGIN ===== */}
          <div className="admin-login-box">
            <span>Connexion Administration?</span>
            <button
              className="admin-login-btn"
              onClick={() => navigate("/admin/login")}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
