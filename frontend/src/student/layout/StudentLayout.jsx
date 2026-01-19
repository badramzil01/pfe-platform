import { Outlet } from "react-router-dom";
import { useContext, useEffect } from "react";
import StudentSidebar from "../sidebar/StudentSidebar";
import { AuthContext } from "../../context/AuthContext";
import "./studentLayout.css";

export default function StudentLayout() {
  const { user, isLoading } = useContext(AuthContext);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "student")) {
      window.location.href = "http://localhost:3000/login";
    }
  }, [user, isLoading]);

  if (isLoading) return null;

  return (
    <div className="admin-layout">
      <StudentSidebar />
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
