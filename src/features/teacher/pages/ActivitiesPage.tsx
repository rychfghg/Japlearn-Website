import { ArrowRight, MessageSquareText } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";

const games = [
  ["あ", "Quackamole", "Character recognition content", "Kana activity editor"],
  [
    "文",
    "QuackSlate",
    "Grammar quiz content and levels",
    "Grammar activity editor",
  ],
  ["語", "QuackMan", "Vocabulary words and hints", "Word activity editor"],
];

export default function ActivitiesPage() {
  return (
    <section className="full-panel">
      <PageHeader
        eyebrow="ACTIVITY MANAGEMENT"
        title="Interactive learning activities"
        description="Access the activity families already managed by the React Native teacher application."
      />
      <div className="activity-web-grid">
        {games.map(([character, title, text, label]) => (
          <article key={title}>
            <span>{character}</span>
            <small>{label}</small>
            <h3>{title}</h3>
            <p>{text}</p>
            <b>
              Select a class to edit <ArrowRight />
            </b>
          </article>
        ))}
      </div>
      <Link className="communication-strip" to="/teacher/communication">
        <MessageSquareText />
        <div>
          <small>COMMUNICATION PRACTICE</small>
          <h3>Manage QuackTalk, QuackSituate, and QuackResponse</h3>
        </div>
        <ArrowRight />
      </Link>
    </section>
  );
}
