import React, { useEffect, useState, useCallback, useRef } from "react";
import api from "../services/api";
import "./chat.css";

/* ================= DATE FORMAT ================= */
const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.toLocaleDateString()} • ${d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

/* ================= FILE ICON ================= */
const getFileIcon = (mime) => {
  if (!mime) return "📄";
  if (mime.includes("pdf")) return "📕";
  if (mime.includes("image")) return "🖼️";
  if (mime.includes("word")) return "📘";
  if (mime.includes("excel")) return "📗";
  if (mime.includes("zip")) return "🗜️";
  return "📄";
};

export default function ChatBox({ groupId, groupName, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const [openMenuId, setOpenMenuId] = useState(null);

  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  /* ================= LOAD ================= */
  const loadMessages = useCallback(async () => {
    if (!groupId) return;
    const data = await api.getMessages(groupId);
    setMessages(Array.isArray(data) ? data : []);
  }, [groupId]);

  useEffect(() => {
    loadMessages();
    const i = setInterval(loadMessages, 3000);
    return () => clearInterval(i);
  }, [loadMessages]);

  /* ================= CLOSE MENU ON OUTSIDE CLICK ================= */
  useEffect(() => {
    const closeMenu = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  /* ================= SEND ================= */
  const send = async () => {
    if (!text.trim() && !selectedFile) return;

    await api.sendMessage(groupId, text.trim() || null, selectedFile);

    setText("");
    setSelectedFile(null);
    fileInputRef.current.value = "";
    loadMessages();
  };

  /* ================= UPDATE ================= */
  const saveEdit = async (id) => {
    if (!editText.trim()) return;
    await api.updateMessage(groupId, id, editText);
    setEditingId(null);
    setEditText("");
    setOpenMenuId(null);
    loadMessages();
  };

  /* ================= DELETE ================= */
  const remove = async (id) => {
    if (!window.confirm("Supprimer ce message ?")) return;
    await api.deleteMessage(groupId, id);
    setOpenMenuId(null);
    loadMessages();
  };

  /* ================= DOWNLOAD ================= */
  const downloadFile = async (m) => {
    try {
      const response = await fetch(m.fileUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = m.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erreur téléchargement");
    }
    setOpenMenuId(null);
  };

  return (
    <div className="chat-zone">
      <div className="chat-header">
        💬 Discussion — <span>{groupName || "Groupe"}</span>
      </div>

      <div className="chat-messages">
        {messages.map((m) => {
          const isMe = m.senderId === currentUser?.uid;

          return (
            <div key={m.id} className={`chat-message ${isMe ? "me" : "other"}`}>
              {/* META */}
              <div className="chat-meta">
                <span className="chat-author">
                  {isMe ? "Me" : m.senderEmail}
                </span>
                <span className="chat-time">
                  {formatDate(m.timestamp)}
                </span>

                {/* User's own message menu */}
                {isMe && (
                  <button
                    className="chat-action-btn"
                    onClick={() =>
                      setOpenMenuId(openMenuId === m.id ? null : m.id)
                    }
                  >
                    ⋮
                  </button>
                )}

                {openMenuId === m.id && isMe && (
                  <div className="chat-menu" ref={menuRef}>
                    {m.type === "text" && (
                      <button
                        onClick={() => {
                          setEditingId(m.id);
                          setEditText(m.text);
                          setOpenMenuId(null);
                        }}
                      >
                        ✏️ Modifier
                      </button>
                    )}

                    <button className="danger" onClick={() => remove(m.id)}>
                      🗑️ Supprimer
                    </button>
                  </div>
                )}
              </div>

              {/* CONTENT */}
              {editingId === m.id ? (
                <div className="chat-edit-box">
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    autoFocus
                  />
                  <div className="chat-edit-actions">
                    <button onClick={() => saveEdit(m.id)}>✔️</button>
                    <button onClick={() => setEditingId(null)}>✖</button>
                  </div>
                </div>
              ) : (
                <>
                  {m.text && <div className="chat-text">{m.text}</div>}
                  {m.type === "document" && (
                    <div className="chat-file-card">
                      <div className="file-icon">{getFileIcon(m.mimeType)}</div>
                      <div className="file-info">
                        <div className="file-name">{m.fileName}</div>
                        <div className="file-type">
                          {m.mimeType?.split("/")[1]?.toUpperCase()}
                        </div>
                      </div>
                      {!isMe && (
                        <button
                          className="file-action-btn"
                          onClick={() =>
                            setOpenMenuId(openMenuId === m.id ? null : m.id)
                          }
                        >
                          ⋮
                        </button>
                      )}
                      {openMenuId === m.id && !isMe && (
                        <div className="doc-menu" ref={menuRef}>
                          <button
                            className="menu-item"
                            onClick={() => downloadFile(m)}
                          >
                            📥 Télécharger
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {selectedFile && (
        <div className="file-preview">
          📎 {selectedFile.name}
          <button onClick={() => setSelectedFile(null)}>✖</button>
        </div>
      )}

      <div className="chat-input">
        <button onClick={() => fileInputRef.current.click()}>📎</button>
        <input
          type="file"
          ref={fileInputRef}
          hidden
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrire un message..."
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button onClick={send}>Envoyer</button>
      </div>
    </div>
  );
}
