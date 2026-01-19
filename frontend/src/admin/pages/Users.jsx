import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "../styles/users.css";

export default function AdminUsers() {
  const { user, token } = useAuth();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [editingUser, setEditingUser] = useState(null);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    displayName: "",
    role: "student",
  });

  /* ================= LOAD USERS ================= */
  const loadUsers = async () => {
    if (!token) {
      setErrorMsg("⛔ Session invalide. Veuillez vous reconnecter.");
      return;
    }

    if (!user || user.role !== "admin") {
      setErrorMsg("⛔ Accès réservé aux administrateurs.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const data = await api.listUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("LOAD USERS ERROR:", err);
      setErrorMsg("❌ Erreur lors du chargement des utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line
  }, [user, token]);

  /* ================= FILTER ================= */
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      return (
        (!filterRole || u.role === filterRole) &&
        (u.displayName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q))
      );
    });
  }, [users, search, filterRole]);

  /* ================= CREATE ================= */
  const handleCreate = async (e) => {
  e.preventDefault();
  setSuccessMsg("");
  setErrorMsg("");

  try {
    const res = await api.createUser(form);

    if (res.emailSent) {
      setSuccessMsg("✅ Utilisateur créé. Email envoyé.");
    } else {
      setSuccessMsg("⚠️ Utilisateur créé mais email non envoyé.");
    }

    setForm({ email: "", displayName: "", role: "student" });
    loadUsers();

  } catch (err) {
    console.error("CREATE USER ERROR:", err);

    // ✅ EMAIL DÉJÀ UTILISÉ
    if (err.response && err.response.status === 409) {
      setErrorMsg("❌ Cet email est déjà utilisé.");
      return;
    }

    // ❌ AUTRE ERREUR
    setErrorMsg("❌ Erreur lors de la création de l’utilisateur.");
  }
};


  /* ================= DELETE ================= */
  const handleDelete = async (uid) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;

    try {
      await api.deleteUser(uid);
      loadUsers();
    } catch (err) {
      console.error("DELETE USER ERROR:", err);
      setErrorMsg("❌ Impossible de supprimer l’utilisateur.");
    }
  };

  /* ================= EDIT ================= */
  const openEdit = (u) => {
    setEditingUser({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      await api.updateUser(editingUser.uid, {
        email: editingUser.email,
        displayName: editingUser.displayName,
        role: editingUser.role,
      });
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      console.error("UPDATE USER ERROR:", err);
      setErrorMsg("❌ Erreur lors de la mise à jour.");
    }
  };

  /* ================= GUARDS ================= */
  if (!user || !token) {
    return <div className="admin-users-page">⏳ Chargement...</div>;
  }

  if (user.role !== "admin") {
    return (
      <div className="admin-users-page error-message">
        ⛔ Accès réservé aux administrateurs
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="admin-users-page">
      {/* HEADER */}
      <div className="users-header">
        <h1>Utilisateurs</h1>
        <input
          className="users-search"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <div className="info-message">Chargement...</div>}
      {errorMsg && <div className="error-message">{errorMsg}</div>}
      {successMsg && <div className="success-message">{successMsg}</div>}

      {/* CREATE */}
      <div className="admin-card">
        <h2>Créer un utilisateur</h2>

        <form className="admin-form" onSubmit={handleCreate}>
          <input
            placeholder="Nom complet"
            value={form.displayName}
            onChange={(e) =>
              setForm({ ...form, displayName: e.target.value })
            }
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            required
          />

          <select
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value })
            }
          >
            <option value="student">Étudiant</option>
            <option value="prof">Encadrant</option>
            <option value="admin">Admin</option>
          </select>

          <div className="auto-password-info">
            🔐 Un mot de passe automatique est généré par la plateforme
          </div>

          <button className="btn-primary">Créer utilisateur</button>
        </form>
      </div>

      {/* FILTER */}
      <div className="table-toolbar">
        <select onChange={(e) => setFilterRole(e.target.value)}>
          <option value="">Tous</option>
          <option value="student">Étudiants</option>
          <option value="prof">Encadrants</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.uid}>
                <td>{u.displayName}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`role-badge role-${u.role}`}>
                    {u.role}
                  </span>
                </td>
                <td className="table-actions">
                  <button
                    className="btn-edit"
                    onClick={() => openEdit(u)}
                  >
                    Éditer
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(u.uid)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL EDIT */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Modifier utilisateur</h2>

            <form className="modal-form" onSubmit={handleUpdate}>
              <input
                value={editingUser.displayName}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    displayName: e.target.value,
                  })
                }
                required
              />

              <input
                type="email"
                value={editingUser.email}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    email: e.target.value,
                  })
                }
                required
              />

              <select
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    role: e.target.value,
                  })
                }
              >
                <option value="student">Étudiant</option>
                <option value="prof">Encadrant</option>
                <option value="admin">Admin</option>
              </select>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setEditingUser(null)}
                >
                  Annuler
                </button>
                <button className="btn-primary">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
