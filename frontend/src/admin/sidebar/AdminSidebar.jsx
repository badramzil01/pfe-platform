import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "../styles/sidebar.css";
import userIcon from "../../images/man-user-color-icon.png";

export default function AdminSidebar() {
  const { user, logout } = useContext(AuthContext) || {};

  const handleLogout = () => {
    logout();           // 🔐 vider session
    window.location.href = "http://localhost:3000/login"; // 🔁 redirection login
  };

  return (
    <aside className="admin-sidebar">
      <div className="profile">
        <img src={userIcon} alt="Admin" className="profile-avatar" />
        <div className="profile-text">
          <div className="profile-name">
            {user?.displayName || "Admin"}
          </div>
          <div className="profile-handle">@admin</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/admin" end className="sidebar-link">
          <span className="link-icon">🏠</span>
          <span className="link-label">Dashboard</span>
        </NavLink>

        <NavLink to="/admin/users" className="sidebar-link">
          <span className="link-icon">🎓</span>
          <span className="link-label">Étudiants</span>
        </NavLink>

        <NavLink to="/admin/groups" className="sidebar-link">
          <span className="link-icon">👥</span>
          <span className="link-label">Groupes</span>
        </NavLink>
      </nav>

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
