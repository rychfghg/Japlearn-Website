import {
  ArrowRight,
  BarChart3,
  ClipboardPlus,
  FileBarChart,
  MessageSquareText,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";

const tools = [
  {
    to: "/teacher/communication/performance",
    icon: BarChart3,
    title: "Monitor student performance",
    text: "Review QuackTalk, QuackSituate, and QuackResponse accuracy and recommendations.",
    color: "purple",
  },
  {
    to: "/teacher/communication/assign",
    icon: ClipboardPlus,
    title: "Assign communication activities",
    text: "Choose communication activities and assign them to a class or individual learners.",
    color: "green",
  },
  {
    to: "/teacher/reports",
    icon: FileBarChart,
    title: "Generate progress reports",
    text: "Generate, review, and export student communication mastery reports.",
    color: "orange",
  },
];

export default function CommunicationPage() {
  return (
    <section className="full-panel">
      <PageHeader
        eyebrow="COMMUNICATION MANAGEMENT"
        title="Speaking and situational learning"
        description="Manage the same communication workflows available in the React Native teacher application."
      />
      <div className="communication-hero">
        <MessageSquareText />
        <div>
          <small>CONNECTED COMMUNICATION MODULES</small>
          <h3>Guide every learner from response to confident conversation.</h3>
        </div>
      </div>
      <div className="communication-grid">
        {tools.map(({ to, icon: Icon, title, text, color }) => (
          <Link key={to} to={to} className={`communication-card ${color}`}>
            <span>
              <Icon />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
            <b>
              Open tool <ArrowRight />
            </b>
          </Link>
        ))}
      </div>
    </section>
  );
}
