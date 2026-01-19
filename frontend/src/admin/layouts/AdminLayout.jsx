import { Outlet } from "react-router-dom";
import { useContext, useEffect } from "react";
import AdminSidebar from "../sidebar/AdminSidebar";
import { AuthContext } from "../../context/AuthContext";
import "./adminLayout.css";

export default function AdminLayout() {
  const { user, isLoading } = useContext(AuthContext);

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = "http://localhost:3000/login";
    }
  }, [user, isLoading]);

  // ⏳ éviter affichage pendant restore session
  if (isLoading) return null;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
