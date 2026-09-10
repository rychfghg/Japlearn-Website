import { type FormEvent, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import mascot from "../assets/hello.png";
import Brand from "../components/Brand";
import { registerTeacher } from "../lib/api";

export default function TeacherSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fname: "",
    lname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    if (form.password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await registerTeacher({
        fname: form.fname,
        lname: form.lname,
        email: form.email,
        password: form.password,
      });
      setCreated(true);
    } catch (registrationError) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : "Teacher account creation failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page teacher-signup-page">
      <section className="login-visual signup-visual login-visual-teacher">
        <span className="login-blob login-blob-1" />
        <span className="login-blob login-blob-2" />
        <span className="login-blob login-blob-3" />
        <Link to="/" className="back-home">
          <ArrowLeft /> Back to website
        </Link>
        <Brand light />
        <div className="login-scene signup-scene login-scene-minimal">
          <div className="login-message">
            <span className="teacher-auth-kicker"><Sparkles /> JOIN JAPLEARN</span>
            <b>Build a classroom learners enjoy returning to.</b>
            <p>Create your educator workspace, invite students, and turn progress into clear next steps.</p>
            <div className="teacher-auth-proof">
              <span><GraduationCap /> Classroom-ready tools</span>
              <span><BadgeCheck /> Simple guided setup</span>
            </div>
          </div>
          <img src={mascot} alt="Ahiru welcoming a JapLearn teacher" />
        </div>
      </section>

      <section className="login-panel signup-panel">
        {created ? (
          <div className="signup-success">
            <span><BadgeCheck /></span>
            <small>ACCOUNT CREATED</small>
            <h1>Check your email</h1>
            <p>
              We sent a confirmation link to <b>{form.email}</b>. Confirm your
              email, then return to the teacher login.
            </p>
            <button className="submit" onClick={() => navigate("/teacher/login")}>
              Continue to teacher login <ArrowRight />
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="auth-form-heading">
            <span className="portal-pill">
              <GraduationCap /> TEACHER ACCOUNT
            </span>
            <h1>Create your workspace</h1>
            <p>Tell us who you are. We’ll send one email to verify your account.</p>
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="signup-name-grid">
              <div className="field-float">
                <span className="field-icon"><UserRound /></span>
                <input id="signup-fname" value={form.fname} onChange={(event) => update("fname", event.target.value)} placeholder=" " required autoComplete="given-name" />
                <label htmlFor="signup-fname">First name</label>
              </div>
              <div className="field-float">
                <span className="field-icon"><UserRound /></span>
                <input id="signup-lname" value={form.lname} onChange={(event) => update("lname", event.target.value)} placeholder=" " required autoComplete="family-name" />
                <label htmlFor="signup-lname">Last name</label>
              </div>
            </div>

            <div className="field-float">
              <span className="field-icon"><Mail /></span>
              <input type="email" id="signup-email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder=" " required autoComplete="email" />
              <label htmlFor="signup-email">Email address</label>
            </div>

            <div className="field-float">
              <span className="field-icon"><LockKeyhole /></span>
              <input type={showPassword ? "text" : "password"} id="signup-password" value={form.password} onChange={(event) => update("password", event.target.value)} placeholder=" " required autoComplete="new-password" />
              <label htmlFor="signup-password">Password (min. 8 characters)</label>
              <button type="button" className="field-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            <div className="field-float">
              <span className="field-icon"><LockKeyhole /></span>
              <input type={showPassword ? "text" : "password"} id="signup-confirm" value={form.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} placeholder=" " required autoComplete="new-password" />
              <label htmlFor="signup-confirm">Confirm password</label>
            </div>

            <button className="submit" disabled={loading}>
              {loading ? "Creating your workspace…" : "Create my workspace"}
              {!loading && <ArrowRight />}
            </button>

            <div className="role-switch">
              Already registered? <Link to="/teacher/login">Sign in as teacher</Link>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
