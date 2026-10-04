import { ArrowLeft, BadgeCheck, Gamepad2, Mail, MessageCircleMore, ShieldCheck, Smartphone, Trash2, UserRoundX } from "lucide-react";
import { Link } from "react-router-dom";
import Brand from "../components/Brand";

const SUPPORT_EMAIL = "japlearnofficial@gmail.com";
const MAILTO = `mailto:${SUPPORT_EMAIL}?subject=JapLearn%20account%20deletion%20request&body=Please%20delete%20my%20JapLearn%20account.%0A%0AName%3A%0AAccount%20email%3A%0A`;

const REMOVED = [
  { icon: UserRoundX, label: "Your account", detail: "Sign-in, name and class membership" },
  { icon: BadgeCheck, label: "Lesson progress", detail: "Completed lessons, badges and milestones" },
  { icon: Gamepad2, label: "Game scores", detail: "Every attempt and high score" },
  { icon: MessageCircleMore, label: "Speaking practice", detail: "Transcripts, scores and feedback" },
];

// Account deletion is handled by email (or inside the signed-in app) only.
// There is deliberately no email field here, so this page cannot be used to
// test which addresses have a JapLearn account.
export default function DeleteAccountPage() {
  return (
    <main className="dacc-page">
      <nav className="dacc-top">
        <Brand />
        <Link to="/" className="dacc-back"><ArrowLeft /> Back to JapLearn</Link>
      </nav>

      <div className="dacc-shell dacc-shell-clean">
        <div className="dacc-main">
          <div className="dacc-card">
            <span className="dacc-icon danger"><Trash2 /></span>
            <small className="dacc-kicker">ACCOUNT DELETION</small>
            <h1>Delete your account</h1>
            <p className="dacc-lead">
              To keep every account safe, we only accept deletion requests by email from the account owner,
              or from inside the JapLearn app while you are signed in.
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

            <div className="dacc-steps">
              <div><b>1</b><p>Email <b>{SUPPORT_EMAIL}</b> from the same address you use to sign in to JapLearn.</p></div>
              <div><b>2</b><p>Use the subject <i>JapLearn account deletion request</i> and include your name.</p></div>
              <div><b>3</b><p>We verify the request came from the account owner, delete the account, and reply to confirm.</p></div>
            </div>

            <a className="dacc-submit" href={MAILTO}>
              <Mail /> Email {SUPPORT_EMAIL}
            </a>

            <p className="dacc-note"><ShieldCheck /> Requests sent from a different email address cannot be accepted.</p>
          </div>
        </div>

        <aside className="dacc-clean-help">
          <span><Smartphone /></span>
          <div>
            <b>Signed in to the app?</b>
            <p>You can delete your account yourself in the JapLearn app: Profile → Account &amp; data → Delete account.</p>
          </div>
        </aside>

        <p className="dacc-clean-legal">
          Deletion is permanent. Read our <Link to="/privacy">Privacy Policy</Link> for more information.
        </p>
      </div>
    </main>
  );
}
