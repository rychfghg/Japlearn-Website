import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import TeacherSignup from "./pages/TeacherSignup";
import AdminQuestionBankPage from "./features/admin/pages/AdminQuestionBankPage";
import AdminQuackResponsePage from "./features/admin/pages/AdminQuackResponsePage";
import AdminLayout from "./features/admin/layouts/AdminLayout";
import AdminOverviewPage from "./features/admin/pages/AdminOverviewPage";
import AdminUsersPage from "./features/admin/pages/AdminUsersPage";
import TeacherLayout from "./features/teacher/layouts/TeacherLayout";
import ActivitiesPage from "./features/teacher/pages/ActivitiesPage";
import AssignCommunicationPage from "./features/teacher/pages/AssignCommunicationPage";
import ClassDetailPage from "./features/teacher/pages/ClassDetailPage";
import ClassesPage from "./features/teacher/pages/ClassesPage";
import CommunicationPage from "./features/teacher/pages/CommunicationPage";
import LessonsPage from "./features/teacher/pages/LessonsPage";
import LessonProgressPage from "./features/teacher/pages/LessonProgressPage";
import OverviewPage from "./features/teacher/pages/OverviewPage";
import PerformancePage from "./features/teacher/pages/PerformancePage";
import ProfilePage from "./features/teacher/pages/ProfilePage";
import ReportsPage from "./features/teacher/pages/ReportsPage";
import SettingsPage from "./features/teacher/pages/SettingsPage";
import StudentsPage from "./features/teacher/pages/StudentsPage";
import QuackslatePage from "./features/teacher/pages/QuackslatePage";
import { session } from "./lib/auth";

function RoleGuard({ role, children }: { role: string; children: ReactNode }) {
  const user = session.get();

  if (user?.role !== role) {
    return <Navigate to={`/${role}/login`} replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/teacher/login" element={<Login role="teacher" />} />
      <Route path="/teacher/create-account" element={<TeacherSignup />} />
      <Route path="/admin/login" element={<Login role="admin" />} />

      <Route
        path="/teacher"
        element={
          <RoleGuard role="teacher">
            <TeacherLayout />
          </RoleGuard>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="classes/:classCode" element={<ClassDetailPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="lessons" element={<LessonsPage />} />
        <Route path="lessons/progress" element={<LessonProgressPage />} />
        <Route path="activities" element={<ActivitiesPage />} />
        <Route path="quackslate" element={<QuackslatePage />} />
        <Route path="communication" element={<CommunicationPage />} />
        <Route path="communication/performance" element={<PerformancePage />} />
        <Route
          path="communication/assign"
          element={<AssignCommunicationPage />}
        />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RoleGuard role="admin">
            <AdminLayout />
          </RoleGuard>
        }
      >
        <Route index element={<AdminOverviewPage />} />
        <Route path="students" element={<AdminUsersPage role="student" />} />
        <Route path="teachers" element={<AdminUsersPage role="teacher" />} />
        <Route path="quackslate" element={<AdminQuestionBankPage />} />
        <Route path="quackresponse" element={<AdminQuackResponsePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
