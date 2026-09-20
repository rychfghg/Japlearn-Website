import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Copy,
  GraduationCap,
  KeyRound,
  Mail,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCircle,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { session } from "../../../lib/auth";
import { teacherApi } from "../services/teacherApi";

type Snapshot = { classes: number; students: number; sections: string[] };

export default function ProfilePage() {
  const user = session.get()!;
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([teacherApi.getClasses(), teacherApi.getAllStudents()])
      .then(([classes, students]) => {
        if (!active) return;
        const sections = [...new Set(classes.map((item) => item.classCodes).filter(Boolean))];
        setSnapshot({ classes: sections.length, students: students.length, sections: sections.slice(0, 6) });
      })
      .catch(() => { if (active) setSnapshot({ classes: 0, students: 0, sections: [] }); });
    return () => { active = false; };
  }, []);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(user.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const count = (value: number | undefined) => (snapshot ? value ?? 0 : "—");

  return (
    <section className="tprof-page">
      <header className="tprof-hero">
        <div className="tprof-hero-kana" aria-hidden="true"><span>先</span><span>生</span></div>

        <div className="tprof-identity">
          <div className="tprof-avatar">
            {user.fname?.[0]}{user.lname?.[0]}
            <i aria-label="Verified teacher"><BadgeCheck /></i>
          </div>
          <div className="tprof-identity-copy">
            <span className="tprof-kicker">先生プロフィール · TEACHER PROFILE</span>
            <h2>{user.fname} {user.lname}</h2>
            <p>Japanese language teacher · JapLearn workspace</p>
            <div className="tprof-tags">
              <span className="tprof-tag"><ShieldCheck /> Verified educator</span>
              <span className="tprof-tag soft"><Sparkles /> Active account</span>
            </div>
          </div>
        </div>

        <div className="tprof-stats">
          <article><span className="tprof-stat-icon violet"><GraduationCap /></span><b>{count(snapshot?.classes)}</b><small>Classes</small></article>
          <article><span className="tprof-stat-icon green"><Users /></span><b>{count(snapshot?.students)}</b><small>Learners</small></article>
          <article><span className="tprof-stat-icon orange"><BadgeCheck /></span><b>Teacher</b><small>Access level</small></article>
        </div>
      </header>

      <div className="tprof-layout">
        <section className="tprof-card">
          <header>
            <div><small>ACCOUNT DETAILS</small><h3>Your information</h3></div>
            <Link to="/teacher/settings" className="tprof-head-link"><Settings /> Workspace settings</Link>
          </header>

          <div className="tprof-details">
            <article>
              <span className="tprof-detail-icon violet"><UserCircle /></span>
              <div><small>FULL NAME</small><b>{user.fname} {user.lname}</b><p>Shown to your learners and on class records</p></div>
            </article>
            <article className="tprof-has-copy">
              <span className="tprof-detail-icon blue"><Mail /></span>
              <div><small>EMAIL ADDRESS</small><b>{user.email}</b><p>Used for sign-in and password recovery</p></div>
              <button type="button" className="tprof-copy" onClick={copyEmail} aria-label="Copy email address">
                {copied ? <BadgeCheck /> : <Copy />}{copied ? "Copied" : "Copy"}
              </button>
            </article>
            <article>
              <span className="tprof-detail-icon green"><GraduationCap /></span>
              <div><small>WORKSPACE ROLE</small><b>{user.role === "teacher" ? "Teacher" : user.role}</b><p>Access to classes, lessons, activities and reports</p></div>
            </article>
            <article>
              <span className="tprof-detail-icon orange"><KeyRound /></span>
              <div><small>ACCOUNT ID</small><b>{user.userId || "Connected account"}</b><p>Your unique JapLearn account reference</p></div>
            </article>
          </div>

          <div className="tprof-sections">
            <small>YOUR SECTIONS</small>
            {snapshot?.sections.length ? (
              <div>{snapshot.sections.map((code) => <span key={code} className="tprof-section-chip">{code}</span>)}</div>
            ) : (
              <p>{snapshot ? "No class sections yet. Create one from My classes." : "Loading your sections…"}</p>
            )}
          </div>
        </section>

        <aside className="tprof-side">
          <article className="tprof-status">
            <span><ShieldCheck /></span>
            <small>ACCOUNT STATUS</small>
            <h3>Your workspace is protected</h3>
            <p>Only you can see your classes, learners and reports. Sign-in is required on every device.</p>
            <div className="tprof-status-row"><BadgeCheck /> Active teacher access</div>
          </article>

          <article className="tprof-shortcuts">
            <small>CONTINUE YOUR WORK</small>
            <Link to="/teacher/classes"><span className="tprof-detail-icon violet"><GraduationCap /></span><div><b>My classes</b><small>Rosters and class codes</small></div><ArrowRight /></Link>
            <Link to="/teacher/lessons"><span className="tprof-detail-icon blue"><BookOpen /></span><div><b>Lessons</b><small>Plan learning content</small></div><ArrowRight /></Link>
            <Link to="/teacher/activities"><span className="tprof-detail-icon green"><Activity /></span><div><b>Activities</b><small>QuackSlate and speaking practice</small></div><ArrowRight /></Link>
            <Link to="/teacher/reports"><span className="tprof-detail-icon orange"><BarChart3 /></span><div><b>Reports</b><small>Progress and game scores</small></div><ArrowRight /></Link>
          </article>
        </aside>
      </div>

      <section className="tprof-help">
        <div>
          <b>Need to update protected information?</b>
          <p>Your name and email are tied to your account. Contact the JapLearn admin to change them, or reset your password from the sign-in screen.</p>
        </div>
        <Link to="/teacher/settings">Open workspace settings <ArrowRight /></Link>
      </section>
    </section>
  );
}
