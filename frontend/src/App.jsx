// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";

import AdminLayout from "./admin/layouts/AdminLayout";
import AdminDashboard from "./admin/pages/Dashboard";
import Users from "./admin/pages/Users";
import AdminGroups from "./admin/pages/Groups";

import ProfLayout from "./prof/layout/ProfLayout";
import ProfDashboard from "./prof/Dashboard";
import ProfCalendar from "./prof/Calendar";
import ProfComplaints from "./prof/Complaints";
import ProfStudents from "./prof/Students";
import ProjectProgress from "./prof/ProjectProgress";
import ProfChat from "./prof/pages/Chat";


import StudentLayout from "./student/layout/StudentLayout";
import StudentDashboard from "./student/Dashboard";
import StudentCalendar from "./student/Calendar";
import StudentComplaints from "./student/Complaints";
import StudentChat from "./student/pages/Chat";
import StudentProjectProgress from "./student/ProjectProgress";
import StudentStudents from "./student/Students";

export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Chargement...</div>;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* 🔐 ADMIN */}
      <Route
        path="/admin"
        element={
          user?.role === "admin" ? <AdminLayout /> : <Navigate to="/admin/login" />
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="groups" element={<AdminGroups />} />
      </Route>

      {/* 👨‍🏫 PROF */}
      <Route
        path="/prof"
        element={
          user?.role === "prof" ? <ProfLayout /> : <Navigate to="/login" />
        }
      >
        <Route path="dashboard" element={<ProfDashboard />} />
        <Route path="calendar" element={<ProfCalendar />} />
        <Route path="complaints" element={<ProfComplaints />} />
        <Route path="project-progress" element={<ProjectProgress />} />
        <Route path="students" element={<ProfStudents />} />
        <Route path="chat" element={<ProfChat />} />

      </Route>

      {/* 🎓 STUDENT */}
      <Route
        path="/student"
        element={
          user?.role === "student" ? <StudentLayout /> : <Navigate to="/login" />
        }
      >
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="calendar" element={<StudentCalendar />} />
        <Route path="complaints" element={<StudentComplaints />} />
        <Route path="progress" element={<StudentProjectProgress />} />
        <Route path="students" element={<StudentStudents />} />
        <Route path="/student/chat" element={<StudentChat />} />

      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
