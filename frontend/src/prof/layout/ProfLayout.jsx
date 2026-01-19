import { Outlet } from "react-router-dom";
import { useContext, useEffect } from "react";
import ProfSidebar from "../sidebar/ProfSidebar";
import { AuthContext } from "../../context/AuthContext";
import "./profLayout.css";

export default function ProfLayout() {
  const { user, isLoading } = useContext(AuthContext);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "prof")) {
      window.location.href = "http://localhost:3000/login";
    }
  }, [user, isLoading]);

  if (isLoading) return null;

  return (
    <div className="prof-layout">
      <ProfSidebar />
      <div className="prof-main">
        <Outlet />
      </div>
    </div>
  );
}
