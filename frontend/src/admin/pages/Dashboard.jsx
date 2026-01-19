import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import "../styles/dashboard.css";

function Avatar({ name }) {
  const letters = name
    ? name.split(" ").map(n => n[0]).join("").toUpperCase()
    : "U";
  return <div className="dash-avatar">{letters}</div>;
}

export default function AdminDashboard() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.listUsers(token).then(data => setUsers(data || []));
  }, [token]);

  const students = useMemo(
    () => users.filter(u => u.role === "student" && u.displayName.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 4),
    [users, searchQuery]
  );

  const profs = useMemo(
    () => users.filter(u => u.role === "prof" && u.displayName.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 4),
    [users, searchQuery]
  );

  return (
    <div className="dash-root">
      {/* TOP */}
      <div className="dash-top">
        <h1>Dashboard</h1>
        <input className="dash-search" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      {/* ÉTUDIANTS */}
      <section className="dash-section">
        <div className="dash-header">
          <h2>Les Étudiants</h2>
          <button onClick={() => navigate("/admin/users")}>More</button>
        </div>

        <div className="dash-grid">
          {students.map(s => (
            <div key={s.uid} className="dash-card">
              <Avatar name={s.displayName} />
              <p>{s.displayName}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ENCADRANTS */}
      <section className="dash-section">
        <div className="dash-header">
          <h2>Les Encadrants</h2>
          <button onClick={() => navigate("/admin/users")}>More</button>
        </div>

        <div className="dash-grid">
          {profs.map(p => (
            <div key={p.uid} className="dash-card">
              <Avatar name={p.displayName} />
              <p>{p.displayName}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
