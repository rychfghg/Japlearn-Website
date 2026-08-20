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
      <section className="login-visual signup-visual">
        <Link to="/" className="back-home">
          <ArrowLeft /> Back to website
        </Link>
        <Brand light />
        <div className="login-scene signup-scene">
          <div className="moon" />
          <div className="login-fuji" />
          <div className="login-message">
            <span>JAPLEARN EDUCATOR COMMUNITY</span>
            <b>Build a classroom where practice feels rewarding.</b>
            <p>
              Create your teacher profile, organize learners, and guide every
              Japanese learning milestone from one connected workspace.
            </p>
          </div>
          <img src={mascot} alt="Ahiru welcoming a JapLearn teacher" />
        </div>
        <div className="secure-note">
          <BadgeCheck />
          <span>
            <b>Teacher account</b>
            <small>Your account is automatically assigned the teacher role.</small>
          </span>
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
            <span className="portal-pill">
              <GraduationCap /> TEACHER REGISTRATION
            </span>
            <h1>Create your teacher account</h1>
            <p>Enter your basic information to begin using the teacher portal.</p>

            {error && <div className="form-error">{error}</div>}

            <div className="signup-name-grid">
              <label>
                First name
                <div className="field">
                  <UserRound />
                  <input value={form.fname} onChange={(event) => update("fname", event.target.value)} placeholder="First name" required autoComplete="given-name" />
                </div>
              </label>
              <label>
                Last name
                <div className="field">
                  <UserRound />
                  <input value={form.lname} onChange={(event) => update("lname", event.target.value)} placeholder="Last name" required autoComplete="family-name" />
                </div>
              </label>
            </div>

            <label>
              Email address
              <div className="field">
                <Mail />
                <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="teacher@example.com" required autoComplete="email" />
              </div>
            </label>

            <label>
              Password
              <div className="field">
                <LockKeyhole />
                <input type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => update("password", event.target.value)} placeholder="At least 8 characters" required autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </label>

            <label>
              Confirm password
              <div className="field">
                <LockKeyhole />
                <input type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} placeholder="Enter the password again" required autoComplete="new-password" />
              </div>
            </label>

            <button className="submit" disabled={loading}>
              {loading ? "Creating account…" : "Create teacher account"}
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
