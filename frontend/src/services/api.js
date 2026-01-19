import axios from "axios";

/* =========================
   AXIOS CONFIG
========================= */
const apiClient = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 10000, // 10 seconds timeout
});

/* =========================
   TOKEN INTERCEPTOR
========================= */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   RESPONSE INTERCEPTOR
========================= */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      console.warn("403 Forbidden");
    }
    return Promise.reject(error);
  }
);

/* =========================
   API METHODS
========================= */
const api = {
  /* ================= AUTH ================= */

  login: async (email, password) => {
    const res = await apiClient.post("/auth/login", { email, password });
    return res.data;
  },

  /* ================= ADMIN ================= */

  listUsers: async () => {
    const res = await apiClient.get("/admin/users");
    return res.data;
  },

  createUser: async (payload) => {
    const res = await apiClient.post("/admin/users", payload);
    return res.data;
  },

  updateUser: async (uid, payload) => {
    const res = await apiClient.put(`/admin/users/${uid}`, payload);
    return res.data;
  },

  deleteUser: async (uid) => {
    const res = await apiClient.delete(`/admin/users/${uid}`);
    return res.data;
  },

  /* ================= GROUPS ================= */

  listGroups: async () => {
    const res = await apiClient.get("/admin/groups");
    return res.data;
  },

  createGroup: async (payload) => {
    const res = await apiClient.post("/admin/groups", payload);
    return res.data;
  },

  getMyGroups: async () => {
    const res = await apiClient.get("/admin/my-groups");
    return res.data;
  },

  updateGroup: async (groupId, payload) => {
    const res = await apiClient.put(`/admin/groups/${groupId}`, payload);
    return res.data;
  },

  deleteGroup: async (groupId) => {
    const res = await apiClient.delete(`/admin/groups/${groupId}`);
    return res.data;
  },

  /* ================= CHAT ================= */

  getMessages: async (groupId) => {
    const res = await apiClient.get(`/chat/${groupId}/messages`);
    return res.data;
  },

  sendMessage: async (groupId, text = null, file = null) => {
    const formData = new FormData();

    if (text) formData.append("text", text);
    if (file) formData.append("file", file);

    const res = await apiClient.post(
      `/chat/${groupId}/messages`,
      formData
    );
    return res.data;
  },

  updateMessage: async (groupId, messageId, text) => {
    const formData = new FormData();
    formData.append("text", text);

    const res = await apiClient.put(
      `/chat/${groupId}/messages/${messageId}`,
      formData
    );
    return res.data;
  },

  deleteMessage: async (groupId, messageId) => {
    const res = await apiClient.delete(
      `/chat/${groupId}/messages/${messageId}`
    );
    return res.data;
  },

  /* ================= COMPLAINTS ================= */

  /** 🔹 Réclamations reçues par le prof */
  getProfComplaints: async () => {
    const res = await apiClient.get("/complaints/prof");
    return res.data;
  },

  /** 🔹 Réclamations reçues par l’étudiant */
  getStudentComplaints: async () => {
    const res = await apiClient.get("/complaints/student");
    return res.data;
  },

  /** 🔹 Réclamations envoyées par l’utilisateur */
  getMyComplaints: async () => {
    const res = await apiClient.get("/complaints/my");
    return res.data;
  },

  /** 🔹 Créer une réclamation */
  createComplaint: async ({
    title,
    message,
    toProfId = null,
    toStudentId = null,
    groupId = null,
  }) => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("message", message);
    if (toProfId) formData.append("toProfId", toProfId);
    if (toStudentId) formData.append("toStudentId", toStudentId);
    if (groupId) formData.append("groupId", groupId);

    const res = await apiClient.post("/complaints", formData);
    return res.data;
  },

  /** 🔹 Marquer comme lu */
  markComplaintRead: async (complaintId) => {
    const res = await apiClient.put(`/complaints/${complaintId}/read`);
    return res.data;
  },

  /** 🔹 Supprimer */
  deleteComplaint: async (complaintId) => {
    const res = await apiClient.delete(`/complaints/${complaintId}`);
    return res.data;
  },

  /** 🔹 Mettre à jour une réclamation (titre/message) */
  updateComplaint: async (complaintId, { title = null, message = null } = {}) => {
    const formData = new FormData();
    if (title) formData.append("title", title);
    if (message) formData.append("message", message);
    const res = await apiClient.put(`/complaints/${complaintId}`, formData);
    return res.data;
  },

  /** 🔹 Professeurs liés au PFE de l’étudiant */
  getStudentProfessors: async () => {
    const res = await apiClient.get("/complaints/student/professors");
    return res.data;
  },

  /** 🔹 Étudiants dans un groupe */
  getGroupStudents: async (groupId) => {
    const res = await apiClient.get(`/admin/groups/${groupId}/students`);
    return res.data;
  },

  /** 🔹 Détails des étudiants pour le prof */
  getStudentsDetails: async () => {
    const res = await apiClient.get("/prof/students-details");
    return res.data;
  },

  /** 🔹 Stats du dashboard prof */
  getProfDashboardStats: async () => {
    const res = await apiClient.get("/prof/dashboard-stats");
    return res.data;
  },

  /** 🔹 Stats du dashboard étudiant */
  getStudentDashboardStats: async () => {
    const res = await apiClient.get("/student/dashboard-stats");
    return res.data;
  },
/* =========================
   CALENDAR (PROF & STUDENT)
========================= */

/**
 * 🔹 Récupérer les événements
 * (partagés prof ↔ étudiant par groupId)
 */
getCalendarEvents: async (groupId) => {
  if (!groupId) throw new Error("groupId required");
  const res = await apiClient.get("/calendar", {
    params: { groupId },
  });
  return res.data;
},

/**
 * 🔹 Créer un événement
 */
createCalendarEvent: async ({
  title,
  description = "",
  date,
  groupId,
  type = "task",
}) => {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("date", date);
  formData.append("groupId", groupId);
  formData.append("type", type);

  try {
    const res = await apiClient.post("/calendar/", formData);
    return res.data;
  } catch (error) {
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error: Unable to connect to the server. Please check if the backend is running on http://localhost:8000.');
    }
    if (error.response?.status === 500) {
      const detail = error.response?.data?.detail || 'Internal server error';
      if (detail.includes('Access denied')) {
        throw new Error('Access denied: You are not a member of this group.');
      }
      throw new Error(`Server error: ${detail}`);
    }
    throw error;
  }
},

/**
 * 🔹 Modifier un événement
 * (titre, description OU date)
 */
updateCalendarEvent: async (eventId, payload) => {
  const res = await apiClient.put(
    `/calendar/${eventId}`,
    payload, // JSON OK pour FastAPI
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
},

/**
 * 🔹 Supprimer un événement
 */
deleteCalendarEvent: async (eventId) => {
  const res = await apiClient.delete(`/calendar/${eventId}`);
  return res.data;
},
/* ================= PROJECT PROGRESS ================= */

getMyGroup: async () => {
  const res = await apiClient.get("/groups/my-group");
  return res.data;
},

getProfGroups: async () => {
  const res = await apiClient.get("/groups/prof");
  return res.data;
},

updateGroupProgress: async (groupId, progress) => {
  const formData = new FormData();
  formData.append("progress", progress);

  const res = await apiClient.put(
    `/groups/${groupId}/progress`,
    formData
  );
  return res.data;
},

addGroupNote: async (groupId, noteData) => {
  const formData = new FormData();
  formData.append("text", noteData.text);
  formData.append("timestamp", noteData.timestamp);

  const res = await apiClient.post(
    `/groups/${groupId}/notes`,
    formData
  );
  return res.data;
},

updateGroupNote: async (groupId, noteData) => {
  const formData = new FormData();
  formData.append("text", noteData.text);
  formData.append("timestamp", noteData.timestamp);

  const res = await apiClient.put(
    `/groups/${groupId}/notes/${noteData.timestamp}`,
    formData
  );
  return res.data;
},

deleteGroupNote: async (groupId, timestamp) => {
  const res = await apiClient.delete(
    `/groups/${groupId}/notes/${timestamp}`
  );
  return res.data;
},




};

export default api;
