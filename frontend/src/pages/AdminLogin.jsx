// src/pages/AdminLogin.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ADMIN_SECRET_KEY } from "../config/admin";
import "../styles/adminLogin.css";

import AdminImage from "../images/flat-design-illustration-customer-support.png";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, loginAsAdmin } = useAuth();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔁 déjà admin → dashboard
  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Veuillez entrer le code administrateur.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (code === ADMIN_SECRET_KEY) {
        loginAsAdmin({ displayName: "Administrateur" });
        navigate("/admin", { replace: true });
      } else {
        setError("❌ Code administrateur incorrect");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="login-container">
      {/* IMAGE */}
      <div className="login-image">
        <img src={AdminImage} alt="Admin login" />
      </div>

      {/* FORM */}
      <div className="login-form">
        <h1>WELCOME</h1>
        <p className="subtitle">
          Connectez-vous à l’espace d’administration
        </p>

        <form onSubmit={handleLogin}>
          <label>Code administrateur</label>
          <input
            type="password"
            placeholder="Entrez le code secret"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading}
            required
          />

          {error && <div className="error">{error}</div>}

          <button className="btn-login" disabled={loading}>
            {loading ? "Connexion..." : "Sign in"}
          </button>
        </form>

        <div className="admin-login">
          <span onClick={() => navigate("/login")}>
            ← Retour à la connexion utilisateur
          </span>
        </div>
      </div>
    </div>
  );
}
