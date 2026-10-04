import { ArrowLeft, Mail, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import Brand from "../components/Brand";

const SUPPORT_EMAIL = "japlearnofficial@gmail.com";

// Emailed deletion links are no longer used; old links land here.
export default function DeleteAccountConfirmPage() {
  return (
    <main className="dacc-page">
      <nav className="dacc-top">
        <Brand />
        <Link to="/" className="dacc-back"><ArrowLeft /> Back to JapLearn</Link>
      </nav>

      <section className="dacc-shell dacc-shell-single">
        <div className="dacc-card dacc-result">
          <span className="dacc-icon review"><ShieldAlert /></span>
          <small className="dacc-kicker">LINK NO LONGER USED</small>
          <h1>Deletion links have been retired</h1>
          <p className="dacc-lead">
            Nothing has been deleted. Account deletion is now handled by email from the account owner, or inside
            the JapLearn app while signed in.
          </p>
          <Link className="dacc-secondary" to="/delete-account">How to delete your account</Link>
          <a className="dacc-quiet-link" href={`mailto:${SUPPORT_EMAIL}?subject=JapLearn%20account%20deletion%20request`}>
            <Mail /> Email {SUPPORT_EMAIL}
          </a>
        </div>
      </section>
    </main>
  );
}
