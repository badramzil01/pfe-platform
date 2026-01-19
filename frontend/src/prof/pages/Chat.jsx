import React, { useEffect, useState, useContext } from "react";
import api from "../../services/api";
import ChatBox from "../../components/ChatBox";
import { AuthContext } from "../../context/AuthContext";
import "../../components/chat.css";

export default function ProfChat() {
  const { user } = useContext(AuthContext); // ✅ vrai user
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await api.getMyGroups();
      setGroups(data || []);
      if (data?.length) {
        setActiveGroup(data[0]);
      }
    } catch (err) {
      console.error("LOAD GROUPS ERROR:", err);
    }
  };

  return (
    <div style={{ display: "flex", height: "100%" }}>
      
      {/* 📁 LISTE DES GROUPES */}
      <div style={{ width: 280, borderRight: "1px solid #e5e7eb" }}>
        <h3 style={{ padding: 14 }}>💬 Mes Groupes</h3>

        {groups.map((g) => (
          <div
            key={g.groupId}
            onClick={() => setActiveGroup(g)}
            style={{
              padding: 14,
              cursor: "pointer",
              background:
                activeGroup?.groupId === g.groupId
                  ? "#eef2ff"
                  : "transparent",
            }}
          >
            <strong>{g.name}</strong>
            <div style={{ fontSize: 12, color: "#555" }}>
              {g.projectTitle}
            </div>
          </div>
        ))}
      </div>

      {/* 💬 CHAT */}
      <div style={{ flex: 1 }}>
        {activeGroup ? (
          <ChatBox
            groupId={activeGroup.groupId}
            currentUser={user}   // ✅ IMPORTANT
          />
        ) : (
          <div style={{ padding: 20 }}>
            ⛔ Sélectionnez un groupe
          </div>
        )}
      </div>
    </div>
  );
}
