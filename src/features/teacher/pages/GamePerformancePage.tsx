import { BarChart3, Clock3, MessageCircleMore, RotateCw, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import StatusMessage from "../components/StatusMessage";
import { teacherApi } from "../services/teacherApi";
import type { GameAttempt, Student, TeacherGamePerformance } from "../types";

const scoreText = (value: number | null) => value == null ? "—" : `${value}%`;
const when = (value: string | null) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};
const metric = (label: string, value: number | null) => (
  <span className="game-performance-metric" key={label}><small>{label}</small><strong>{scoreText(value)}</strong></span>
);

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
  const [selectedEmail, setSelectedEmail] = useState("ALL");
  const [studentError, setStudentError] = useState("");
  const [performances, setPerformances] = useState<Record<string, TeacherGamePerformance>>({});
  const [performanceError, setPerformanceError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);
  const [selectedGame, setSelectedGame] = useState("All games");
  const [selectedActivity, setSelectedActivity] = useState("All activities");
  const [sheetView, setSheetView] = useState<"results" | "attempts">("results");

  useEffect(() => {
    let active = true;
    teacherApi.getAllStudents().then(data => {
      if (!active) return;
      setStudents(data);
    }).catch(() => { if (active) setStudentError("Your class roster could not be loaded. Please refresh or sign in again."); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const emails = selectedEmail === "ALL" ? students.map(student => student.email) : [selectedEmail];
    if (!emails.length) { setPerformances({}); return; }
    let active = true;
    setLoading(true); setPerformances({}); setPerformanceError("");
    void (async () => {
      const loaded: Record<string, TeacherGamePerformance> = {};
      let failed = 0;
      // Keep roster-wide requests bounded so a large class does not overwhelm the API.
      for (let start = 0; start < emails.length; start += 4) {
        const batch = await Promise.allSettled(emails.slice(start, start + 4).map(email => teacherApi.getGamePerformance(email)));
        batch.forEach((result, index) => {
          if (result.status === "fulfilled") loaded[emails[start + index].toLowerCase()] = result.value;
          else failed += 1;
        });
        if (!active) return;
      }
      setPerformances(loaded);
      if (failed) setPerformanceError(`${failed} student record${failed === 1 ? "" : "s"} could not be loaded. The sheet is incomplete; try Refresh scores.`);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [students, selectedEmail, reload]);

  const studentName = (email: string) => {
    const student = students.find(item => item.email.toLowerCase() === email.toLowerCase());
    return student ? `${student.fname} ${student.lname}`.trim() || email : email;
  };
  const records = useMemo(() => students.flatMap(student => {
    const data = performances[student.email.toLowerCase()];
    if (!data) return [];
    return data.games.flatMap(game => [
      { email: student.email, game: game.name, activity: "Overall", summary: game.summary, child: false },
      ...game.activities.map(activity => ({ email: student.email, game: game.name, activity: activity.label, summary: activity, child: true })),
    ]);
  }), [students, performances]);
  const history = useMemo(() => students.flatMap(student =>
    (performances[student.email.toLowerCase()]?.attempts || []).map(attempt => ({ studentEmail: student.email, attempt }))
  ).sort((a, b) => new Date(b.attempt.playedAt || 0).getTime() - new Date(a.attempt.playedAt || 0).getTime()), [students, performances]);
  const games = useMemo(() => [...new Set(records.filter(row => !row.child).map(row => row.game))], [records]);
  const activities = useMemo(() => [...new Set(records.filter(row => row.game === selectedGame && row.child).map(row => row.activity))], [records, selectedGame]);
  const resultRows = useMemo(() => selectedGame === "All games"
    ? records.filter(row => !row.child)
    : records.filter(row => row.game === selectedGame), [records, selectedGame]);
  const filtered = history.filter(({ attempt }) =>
    (selectedGame === "All games" || attempt.game === selectedGame) &&
    (selectedActivity === "All activities" || attempt.activity === selectedActivity ||
      (selectedActivity === "Reply Coach" && attempt.activity.startsWith("Reply Coach · "))));
  const totalAttempts = Object.values(performances).reduce((sum, data) => sum + data.totalAttempts, 0);
  const playedGames = new Set(history.map(row => row.attempt.game)).size;

  return <section className="full-panel game-performance-page">
    <PageHeader eyebrow="LEARNER RECORD" title="Game scores"
      description="A classroom-wide score sheet with every learner's latest, average and highest results." />
    {studentError && <StatusMessage>{studentError}</StatusMessage>}
    <div className="game-performance-toolbar">
      <label className="student-picker">Student
        <select value={selectedEmail} onChange={event => {
          setSelectedEmail(event.target.value); setSelectedGame("All games"); setSelectedActivity("All activities");
        }}>
          <option value="ALL">All students ({students.length})</option>
          {students.map(student => <option key={student.email} value={student.email}>{student.fname} {student.lname} · {student.email}</option>)}
        </select>
      </label>
      <button type="button" className="game-performance-refresh" onClick={() => setReload(value => value + 1)}
        disabled={!students.length || loading}><RotateCw size={16} /> Refresh scores</button>
    </div>
    {!students.length && !studentError && !loading && <div className="game-performance-empty">No students are linked to your classes yet.</div>}
    {loading && <div className="game-performance-empty">Loading the score sheet…</div>}
    {performanceError && <StatusMessage>{performanceError}</StatusMessage>}
    {!loading && Object.keys(performances).length > 0 && <>
      <div className="game-performance-overview">
        <div><Trophy size={20} /><b>{totalAttempts}</b><small>Total saved attempts</small></div>
        <div><BarChart3 size={20} /><b>{playedGames}</b><small>Games played</small></div>
        <div><Clock3 size={20} /><b>{history[0] ? when(history[0].attempt.playedAt) : "—"}</b><small>Most recent activity</small></div>
      </div>
      <div className="game-performance-workspace">
        <div className="game-performance-workspace-head"><div><small>CLASSROOM RECORDS</small><h2>{sheetView === "results" ? "Game results" : "Every attempt"}</h2><p>{sheetView === "results" ? "Compare each learner's latest, average and highest score." : "Review each play in date order, including speaking feedback."}</p></div><span>{sheetView === "results" ? `${resultRows.length} rows` : `${filtered.length} attempts`}</span></div>
        <div className="game-performance-viewbar">
          <label>Show<select value={sheetView} onChange={event => setSheetView(event.target.value as "results" | "attempts")}><option value="results">Game results</option><option value="attempts">Every attempt</option></select></label>
          <label>Game<select value={selectedGame} onChange={event => { setSelectedGame(event.target.value); setSelectedActivity("All activities"); }}><option>All games</option>{games.map(game => <option key={game} value={game}>{game}</option>)}</select></label>
          {sheetView === "attempts" && selectedGame !== "All games" && activities.length > 0 && <label>Activity<select value={selectedActivity} onChange={event => setSelectedActivity(event.target.value)}><option>All activities</option>{activities.map(activity => <option key={activity}>{activity}</option>)}</select></label>}
        </div>
        {sheetView === "results" && <>
          {selectedGame === "All games" && <p className="game-performance-view-tip">Showing one row per game. Choose a game above to see its activities.</p>}
          {resultRows.length ? <div className="game-score-sheet-scroll" role="region" aria-label="Game scores by student" tabIndex={0}>
        <table className="game-score-sheet">
          <thead><tr><th scope="col">Student</th><th scope="col">Game / activity</th><th scope="col">Attempts</th><th scope="col">Latest</th><th scope="col">Average</th><th scope="col">Highest</th><th scope="col">Last played</th></tr></thead>
          <tbody>{resultRows.map(row => <tr key={`${row.email}-${row.game}-${row.activity}`} className={row.child ? "game-score-sheet-child" : "game-score-sheet-parent"}>
            <th scope="row"><span>{studentName(row.email)}</span><small>{row.email}</small></th>
            <td><span>{row.child ? row.activity : row.game}</span>{row.child && <small>{row.game}</small>}</td>
            <td>{row.summary.attempts}<small>{row.summary.scoredAttempts} scored</small></td>
            <td>{scoreText(row.summary.latest)}</td><td>{scoreText(row.summary.average)}</td><td>{scoreText(row.summary.highest)}</td><td>{row.summary.latestAt ? when(row.summary.latestAt) : "—"}</td>
          </tr>)}</tbody>
        </table>
          </div> : <div className="game-performance-empty">No game results match this selection yet.</div>}
        </>}
        {sheetView === "attempts" && (filtered.length ? <div className="game-score-sheet-scroll" role="region" aria-label="Every game attempt" tabIndex={0}>
        <table className="game-score-sheet game-score-history-sheet">
          <thead><tr><th scope="col">Student</th><th scope="col">Game</th><th scope="col">Activity</th><th scope="col">Score</th><th scope="col">Played</th><th scope="col">Status / feedback</th></tr></thead>
          <tbody>{filtered.map(({ studentEmail, attempt }, index) => <tr key={`${studentEmail}-${attempt.game}-${attempt.id || index}`}>
            <th scope="row"><span>{studentName(studentEmail)}</span><small>{studentEmail}</small></th>
            <td>{attempt.game}</td><td><span>{attempt.activity}</span>{attempt.mode && <small>{attempt.mode.replaceAll("_", " ").toLowerCase()}</small>}</td>
            <td><strong>{scoreText(attempt.percentage)}</strong><small>{attempt.score != null ? `${attempt.score}${attempt.maxScore ? ` / ${attempt.maxScore}` : ""} points` : "Practice only"}</small></td>
            <td>{when(attempt.playedAt)}</td>
            <td><span className={`game-performance-status ${attempt.status === "COMPLETED" ? "done" : ""}`}>{attempt.status === "COMPLETED" ? "Completed" : "In progress"}</span>{attempt.game === "QuackTalk" && <SpeakingFeedback attempt={attempt} />}</td>
          </tr>)}</tbody>
        </table>
        </div> : <div className="game-performance-empty">No attempts match this selection yet.</div>)}
      </div>
    </>}
  </section>;
}
