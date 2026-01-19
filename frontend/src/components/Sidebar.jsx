import { NavLink } from "react-router-dom";
import "../styles/sidebar.css";

export default function Sidebar({ user }) {
  return (
    <div className="sidebar">

      {/* Top user section */}
      <div className="sidebar-header">
        <img
          src={user?.photoURL || "/default-avatar.png"}
          alt="profile"
          className="sidebar-avatar"
        />
        <h3 className="sidebar-name">{user?.displayName || "Admin"}</h3>
        <p className="sidebar-role">{user?.role}</p>
      </div>

      {/* Menu */}
      <div className="sidebar-menu">

        <NavLink to="/admin/dashboard" className="sidebar-link">
          <i className="fas fa-home"></i> Dashboard
        </NavLink>

        <NavLink to="/admin/students" className="sidebar-link">
          <i className="fas fa-user-graduate"></i> Étudiants
        </NavLink>

        <NavLink to="/admin/profs" className="sidebar-link">
          <i className="fas fa-chalkboard-teacher"></i> Encadrants
        </NavLink>

        <NavLink to="/admin/groups" className="sidebar-link">
          <i className="fas fa-users"></i> Groupes
        </NavLink>

      </div>
    </div>
  );
}
