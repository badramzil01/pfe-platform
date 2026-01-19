import React, { useEffect, useState } from "react";
import api from "../services/api";
import "./styles/profStudents.css";

export default function ProfStudents() {
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
    <div className="prof-students">
      <div className="ps-header">
        <h2>👨‍🎓 Mes Étudiants</h2>
        <span className="ps-count">
          {students.length} étudiant{students.length > 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div className="ps-empty">Attendez le chargement...</div>
      ) : Object.keys(groupedStudents).length === 0 ? (
        <div className="ps-empty">Aucun étudiant trouvé</div>
      ) : (
        Object.entries(groupedStudents).map(([project, projectStudents]) => (
          <div key={project} className="ps-project">
            <div className="ps-project-header">
              <h3>📁 {project}</h3>
              
            </div>

            <div className="ps-table-wrapper">
              <table className="ps-table">
                <thead>
                  <tr>
                    <th>Étudiant</th>
                    <th>Email</th>
                    <th>📄 Documents</th>
                    <th>💬 Messages</th>
                  </tr>
                </thead>
                <tbody>
                  {projectStudents.map((s) => (
                    <tr key={s.uid}>
                      <td>
                        <div className="ps-student">
                          <div className="ps-avatar">
                            {s.name?.charAt(0).toUpperCase()}
                          </div>
                          <span>{s.name}</span>
                        </div>
                      </td>
                      <td className="ps-email">{s.email}</td>
                      <td>
                        <span
                          className={`ps-pill ${
                            s.documentCount > 0 ? "ok" : "warn"
                          }`}
                        >
                          {s.documentCount}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`ps-pill ${
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
