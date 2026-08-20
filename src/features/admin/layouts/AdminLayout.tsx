import { BookOpenCheck, GitCompareArrows, GraduationCap, LayoutDashboard, LogOut, MessageCircleQuestion, Users } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Brand from "../../../components/Brand";
import { session } from "../../../lib/auth";

export default function AdminLayout() {
  const navigate = useNavigate();
  const logout = () => {
    session.clear();
    navigate("/admin/login", { replace: true });
  };

  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <Brand light />
        <div className="admin-identity"><span>AD</span><div><b>Administrator</b><small>JapLearn control center</small></div></div>
        <nav>
          <NavLink end to="/admin"><LayoutDashboard />Overview</NavLink>
          <NavLink to="/admin/students"><Users />Students</NavLink>
          <NavLink to="/admin/teachers"><GraduationCap />Teachers</NavLink>
          <NavLink to="/admin/quackslate"><BookOpenCheck />QuackSlate bank</NavLink>
          <NavLink to="/admin/quackresponse"><MessageCircleQuestion />QuackResponse</NavLink>
          <NavLink to="/admin/expression-match"><GitCompareArrows />Expression Match</NavLink>
        </nav>
        <button className="admin-logout" onClick={logout}><LogOut />Sign out</button>
      </aside>
      <section className="admin-content"><Outlet /></section>
    </main>
  );
}
