import { ChevronDown, Download, RefreshCw, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { teacherApi } from "../services/teacherApi";
import type { Student, TeacherGamePerformance } from "../types";
import { downloadCsv } from "../utils/reportBuilder";

const percent = (value: number | null) => value == null ? "—" : `${Math.round(value)}%`;
export default function StudentScoreReport({ students }: { students: Student[] }) {
  const [email, setEmail] = useState(students[0]?.email || "");
  const [data, setData] = useState<TeacherGamePerformance | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => { if (!email && students[0]) setEmail(students[0].email); }, [students, email]);
  useEffect(() => {
    if (!email) return;
    let active = true;
    setLoading(true); setData(null); setError("");
    teacherApi.getGamePerformance(email).then(result => { if (active) setData(result); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : "Could not load this student's report."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [email, refresh]);
  const exportReport = () => {
    if (!data) return;
    const cell = (value: unknown) => `"${String(value ?? "").replace(/^[=+@-]/, "'$&").replace(/"/g, '""')}"`;
    const rows = [["Student", "Game", "Activity", "Date", "Status", "Score", "Maximum", "Percentage", "Feedback"],
      ...data.attempts.map(a => [email, a.game, a.activity, a.playedAt, a.status, a.score, a.maxScore, a.percentage, a.feedbackSummary])];
    downloadCsv("japlearn-student-report.csv", rows.map(row => row.map(cell).join(",")).join("\r\n"));
  };
  return <div className="student-score-report">
    <div className="tile-head"><div><h3>Student progress report</h3><p>Recorded game results and speaking feedback, linked to the student's account.</p></div></div>
    <div className="reports-filterbar">
      <label className="designed-select"><span><UserRound />Learner</span><div><select aria-label="Student" value={email} onChange={e => setEmail(e.target.value)}>{students.map(s => <option key={s.email} value={s.email}>{s.fname} {s.lname}</option>)}</select><ChevronDown /></div></label>
      <button className="report-refresh-button" disabled={loading || !email} onClick={() => setRefresh(n => n + 1)}><RefreshCw />Refresh</button>
      <button className="report-export-button" disabled={!data} onClick={exportReport}><Download />Export attempts</button>
    </div>
    {loading && <p role="status">Loading recorded results…</p>}
    {error && <p role="alert">{error}</p>}
    {!students.length && <p>No students are enrolled yet.</p>}
    {data && <>
      <div className="report-metric-row"><div><b>{data.totalAttempts}</b><small>Recorded attempts</small></div><div><b>{data.attempts.filter(a => a.status === "COMPLETED").length}</b><small>Completed attempts</small></div><div><b>{data.games.filter(g => g.summary.scoredAttempts > 0).length}</b><small>Games with scores</small></div></div>
      <div style={{ overflowX: "auto" }}><table className="data-table"><thead><tr><th>Game</th><th>Scored attempts</th><th>Latest</th><th>Average</th><th>Highest</th></tr></thead><tbody>{data.games.map(g => <tr key={g.name}><td>{g.name}</td><td>{g.summary.scoredAttempts}</td><td>{percent(g.summary.latest)}</td><td>{percent(g.summary.average)}</td><td>{percent(g.summary.highest)}</td></tr>)}</tbody></table></div>
      {!data.totalAttempts && <p>No attempts recorded yet. Missing scores are shown as —, not zero.</p>}
      <details className="report-feedback-details"><summary>Speaking feedback and practice recommendations</summary>{data.attempts.filter(a => a.feedbackSummary || a.areasForImprovement?.length).map(a => <article key={`${a.game}-${a.id}`}><h4>{a.activity}</h4><small>{a.playedAt ? new Date(a.playedAt).toLocaleString() : "Date unavailable"}</small><p>{a.feedbackSummary}</p>{a.areasForImprovement?.length > 0 && <p>Practice next: {a.areasForImprovement.join(" · ")}</p>}</article>)}</details>
    </>}
  </div>;
}
