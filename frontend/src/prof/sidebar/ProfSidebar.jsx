import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "../styles/sidebar.css";
import userIcon from "../../images/man-user-color-icon.png";

export default function ProfSidebar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();           // 🔐 vider session
    navigate("/login"); // 🔁 redirection login
  };

  return (
    <aside className="admin-sidebar">
      {/* ================= PROFILE ================= */}
      <div className="profile">
        <img
          src={userIcon}
          alt="Prof"
          className="profile-avatar"
        />

        <div className="profile-text">
          <div className="profile-name">
            {user?.displayName || "Professeur"}
          </div>
          <div className="profile-handle">
            @{user?.role || "prof"}
          </div>
        </div>
      </div>

      {/* ================= NAV ================= */}
      <nav className="sidebar-nav">
        {/* DASHBOARD */}
        <NavLink to="/prof/dashboard" className="sidebar-link">
          <span className="link-icon">📊</span>
          <span className="link-label">Dashboard</span>
        </NavLink>

        {/* CALENDAR */}
        <NavLink to="/prof/calendar" className="sidebar-link">
          <span className="link-icon">📅</span>
          <span className="link-label">Calendrier</span>
        </NavLink>

        {/* COMPLAINTS */}
        <NavLink to="/prof/complaints" className="sidebar-link">
          <span className="link-icon">📝</span>
          <span className="link-label">Réclamations</span>
        </NavLink>

        {/* PROJECT PROGRESS */}
        <NavLink to="/prof/project-progress" className="sidebar-link">
          <span className="link-icon">📈</span>
          <span className="link-label">Progression Projet</span>
        </NavLink>

        {/* STUDENTS */}
        <NavLink to="/prof/students" className="sidebar-link">
          <span className="link-icon">👥</span>
          <span className="link-label">Étudiants</span>
        </NavLink>

        {/* CHAT */}
        <NavLink to="/prof/chat" className="sidebar-link">
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
