import {
  Activity, ArrowRight, BarChart3, BookOpen, CheckCircle2, CircleHelp,
  FileSpreadsheet, GraduationCap, LayoutDashboard, LifeBuoy, Radio,
  Settings, ShieldCheck, Sparkles, UserCircle, Users,
} from "lucide-react";
import { Link } from "react-router-dom";

const guides = [
  { id:"overview", title:"Overview", text:"Use the dashboard for a quick view of classes, learners, lessons, and recent teaching activity.", icon:LayoutDashboard, to:"/teacher" },
  { id:"classes", title:"Classes", text:"Create or open a classroom, copy its class code, enrol learners, and review class mastery.", icon:GraduationCap, to:"/teacher/classes" },
  { id:"students", title:"Students", text:"Search your own learners, review their class membership, and control access to supported learning features.", icon:Users, to:"/teacher/students" },
  { id:"lessons", title:"Lessons", text:"Publish a PDF lesson to one or more sections, add an optional quiz, and monitor learner completion.", icon:BookOpen, to:"/teacher/lessons" },
  { id:"activities", title:"Activities", text:"See the games and exercises available in the student app. Live QuackSlate is managed from the portal.", icon:Activity, to:"/teacher/activities" },
  { id:"quackslate", title:"Live QuackSlate", text:"Create a code, select or write questions, schedule the play window, share the code, and review every attempt.", icon:Radio, to:"/teacher/quackslate" },
  { id:"scores", title:"Game scores", text:"Choose a game and learner to inspect latest, average, highest, and individual attempt results.", icon:BarChart3, to:"/teacher/game-performance" },
  { id:"reports", title:"Progress reports", text:"Open a class or single-learner report for mastery, completion, strengths, focus areas, and summaries.", icon:FileSpreadsheet, to:"/teacher/reports" },
  { id:"profile", title:"Profile", text:"Review the educator identity connected to the current signed-in teacher account.", icon:UserCircle, to:"/teacher/profile" },
  { id:"settings", title:"Settings", text:"Adjust the portal appearance, motion, density, and notification preferences stored for this device.", icon:Settings, to:"/teacher/settings" },
] as const;

export default function TeacherGuidePage() {
  return <section className="teacher-guide-page">
    <div className="teacher-guide-intro">
      <span className="teacher-guide-hero-icon"><CircleHelp /></span>
      <div><small>JAPLEARN TEACHER HANDBOOK</small><h2>Everything you need, in one place.</h2><p>Use this guide whenever you need a quick reminder about a page, classroom workflow, or teaching tool.</p></div>
      <Link to="/teacher/classes">Open my classes <ArrowRight /></Link>
    </div>

    <nav className="teacher-guide-jump" aria-label="Guide sections">
      {guides.map((guide) => <a key={guide.id} href={`#${guide.id}`}>{guide.title}</a>)}
    </nav>

    <div className="teacher-guide-grid">
      {guides.map((guide, index) => { const Icon=guide.icon; return <article id={guide.id} key={guide.id}>
        <div className="teacher-guide-card-top"><span><Icon /></span><small>{String(index+1).padStart(2,"0")}</small></div>
        <h3>{guide.title}</h3><p>{guide.text}</p>
        {guide.id === "quackslate" && <ol><li>Create a session code.</li><li>Select questions and save.</li><li>Schedule its start and end.</li><li>Share the code with learners.</li><li>Review or export the score sheet.</li></ol>}
        <Link to={guide.to}>Open {guide.title}<ArrowRight /></Link>
      </article>; })}
    </div>

    <div className="teacher-guide-support">
      <span><LifeBuoy /></span><div><small>NEED A QUICK CHECK?</small><h3>Safe teaching workflow</h3><p>Confirm the correct class or section before publishing. Preview dates and times before sharing a code, and use Reports after students finish.</p></div>
      <div><span><ShieldCheck /> Account-specific records</span><span><CheckCircle2 /> Saved learner progress</span><span><Sparkles /> Guided portal tools</span></div>
    </div>
  </section>;
}
