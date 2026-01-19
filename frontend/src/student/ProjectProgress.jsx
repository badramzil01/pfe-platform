import React, { useEffect, useState } from "react";
import api from "../services/api";
import "./styles/projectProgress.css";

export default function ProjectProgress() {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState(null);

  useEffect(() => {
    loadGroup();
  }, []);

  const loadGroup = async () => {
    try {
      const data = await api.getMyGroup();
      setGroup(data);
      // Load notes if available
      if (data && data.notes) {
        setNotes(data.notes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (value) => {
    await api.updateGroupProgress(group.groupId, value);
    setGroup({ ...group, progress: value });
  };

  const addNote = async () => {
    if (newNote.trim()) {
      const noteData = {
        text: newNote,
        timestamp: new Date().toISOString(),
      };
      // Assuming there's an API to add notes
      await api.addGroupNote(group.groupId, noteData);
      setNotes([...notes, noteData]);
      setNewNote("");
      setShowModal(false);
      // Reload groups to update professor view
      loadGroup();
    }
  };

  const editNote = async () => {
    if (editingNote && newNote.trim()) {
      const updatedNote = { ...editingNote, text: newNote };
      // Assuming there's an API to update notes
      await api.updateGroupNote(group.groupId, updatedNote);
      setNotes(notes.map(note => note.timestamp === editingNote.timestamp ? updatedNote : note));
      setNewNote("");
      setEditingNote(null);
      setShowModal(false);
      loadGroup();
    }
  };

  const deleteNote = async (note) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette note ?")) {
      // Assuming there's an API to delete notes
      await api.deleteGroupNote(group.groupId, note.timestamp);
      setNotes(notes.filter(n => n.timestamp !== note.timestamp));
      loadGroup();
    }
  };

  if (loading) return <div className="pp-loading">⏳ Chargement...</div>;
  if (!group) return <div className="pp-empty">Aucun groupe assigné</div>;

  return (
    <div className="project-progress">
      <div className="pp-header">
        <h2>📊 Avancement de mon projet</h2>
        <div className="pp-count">
          Progression: {group.progress || 0}%
        </div>
      </div>

      <div className="pp-group-card">
        <div className="pp-group-header">
          <h3>{group.name}</h3>
          <p className="pp-project-title">{group.projectTitle}</p>
        </div>

        <div className="pp-progress-section">
          <div className="pp-progress-bar">
            <div
              className="pp-progress-fill"
              style={{ width: `${group.progress || 0}%` }}
            />
          </div>
          <div className="pp-progress-text">
            {group.progress || 0}%
          </div>
        </div>

        <div className="pp-update-section">
          <label>Mettre à jour la progression:</label>
          <div className="pp-progress-inputs">
            <input
              type="range"
              min="0"
              max="100"
              value={group.progress || 0}
              onChange={(e) => updateProgress(Number(e.target.value))}
            />
            <input
              type="number"
              min="0"
              max="100"
              value={group.progress || 0}
              onChange={(e) => updateProgress(Number(e.target.value))}
              className="pp-number-input"
            />
          </div>
        </div>

        <div className="pp-notes-section">
          <h4>📝 Dernière note de progression</h4>
          <div className="pp-notes-list">
            {notes.length === 0 ? (
              <p>Aucune note pour le moment.</p>
            ) : (
              <div className="pp-note-item">
                <p>{notes[notes.length - 1].text}</p>
                <small>{new Date(notes[notes.length - 1].timestamp).toLocaleDateString()}</small>
                <div className="pp-note-actions">
                  <button className="pp-edit-btn" onClick={() => { setEditingNote(notes[notes.length - 1]); setNewNote(notes[notes.length - 1].text); setShowModal(true); }}>Modifier</button>
                  <button className="pp-delete-btn" onClick={() => deleteNote(notes[notes.length - 1])}>Supprimer</button>
                </div>
              </div>
            )}
          </div>
          <button className="pp-add-note-btn" onClick={() => setShowModal(true)}>
            ➕ Ajouter une note
          </button>
        </div>
      </div>

      {showModal && (
        <div className="pp-modal">
          <div className="pp-modal-content">
            <h3>{editingNote ? "Modifier la note" : "Ajouter une note"}</h3>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Écrivez votre note ici..."
            />
            <div className="pp-modal-buttons">
              <button className="pp-modal-btn secondary" onClick={() => { setShowModal(false); setEditingNote(null); setNewNote(""); }}>
                Annuler
              </button>
              <button className="pp-modal-btn primary" onClick={editingNote ? editNote : addNote}>
                {editingNote ? "Modifier" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
