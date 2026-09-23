import { type FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Clock,
  Gamepad2,
  Mail,
  MailCheck,
  MessageCircleMore,
  ShieldAlert,
  Trash2,
  TriangleAlert,
  UserRoundX,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Brand from "../components/Brand";
import { API_URL, EMAIL_PATTERN } from "../lib/api";

const SUPPORT_EMAIL = "japlearnofficial@gmail.com";

const REMOVED = [
  { icon: UserRoundX, label: "Your account", detail: "Sign-in, name and class membership" },
  { icon: BadgeCheck, label: "Lesson progress", detail: "Completed lessons, badges and milestones" },
  { icon: Gamepad2, label: "Game scores", detail: "Every attempt and high score" },
  { icon: MessageCircleMore, label: "Speaking practice", detail: "Transcripts, scores and feedback" },
];

type Stage = "form" | "sent" | "review";

export default function DeleteAccountPage() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // The app links here with the signed-in address already filled in.
  useEffect(() => {
    const prefill = params.get("email");
    if (prefill) setEmail(prefill);
  }, [params]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Enter the email address you use to sign in to JapLearn.");
      return;
    }
    if (!acknowledged) {
      setError("Please confirm you understand this permanently deletes your data.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/users/request-account-deletion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!response.ok) {
        if (response.status === 429) {
          setError("Too many requests. Please wait a minute and try again.");
        } else if (response.status === 401 || response.status === 403) {
          // The server rejected the request itself, rather than the account.
          setError(`Account deletion is temporarily unavailable on our server. Please email ${SUPPORT_EMAIL} and we will delete your account for you.`);
        } else {
          setError(`We could not start the deletion right now. Please try again, or email ${SUPPORT_EMAIL} for help.`);
        }
        return;
      }
      const body = await response.json().catch(() => ({ status: "sent" }));
      setStage(body?.status === "review" ? "review" : "sent");
    } catch {
      setError("We couldn't reach JapLearn. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="dacc-page">
      <nav className="dacc-top">
        <Brand />
        <Link to="/" className="dacc-back"><ArrowLeft /> Back to JapLearn</Link>
      </nav>

      <div className="dacc-shell dacc-shell-clean">
        <div className="dacc-main">
          {stage === "form" && (
            <form className="dacc-card" onSubmit={submit} noValidate>
              <span className="dacc-icon danger"><Trash2 /></span>
              <small className="dacc-kicker">ACCOUNT DELETION</small>
              <h1>Delete your account</h1>
              <p className="dacc-lead">
                Enter the email you use for JapLearn. We will send a secure confirmation link before anything is deleted.
              </p>

              <div className="dacc-removed">
                <small>WHAT GETS DELETED</small>
                <ul>
                  {REMOVED.map(({ icon: Icon, label, detail }) => (
                    <li key={label}>
                      <span><Icon /></span>
                      <div><b>{label}</b><small>{detail}</small></div>
                    </li>
                  ))}
                </ul>
              </div>

              <label className="dacc-field" htmlFor="dacc-email">
                <span><Mail /></span>
                <input
                  id="dacc-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="The email you sign in with"
                  autoComplete="email"
                />
              </label>

              <button
                type="button"
                className={`dacc-check ${acknowledged ? "on" : ""}`}
                role="checkbox"
                aria-checked={acknowledged}
                onClick={() => { setAcknowledged((value) => !value); setError(""); }}
              >
                <i>{acknowledged && <BadgeCheck />}</i>
                <span>I understand this permanently deletes my account and all of my learning data, and cannot be undone.</span>
              </button>

              {error && <p className="dacc-error"><TriangleAlert /> {error}</p>}

              <button className="dacc-submit" disabled={busy}>
                {busy ? "Sending confirmation…" : "Email me a confirmation link"}
                {!busy && <ArrowRight />}
              </button>

              <p className="dacc-note"><Clock /> The confirmation link expires 30 minutes after it is sent.</p>
            </form>
          )}

          {stage === "sent" && (
            <div className="dacc-card dacc-result">
              <span className="dacc-icon sent"><MailCheck /></span>
              <small className="dacc-kicker">NEXT STEP</small>
              <h1>Check your email</h1>
              <p className="dacc-lead">
                If an account exists for <b>{email.trim().toLowerCase()}</b>, we have sent a confirmation link.
                Open it and type <b>DELETE</b> to finish. Nothing has been deleted yet.
              </p>
              <div className="dacc-steps">
                <div><b>1</b><p>Open the email from JapLearn.</p></div>
                <div><b>2</b><p>Select <i>Confirm deletion</i> within 30 minutes.</p></div>
                <div><b>3</b><p>Type DELETE to permanently remove the account.</p></div>
              </div>
              <button type="button" className="dacc-secondary" onClick={() => { setStage("form"); setAcknowledged(false); }}>
                Use a different email address
              </button>
            </div>
          )}

          {stage === "review" && (
            <div className="dacc-card dacc-result">
              <span className="dacc-icon review"><ShieldAlert /></span>
              <small className="dacc-kicker">TEACHER ACCOUNT</small>
              <h1>This account needs a quick review</h1>
              <p className="dacc-lead">
                Teacher accounts are connected to classes, lessons and learner records, so a person checks
                them before deletion. The JapLearn team has been notified and will contact you by email.
              </p>
              <a className="dacc-secondary" href={`mailto:${SUPPORT_EMAIL}?subject=JapLearn%20account%20deletion`}>
                <Mail /> Email {SUPPORT_EMAIL}
              </a>
            </div>
          )}
        </div>

        <aside className="dacc-clean-help">
          <span><Mail /></span>
          <div>
            <b>Cannot access your account email?</b>
            <p>Contact our team and include your name, class code, and account email so we can verify your request.</p>
          </div>
          <a href={`mailto:${SUPPORT_EMAIL}?subject=JapLearn%20account%20deletion%20request&body=Name%3A%0AClass%20code%3A%0AAccount%20email%3A%0AReason%20I%20cannot%20access%20this%20email%3A`}>
            Contact support
          </a>
        </aside>

        <p className="dacc-clean-legal">
          Deletion is permanent. Read our <Link to="/privacy">Privacy Policy</Link> for more information.
        </p>
      </div>
    </main>
  );
}
