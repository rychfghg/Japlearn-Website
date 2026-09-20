import {
  ArrowRight,
  BookOpen,
  Check,
  CircleHelp,
  Compass,
  Eye,
  GraduationCap,
  KeyRound,
  Languages,
  LayoutPanelTop,
  LogOut,
  type LucideIcon,
  PanelTop,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Type,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { session } from "../../../lib/auth";
import {
  applyPreferences,
  defaultPreferences,
  loadPreferences,
  savePreferences,
  START_PAGES,
  type TeacherPreferences,
} from "../preferences";

type ToggleKey = "reducedMotion" | "helpfulTips" | "stickyHeader";

const TOGGLES: { key: ToggleKey; icon: LucideIcon; tone: string; title: string; description: string }[] = [
  {
    key: "stickyHeader",
    icon: PanelTop,
    tone: "violet",
    title: "Keep the page header in view",
    description: "The workspace title and search stay pinned while you scroll long class lists.",
  },
  {
    key: "reducedMotion",
    icon: Eye,
    tone: "green",
    title: "Reduce motion",
    description: "Turns off hover movement and transitions across every teacher screen.",
  },
  {
    key: "helpfulTips",
    icon: Sparkles,
    tone: "orange",
    title: "Helpful guidance",
    description: "Shows the small section hints and tips while you manage classes and tools.",
  },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = session.get();
  const [preferences, setPreferences] = useState<TeacherPreferences>(loadPreferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    savePreferences(preferences);
    setSaved(true);
    const timer = window.setTimeout(() => setSaved(false), 1600);
    return () => window.clearTimeout(timer);
  }, [preferences]);

  // Keep the live workspace matching these controls while the page is open.
  useEffect(() => () => applyPreferences(loadPreferences()), []);

  const isDefault = useMemo(
    () => (Object.keys(defaultPreferences) as (keyof TeacherPreferences)[]).every((key) => preferences[key] === defaultPreferences[key]),
    [preferences],
  );

  const update = <K extends keyof TeacherPreferences>(key: K, value: TeacherPreferences[K]) =>
    setPreferences((current) => ({ ...current, [key]: value }));

  const signOut = () => {
    session.clear();
    navigate("/teacher/login", { replace: true });
  };

  return (
    <section className="tset-page">
      <header className="tset-bar">
        <div>
          <span className="tset-kicker"><Compass /> WORKSPACE SETTINGS</span>
          <h2>Make the portal work the way you teach</h2>
          <p>Every choice here applies to all of your teacher screens and is remembered the next time you sign in.</p>
        </div>
        <div className="tset-bar-actions">
          <span className={`tset-saved ${saved ? "show" : ""}`} aria-live="polite">
            <Check /> Saved
          </span>
          <button type="button" className="tset-reset" onClick={() => setPreferences(defaultPreferences)} disabled={isDefault}>
            <RotateCcw /> Reset to defaults
          </button>
        </div>
      </header>

      <div className="tset-grid">
        <div className="tset-column">
          <article className="tset-card">
            <header>
              <span className="tset-card-icon violet"><LayoutPanelTop /></span>
              <div><small>APPEARANCE</small><h3>Layout and readability</h3></div>
            </header>

            <div className="tset-choice">
              <div className="tset-choice-copy">
                <b>Information density</b>
                <small>Comfortable keeps generous spacing. Compact fits more rows of learners on screen.</small>
              </div>
              <div className="tset-segment" role="group" aria-label="Information density">
                <button type="button" className={preferences.density === "comfortable" ? "on" : ""} onClick={() => update("density", "comfortable")}>Comfortable</button>
                <button type="button" className={preferences.density === "compact" ? "on" : ""} onClick={() => update("density", "compact")}>Compact</button>
              </div>
            </div>

            <div className="tset-choice">
              <div className="tset-choice-copy">
                <b><Type /> Text size</b>
                <small>Larger text helps when you present the portal on a classroom projector.</small>
              </div>
              <div className="tset-segment" role="group" aria-label="Text size">
                <button type="button" className={preferences.textSize === "default" ? "on" : ""} onClick={() => update("textSize", "default")}>Default</button>
                <button type="button" className={preferences.textSize === "large" ? "on" : ""} onClick={() => update("textSize", "large")}>Large</button>
              </div>
            </div>

            <div className="tset-preview" aria-hidden="true">
              <small>PREVIEW</small>
              <div className="tset-preview-rows">
                <span><i /><b>Nihongo 1 · 24 learners</b><em>82%</em></span>
                <span><i /><b>Nihongo 2 · 19 learners</b><em>74%</em></span>
                <span><i /><b>Nihongo 3 · 21 learners</b><em>91%</em></span>
              </div>
            </div>
          </article>

          <article className="tset-card">
            <header>
              <span className="tset-card-icon green"><Eye /></span>
              <div><small>BEHAVIOUR</small><h3>How the workspace responds</h3></div>
            </header>
            <ul className="tset-toggles">
              {TOGGLES.map(({ key, icon: Icon, tone, title, description }) => (
                <li key={key}>
                  <span className={`tset-option-icon ${tone}`}><Icon /></span>
                  <div><b>{title}</b><small>{description}</small></div>
                  <div className="tset-control">
                    <em>{preferences[key] ? "On" : "Off"}</em>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={preferences[key]}
                      aria-label={title}
                      className={preferences[key] ? "toggle on" : "toggle"}
                      onClick={() => update(key, !preferences[key])}
                    >
                      <i />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className="tset-card">
            <header>
              <span className="tset-card-icon blue"><Compass /></span>
              <div><small>STARTING POINT</small><h3>Where you land after signing in</h3></div>
            </header>
            <p className="tset-card-note">Choose the screen you open most. It becomes your first page every time you sign in.</p>
            <div className="tset-startpages" role="group" aria-label="Start page">
              {START_PAGES.map((page) => (
                <button
                  key={page.value}
                  type="button"
                  className={preferences.startPage === page.value ? "on" : ""}
                  onClick={() => update("startPage", page.value)}
                >
                  {preferences.startPage === page.value && <Check />}
                  {page.label}
                </button>
              ))}
            </div>
          </article>
        </div>

        <aside className="tset-column tset-aside">
          <article className="tset-account">
            <span className="tset-account-avatar">{user?.fname?.[0]}{user?.lname?.[0]}</span>
            <div>
              <b>{user?.fname} {user?.lname}</b>
              <small>{user?.email}</small>
            </div>
            <span className="tset-verified"><ShieldCheck /> Verified teacher</span>
            <Link to="/teacher/profile" className="tset-link-button">View full profile <ArrowRight /></Link>
          </article>

          <article className="tset-card tset-quiet">
            <header>
              <span className="tset-card-icon pink"><Languages /></span>
              <div><small>LANGUAGE</small><h3>Portal language</h3></div>
            </header>
            <p className="tset-card-note">The teacher portal uses English with Japanese learning terminology.</p>
            <span className="tset-pill-value"><Check /> English</span>
          </article>

          <article className="tset-links">
            <small>QUICK LINKS</small>
            <Link to="/teacher/guide"><span className="tset-option-icon violet"><CircleHelp /></span><div><b>Teacher guide</b><small>Step-by-step help for every tool</small></div><ArrowRight /></Link>
            <Link to="/teacher/classes"><span className="tset-option-icon green"><GraduationCap /></span><div><b>My classes</b><small>Rosters and class codes</small></div><ArrowRight /></Link>
            <Link to="/teacher/lessons"><span className="tset-option-icon orange"><BookOpen /></span><div><b>Lessons</b><small>Plan and assign content</small></div><ArrowRight /></Link>
          </article>

          <article className="tset-security">
            <span className="tset-option-icon violet"><KeyRound /></span>
            <div>
              <b>Password and security</b>
              <small>Reset your password from the sign-in screen using your account email.</small>
            </div>
            <button type="button" className="tset-signout" onClick={signOut}><LogOut /> Sign out of this device</button>
          </article>

          <p className="tset-footnote"><GraduationCap /> These preferences change your workspace only. Learner accounts and the student app are not affected.</p>
        </aside>
      </div>
    </section>
  );
}
