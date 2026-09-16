import {
  Activity, ArrowRight, BookOpen, CheckCircle2, Clock3, Gamepad2, HelpCircle,
  Languages, MessageCircleMore, MessagesSquare, Puzzle, Radio, Smartphone,
  Sparkles, Users, X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const GUIDE_KEY = "japlearn-teacher-activities-guide-v1";
const GAMES = [
  { title:"Quack-a-Mole", type:"Character recognition", text:"Fast Kana recognition and recall rounds.", icon:Puzzle, tone:"purple" },
  { title:"QuackMan", type:"Vocabulary arcade", text:"Word clues, meaning recall, and vocabulary reinforcement.", icon:Sparkles, tone:"green" },
  { title:"QuackSituate", type:"Situational practice", text:"Expression Match and Politeness Journey scenarios.", icon:MessagesSquare, tone:"pink" },
  { title:"QuackResponse", type:"Response practice", text:"Reply Coach, Response Rush, and Dialogue Relay.", icon:MessageCircleMore, tone:"blue" },
  { title:"QuackTalk", type:"Speaking practice", text:"Guided Phrase Practice and Talk with Sumi.", icon:Radio, tone:"violet" },
] as const;
const EXERCISES = [
  { title:"Hiragana", text:"Three lesson sets with recognition exercises." },
  { title:"Katakana", text:"Three lesson sets with recognition exercises." },
  { title:"Vocabulary", text:"Word collections with lesson and individual practice." },
  { title:"Grammar", text:"Sentence lessons and independent review." },
];

export default function ActivitiesPage() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(GUIDE_KEY)) setGuideOpen(true);
  }, []);
  useEffect(() => {
    if (guideOpen && !dialog.current?.open) dialog.current?.showModal();
    if (!guideOpen && dialog.current?.open) dialog.current.close();
  }, [guideOpen]);
  const closeGuide = () => {
    localStorage.setItem(GUIDE_KEY, "seen");
    setGuideOpen(false);
  };

  return <section className="activities-page activity-hub">
    <div className="activity-hub-intro">
      <div>
        <span className="eyebrow">CLASSROOM ACTIVITIES</span>
        <h2>Practice students can access in JapLearn</h2>
        <p>Review every available game and exercise. Live QuackSlate is the activity teachers can prepare, schedule, and monitor from this portal.</p>
      </div>
      <button className="activity-guide-button" onClick={() => setGuideOpen(true)}><HelpCircle />How Activities works</button>
    </div>

    <Link className="live-slate-card" to="/teacher/quackslate">
      <div className="live-slate-icon"><Gamepad2 /></div>
      <div className="live-slate-copy">
        <span><Radio />TEACHER LIVE ACTIVITY</span>
        <h3>Run a Live QuackSlate round</h3>
        <p>Choose sentence questions, create a class code, set an automatic start and end time, then review every learner’s attempts and scores.</p>
        <div><small><CheckCircle2 />Question bank</small><small><Clock3 />Scheduled play</small><small><Users />Class score sheet</small></div>
      </div>
      <span className="live-slate-action">Open Live QuackSlate <ArrowRight /></span>
    </Link>

    <div className="activity-section-heading">
      <div><span className="activity-section-icon"><Smartphone /></span><div><h3>Student games</h3><p>These games are played by learners in the JapLearn app.</p></div></div>
      <span>{GAMES.length} game families</span>
    </div>
    <div className="activity-game-grid">
      {GAMES.map(game => { const Icon=game.icon; return <article className={"activity-game-card "+game.tone} key={game.title}>
        <span className="activity-game-icon"><Icon /></span>
        <small>{game.type}</small><h3>{game.title}</h3><p>{game.text}</p>
        <span className="activity-availability"><CheckCircle2 />Available to students</span>
      </article>; })}
    </div>

    <div className="activity-section-heading exercises">
      <div><span className="activity-section-icon"><BookOpen /></span><div><h3>Lesson and individual exercises</h3><p>Core exercises available through lessons and independent study.</p></div></div>
      <Link to="/teacher/lessons">View lessons <ArrowRight /></Link>
    </div>
    <div className="activity-exercise-grid">
      {EXERCISES.map((exercise,index) => <article key={exercise.title}>
        <span>{String(index+1).padStart(2,"0")}</span>
        <div><small>LESSON + INDIVIDUAL PRACTICE</small><h3>{exercise.title}</h3><p>{exercise.text}</p></div>
        <Languages />
      </article>)}
    </div>

    <dialog ref={dialog} className="activity-guide-dialog" onCancel={event => { event.preventDefault(); closeGuide(); }}>
      <button className="activity-guide-close" aria-label="Close guide" onClick={closeGuide}><X /></button>
      <span className="activity-guide-icon"><Activity /></span>
      <small>ACTIVITIES GUIDE</small>
      <h2>Everything your class can practise</h2>
      <p>This page shows the games and exercises already available to students. You do not need to edit each game here.</p>
      <div className="activity-guide-steps">
        <article><span>1</span><div><b>Students practise in the app</b><p>Quack-a-Mole, QuackMan, QuackSituate, QuackResponse, and QuackTalk are learner activities.</p></div></article>
        <article><span>2</span><div><b>You can run Live QuackSlate</b><p>Select questions, share the class code, schedule the round, and follow the score sheet.</p></div></article>
        <article><span>3</span><div><b>Results return to the portal</b><p>Use Game scores and Reports to review saved attempts and learner progress.</p></div></article>
      </div>
      <Link className="activity-guide-primary" to="/teacher/quackslate" onClick={closeGuide}>Set up Live QuackSlate <ArrowRight /></Link>
      <button className="activity-guide-secondary" onClick={closeGuide}>Explore activities</button>
    </dialog>
  </section>;
}
