import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  GraduationCap,
  KeyRound,
  Mail,
  Settings,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { session } from "../../../lib/auth";

export default function ProfilePage() {
  const user = session.get()!;

  return (
    <section className="teacher-profile-page">
      <div className="profile-hero-card">
        <div className="profile-hero-pattern" aria-hidden="true"><span>あ</span><span>学</span><span>話</span></div>
        <div className="profile-avatar-large">
          {user.fname?.[0]}{user.lname?.[0]}
          <i aria-label="Verified teacher"><BadgeCheck /></i>
        </div>
        <div className="profile-hero-copy">
          <span>先生プロフィール</span>
          <div>
            <h2>{user.fname} {user.lname}</h2>
            <p>Japanese language teacher</p>
          </div>
        </div>
        <span className="profile-status"><ShieldCheck /> Verified educator account</span>
      </div>

      <div className="teacher-profile-layout">
        <section className="profile-information-card">
          <header>
            <div><small>PERSONAL INFORMATION</small><h3>Account details</h3></div>
            <Link to="/teacher/settings"><Settings /> Account settings</Link>
          </header>
          <div className="profile-information-grid">
            <article><span><UserCircle /></span><div><small>FULL NAME</small><b>{user.fname} {user.lname}</b><p>Your name across the teacher workspace</p></div></article>
            <article><span><Mail /></span><div><small>EMAIL ADDRESS</small><b>{user.email}</b><p>Used for sign-in and account communication</p></div></article>
            <article><span><GraduationCap /></span><div><small>WORKSPACE ROLE</small><b>{user.role === "teacher" ? "Teacher" : user.role}</b><p>Educator access to classes and learner progress</p></div></article>
            <article><span><KeyRound /></span><div><small>ACCOUNT ID</small><b>{user.userId || "Connected account"}</b><p>Your unique JapLearn account reference</p></div></article>
          </div>
        </section>

        <aside className="profile-side-column">
          <section className="profile-account-card">
            <span><ShieldCheck /></span>
            <small>ACCOUNT STATUS</small>
            <h3>Your workspace is protected</h3>
            <p>Your profile is connected to a verified teacher account.</p>
            <div><BadgeCheck /> Active teacher access</div>
          </section>
          <section className="profile-shortcuts-card">
            <small>TEACHER SHORTCUTS</small>
            <h3>Continue your work</h3>
            <Link to="/teacher/classes"><span><GraduationCap /></span><div><b>My classes</b><small>Manage classrooms</small></div><ArrowRight /></Link>
            <Link to="/teacher/lessons"><span><BookOpen /></span><div><b>Lessons</b><small>Plan learning content</small></div><ArrowRight /></Link>
            <Link to="/teacher/settings"><span><Settings /></span><div><b>Settings</b><small>Account preferences</small></div><ArrowRight /></Link>
          </section>
        </aside>
      </div>

      <section className="profile-help-strip">
        <div><span>Need to update protected information?</span><p>Account email and identity changes may require verification.</p></div>
        <Link to="/teacher/settings">Review account settings <ArrowRight /></Link>
      </section>
    </section>
  );
}
