import React from "react";
import { Link, Outlet } from "react-router-dom";
import "./DashboardLayout.css"; // Styles pour la sidebar

export default function DashboardLayout({ user }) {
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img
            src={user?.avatar || "/default-avatar.png"}
           
            alt="Avatar"
            className="avatar"
          />
          <h3 className="username">{user?.name || "Utilisateur"}</h3>
        </div>

        <nav className="sidebar-nav">
          {/* Exemple de liens de navigation */}
          <Link to="">Tableau de bord</Link>
          <Link to="documents">Documents</Link>
          <Link to="complaints">Réclamations</Link>
          <Link to="calendar">Calendrier</Link>
          {user?.role === "admin" && (
            <>
              <Link to="users">Utilisateurs</Link>
              <Link to="groups">Groupes</Link>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <button onClick={user?.logout}>Se déconnecter</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <Outlet /> {/* Affiche la page sélectionnée */}
      </main>
    </div>
  );
}
