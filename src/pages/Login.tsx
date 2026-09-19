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
  Presentation,
  MailCheck,
  ShieldCheck,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Brand from "../components/Brand";
import mascot from "../assets/idle.png";
import { EMAIL_PATTERN, loginUser, requestPasswordReset, type PortalRole } from "../lib/api";
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
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const openReset = () => {
    setResetEmail(email);
    setResetError("");
    setResetSent(false);
    setResetOpen(true);
  };

  async function submitReset(event: FormEvent) {
    event.preventDefault();
    if (resetSending) return;
    const normalized = resetEmail.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      setResetError("Enter a valid email address, such as name@gmail.com.");
      return;
    }
    setResetSending(true);
    setResetError("");
    try {
      await requestPasswordReset(normalized);
      setResetSent(true);
    } catch (resetFailure) {
      setResetError(resetFailure instanceof Error ? resetFailure.message : "Could not send the reset email.");
    } finally {
      setResetSending(false);
    }
  }

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
                <span className="teacher-auth-kicker"><Presentation /> TEACHER WORKSPACE</span>
                <b>Your classroom, ready.</b>
                <p>Manage lessons, learners, and progress in one place.</p>
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
            <span className="portal-pill"><LockKeyhole /> SECURE TEACHER ACCESS</span>
          ) : (
            <span className="portal-pill">
              <LockKeyhole /> {role.toUpperCase()} PORTAL
            </span>
          )}
          <h1>{isTeacher ? "Teacher sign in" : "Welcome back"}</h1>
          <p>{isTeacher ? "Use your educator account to continue." : `Sign in to continue to your ${role} workspace.`}</p>
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
              <div className="forgot-row">
                <button type="button" className="forgot-link" onClick={openReset}>Forgot password?</button>
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
      {isTeacher && resetOpen && (
        <div className="reset-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setResetOpen(false)}>
          <div className="reset-card" role="dialog" aria-modal="true" aria-labelledby="reset-title">
            <button type="button" className="reset-close" onClick={() => setResetOpen(false)} aria-label="Close">
              <X />
            </button>
            {resetSent ? (
              <>
                <span className="reset-icon done"><MailCheck /></span>
                <h2 id="reset-title">Check your inbox</h2>
                <p>If <b>{resetEmail.trim().toLowerCase()}</b> belongs to a JapLearn account, a reset link is on its way. It expires in a few hours.</p>
                <button type="button" className="submit" onClick={() => setResetOpen(false)}>
                  Back to sign in <ArrowRight />
                </button>
              </>
            ) : (
              <form onSubmit={submitReset} noValidate>
                <span className="reset-icon"><LockKeyhole /></span>
                <h2 id="reset-title">Reset your password</h2>
                <p>Enter the email you use for JapLearn and we'll send you a reset link.</p>
                {resetError && <div className="form-error">{resetError}</div>}
                <div className="field-float">
                  <span className="field-icon"><Mail /></span>
                  <input
                    type="email"
                    id="reset-email"
                    value={resetEmail}
                    onChange={(event) => { setResetEmail(event.target.value); setResetError(""); }}
                    placeholder=" "
                    autoComplete="email"
                    autoFocus
                  />
                  <label htmlFor="reset-email">Email address</label>
                </div>
                <button className="submit" disabled={resetSending}>
                  {resetSending ? "Sending…" : "Send reset link"}
                  {!resetSending && <ArrowRight />}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
