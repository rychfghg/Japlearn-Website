import {
  BookOpenCheck,
  Compass,
  Gamepad2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageCircleQuestion,
  Mic2,
  Users,
} from "lucide-react";
import { Fragment } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Brand from "../../../components/Brand";
import { session } from "../../../lib/auth";

const navigation = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true, group: "Overview" },
  { to: "/admin/students", label: "Students", icon: Users, group: "People" },
  { to: "/admin/teachers", label: "Teachers", icon: GraduationCap, group: "People" },
  { to: "/admin/quacksituate", label: "QuackSituate", icon: Compass, group: "Game content" },
  { to: "/admin/quackresponse", label: "QuackResponse", icon: MessageCircleQuestion, group: "Game content" },
  { to: "/admin/quacktalk", label: "QuackTalk", icon: Mic2, group: "Game content" },
  { to: "/admin/quackamole", label: "Quack-a-Mole", icon: Gamepad2, group: "Game content" },
  { to: "/admin/quackslate", label: "QuackSlate", icon: BookOpenCheck, group: "Game content" },
  { to: "/admin/quackman", label: "Quackman", icon: Gamepad2, group: "Game content" },
];

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
        <NavLink to="/admin" end className="admin-identity">
          <span>AD</span>
          <div>
            <b>Administrator</b>
            <small>JapLearn control center</small>
          </div>
        </NavLink>
        <nav>
          {navigation.map((item, index) => {
            const Icon = item.icon;
            const showGroup = item.group !== navigation[index - 1]?.group;
            return (
              <Fragment key={item.to}>
                {showGroup && <span className="admin-nav-group">{item.group}</span>}
                <NavLink to={item.to} end={item.end}>
                  <span className="admin-nav-icon"><Icon /></span>
                  {item.label}
                </NavLink>
              </Fragment>
            );
          })}
        </nav>
        <button className="admin-logout" onClick={logout}>
          <span className="admin-nav-icon"><LogOut /></span>
          Sign out
        </button>
      </aside>
      <section className="admin-content">
        <Outlet />
      </section>
    </main>
  );
}
