import {
  BookOpenCheck,
  Compass,
  Gamepad2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircleQuestion,
  Mic2,
  Users,
  X,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);
  const logout = () => {
    session.clear();
    setMenuOpen(false);
    navigate("/admin/login", { replace: true });
  };

  return (
    <main className="admin-layout">
      <aside className={`admin-sidebar ${menuOpen ? "open" : ""}`} id="admin-navigation">
        <div className="admin-side-head"><Brand light /><button type="button" onClick={() => setMenuOpen(false)} aria-label="Close admin menu"><X /></button></div>
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
                <NavLink to={item.to} end={item.end} onClick={() => setMenuOpen(false)}>
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
      {menuOpen && <button className="admin-side-scrim" type="button" onClick={() => setMenuOpen(false)} aria-label="Close admin navigation" />}
      <section className="admin-content">
        <header className="admin-mobile-top"><button type="button" onClick={() => setMenuOpen(true)} aria-label="Open admin menu" aria-controls="admin-navigation" aria-expanded={menuOpen}><Menu /></button><div><small>JAPLEARN ADMIN</small><strong>{navigation.find((item) => item.to === location.pathname)?.label || "Content studio"}</strong></div><span className="admin-mobile-mark">AD</span></header>
        <Outlet />
      </section>
    </main>
  );
}
