import { BarChart3, Download, FileBarChart, Sparkles, Users } from "lucide-react";
import { useEffect, useState } from "react";
import StudentScoreReport from "../components/StudentScoreReport";
import { teacherApi } from "../services/teacherApi";
import type { Student } from "../types";
import { buildScorecards, downloadCsv, REPORT_SECTIONS, scorecardsToCsv, type Scorecard, type SectionKey } from "../utils/reportBuilder";

export default function ReportsPage() {
  const [view, setView] = useState("student");
  const [students, setStudents] = useState<Student[]>([]);
  const [scope, setScope] = useState("");
  const [sections, setSections] = useState<SectionKey[]>(REPORT_SECTIONS.map(s => s.key));
  const [cards, setCards] = useState<Scorecard[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  useEffect(() => { teacherApi.getAllStudents().then(setStudents).catch(e => setError(e.message)); }, []);
  useEffect(() => { setCards(null); }, [scope, sections]);
  const build = async () => {
    if (busy) return;
    setBusy(true); setError(""); setCards(null);
    try { setCards(await buildScorecards(students.filter(s => !scope || s.email === scope), sections, (done, total) => setProgress(`${done} of ${total} students loaded`))); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not build report."); }
    finally { setBusy(false); }
  };
  return <section className="reports-page">
    <div className="reports-hero"><span><BarChart3 /></span><div><small>LEARNING INTELLIGENCE</small><h1>Progress reports</h1><p>Turn every saved attempt into a clear view of learner growth, strengths, and next steps.</p></div><i><Sparkles /> Account-synced records</i></div>
    <div className="reports-workspace">
    <nav className="reports-view-tabs" aria-label="Report type">
      <button className={view === "student" ? "active" : ""} onClick={() => setView("student")}><Users />Single student</button>
      <button className={view === "masterlist" ? "active" : ""} onClick={() => setView("masterlist")}><FileBarChart />Class masterlist</button>
    </nav>
    {error && <p role="alert">{error}</p>}
    {view === "student" ? <StudentScoreReport students={students} /> : <div className="reports-masterlist">
      <div className="tile-head"><div><h3>Class masterlist</h3><p>Choose students and activities. Preview results before exporting.</p></div></div>
      <div className="tool-bar"><select aria-label="Students to include" disabled={busy} value={scope} onChange={e => setScope(e.target.value)}><option value="">All students ({students.length})</option>{students.map(s => <option key={s.email} value={s.email}>{s.fname} {s.lname}</option>)}</select><button className="head-action" disabled={busy || !students.length || !sections.length} onClick={build}>{busy ? "Building…" : "Build report"}</button>{cards && <button className="head-action" onClick={() => downloadCsv("japlearn-masterlist.csv", scorecardsToCsv(cards, sections))}><Download />Download CSV</button>}</div>
      <details className="report-feedback-details"><summary>Included activities ({sections.length})</summary><div className="chip-row">{REPORT_SECTIONS.map(s => <button disabled={busy} key={s.key} className={`chip ${sections.includes(s.key) ? "on" : ""}`} onClick={() => setSections(current => current.includes(s.key) ? current.filter(k => k !== s.key) : [...current, s.key])}>{s.label}</button>)}</div></details>
      {busy && <p role="status">{progress}</p>}
      {cards ? <div style={{ overflowX: "auto" }}><table className="data-table"><thead><tr><th>Student</th><th>Class</th><th>Overall</th></tr></thead><tbody>{cards.map(c => <tr key={c.student.email}><td>{c.student.fname} {c.student.lname}</td><td>{c.student.classCode || "Unassigned"}</td><td>{c.overall == null ? "—" : `${c.overall}%`}</td></tr>)}</tbody></table></div> : !busy && <div className="state-empty"><FileBarChart /><h3>Your report preview appears here</h3><p>Select your students and build the report.</p></div>}
    </div>}
    </div>
  </section>;
}
