import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { Fragment, type FormEvent, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import Brand from "../../../components/Brand";
import { session } from "../../../lib/auth";

const navigation = [
  { to: "/teacher", label: "Overview", icon: LayoutDashboard, end: true, group: "Workspace" },
  { to: "/teacher/classes", label: "My classes", icon: GraduationCap, group: "Workspace" },
  { to: "/teacher/students", label: "Students", icon: Users, group: "Workspace" },
  { to: "/teacher/lessons", label: "Lessons", icon: BookOpen, group: "Workspace" },
  { to: "/teacher/activities", label: "Activities", icon: Activity, group: "Workspace" },
  { to: "/teacher/reports", label: "Reports", icon: BarChart3, group: "Insights" },
  { to: "/teacher/profile", label: "Profile", icon: UserCircle, group: "Account" },
  { to: "/teacher/settings", label: "Settings", icon: Settings, group: "Account" },
];

const routeTitles: Record<string, string> = {
  "/teacher": "Overview",
  "/teacher/classes": "My classes",
  "/teacher/students": "Students",
  "/teacher/lessons": "Lessons",
  "/teacher/lessons/progress": "Lesson masterlist",
  "/teacher/activities": "Activities",
  "/teacher/quackslate": "QuackSlate sessions",
  "/teacher/communication": "Communication management",
  "/teacher/communication/performance": "Communication performance",
  "/teacher/communication/assign": "Assign communication activities",
  "/teacher/reports": "Progress reports",
  "/teacher/profile": "Teacher profile",
  "/teacher/settings": "Settings",
};

export default function TeacherLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = session.get()!;
  const pageTitle = location.pathname.startsWith("/teacher/classes/")
    ? "Classroom"
    : routeTitles[location.pathname] || "Teacher workspace";
  const searchResults = searchQuery.trim()
    ? navigation.filter((item) =>
        `${item.label} ${item.to}`.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      ).slice(0, 5)
    : [];

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    if (!searchResults.length) return;
    navigate(searchResults[0].to);
    setSearchQuery("");
    setSearchFocused(false);
  };

  const logout = () => {
    session.clear();
    navigate("/teacher/login", { replace: true });
  };

  return (
    <main className="portal">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="side-head">
          <Brand light />
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X />
          </button>
        </div>

        <NavLink to="/teacher/profile" className="teacher-mini" onClick={() => setMenuOpen(false)}>
          <span>
            {user.fname?.[0]}
            {user.lname?.[0]}
          </span>
          <div>
            <b>
              {user.fname} {user.lname}
            </b>
            <small>Japanese language teacher</small>
          </div>
        </NavLink>

        <nav>
          {navigation.map((item, index) => {
            const Icon = item.icon;
            const showGroup = item.group !== navigation[index - 1]?.group;
            return (
              <Fragment key={item.to}>
                {showGroup && <span className="nav-group-label">{item.group}</span>}
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  <span className="nav-icon"><Icon /></span>
                  {item.label}
                </NavLink>
              </Fragment>
            );
          })}
        </nav>

        <button type="button" className="logout" onClick={logout}>
          <span className="nav-icon"><LogOut /></span>
          Sign out
        </button>
      </aside>

      {menuOpen && (
        <button
          type="button"
          className="side-scrim"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <section className="portal-main">
        <header className="portal-top">
          <button
            type="button"
            className="mobile-menu"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </button>

          <div>
            <small>TEACHER WORKSPACE</small>
            <h1>{pageTitle}</h1>
          </div>

          <div className="top-tools">
            <form className="global-search" onSubmit={submitSearch} role="search">
              <Search />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                placeholder="Search pages and tools…"
                aria-label="Search teacher workspace"
              />
              {searchFocused && searchQuery.trim() && (
                <div className="global-search-results">
                  {searchResults.length ? searchResults.map(({ to, label, icon: Icon }) => (
                    <button key={to} type="button" onMouseDown={() => navigate(to)}>
                      <Icon />
                      <span><b>{label}</b><small>Open workspace page</small></span>
                      <ArrowRight />
                    </button>
                  )) : <p>No matching workspace page</p>}
                </div>
              )}
            </form>
            <NavLink to="/teacher/profile" className="profile-chip">
              <span>
                {user.fname?.[0]}
                {user.lname?.[0]}
              </span>
              <div>
                <b>{user.fname}</b>
                <small>Teacher</small>
              </div>
            </NavLink>
          </div>
        </header>

        <div className="page-body">
          <Outlet />
        </div>
      </section>
    </main>
  );
}
