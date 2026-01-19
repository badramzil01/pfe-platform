import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell } from "recharts";
import api from "../services/api";
import "../styles/dashboard.css";
import userIcon from "../images/man-user-color-icon.png";

export default function ProfDashboard() {
  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState({});
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setGroups(await api.getProfGroups() || []);
    setStats(await api.getProfDashboardStats() || {});
    setStudents(await api.getStudentsDetails() || []);
  };

  const completed = groups.filter(g => (g.progress || 0) >= 100).length;
  const completedPercent = groups.length
    ? Math.round((completed / groups.length) * 100)
    : 0;

  const pieData = [
    { value: completedPercent, color: "#3b82f6" },
    { value: 100 - completedPercent, color: "#e5e7eb" },
  ];

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">

      {/* HEADER */}
      <div className="dashboard-top">
        <h2>Dashboard</h2>
        <input
          className="search"
          placeholder="Rechercher"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div></div>
      </div>

      {/* ===== STAT BOXES (STYLE IMAGE) ===== */}
      <div className="stat-cards">
        <div className="stat-card orange">
          <div>
            <h4>{students.length}</h4>
            <p>Étudiants</p>
          </div>
          <div className="mini-bars"></div>
        </div>

        <div className="stat-card green">
          <div>
            <h4>{stats.totalComplaints || 0}</h4>
            <p>Réclamations</p>
          </div>
          <div className="mini-bars"></div>
        </div>

        <div className="stat-card red">
          <div>
            <h4>{stats.totalMessagesFromStudentsToday || 0}</h4>
            <p>Messages Étudiants / Jour</p>
          </div>
          <div className="mini-bars"></div>
        </div>

        <div className="stat-card blue">
          <div>
            <h4>{groups.length}</h4>
            <p>Groupes</p>
          </div>
          <div className="mini-bars"></div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="dashboard-grid">

        {/* LEFT */}
        <div>
          <div className="card">
            <h3>📊 Avancement Global</h3>

            <div className="chart-box">
              <PieChart width={240} height={240}>
                <Pie
                  data={pieData}
                  innerRadius={80}
                  outerRadius={110}
                  dataKey="value"
                >
                  {pieData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
              </PieChart>

              <div className="chart-center">
                <span>{completedPercent}%</span>
                <small>Complété</small>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div>
          <div className="card">
            <h3>👥 Étudiants</h3>
            {filteredStudents.slice(0, 5).map(s => (
              <div key={s.uid} className="student-row">
                <img src={userIcon} alt="" />
                <div>
                  <span className="student-name">{s.name}</span>
                  <span className="student-email">{s.email}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3>📁 Groupes</h3>
            {filteredGroups.map(g => (
              <div key={g.groupId} className="group-row">
                <span>{g.name}</span>
                <span>{g.progress || 0}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

