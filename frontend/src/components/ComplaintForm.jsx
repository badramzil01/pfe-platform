import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";

export default function ComplaintForm({
  toProfId,
  toStudentId,
  groupId,
  groups = [],
  isStudent = false,
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  // prof only
  const [complaintType, setComplaintType] = useState("individual");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [groupStudents, setGroupStudents] = useState([]);

  /* ================= LOAD STUDENTS (PROF) ================= */
  const loadAllStudents = useCallback(async () => {
    const allStudents = [];
    for (const g of groups) {
      try {
        const students = await api.getGroupStudents(g.groupId || g.id);
        allStudents.push(...students);
      } catch (err) {
        console.error("Erreur chargement étudiants :", err);
      }
    }
    setGroupStudents(allStudents);
  }, [groups]);

  useEffect(() => {
    if (!isStudent && complaintType === "individual" && groups.length > 0) {
      loadAllStudents();
    }
  }, [complaintType, groups, loadAllStudents, isStudent]);

  /* ================= SEND ================= */
  const send = async () => {
    if (!title || !message) {
      alert("Titre et message requis");
      return;
    }

    if (!isStudent && complaintType === "individual" && !selectedStudent) {
      alert("Veuillez sélectionner un étudiant");
      return;
    }

    if (!isStudent && complaintType === "group" && !selectedGroup) {
      alert("Veuillez sélectionner un groupe");
      return;
    }

    try {
      await api.createComplaint({
        title,
        message,
        toProfId: isStudent ? toProfId : null,
        toStudentId: !isStudent && complaintType === "individual"
          ? selectedStudent
          : null,
        groupId:
          !isStudent && complaintType === "group"
            ? selectedGroup
            : groupId || null,
      });

      setTitle("");
      setMessage("");
      setSelectedGroup("");
      setSelectedStudent("");
      alert("✅ Réclamation envoyée");
    } catch (err) {
      console.error("Erreur envoi réclamation :", err);
      alert("❌ Erreur lors de l'envoi");
    }
  };

  return (
    <div
      style={{
        padding: 16,
        background: "#fff",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
      }}
    >
      <h3>➕ Nouvelle réclamation</h3>

      {/* TITLE */}
      <input
        placeholder="Titre"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", marginBottom: 10, padding: 8 }}
      />

      {/* MESSAGE */}
      <textarea
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{
          width: "100%",
          marginBottom: 10,
          padding: 8,
          minHeight: 80,
        }}
      />

      {/* PROF ONLY */}
      {!isStudent && (
        <div style={{ marginBottom: 10 }}>
          <label>
            <input
              type="radio"
              value="individual"
              checked={complaintType === "individual"}
              onChange={(e) => setComplaintType(e.target.value)}
            />{" "}
            Étudiant
          </label>

          <label style={{ marginLeft: 20 }}>
            <input
              type="radio"
              value="group"
              checked={complaintType === "group"}
              onChange={(e) => setComplaintType(e.target.value)}
            />{" "}
            Groupe
          </label>
        </div>
      )}

      {/* SELECT STUDENT */}
      {!isStudent && complaintType === "individual" && groupStudents.length > 0 && (
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          style={{ width: "100%", marginBottom: 10, padding: 8 }}
        >
          <option value="">Sélectionner un étudiant</option>
          {groupStudents.map((s) => (
            <option key={s.uid} value={s.uid}>
              {s.displayName} ({s.email})
            </option>
          ))}
        </select>
      )}

      {/* SELECT GROUP */}
      {(complaintType === "group" || isStudent) && groups.length > 0 && (
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          style={{ width: "100%", marginBottom: 10, padding: 8 }}
        >
          <option value="">Sélectionner un groupe</option>
          {groups.map((g) => (
            <option key={g.groupId || g.id} value={g.groupId || g.id}>
              {g.name}
            </option>
          ))}
        </select>
      )}

      <button
        onClick={send}
        style={{
          padding: 10,
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Envoyer
      </button>
    </div>
  );
}
