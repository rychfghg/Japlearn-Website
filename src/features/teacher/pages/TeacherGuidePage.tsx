import {
  Activity, ArrowRight, BarChart3, BookOpen, CheckCircle2, CircleHelp,
  FileSpreadsheet, GraduationCap, LayoutDashboard, LifeBuoy, Radio,
  Settings, ShieldCheck, Sparkles, UserCircle, Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const guides = [
  { id:"overview", title:"Overview", text:"See the health of your teaching workspace at a glance.", steps:["Choose Overview from the left navigation.","Review classroom, learner, lesson, and activity totals.","Use Quick Start to open a classroom, build QuackSlate, or generate reports."], icon:LayoutDashboard, to:"/teacher" },
  { id:"classes", title:"Classes", text:"Create sections and connect students using a generated code.", steps:["Open My classes and select New class.","Enter only the classroom title or section name.","Copy the generated NIHONGGO class code and share it with learners.","Open the classroom to manage students and learning."], icon:GraduationCap, to:"/teacher/classes" },
  { id:"students", title:"Students", text:"Find and manage learners connected to your classrooms.", steps:["Open Students from the left navigation.","Search by learner name or email.","Use the classroom filter to narrow the roster.","Open a learner record to review access and progress."], icon:Users, to:"/teacher/students" },
  { id:"lessons", title:"Lessons", text:"Publish teacher lessons and optional quizzes to selected sections.", steps:["Open Lessons and select Create lesson.","Add the lesson title and upload the PDF.","Choose one or more classroom sections.","Optionally add quiz questions, then review and publish."], icon:BookOpen, to:"/teacher/lessons" },
  { id:"activities", title:"Activities", text:"Review the games and exercises available to learners.", steps:["Open Activities to browse the full learning catalog.","Select a game card to understand its learning purpose.","Use Live QuackSlate when you want to run a teacher-led activity."], icon:Activity, to:"/teacher/activities" },
  { id:"quackslate", title:"Live QuackSlate", text:"Build and schedule a live classroom quiz.", steps:["Open Live QuackSlate and create a session.","Select questions from the bank or add your own.","Set the automatic start and end time.","Share the session code, then review or export the score sheet."], icon:Radio, to:"/teacher/quackslate" },
  { id:"scores", title:"Game scores", text:"Inspect saved performance from every supported game.", steps:["Open Game scores under Insights.","Choose everyone, one section, or a single learner.","Select Game results for summaries or Every attempt for history.","Filter by game to view its activities and speaking feedback."], icon:BarChart3, to:"/teacher/game-performance" },
  { id:"reports", title:"Progress reports", text:"Build a focused learner report or classroom masterlist.", steps:["Open Reports under Insights.","Choose everyone, one section, or a single learner.","Select the activity groups to include.","Generate the report, review it, and export the CSV when needed."], icon:FileSpreadsheet, to:"/teacher/reports" },
  { id:"profile", title:"Profile", text:"Review the educator identity attached to this account.", steps:["Open Profile under Account.","Review your teacher name, email, class count, and sections.","Contact the JapLearn admin when your name or email must change."], icon:UserCircle, to:"/teacher/profile" },
  { id:"settings", title:"Settings", text:"Personalize how the teacher workspace appears and behaves.", steps:["Open Settings under Account.","Set density, text size, motion, guidance, and the pinned page header.","Choose the page you land on after signing in.","Changes apply to every teacher screen and are remembered on this device."], icon:Settings, to:"/teacher/settings" },
] as const;

export default function TeacherGuidePage() {
  const [activeId, setActiveId] = useState<string>(guides[0].id);

  // Highlight the topic currently being read and show how far through the manual it is.
  useEffect(() => {
    const sections = guides
      .map((guide) => document.getElementById(guide.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const activeIndex = Math.max(0, guides.findIndex((guide) => guide.id === activeId));
  const progress = Math.round(((activeIndex + 1) / guides.length) * 100);

  return <section className="teacher-guide-page">
    <div className="teacher-guide-shell">
      <aside className="teacher-guide-contents">
        <div>
          <span><CircleHelp /></span>
          <small>HELP CENTER</small>
          <h2>Teacher guide</h2>
          <p>Select a topic to jump directly to its tutorial.</p>
        </div>

        <div className="teacher-guide-progress">
          <div className="teacher-guide-progress-track"><span style={{ width: `${progress}%` }} /></div>
          <small>TOPIC {activeIndex + 1} OF {guides.length}</small>
        </div>

        <nav aria-label="Guide topics">{guides.map((guide, index) => { const Icon=guide.icon; return (
          <a
            key={guide.id}
            href={`#${guide.id}`}
            className={guide.id === activeId ? "is-active" : ""}
            aria-current={guide.id === activeId ? "true" : undefined}
          >
            <Icon />
            <span><small>{String(index+1).padStart(2,"0")}</small>{guide.title}</span>
            <ArrowRight />
          </a>
        ); })}</nav>

        <Link className="teacher-guide-class-link" to="/teacher/classes">Open my classes <ArrowRight /></Link>
      </aside>

      <main className="teacher-guide-manual">
        <header><small>STEP-BY-STEP PORTAL MANUAL</small><h1>How can we help?</h1><p>Follow each workflow in order. Every tutorial includes the exact page to open and the action to take next.</p></header>
        <div className="teacher-guide-trust"><span><ShieldCheck />Account-specific records</span><span><CheckCircle2 />Saved learner progress</span><span><Sparkles />Guided portal tools</span></div>
        {guides.map((guide, index) => { const Icon=guide.icon; return <section id={guide.id} className="teacher-guide-topic" key={guide.id}>
          <div className="teacher-guide-topic-heading"><span><Icon /></span><div><small>TUTORIAL {String(index+1).padStart(2,"0")}</small><h2>{guide.title}</h2><p>{guide.text}</p></div></div>
          <ol>{guide.steps.map((step, stepIndex) => <li key={step}><span>{stepIndex + 1}</span><div><small>STEP {stepIndex + 1}</small><p>{step}</p></div></li>)}</ol>
          <Link to={guide.to}>Open {guide.title}<ArrowRight /></Link>
        </section>; })}
        <footer><LifeBuoy /><div><small>BEFORE YOU PUBLISH</small><h3>Use the safe teaching workflow.</h3><p>Confirm the correct class or section, preview schedules before sharing a code, and review Reports after learners finish.</p></div></footer>
      </main>
    </div>
  </section>;
}
