import { type FormEvent, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  DatabaseZap,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
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
    <main className="login-page">
      <section className={`login-visual ${isTeacher ? "" : "login-visual-admin"}`}>
        <Link to="/" className="back-home">
          <ArrowLeft /> Back to website
        </Link>
        <Brand light />
        <div className={`login-scene ${isTeacher ? "login-scene-minimal" : ""}`}>
          <div className="login-message">
            {isTeacher ? (
              <b className="login-message-minimal">Welcome back, sensei.</b>
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

      <section className="login-panel">
        <form onSubmit={submit}>
          <div className={`auth-form-heading ${isTeacher ? "auth-form-heading-minimal" : ""}`}>
          {!isTeacher && (
            <span className="portal-pill">
              <LockKeyhole /> {role.toUpperCase()} PORTAL
            </span>
          )}
          <h1>{isTeacher ? "Sign in" : "Welcome back"}</h1>
          {!isTeacher && <p>Sign in to continue to your {role} workspace.</p>}
          </div>

          {error && <div className="form-error">{error}</div>}

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

          <button className="submit" disabled={loading}>
            {loading ? "Signing you in…" : "Sign in"}
            {!loading && <ArrowRight />}
          </button>

          <div className="role-switch">
            {isTeacher ? (
              <Link to="/teacher/create-account">Create an account</Link>
            ) : (
              <>Authorized administrators only.</>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
