import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell } from "recharts";
import api from "../services/api";
import "../styles/dashboard.css";
import userIcon from "../images/man-user-color-icon.png";

export default function StudentDashboard() {
  const [group, setGroup] = useState(null);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    load();

    const handleCalendarTaskUpdate = () => load();
    window.addEventListener("calendarTaskUpdated", handleCalendarTaskUpdate);

    return () =>
      window.removeEventListener("calendarTaskUpdated", handleCalendarTaskUpdate);
  }, []);

  const load = async () => {
    try {
      const g = await api.getMyGroup();
      const s = await api.getStudentDashboardStats();
      setGroup(g);
      setStats(s || {});
    } catch (err) {
      console.error(err);
    }
  };

  const progress = group?.progress || 0;

  const pieData = [
    { value: progress, color: "#3b82f6" },
    { value: 100 - progress, color: "#e5e7eb" }
  ];

  return (
    <div className="dashboard-container">

      {/* HEADER */}
      <div className="dashboard-top">
        <h2>Dashboard Étudiant</h2>
        <input
          className="search"
          placeholder="Rechercher"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div></div>
      </div>

      {/* STAT CARDS (MEME DESIGN QUE PROF) */}
      <div className="stat-cards">
        <div className="stat-card blue">
          <div>
            <h4>{group?.students?.length || 0}</h4>
            <p>Membres du groupe</p>
          </div>
          <div className="mini-bars" />
        </div>

        <div className="stat-card orange">
          <div>
            <h4>{group?.projectTitle || ''}</h4>
            <p>Projet</p>
          </div>
          <div className="mini-bars" />
        </div>

        <div className="stat-card purple">
          <div>
            <h4>{stats.messagesFromProfessorToday || 0}</h4>
            <p>Messages du Professeur / Aujourd’hui</p>
          </div>
          <div className="mini-bars" />
        </div>

        <div className="stat-card red">
          <div>
            <h4>{stats.totalTasksToday || 0}</h4>
            <p>Tâches Aujourd'hui</p>
          </div>
          <div className="mini-bars" />
        </div>
      </div>

      {/* GRID */}
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
                <span>{progress}%</span>
                <small>Complété</small>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div>
          <div className="card">
            <h3>👥 Membres du groupe</h3>
            {group?.students?.slice(0, 5).map((s) => (
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
            <h3>📁 Projet</h3>
            <div className="group-row">
              <span>{group?.projectTitle || ''}</span>
              <span>{progress}%</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
