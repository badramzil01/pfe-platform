import React, { useEffect, useState } from "react";
import api from "../services/api";
import "./styles/projectProgress.css";

export default function ProjectProgress() {
  const [groups, setGroups] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    const data = await api.getProfGroups();
    setGroups(data || []);
  };

  const filteredGroups = groups.filter((g) => {
    if (filter === "all") return true;
    if (filter === "low") return (g.progress || 0) < 50;
    if (filter === "medium") return (g.progress || 0) >= 50 && (g.progress || 0) < 80;
    if (filter === "high") return (g.progress || 0) >= 80;
    return true;
  });

  return (
    <div className="project-progress">
      <div className="pp-header">
        <h2>📊 Suivi des projets</h2>
        <div className="pp-count">
          Groupes: {groups.length}
        </div>
      </div>

      <div className="pp-filter">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Tous les groupes</option>
          <option value="low">Progression 50%</option>
          <option value="medium">Progression 50-80%</option>
          <option value="high">Progression  80%</option>
        </select>
      </div>

      {filteredGroups.length === 0 && <div className="pp-empty">Aucun groupe trouvé</div>}

      <div className="pp-groups">
        {filteredGroups.map((g) => (
          <div key={g.groupId} className="pp-group-card">
            <div className="pp-group-header">
              <h3>{g.name}</h3>
              <p className="pp-project-title">{g.projectTitle}</p>
            </div>

            <div className="pp-progress-section">
              <div className="pp-progress-bar">
                <div
                  className="pp-progress-fill"
                  style={{ width: `${g.progress || 0}%` }}
                />
              </div>
              <div className="pp-progress-text">
                {g.progress || 0}%
              </div>
            </div>

            {g.notes && g.notes.length > 0 && (
              <div className="pp-notes-section">
                <h4>📝 Dernière note des étudiants</h4>
                <div className="pp-notes-list">
                  <div className="pp-note-item">
                    <p>{g.notes[g.notes.length - 1].text}</p>
                    <small>{new Date(g.notes[g.notes.length - 1].timestamp).toLocaleDateString()}</small>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
