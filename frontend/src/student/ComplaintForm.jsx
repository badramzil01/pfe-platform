import React, { useState, useEffect } from "react";
import api from "../services/api";
import "../student/styles/StudentComplaints.css";

export default function ComplaintForm({ groups }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [professors, setProfessors] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState("");

  useEffect(() => {
    api.getProfessors().then(setProfessors);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    api.sendComplaint({ title, message, professorId: selectedProfessor }).then(() => {
      setTitle("");
      setMessage("");
      setSelectedProfessor("");
    });
  };

  return (
    <div className="complaint-form-container">
      <form onSubmit={handleSubmit} className="advanced-complaint-form">
        <h3 className="form-title">Soumettre une Réclamation</h3>
        <div className="form-group">
          <label className="form-label">Titre</label>
          <div className="input-wrapper">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entrez le titre de votre réclamation"
              required
              className="form-input"
            />
            <span className="input-icon">📝</span>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Message</label>
          <div className="input-wrapper">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décrivez votre réclamation en détail"
              required
              className="form-textarea"
            />
            <span className="input-icon">💬</span>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Choisir un Professeur</label>
          <div className="input-wrapper">
            <select
              value={selectedProfessor}
              onChange={(e) => setSelectedProfessor(e.target.value)}
              required
              className="form-select"
            >
              <option value="">-- Sélectionner un Professeur --</option>
              {professors.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.name}
                </option>
              ))}
            </select>
            <span className="input-icon">👨‍🏫</span>
          </div>
        </div>
        <button type="submit" className="submit-btn">Envoyer la Réclamation</button>
      </form>
    </div>
  );
}
