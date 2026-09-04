import {
  ArrowRight,
  Gamepad2,
  MessageSquareText,
  PenTool,
  Smartphone,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";

const families = [
  {
    character: "あ",
    tone: "",
    title: "Quackamole",
    label: "Character recognition",
    text: "Kana recognition mini-game played inside the JapLearn mobile app.",
  },
  {
    character: "文",
    tone: "tone-green",
    title: "QuackSlate",
    label: "Grammar activity editor",
    text: "Live grammar quiz you can build and run with your class from this workspace.",
  },
  {
    character: "語",
    tone: "tone-orange",
    title: "QuackMan",
    label: "Word activity editor",
    text: "Vocabulary arcade game played inside the JapLearn mobile app.",
  },
] as const;

export default function ActivitiesPage() {
  return (
    <section className="activities-page">
      <PageHeader
        eyebrow="ACTIVITY MANAGEMENT"
        title="Interactive learning activities"
        description="Access the activity families already managed by the React Native teacher application."
      />

      <div className="tile-head">
        <div>
          <span className="eyebrow">GAME CONTENT</span>
          <h3><Gamepad2 /> Activity families</h3>
          <p>The three game types your learners play inside JapLearn.</p>
        </div>
      </div>

      <div className="family-grid">
        {families.map((family) => (
          <article key={family.title} className={`family-card ${family.tone}`}>
            <span className="family-glyph">{family.character}</span>
            <small>{family.label}</small>
            <h3>{family.title}</h3>
            <p>{family.text}</p>
            <span className="family-note">
              <Smartphone /> Content managed in the mobile app
            </span>
          </article>
        ))}
      </div>

      <div className="tile-head" style={{ marginTop: 26 }}>
        <div>
          <span className="eyebrow">WORKSPACE TOOLS</span>
          <h3><PenTool /> Run and guide activities</h3>
          <p>The two toolsets you can operate directly from this workspace.</p>
        </div>
      </div>

      <div className="gateway-grid">
        <Link className="gateway-tile" to="/teacher/quackslate">
          <span><PenTool /></span>
          <small>LIVE GRAMMAR ACTIVITY</small>
          <h3>QuackSlate builder</h3>
          <p>
            Pick questions from the shared bank, generate a class code, then
            drive the session question by question in real time.
          </p>
          <div className="gateway-tags">
            <span>QUESTION BANK</span>
            <span>CLASS CODE</span>
            <span>LIVE CONTROL</span>
          </div>
          <span className="gateway-cta">Open QuackSlate <ArrowRight /></span>
        </Link>

        <Link className="gateway-tile alt" to="/teacher/communication">
          <span><MessageSquareText /></span>
          <small>COMMUNICATION PRACTICE</small>
          <h3>Communication suite</h3>
          <p>
            Monitor QuackTalk, QuackSituate, and QuackResponse accuracy, assign
            practice to a class, and generate mastery reports.
          </p>
          <div className="gateway-tags">
            <span>PERFORMANCE</span>
            <span>ASSIGNMENTS</span>
            <span>REPORTS</span>
          </div>
          <span className="gateway-cta">Open communication <ArrowRight /></span>
        </Link>
      </div>
    </section>
  );
}
