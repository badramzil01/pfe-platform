import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "../styles/sidebar.css";
import userIcon from "../../images/man-user-color-icon.png";

export default function StudentSidebar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();               // 🔐 vider la session
    navigate("/login");     // 🔁 retour login
  };

  return (
    <aside className="admin-sidebar">
      {/* ================= PROFILE ================= */}
      <div className="profile">
        <img
          src={userIcon}
          alt="Student"
          className="profile-avatar"
        />

        <div className="profile-text">
          <div className="profile-name">
            {user?.displayName || "Étudiant"}
          </div>
          <div className="profile-handle">
            @{user?.role || "student"}
          </div>
        </div>
      </div>

      {/* ================= NAV ================= */}
      <nav className="sidebar-nav">
        <NavLink to="/student/dashboard" className="sidebar-link">
          <span className="link-icon">📊</span>
          <span className="link-label">Dashboard</span>
        </NavLink>

        <NavLink to="/student/calendar" className="sidebar-link">
          <span className="link-icon">📅</span>
          <span className="link-label">Calendrier</span>
        </NavLink>

        <NavLink to="/student/complaints" className="sidebar-link">
          <span className="link-icon">📝</span>
          <span className="link-label">Réclamations</span>
        </NavLink>

        <NavLink to="/student/progress" className="sidebar-link">
          <span className="link-icon">📊</span>
          <span className="link-label">Progression</span>
        </NavLink>

        <NavLink to="/student/students" className="sidebar-link">
          <span className="link-icon">👨‍🎓</span>
          <span className="link-label">Étudiants</span>
        </NavLink>

        {/* 💬 CHAT DE GROUPE */}
        <NavLink to="/student/chat" className="sidebar-link">
          <span className="link-icon">💬</span>
          <span className="link-label">Chat</span>
        </NavLink>
      </nav>

      {/* ================= BOTTOM ================= */}
      <div className="sidebar-bottom">
        <button
          className="sidebar-action logout"
          onClick={handleLogout}
        >
          🔓 Log out
        </button>
      </div>
    </aside>
  );
}
