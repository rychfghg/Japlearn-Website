import { BarChart3, ChevronDown, Clock3, MessageCircleMore, RotateCw, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import StatusMessage from "../components/StatusMessage";
import { teacherApi } from "../services/teacherApi";
import type { GameAttempt, GameScoreSummary, Student, TeacherGamePerformance } from "../types";

const scoreText = (value: number | null) => value == null ? "—" : `${value}%`;
const when = (value: string | null) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};
const metric = (label: string, value: number | null) => (
  <span className="game-performance-metric" key={label}><small>{label}</small><strong>{scoreText(value)}</strong></span>
);

function SummaryCard({ title, summary, selected, onClick, children }: {
  title: string; summary: GameScoreSummary; selected: boolean;
  onClick: () => void; children?: React.ReactNode;
}) {
  return <article className={`game-performance-card ${selected ? "selected" : ""}`}>
    <button type="button" className="game-performance-card-head" onClick={onClick} aria-pressed={selected}>
      <span className="game-performance-card-icon"><BarChart3 size={19} /></span>
      <span className="game-performance-card-title"><b>{title}</b><small>{summary.attempts} attempts · {summary.scoredAttempts} scored</small></span>
      <ChevronDown size={18} className={selected ? "rotated" : ""} />
    </button>
    <div className="game-performance-metrics">
      {metric("Latest", summary.latest)}{metric("Average", summary.average)}{metric("Highest", summary.highest)}
    </div>
    {selected && children}
  </article>;
}

function SpeakingFeedback({ attempt }: { attempt: GameAttempt }) {
  const scores = [
    ["Pronunciation", attempt.pronunciationScore], ["Accuracy", attempt.accuracyScore],
    ["Fluency", attempt.fluencyScore], ["Completeness", attempt.completenessScore],
    ["Conversation", attempt.contextualAccuracy],
  ] as const;
  const hasDetails = Boolean(attempt.feedbackSummary || attempt.areasForImprovement?.length
    || attempt.expressionsPracticed?.length || scores.some(([, value]) => value != null));
  if (!hasDetails) return <span className="game-performance-no-feedback">No detailed feedback was saved for this session.</span>;
  return <details className="game-performance-feedback">
    <summary><MessageCircleMore size={16} /> View speaking feedback</summary>
    <div className="game-performance-feedback-body">
      {attempt.feedbackSummary && <p>{attempt.feedbackSummary}</p>}
      <div className="game-performance-feedback-scores">
        {scores.filter(([, value]) => value != null).map(([label, value]) => metric(label, value))}
      </div>
      {attempt.conversationTurns != null && <small>{attempt.conversationTurns} learner responses</small>}
      {attempt.areasForImprovement?.length > 0 && <p><b>Practice next:</b> {attempt.areasForImprovement.join(" · ")}</p>}
      {attempt.expressionsPracticed?.length > 0 && <p><b>Expressions practiced:</b> {attempt.expressionsPracticed.join(" · ")}</p>}
    </div>
  </details>;
}

export default function GamePerformancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [studentError, setStudentError] = useState("");
  const [performance, setPerformance] = useState<TeacherGamePerformance | null>(null);
  const [performanceError, setPerformanceError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);
  const [selectedGame, setSelectedGame] = useState("All games");
  const [selectedActivity, setSelectedActivity] = useState("All activities");

  useEffect(() => {
    let active = true;
    teacherApi.getAllStudents().then(data => {
      if (!active) return;
      setStudents(data);
      setSelectedEmail(current => current || data[0]?.email || "");
    }).catch(() => { if (active) setStudentError("Your class roster could not be loaded. Please refresh or sign in again."); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedEmail) { setPerformance(null); return; }
    let active = true;
    setLoading(true); setPerformance(null); setPerformanceError("");
    teacherApi.getGamePerformance(selectedEmail).then(data => { if (active) setPerformance(data); })
      .catch(error => { if (active) setPerformanceError(error instanceof Error ? error.message : "The student's game history could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedEmail, reload]);

  const filtered = useMemo(() => (performance?.attempts || []).filter(attempt =>
    (selectedGame === "All games" || attempt.game === selectedGame) &&
    (selectedActivity === "All activities" || attempt.activity === selectedActivity ||
      (selectedActivity === "Reply Coach" && attempt.activity.startsWith("Reply Coach · ")))
  ), [performance, selectedGame, selectedActivity]);
  const activities = useMemo(() => selectedGame === "All games" ? [] :
    performance?.games.find(game => game.name === selectedGame)?.activities || [], [performance, selectedGame]);
  const playedGames = performance?.games.filter(game => game.summary.attempts > 0).length || 0;
  const selectedStudent = students.find(student => student.email === selectedEmail);

  return <section className="full-panel">
    <PageHeader eyebrow="LEARNER RECORD" title="Game performance"
      description="Every saved attempt for your student, including speaking feedback and score trends." />
    {studentError && <StatusMessage>{studentError}</StatusMessage>}
    <div className="game-performance-toolbar">
      <label className="student-picker">Student
        <select value={selectedEmail} onChange={event => {
          setSelectedEmail(event.target.value); setSelectedGame("All games"); setSelectedActivity("All activities");
        }}>
          {students.map(student => <option key={student.email} value={student.email}>{student.fname} {student.lname} · {student.email}</option>)}
        </select>
      </label>
      <button type="button" className="game-performance-refresh" onClick={() => setReload(value => value + 1)}
        disabled={!selectedEmail || loading}><RotateCw size={16} /> Refresh scores</button>
    </div>
    {!selectedEmail && !studentError && <div className="game-performance-empty">No students are linked to your classes yet.</div>}
    {loading && <div className="game-performance-empty">Loading saved attempts for {selectedStudent?.fname || "this learner"}…</div>}
    {performanceError && <StatusMessage>{performanceError}</StatusMessage>}
    {performance && !loading && <>
      <div className="game-performance-overview">
        <div><Trophy size={20} /><b>{performance.totalAttempts}</b><small>Total saved attempts</small></div>
        <div><BarChart3 size={20} /><b>{playedGames} / {performance.games.length}</b><small>Games played</small></div>
        <div><Clock3 size={20} /><b>{performance.attempts[0] ? when(performance.attempts[0].playedAt) : "—"}</b><small>Most recent activity</small></div>
      </div>
      <div className="game-performance-section-head">
        <div><small>SCORE SNAPSHOT</small><h2>Latest, average and highest</h2>
          <p>Calculated from completed scored attempts. Practice-only sessions remain in the history.</p></div>
      </div>
      <div className="game-performance-grid">
        {performance.games.map(game => <SummaryCard key={game.name} title={game.name} summary={game.summary}
          selected={selectedGame === game.name} onClick={() => {
            setSelectedGame(current => current === game.name ? "All games" : game.name);
            setSelectedActivity("All activities");
          }}>
          {game.activities.length > 0 && <div className="game-performance-activities">
            {game.activities.map(activity => <div key={activity.label}>
              <b>{activity.label}</b><small>{activity.attempts} attempts</small>
              <span>Latest {scoreText(activity.latest)} · Avg {scoreText(activity.average)} · Best {scoreText(activity.highest)}</span>
            </div>)}
          </div>}
        </SummaryCard>)}
      </div>
      <div className="game-performance-section-head game-performance-history-head">
        <div><small>COMPLETE HISTORY</small><h2>Every attempt</h2>
          <p>Newest first. Repeat plays stay in the learner's account history.</p></div>
        <span>{filtered.length} shown</span>
      </div>
      <div className="game-performance-filters">
        <button type="button" className={selectedGame === "All games" ? "active" : ""}
          onClick={() => { setSelectedGame("All games"); setSelectedActivity("All activities"); }}>All games</button>
        {performance.games.map(game => <button type="button" key={game.name}
          className={selectedGame === game.name ? "active" : ""}
          onClick={() => { setSelectedGame(game.name); setSelectedActivity("All activities"); }}>{game.name}</button>)}
      </div>
      {activities.length > 0 && <label className="game-performance-activity-picker">Activity
        <select value={selectedActivity} onChange={event => setSelectedActivity(event.target.value)}>
          <option>All activities</option>{activities.map(activity => <option key={activity.label}>{activity.label}</option>)}
        </select>
      </label>}
      <div className="game-performance-history">
        {filtered.length ? filtered.map((attempt, index) => <article key={`${attempt.game}-${attempt.id || index}`} className="game-performance-attempt">
          <div className="game-performance-attempt-main">
            <span className="game-performance-attempt-icon"><Trophy size={17} /></span>
            <div className="game-performance-attempt-title"><b>{attempt.activity}</b>
              <small>{attempt.game} · {when(attempt.playedAt)}{attempt.mode ? ` · ${attempt.mode.replaceAll("_", " ").toLowerCase()}` : ""}</small></div>
            <span className="game-performance-attempt-score"><strong>{scoreText(attempt.percentage)}</strong>
              <small>{attempt.score != null ? `${attempt.score}${attempt.maxScore ? ` / ${attempt.maxScore}` : ""} points` : "Practice only"}</small></span>
            <span className={`game-performance-status ${attempt.status === "COMPLETED" ? "done" : ""}`}>
              {attempt.status === "COMPLETED" ? "Completed" : "In progress"}</span>
          </div>
          {attempt.game === "QuackTalk" && <SpeakingFeedback attempt={attempt} />}
        </article>) : <div className="game-performance-empty">No attempts match this selection yet.</div>}
      </div>
    </>}
  </section>;
}
