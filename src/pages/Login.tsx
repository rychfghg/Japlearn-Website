import { type FormEvent, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  DatabaseZap,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Brand from "../components/Brand";
import mascot from "../assets/idle.png";
import { loginUser, type PortalRole } from "../lib/api";
import { session } from "../lib/auth";

type LoginProps = {
  role: PortalRole;
};

export default function Login({ role }: LoginProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const user = await loginUser(email, password);

      if (user.role !== role) {
        throw new Error(`This portal is for ${role} accounts only.`);
      }

      session.set(user);
      navigate(role === "teacher" ? "/teacher" : "/admin", { replace: true });
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Login failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  const isTeacher = role === "teacher";

  return (
    <main className={`login-page ${isTeacher ? "login-page-teacher" : ""}`}>
      <section className={`login-visual ${isTeacher ? "login-visual-teacher" : "login-visual-admin"}`}>
        {isTeacher && (
          <>
            <span className="login-blob login-blob-1" />
            <span className="login-blob login-blob-2" />
            <span className="login-blob login-blob-3" />
          </>
        )}
        <Link to="/" className="back-home">
          <ArrowLeft /> Back to website
        </Link>
        <Brand light />
        <div className={`login-scene ${isTeacher ? "login-scene-minimal" : ""}`}>
          <div className="login-message">
            {isTeacher ? (
              <>
                <span className="teacher-auth-kicker"><Sparkles /> TEACHER WORKSPACE</span>
                <b>Guide every learner with clarity.</b>
                <p>Lessons, classroom progress, and learning insights—organized in one calm workspace.</p>
                <div className="teacher-auth-proof">
                  <span><BookOpenCheck /> Plan with purpose</span>
                  <span><ShieldCheck /> Your classes stay private</span>
                </div>
              </>
            ) : (
              <>
                <span className="login-message-tag-admin">管理者ポータル</span>
                <b>Your JapLearn command center.</b>
                <p>Manage accounts, content, and access across the entire JapLearn platform.</p>
                <div className="login-benefits" aria-label="Portal benefits">
                  <span><ShieldCheck /> Verified access only</span>
                  <span><DatabaseZap /> Full platform control</span>
                </div>
              </>
            )}
          </div>
          {isTeacher ? (
            <img src={mascot} alt="JapLearn mascot" />
          ) : (
            <div className="admin-login-badge" aria-hidden="true">
              <ShieldCheck />
            </div>
          )}
        </div>
        {!isTeacher && (
          <div className="secure-note">
            <ShieldCheck />
            <span>
              <b>Protected workspace</b>
              <small>Only verified {role} accounts can continue.</small>
            </span>
          </div>
        )}
      </section>

      <section className={`login-panel ${isTeacher ? "login-panel-teacher" : ""}`}>
        <form onSubmit={submit}>
          <div className="auth-form-heading">
          {isTeacher ? (
            <span className="portal-pill"><LockKeyhole /> TEACHER SIGN IN</span>
          ) : (
            <span className="portal-pill">
              <LockKeyhole /> {role.toUpperCase()} PORTAL
            </span>
          )}
          <h1>Welcome back</h1>
          <p>{isTeacher ? "Sign in to continue to your teaching workspace." : `Sign in to continue to your ${role} workspace.`}</p>
          </div>

          {error && <div className="form-error">{error}</div>}

          {isTeacher ? (
            <>
              <div className="field-float">
                <span className="field-icon"><Mail /></span>
                <input
                  type="email"
                  id="teacher-email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder=" "
                  required
                  autoComplete="email"
                />
                <label htmlFor="teacher-email">Email address</label>
              </div>

              <div className="field-float">
                <span className="field-icon"><LockKeyhole /></span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="teacher-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder=" "
                  required
                  autoComplete="current-password"
                />
                <label htmlFor="teacher-password">Password</label>
                <button
                  type="button"
                  className="field-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </>
          ) : (
            <>
              <label>
                Email address
                <div className="field">
                  <Mail />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={`${role}@japlearn.com`}
                    required
                    autoComplete="email"
                  />
                </div>
              </label>

              <label>
                Password
                <div className="field">
                  <LockKeyhole />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </label>
            </>
          )}

          <button className="submit" disabled={loading}>
            {loading ? "Signing you in…" : "Sign in"}
            {!loading && <ArrowRight />}
          </button>

          <div className="role-switch">
            {isTeacher ? (
              <>New to JapLearn? <Link to="/teacher/create-account">Create a teacher account</Link></>
            ) : (
              <>Authorized administrators only.</>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
