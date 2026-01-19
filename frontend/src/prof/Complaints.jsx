import React, { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import "./styles/profComplaints.css";

export default function ProfComplaints() {
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);

  // form state
  const [target, setTarget] = useState("group"); // 'group' | 'student'
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [loadingSend, setLoadingSend] = useState(false);

  // Light theme styles
  const lightPage = { background: "#ffffff", color: "#111827", minHeight: "100%" };
  const lightCard = { background: "#ffffff", border: "1px solid #e5e7eb", color: "#111827" };
  const lightInput = { background: "#ffffff", border: "1px solid #e5e7eb", color: "#111827" };
  const badgeBase = { display: "inline-block", padding: "2px 8px", borderRadius: 9999, fontSize: 12, border: "1px solid #e5e7eb", background: "#f3f4f6", color: "#374151" };
  const badgeOk = { ...badgeBase, background: "#dcfce7", border: "1px solid #bbf7d0", color: "#166534" };
  const badgeWarn = { ...badgeBase, background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e" };



  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [activeSection, setActiveSection] = useState(null); // 'sent' | 'received'
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const loadAll = useCallback(async () => {
    try {
      // Load sent
      try {
        const sentData = await api.getMyComplaints();
        setSent(sentData || []);
      } catch (e) {
        console.error("Erreur chargement réclamations envoyées :", e);
        setSent([]);
      }

      // Load received
      try {
        const receivedData = await api.getProfComplaints();
        setReceived(receivedData || []);
      } catch (e) {
        console.error("Erreur chargement réclamations reçues :", e);
        setReceived([]);
      }

      // Load groups
      let myGroups = [];
      try {
        myGroups = await api.getMyGroups();
        setGroups(myGroups || []);
      } catch (e) {
        console.error("Erreur chargement groupes :", e);
        setGroups([]);
      }

      // Load students from groups
      const allStudents = [];
      for (const g of myGroups) {
        try {
          const studentsInGroup = await api.getGroupStudents(g.groupId || g.id);
          allStudents.push(...studentsInGroup);
        } catch (err) {
          console.error("Erreur chargement étudiants pour groupe", g.groupId || g.id, ":", err);
        }
      }
      setStudents(allStudents);
    } catch (e) {
      console.error("Erreur générale chargement :", e);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Clear the opposite selection when target changes
  useEffect(() => {
    if (target === "group") {
      setSelectedStudent("");
    } else if (target === "student") {
      setSelectedGroup("");
    }
  }, [target]);

  // Auto-select when there's only one group, otherwise reset selection
  useEffect(() => {
    if (groups && groups.length === 1) {
      const g = groups[0];
      setSelectedGroup(g.groupId || g.id || "");
    } else {
      setSelectedGroup("");
    }
  }, [groups]);

  // Auto-select when there's only one student; if multiple, reset selection
  useEffect(() => {
    const validStudents = (students || []).filter((s) => s && s.uid);
    if (validStudents.length === 1) {
      setSelectedStudent(validStudents[0].uid);
    } else {
      setSelectedStudent("");
    }
  }, [students]);

  /* ================= ACTIONS ================= */

  const deleteComplaint = async (id, type) => {
    if (!window.confirm("Supprimer cette réclamation ?")) return;
    await api.deleteComplaint(id);
    if (type === "sent") setSent(prev => prev.filter(c => c.id !== id));
    else setReceived(prev => prev.filter(c => c.id !== id));
  };

  const markAsRead = async (id) => {
    await api.markComplaintRead(id);
    setReceived(prev =>
      prev.map(c => (c.id === id ? { ...c, status: "open" } : c))
    );
  };

  /* ================= MODAL ================= */

  const openModal = (c, section) => {
    setActiveComplaint(c);
    setActiveSection(section);
    setIsEditing(false);
    setEditTitle(c.title);
    setEditMessage(c.message);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveComplaint(null);
    setIsEditing(false);
  };

  const saveEdit = async () => {
    await api.updateComplaint(activeComplaint.id, {
      title: editTitle,
      message: editMessage,
    });

    setSent(prev =>
      prev.map(c =>
        c.id === activeComplaint.id
          ? { ...c, title: editTitle, message: editMessage }
          : c
      )
    );

    setIsEditing(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      alert("Titre et message requis");
      return;
    }

    const payload = { title, message };
    if (target === "group") {
      if (!selectedGroup) {
        alert("Sélectionner un groupe");
        return;
      }
      payload.groupId = selectedGroup;
    } else {
      if (!selectedStudent) {
        alert("Sélectionner un étudiant");
        return;
      }
      payload.toStudentId = selectedStudent;
    }

    try {
      setLoadingSend(true);
      await api.createComplaint(payload);
      setTitle("");
      setMessage("");
      setSelectedGroup("");
      setSelectedStudent("");
      // refresh sent list
      const newSent = await api.getMyComplaints();
      setSent(newSent || []);
      alert("Réclamation envoyée avec succès");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi");
    } finally {
      setLoadingSend(false);
    }
  };

  return (
    <div className="prof-complaints" style={lightPage}>
      <div className="pc-header">
        <h2 className="pc-title">📬 Réclamations (Professeur)</h2>
      </div>

      {/* CREATE */}
      <form onSubmit={handleSend} className="pc-form" style={lightCard}>
        {/* Centered toggle buttons to switch target */}
        <div className="pc-toggle" style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 12 }}>
          <button
            type="button"
            className={target === "group" ? "pc-btn pc-btn-primary" : "pc-btn pc-btn-dark"}
            onClick={() => setTarget("group")}
          >
            Envoyer au groupe
          </button>
          <button
            type="button"
            className={target === "student" ? "pc-btn pc-btn-primary" : "pc-btn pc-btn-dark"}
            onClick={() => setTarget("student")}
          >
            Envoyer à un étudiant
          </button>
        </div>

        <div className="pc-row">
          <input
            className="pc-input"
            style={lightInput}
            placeholder="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {target === "group" && (
            <select
              className="pc-select"
              style={lightInput}
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              <option value="">Sélectionner un groupe</option>
              {groups.map((g) => (
                <option key={g.groupId || g.id} value={g.groupId || g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}

          {target === "student" && (
            <select
              className="pc-select"
              style={lightInput}
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">Sélectionner un étudiant</option>
              {students
                .filter((s) => s && s.uid)
                .map((s) => (
                  <option key={s.uid} value={s.uid}>
                    {s.displayName || s.name || s.email || s.uid}
                  </option>
                ))}
            </select>
          )}
        </div>

        <textarea
          className="pc-textarea"
          style={lightInput}
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="pc-actions">
          <button type="submit" disabled={loadingSend} className="pc-btn pc-btn-primary">
            {loadingSend ? "Envoi..." : "Envoyer"}
          </button>
        </div>
      </form>

      <div className="pc-grid">
        {/* SENT */}
        <div className="pc-section" style={lightCard}>
          <h3>📤 Réclamations envoyées</h3>

          {sent.length === 0 && <div className="pc-empty" style={lightCard}>Aucune réclamation envoyée</div>}

          {sent.map(c => (
            <div
              key={c.id}
              className="pc-card"
              style={{ ...lightCard, cursor: "pointer" }}
              onClick={() => openModal(c, "sent")}
            >
              <h4 className="pc-card-title">{c.title}</h4>
              <p>{c.message}</p>
              <div className="sc-card-meta">
                <span style={badgeBase}>Destinataire : {c.toProfId ? "Professeur" : c.groupId ? "Groupe" : "—"}</span>
                <span style={c.status === "open" ? badgeOk : badgeWarn}>Status : {c.status}</span>
              </div>
              <div className="sc-card-actions" onClick={(e) => e.stopPropagation()}>
                <button className="sc-btn sc-btn-danger" onClick={() => deleteComplaint(c.id, "sent")}>🗑️ Supprimer</button>
              </div>
            </div>
          ))}
        </div>

        {/* RECEIVED */}
        <div className="pc-section" style={lightCard}>
          <h3>📥 Réclamations reçues</h3>

          {received.length === 0 && <div className="pc-empty" style={lightCard}>Aucune réclamation reçue</div>}

          {received.map(c => (
            <div
              key={c.id}
              className="pc-card"
              style={{ ...lightCard, cursor: "pointer" }}
              onClick={() => openModal(c, "received")}
            >
              <h4 className="pc-card-title">{c.title}</h4>
              <p>{c.message}</p>
              <div className="sc-card-meta">
                <span style={badgeBase}>De : {c.fromName || c.fromRole}</span>
                <span style={c.status === "open" ? badgeOk : badgeWarn}>Status : {c.status}</span>
              </div>

              <div className="sc-card-actions" onClick={(e) => e.stopPropagation()}>
                {c.status === "not open" && (
                  <button className="sc-btn sc-btn-primary" onClick={() => markAsRead(c.id)}>
                    ✅ Marquer comme lu
                  </button>
                )}
                <button className="sc-btn sc-btn-danger" onClick={() => deleteComplaint(c.id, "received")}>🗑️ Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && activeComplaint && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              ...lightCard,
              width: "min(680px, 96%)",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {!isEditing ? (
                <h3 style={{ margin: 0 }}>{activeComplaint.title}</h3>
              ) : (
                <input
                  className="sc-input"
                  style={lightInput}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              )}
              <button className="sc-btn sc-btn-dark" onClick={closeModal}>✖</button>
            </div>

            {!isEditing ? (
              <p style={{ marginTop: 10 }}>{activeComplaint.message}</p>
            ) : (
              <textarea
                className="sc-textarea"
                style={{ ...lightInput, marginTop: 10 }}
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
              />
            )}

            <div className="sc-card-meta" style={{ marginTop: 10 }}>
              {activeSection === "sent" ? (
                <span style={badgeBase}>Destinataire : {activeComplaint.toProfId ? "Professeur" : activeComplaint.groupId ? "Groupe" : "—"}</span>
              ) : (
                <span style={badgeBase}>De : {activeComplaint.fromName || activeComplaint.fromRole}</span>
              )}
              <span style={activeComplaint.status === "open" ? badgeOk : badgeWarn}>
                Status : {activeComplaint.status}
              </span>
            </div>

            <div className="sc-card-actions" style={{ marginTop: 12 }}>
              {activeSection === "sent" && (
                <>
                  {!isEditing && (
                    <button className="sc-btn sc-btn-primary" onClick={() => setIsEditing(true)}>
                      ✏️ Modifier
                    </button>
                  )}

                  {isEditing && (
                    <>
                      <button className="sc-btn sc-btn-primary" onClick={saveEdit}>💾 Enregistrer</button>
                      <button className="sc-btn sc-btn-dark" onClick={() => { setIsEditing(false); setEditTitle(activeComplaint.title || ""); setEditMessage(activeComplaint.message || ""); }}>Annuler</button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}