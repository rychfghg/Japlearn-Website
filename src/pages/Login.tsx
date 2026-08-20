import { type FormEvent, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
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
      <section className="login-visual">
        <Link to="/" className="back-home">
          <ArrowLeft /> Back to website
        </Link>
        <Brand light />
        <div className="login-scene">
          <div className="moon" />
          <div className="login-fuji" />
          <div className="login-message">
            <span>{isTeacher ? "先生、おかえりなさい" : "管理者ポータル"}</span>
            <b>
              {isTeacher ? "Welcome back, teacher." : "Secure admin access."}
            </b>
            <p>
              {isTeacher
                ? "Your classes, lessons, and learners are ready."
                : "Manage JapLearn through the authorized administration portal."}
            </p>
          </div>
          <img src={mascot} alt="JapLearn mascot" />
        </div>
        <div className="secure-note">
          <ShieldCheck />
          <span>
            <b>Protected workspace</b>
            <small>Only verified {role} accounts can continue.</small>
          </span>
        </div>
      </section>

      <section className="login-panel">
        <form onSubmit={submit}>
          <span className="portal-pill">
            <LockKeyhole /> {role.toUpperCase()} PORTAL
          </span>
          <h1>Sign in to JapLearn</h1>
          <p>Use your existing {role} account credentials.</p>

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
            {loading ? "Signing in…" : `Continue as ${role}`}
            {!loading && <ArrowRight />}
          </button>

          <div className="role-switch">
            {isTeacher ? (
              <>
                Are you an administrator?{" "}
                <Link to="/admin/login">Admin login</Link>
              </>
            ) : (
              <>
                Are you a teacher?{" "}
                <Link to="/teacher/login">Teacher login</Link>
              </>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
