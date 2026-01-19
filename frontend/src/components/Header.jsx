// src/components/Header.jsx
import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b bg-white">
      <div className="text-lg font-semibold">Plateforme PFE — Administration</div>
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <div className="font-medium">{user?.displayName || "Admin"}</div>
          <div className="text-xs text-gray-500">{user?.email}</div>
        </div>
        <button className="px-3 py-1 rounded bg-red-50 text-red-600" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}
