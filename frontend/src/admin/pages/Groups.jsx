import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "../styles/groups.css";

export default function AdminGroups() {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchGroup, setSearchGroup] = useState("");

  const [form, setForm] = useState({
    name: "",
    profId: "",
    studentIds: [],
    projectTitle: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [showStudents, setShowStudents] = useState(false);
  const [searchStudent, setSearchStudent] = useState("");

  const [loadingPage, setLoadingPage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // quick inline edit for professor per group
  const [quickEditProfFor, setQuickEditProfFor] = useState(null);
  const [quickProfId, setQuickProfId] = useState("");

  /* ================= LOAD ================= */
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoadingPage(true);
      setError("");

      const [g, u] = await Promise.all([
        api.listGroups(),
        api.listUsers(),
      ]);

      setGroups(Array.isArray(g) ? g : []);
      setUsers(Array.isArray(u) ? u : []);

    } catch (err) {
      console.error("LOAD GROUPS ERROR:", err);
      setError("❌ Impossible de charger les données");
    } finally {
      setLoadingPage(false);
    }
  };

  /* ================= FILTERS ================= */
  const profs = users.filter(u => u.role === "prof");
  const students = users.filter(u => u.role === "student");

  const filteredGroups = useMemo(() => {
    return groups.filter(g =>
      g?.name?.toLowerCase().includes(searchGroup.toLowerCase())
    );
  }, [groups, searchGroup]);

  const filteredStudents = useMemo(() => {
    return students.filter(s =>
      s?.displayName?.toLowerCase().includes(searchStudent.toLowerCase())
    );
  }, [students, searchStudent]);

  /* ================= ACTIONS ================= */
  const toggleStudent = (id) => {
    setForm(f => ({
      ...f,
      studentIds: f.studentIds.includes(id)
        ? f.studentIds.filter(x => x !== id)
        : [...f.studentIds, id]
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      profId: "",
      studentIds: [],
      projectTitle: "",
    });
    setShowStudents(false);
    setSearchStudent("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("⚠️ Nom du groupe requis");
      return;
    }

    if (!form.profId) {
      setError("⚠️ Encadrant requis");
      return;
    }

    const payload = {
      name: form.name.trim(),
      profId: form.profId,
      studentIds: form.studentIds || [],
      projectTitle: form.projectTitle || "",
    };

    try {
      setSubmitting(true);

      if (editingId) {
        await api.updateGroup(editingId, payload);
      } else {
        await api.createGroup(payload);
      }

      resetForm();

      // 🔄 Recharge sans casser l'UI
      try {
        await loadAll();
      } catch (e) {
        console.warn("Groupe créé mais refresh échoué");
      }

    } catch (err) {
      console.error("CREATE / UPDATE GROUP ERROR:", err);
      setError(
        err?.response?.data?.detail ||
        "❌ Erreur lors de l’enregistrement du groupe"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (g) => {
    setEditingId(g.groupId);
    setForm({
      name: g.name || "",
      profId: g.profId || "",
      studentIds: g.studentIds || [],
      projectTitle: g.projectTitle || "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce groupe ?")) return;

    try {
      setSubmitting(true);
      await api.deleteGroup(id);
      await loadAll();
    } catch (err) {
      console.error("DELETE GROUP ERROR:", err);
      setError("❌ Impossible de supprimer le groupe");
    } finally {
      setSubmitting(false);
    }
  };

  // Inline change professor for a specific group
  const startQuickEditProf = (g) => {
    setQuickEditProfFor(g.groupId);
    setQuickProfId(g.profId || "");
  };

  const cancelQuickEditProf = () => {
    setQuickEditProfFor(null);
    setQuickProfId("");
  };

  const saveQuickEditProf = async (groupId) => {
    if (!quickProfId) {
      setError("⚠️ Encadrant requis");
      return;
    }
    try {
      setSubmitting(true);
      await api.updateGroup(groupId, { profId: quickProfId });
      await loadAll();
      cancelQuickEditProf();
    } catch (err) {
      console.error("UPDATE PROF ERROR:", err);
      setError("❌ Impossible de mettre à jour l'encadrant");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="groups-page">

      <h1 className="page-title">Gestion des Groupes</h1>

      {error && <div className="error-message">{error}</div>}
      {loadingPage && <div className="info-message">Chargement...</div>}

      {/* SEARCH */}
      <div className="group-search-wrapper">
        <input
          className="group-search"
          placeholder="🔍 Rechercher un groupe..."
          value={searchGroup}
          onChange={e => setSearchGroup(e.target.value)}
        />
      </div>

      {/* FORM */}
      <form className="group-form" onSubmit={handleSubmit}>
        <h2>{editingId ? "Modifier Groupe" : "Créer Groupe"}</h2>

        <div className="form-grid">
          <input
            placeholder="Nom du groupe"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />

          <input
            placeholder="Sujet du projet"
            value={form.projectTitle}
            onChange={e => setForm({ ...form, projectTitle: e.target.value })}
          />

          <select
            value={form.profId}
            onChange={e => setForm({ ...form, profId: e.target.value })}
          >
            <option value="">Choisir encadrant</option>
            {profs.map(p => (
              <option key={p.uid} value={p.uid}>
                {p.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="student-select">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowStudents(true)}
          >
            Sélectionner étudiants ({form.studentIds.length})
          </button>
        </div>

        {showStudents && (
          <div className="student-modal">
            <div className="student-modal-content">
              <h3>Sélection des étudiants</h3>

              <input
                className="student-search"
                placeholder="Rechercher étudiant..."
                value={searchStudent}
                onChange={e => setSearchStudent(e.target.value)}
              />

              <div className="student-list">
                {filteredStudents.map(s => (
                  <label key={s.uid}>
                    <input
                      type="checkbox"
                      checked={form.studentIds.includes(s.uid)}
                      onChange={() => toggleStudent(s.uid)}
                    />
                    {s.displayName}
                  </label>
                ))}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowStudents(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Enregistrement..." : editingId ? "Mettre à jour" : "Créer"}
          </button>

          {editingId && (
            <button type="button" className="btn-cancel" onClick={resetForm}>
              Annuler
            </button>
          )}
        </div>
      </form>

      {/* LIST */}
      <div className="groups-list">
        {filteredGroups.map(g => (
          <div key={g.groupId} className="group-card">
            <div>
              <h3>{g.name}</h3>
              <p>{g.projectTitle}</p>

              {/* Professor section */}
              <div style={{ marginTop: 6, marginBottom: 6 }}>
                <div>
                  <strong>Encadrant :</strong>{" "}
                  {users.find(u => u.uid === g.profId)?.displayName || "—"}
                  {users.find(u => u.uid === g.profId)?.email ? (
                    <span style={{ color: "#6b7280" }}> ({users.find(u => u.uid === g.profId)?.email})</span>
                  ) : null}
                </div>

                {quickEditProfFor === g.groupId ? (
                  <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                    <select
                      value={quickProfId}
                      onChange={e => setQuickProfId(e.target.value)}
                    >
                      <option value="">Choisir encadrant</option>
                      {profs.map(p => (
                        <option key={p.uid} value={p.uid}>
                          {p.displayName}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn-primary"
                      type="button"
                      disabled={submitting}
                      onClick={() => saveQuickEditProf(g.groupId)}
                    >
                      {submitting ? "Enregistrement..." : "Valider"}
                    </button>
                    <button
                      className="btn-cancel"
                      type="button"
                      onClick={cancelQuickEditProf}
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <div style={{ marginTop: 6 }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => startQuickEditProf(g)}
                    >
                      Changer encadrant
                    </button>
                  </div>
                )}
              </div>

              {/* Students detail */}
              <div>
                <strong>Étudiants ({(g.studentIds || []).length}) :</strong>
                <ul style={{ margin: 0, marginTop: 6, paddingLeft: 18 }}>
                  {(g.studentIds || []).map(sid => {
                    const s = users.find(u => u.uid === sid);
                    return (
                      <li key={`s-${sid}`}>
                        {s?.displayName || sid}
                        {s?.email ? <span style={{ color: "#6b7280" }}> ({s.email})</span> : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="actions">
              <button onClick={() => handleEdit(g)}>✏️</button>
              <button onClick={() => handleDelete(g.groupId)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
