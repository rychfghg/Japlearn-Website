import { type FormEvent, useEffect, useState } from "react";
import { ArrowLeft, CircleCheckBig, Clock, Mail, ShieldAlert, Trash2, TriangleAlert } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Brand from "../components/Brand";
import { API_URL } from "../lib/api";

const SUPPORT_EMAIL = "japlearnofficial@gmail.com";

type Stage = "checking" | "ready" | "expired" | "done";

export default function DeleteAccountConfirmPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [stage, setStage] = useState<Stage>("checking");
  const [accountEmail, setAccountEmail] = useState("");
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Confirm the link is still valid, and show whose account it belongs to.
  useEffect(() => {
    if (!token) { setStage("expired"); return; }
    let active = true;
    fetch(`${API_URL}/api/users/account-deletion-request?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) { setStage("expired"); return; }
        const body = await response.json();
        setAccountEmail(String(body?.email || ""));
        setStage("ready");
      })
      .catch(() => { if (active) setStage("expired"); });
    return () => { active = false; };
  }, [token]);

  const confirmed = typed.trim().toUpperCase() === "DELETE";

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !confirmed) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/users/confirm-account-deletion?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });
      if (!response.ok) {
        if (response.status === 429) {
          setError("Too many attempts. Please wait a minute and try again.");
          return;
        }
        setStage("expired");
        return;
      }
      setStage("done");
    } catch {
      setError("We couldn't reach JapLearn. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="legal-page">
      <nav className="legal-nav">
        <Brand />
        <Link to="/" className="legal-back"><ArrowLeft /> Back to JapLearn</Link>
      </nav>

      <section className="dacc-single">
        {stage === "checking" && (
          <div className="legal-section dacc-card dacc-result">
            <header>
              <span className="legal-section-icon"><Clock /></span>
              <div><small>ONE MOMENT</small><h2>Checking your link…</h2></div>
            </header>
            <p className="dacc-lead">One moment while we confirm this deletion link is still valid.</p>
          </div>
        )}

        {stage === "ready" && (
          <form className="legal-section dacc-card" onSubmit={submit} noValidate>
            <header>
              <span className="legal-section-icon"><Trash2 /></span>
              <div><small>FINAL STEP</small><h2>Delete this account permanently?</h2></div>
            </header>
            <p className="dacc-lead">
              You are about to delete <b>{accountEmail}</b> and everything saved with it: lesson progress,
              badges, game scores and speaking feedback. This cannot be undone.
            </p>

            <div className="dacc-typebox">
              <label htmlFor="dacc-confirm">Type <b>DELETE</b> to confirm</label>
              <input
                id="dacc-confirm"
                value={typed}
                onChange={(e) => { setTyped(e.target.value); setError(""); }}
                placeholder="DELETE"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                autoFocus
              />
            </div>

            {error && <p className="dacc-error"><TriangleAlert /> {error}</p>}

            <div className="dacc-actions">
              <Link to="/" className="dacc-cancel">Cancel</Link>
              <button className="dacc-danger" disabled={!confirmed || busy}>
                {busy ? "Deleting…" : "Delete my account"}
              </button>
            </div>
          </form>
        )}

        {stage === "expired" && (
          <div className="legal-section dacc-card dacc-result">
            <header>
              <span className="legal-section-icon"><ShieldAlert /></span>
              <div><small>EXPIRED LINK</small><h2>This link is no longer valid</h2></div>
            </header>
            <p className="dacc-lead">
              Deletion links expire 30 minutes after they are sent, and each one works only once.
              Nothing has been deleted. Start again to get a fresh link.
            </p>
            <Link className="dacc-secondary" to="/delete-account">Request a new link</Link>
            <a className="dacc-quiet-link" href={`mailto:${SUPPORT_EMAIL}?subject=JapLearn%20account%20deletion`}>
              <Mail /> Or email {SUPPORT_EMAIL}
            </a>
          </div>
        )}

        {stage === "done" && (
          <div className="legal-section dacc-card dacc-result">
            <header>
              <span className="legal-section-icon done"><CircleCheckBig /></span>
              <div><small>COMPLETE</small><h2>Your account has been deleted</h2></div>
            </header>
            <p className="dacc-lead">
              {accountEmail ? <>The account <b>{accountEmail}</b> and</> : <>Your account and</>} all of its learning
              records have been permanently removed from JapLearn. You can sign up again any time with the same
              email address.
            </p>
            <Link className="dacc-secondary" to="/">Return to JapLearn</Link>
          </div>
        )}
      </section>

      <footer className="legal-footer">
        <span>© 2026 JapLearn · Japanese made interactive.</span>
        <nav>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/contact">Help &amp; contact</Link>
        </nav>
      </footer>
    </main>
  );
}
