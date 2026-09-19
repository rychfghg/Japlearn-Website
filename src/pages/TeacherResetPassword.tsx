import { type FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Circle, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck, TriangleAlert } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Brand from "../components/Brand";
import mascot from "../assets/idle.png";
import { API_URL } from "../lib/api";

// Same rules the student reset page enforces.
const RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One number", test: (v: string) => /[0-9]/.test(v) },
  { label: "One special character", test: (v: string) => /[!@#$%^&*(),.?":{}|<>]/.test(v) },
];

export default function TeacherResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const rules = RULES.map((rule) => ({ label: rule.label, met: rule.test(password) }));
  const mismatch = confirm.length > 0 && confirm !== password;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!token) {
      setError("This reset link is incomplete. Request a new one from the teacher login.");
      return;
    }
    if (rules.some((rule) => !rule.met)) {
      setError("Your new password doesn't meet all the requirements yet.");
      return;
    }
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Same endpoint the student app uses.
      const response = await fetch(`${API_URL}/api/users/reset-password?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      });
      if (!response.ok) {
        setError(response.status === 429
          ? "Too many attempts. Please wait a minute and try again."
          : "This reset link is invalid, expired, or already used. Request a new one from the teacher login.");
        return;
      }
      setDone(true);
    } catch {
      setError("We couldn't reach JapLearn. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="login-page login-page-teacher">
      <section className="login-visual login-visual-teacher">
        <span className="login-blob login-blob-1" />
        <span className="login-blob login-blob-2" />
        <span className="login-blob login-blob-3" />
        <Link to="/teacher/login" className="back-home">
          <ArrowLeft /> Back to sign in
        </Link>
        <Brand light />
        <div className="login-scene login-scene-minimal">
          <div className="login-message">
            <b className="login-message-minimal">A fresh start.</b>
          </div>
          <img src={mascot} alt="JapLearn mascot" />
        </div>
      </section>

      <section className="login-panel login-panel-teacher">
        {done ? (
          <div className="treset-done">
            <span className="reset-icon done"><ShieldCheck /></span>
            <h1>Password updated</h1>
            <p>Your teacher account is secured with the new password. Sign in to continue.</p>
            <button type="button" className="submit" onClick={() => navigate("/teacher/login", { replace: true })}>
              Go to teacher sign in <ArrowRight />
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className="auth-form-heading">
              <span className="portal-pill"><KeyRound /> TEACHER ACCOUNT</span>
              <h1>Set a new password</h1>
              <p>Choose a strong password for your teacher account.</p>
            </div>

            {!token && (
              <div className="form-error"><TriangleAlert /> This reset link is incomplete. Request a new one from the teacher login.</div>
            )}
            {error && token && <div className="form-error">{error}</div>}

            <div className="field-float">
              <span className="field-icon"><LockKeyhole /></span>
              <input
                type={show ? "text" : "password"}
                id="reset-new"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder=" "
                autoComplete="new-password"
                autoFocus
              />
              <label htmlFor="reset-new">New password</label>
              <button type="button" className="field-toggle" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>
                {show ? <EyeOff /> : <Eye />}
              </button>
            </div>

            <ul className="treset-rules">
              {rules.map((rule) => (
                <li key={rule.label} className={rule.met ? "met" : ""}>
                  {rule.met ? <Check /> : <Circle />} {rule.label}
                </li>
              ))}
            </ul>

            <div className="field-float">
              <span className="field-icon"><ShieldCheck /></span>
              <input
                type={show ? "text" : "password"}
                id="reset-confirm"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                placeholder=" "
                autoComplete="new-password"
                className={mismatch ? "treset-mismatch" : ""}
              />
              <label htmlFor="reset-confirm">Confirm new password</label>
            </div>
            {mismatch && <p className="treset-hint">Passwords do not match.</p>}

            <button className="submit" disabled={saving || !token}>
              {saving ? "Updating…" : "Update password"}
              {!saving && <ArrowRight />}
            </button>

            <div className="role-switch">
              <Link to="/teacher/login">Back to teacher sign in</Link>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
