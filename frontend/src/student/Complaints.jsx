import React, { useEffect, useState, useContext } from "react";
import api from "../services/api";
import "./styles/StudentComplaints.css";
import { AuthContext } from "../context/AuthContext";

export default function StudentComplaints() {
  const { user } = useContext(AuthContext) || {};

  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [groups, setGroups] = useState([]);
  const [professors, setProfessors] = useState([]);

  // form state
  const [target, setTarget] = useState("group"); // 'group' | 'prof'
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedProf, setSelectedProf] = useState("");
  const [loadingSend, setLoadingSend] = useState(false);

  // Light theme styles
  const lightPage = { background: "#ffffff", color: "#111827", minHeight: "100%" };
  const lightCard = { background: "#ffffff", border: "1px solid #e5e7eb", color: "#111827" };
  const lightInput = { background: "#ffffff", border: "1px solid #e5e7eb", color: "#111827" };
  const badgeBase = { display: "inline-block", padding: "2px 8px", borderRadius: 9999, fontSize: 12, border: "1px solid #e5e7eb", background: "#f3f4f6", color: "#374151" };
  const badgeOk = { ...badgeBase, background: "#dcfce7", border: "1px solid #bbf7d0", color: "#166534" };
  const badgeWarn = { ...badgeBase, background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e" };

  // Truncation state
  const [expanded, setExpanded] = useState({});

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [activeSection, setActiveSection] = useState(null); // 'sent' | 'received'
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  // Clear the opposite selection when target changes
  useEffect(() => {
    if (target === "group") {
      setSelectedProf("");
    } else if (target === "prof") {
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

  // Auto-select when there's only one professor; if multiple, reset selection
  useEffect(() => {
    const validProfs = (professors || []).filter((p) => p && p.id);
    if (validProfs.length === 1) {
      setSelectedProf(validProfs[0].id);
    } else {
      setSelectedProf("");
    }
  }, [professors]);

  const loadData = async () => {
    const [sentData, receivedData, myGroups, myProfs] = await Promise.all([
      api.getMyComplaints(),
      api.getStudentComplaints(),
      api.getMyGroups(),
      api.getStudentProfessors().catch(() => []),
    ]);

    setSent(sentData || []);
    setReceived(receivedData || []);
    setGroups(myGroups || []);
    setProfessors(myProfs || []);
  };

  const deleteComplaint = async (id, type) => {
    await api.deleteComplaint(id);
    if (type === "sent") {
      setSent((prev) => prev.filter((c) => c.id !== id));
    } else {
      setReceived((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const markAsRead = async (id) => {
    await api.markComplaintRead(id);
    setReceived((prev) => prev.map((c) => (c.id === id ? { ...c, status: "open" } : c)));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title || !message) return alert("Titre et message requis");

    const payload = { title, message };
    if (target === "group") {
      if (!selectedGroup) return alert("Sélectionner un groupe");
      payload.groupId = selectedGroup;
    } else {
      if (!selectedProf) return alert("Sélectionner un professeur");
      payload.toProfId = selectedProf;
    }

    try {
      setLoadingSend(true);
      await api.createComplaint(payload);
      setTitle("");
      setMessage("");
      setSelectedGroup("");
      setSelectedProf("");
      // refresh sent list
      const newSent = await api.getMyComplaints();
      setSent(newSent || []);
      alert("✅ Réclamation envoyée");
    } catch (err) {
      console.error(err);
      alert("❌ Erreur lors de l'envoi");
    } finally {
      setLoadingSend(false);
    }
  };

  // Helpers
  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderMessage = (c) => {
    const full = c.message || "";
    const max = 220;
    const isLong = full.length > max;
    const isExp = !!expanded[c.id];

    if (!isLong) return <span>{full}</span>;
    if (isExp) {
      return (
        <span>
          {full} {" "}
          <button
            type="button"
            className="sc-btn sc-btn-dark"
            style={{ padding: "2px 6px", fontSize: 12 }}
            onClick={(e) => { e.stopPropagation(); toggleExpand(c.id); }}
          >
            Voir moins
          </button>
        </span>
      );
    }
    return (
      <span>
        {full.slice(0, max)}… {" "}
        <button
          type="button"
          className="sc-btn sc-btn-dark"
          style={{ padding: "2px 6px", fontSize: 12 }}
          onClick={(e) => { e.stopPropagation(); toggleExpand(c.id); }}
        >
          Voir plus
        </button>
      </span>
    );
  };

  const openModal = (c, section) => {
    setActiveComplaint(c);
    setActiveSection(section);
    setIsEditing(false);
    setEditTitle(c.title || "");
    setEditMessage(c.message || "");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveComplaint(null);
    setActiveSection(null);
    setIsEditing(false);
  };

  const saveEdit = async () => {
    if (!activeComplaint) return;
    const id = activeComplaint.id;
    const body = {};
    if ((editTitle || "").trim() && editTitle !== activeComplaint.title) {
      body.title = editTitle.trim();
    }
    if ((editMessage || "").trim() && editMessage !== activeComplaint.message) {
      body.message = editMessage.trim();
    }
    if (!body.title && !body.message) {
      alert("Aucun changement");
      return;
    }
    try {
      await api.updateComplaint(id, body);
      // update lists
      setSent((prev) => prev.map((c) => (c.id === id ? { ...c, ...body } : c)));
      setReceived((prev) => prev.map((c) => (c.id === id ? { ...c, ...body } : c)));
      setActiveComplaint((prev) => ({ ...prev, ...body }));
      setIsEditing(false);
      alert("✅ Réclamation mise à jour");
    } catch (e) {
      console.error(e);
      alert("❌ Impossible de mettre à jour");
    }
  };



  const isOwner = (c) => {
    if (!c) return false;
    if (activeSection === "sent") return true;
    if (user && c.fromUserId) return c.fromUserId === user.uid;
    return false;
  };

  return (
    <div className="student-complaints" style={lightPage}>
      <div className="sc-header">
        <h2 className="sc-title">📣 Réclamations</h2>
      </div>

      {/* CREATE */}
      <form onSubmit={handleSend} className="sc-form" style={lightCard}>
        {/* Centered toggle buttons to switch target */}
        <div className="sc-toggle" style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 12 }}>
          <button
            type="button"
            className={target === "group" ? "sc-btn sc-btn-primary" : "sc-btn sc-btn-dark"}
            onClick={() => setTarget("group")}
          >
            Envoyer au groupe
          </button>
          <button
            type="button"
            className={target === "prof" ? "sc-btn sc-btn-primary" : "sc-btn sc-btn-dark"}
            onClick={() => setTarget("prof")}
          >
            Envoyer à l'encadrant
          </button>
        </div>

        <div className="sc-row">
          <input
            className="sc-input"
            style={lightInput}
            placeholder="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {target === "group" && (
            <select
              className="sc-select"
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

          {target === "prof" && (
            <select
              className="sc-select"
              style={lightInput}
              value={selectedProf}
              onChange={(e) => setSelectedProf(e.target.value)}
            >
              <option value="">Sélectionner un professeur</option>
              {(professors || [])
                .filter((p) => p && p.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName || p.name || p.email || p.id}
                  </option>
                ))}
            </select>
          )}
        </div>

        <textarea
          className="sc-textarea"
          style={lightInput}
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="sc-actions">
          <button type="submit" disabled={loadingSend} className="sc-btn sc-btn-primary">
            {loadingSend ? "Envoi..." : "Envoyer"}
          </button>
        </div>
      </form>

      <div className="sc-grid">
        {/* SENT */}
        <div className="sc-section" style={lightCard}>
          <h3>📤 Réclamations envoyées</h3>

          {sent.length === 0 && <div className="sc-empty" style={lightCard}>Aucune réclamation envoyée</div>}

          {sent.map((c) => (
            <div
              key={c.id}
              className="sc-card"
              style={{ ...lightCard, cursor: "pointer" }}
              onClick={() => openModal(c, "sent")}
            >
              <h4 className="sc-card-title">{c.title}</h4>
              <p>{renderMessage(c)}</p>
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
        <div className="sc-section" style={lightCard}>
          <h3>📥 Réclamations reçues</h3>

          {received.length === 0 && <div className="sc-empty" style={lightCard}>Aucune réclamation reçue</div>}

          {received.map((c) => (
            <div
              key={c.id}
              className="sc-card"
              style={{ ...lightCard, cursor: "pointer" }}
              onClick={() => openModal(c, "received")}
            >
              <h4 className="sc-card-title">{c.title}</h4>
              <p>{renderMessage(c)}</p>
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
                  {isOwner(activeComplaint) && !isEditing && (
                    <button className="sc-btn sc-btn-primary" onClick={() => setIsEditing(true)}>
                      ✏️ Modifier
                    </button>
                  )}

                  {isOwner(activeComplaint) && isEditing && (
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
