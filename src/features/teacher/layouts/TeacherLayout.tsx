import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  PenTool,
  Search,
  Settings,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import Brand from "../../../components/Brand";
import { session } from "../../../lib/auth";

const navigation = [
  { to: "/teacher", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/teacher/classes", label: "My classes", icon: GraduationCap },
  { to: "/teacher/students", label: "Students", icon: Users },
  { to: "/teacher/lessons", label: "Lessons", icon: BookOpen },
  { to: "/teacher/activities", label: "Activities", icon: Activity },
  { to: "/teacher/quackslate", label: "QuackSlate", icon: PenTool },
  {
    to: "/teacher/communication",
    label: "Communication",
    icon: MessageSquareText,
  },
  { to: "/teacher/reports", label: "Reports", icon: BarChart3 },
  { to: "/teacher/profile", label: "Profile", icon: UserCircle },
  { to: "/teacher/settings", label: "Settings", icon: Settings },
];

const routeTitles: Record<string, string> = {
  "/teacher": "Overview",
  "/teacher/classes": "My classes",
  "/teacher/students": "Students",
  "/teacher/lessons": "Lessons",
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

        <div className="teacher-mini">
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
        </div>

        <nav>
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="logout" onClick={logout}>
          <LogOut />
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
