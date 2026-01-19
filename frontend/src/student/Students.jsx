import React, { useEffect, useState } from "react";
import api from "../services/api";
import "./styles/studentStudents.css";

export default function StudentStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getStudentsDetails();
      setStudents(data || []);
    } catch (err) {
      console.error("LOAD STUDENTS ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  // Grouper les étudiants par projet
  const groupedStudents = students.reduce((acc, s) => {
    const project = s.projectTitle || "Sans projet";
    if (!acc[project]) acc[project] = [];
    acc[project].push(s);
    return acc;
  }, {});

  return (
    <div className="student-students">
      <div className="ss-header">
        <h2>👨‍🎓 Membres du Groupe</h2>
        <span className="ss-count">
          {students.length} étudiant{students.length > 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div className="ss-empty">Attendez le chargement...</div>
      ) : Object.keys(groupedStudents).length === 0 ? (
        <div className="ss-empty">Aucun étudiant trouvé</div>
      ) : (
        Object.entries(groupedStudents).map(([project, projectStudents]) => (
          <div key={project} className="ss-project">
            <div className="ss-project-header">
              <h3>📁 {project}</h3>

            </div>

            <div className="ss-table-wrapper">
              <table className="ss-table">
                <thead>
                  <tr>
                    <th>Étudiant</th>
                    <th>Email</th>
                    <th>📄 Documents</th>
                    <th>💬 Messages du Prof</th>
                    <th>💬 Messages Collègues</th>
                  </tr>
                </thead>
                <tbody>
                  {projectStudents.map((s) => (
                    <tr key={s.uid}>
                      <td>
                        <div className="ss-student">
                          <div className="ss-avatar">
                            {s.name?.charAt(0).toUpperCase()}
                          </div>
                          <span>{s.name}</span>
                        </div>
                      </td>
                      <td className="ss-email">{s.email}</td>
                      <td>
                        <span
                          className={`ss-pill ${
                            s.documentCount > 0 ? "ok" : "warn"
                          }`}
                        >
                          {s.documentCount}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`ss-pill ${
                            s.messagesFromProfToday > 0 ? "ok" : "warn"
                          }`}
                        >
                          {s.messagesFromProfToday || 0}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`ss-pill ${
                            s.messageCount > 0 ? "ok" : "warn"
                          }`}
                        >
                          {s.messageCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
