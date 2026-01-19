import React, { useContext } from "react";
import ChatBox from "../../components/ChatBox";
import { AuthContext } from "../../context/AuthContext";

export default function StudentChat() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <div>⏳ Chargement...</div>;
  }

  if (!user.groupId) {
    return <div>⛔ Aucun groupe assigné</div>;
  }

  return (
    <div style={{ height: "100%" }}>
      <ChatBox
        groupId={user.groupId}
        currentUser={user}
      />
    </div>
  );
}
