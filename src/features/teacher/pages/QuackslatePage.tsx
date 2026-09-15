import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Plus, RefreshCw, Sparkles } from "lucide-react";
import { teacherApi } from "../services/teacherApi";
import type { SlateQuestion, SlateScoreSheet, SlateSession } from "../types";

const localInputTime = (value: string) => {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};
const csvCell = (value: string | number | null) => {
  const content = String(value ?? "");
  const safe = /^[=+@-]/.test(content) ? `'${content}` : content;
  return `"${safe.replaceAll('"', '""')}"`;
};

export default function QuackslatePage() {
  const [questions, setQuestions] = useState<SlateQuestion[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [gameCode, setGameCode] = useState("");
  const [filter, setFilter] = useState("All");
  const [status, setStatus] = useState("");
  const [sessions, setSessions] = useState<SlateSession[]>([]);
  const [sessionFilter, setSessionFilter] = useState<"ACTIVE" | "DRAFT" | "ENDED">("ACTIVE");
  const [session, setSession] = useState<SlateSession | null>(null);
  const [sheet, setSheet] = useState<SlateScoreSheet | null>(null);
  const [studentFilter, setStudentFilter] = useState("all");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState({prompt:"",translation:"",category:"Custom",difficulty:"Easy",options:"",correctAnswer:"",explanation:""});

  const load = async () => {
    const [bank, codes] = await Promise.all([teacherApi.getSlateQuestions(), teacherApi.getSlateSessions()]);
    setQuestions(bank);
    setSessions(codes);
  };

  useEffect(() => {
    void load().catch((error) => setStatus(error.message));
  }, []);
  useEffect(() => {
    const interval = window.setInterval(() => {
      void teacherApi.getSlateSessions().then(setSessions).catch(() => undefined);
      if (gameCode) {
        void teacherApi.getSlateSession(gameCode).then((detail) => setSession(detail.session)).catch(() => undefined);
        void teacherApi.getSlateScoreSheet(gameCode).then(setSheet).catch(() => undefined);
      }
    }, 15_000);
    return () => window.clearInterval(interval);
  }, [gameCode]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(questions.map((question) => question.category)))],
    [questions],
  );
  const visible = filter === "All" ? questions : questions.filter((question) => question.category === filter);

  const generate = async () => {
    try {
      const created = await teacherApi.createSlateSession();
      setGameCode(created.gameCode);
      setSession(created);
      setSelected([]);
      setSheet(null);
      setSessions((items) => [created, ...items]);
      setSessionFilter("DRAFT");
      setStatus("Code created. Choose questions, then schedule when students can play.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not create a code."); }
  };

  const openSession = async (code: string) => {
    try {
      const [detail, scores] = await Promise.all([teacherApi.getSlateSession(code), teacherApi.getSlateScoreSheet(code)]);
      setGameCode(code); setSession(detail.session); setSelected(detail.questionIds); setSheet(scores);
      setStudentFilter("all"); setStatus("");
      setStartAt(detail.session.startsAt ? localInputTime(detail.session.startsAt) : "");
      setEndAt(detail.session.endsAt ? localInputTime(detail.session.endsAt) : "");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not open session."); }
  };

  const saveSelection = async () => {
    try { const updated = await teacherApi.setSlateQuestions(gameCode, selected); setSession(updated); setStatus(`${updated.questionCount} questions saved.`); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Questions could not be saved."); }
  };

  const schedule = async () => {
    try {
      await teacherApi.setSlateQuestions(gameCode, selected);
      const updated = await teacherApi.scheduleSlateSession(gameCode, new Date(startAt).toISOString(), new Date(endAt).toISOString());
      setSession(updated); setSessions((items) => items.map((item) => item.gameCode === gameCode ? updated : item));
      setStatus("Scheduled. The session opens and closes automatically; you do not need to wait.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Schedule could not be saved."); }
  };

  const addCustom = async () => {
    try {
      const added = await teacherApi.addSlateQuestion({...custom, options: custom.options.split(",").map((part) => part.trim()).filter(Boolean)});
      setQuestions((items) => [added, ...items]); setSelected((items) => [...items, added.id]); setCustomOpen(false);
      setCustom({prompt:"",translation:"",category:"Custom",difficulty:"Easy",options:"",correctAnswer:"",explanation:""});
      setStatus("Question added and selected. Save the selection before scheduling.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Question could not be added."); }
  };
  const visibleSessions = sessions.filter((item) => sessionFilter === "ACTIVE"
    ? item.status === "UPCOMING" || item.status === "LIVE"
    : item.status === sessionFilter);

  const exportSheet = () => {
    if (!sheet) return;
    const rows = sheet.rows.filter((row) => studentFilter === "all" || row.email === studentFilter);
    const lines = [["Student", "Email", "Attempts", "Latest %", "Average %", "Highest %", "Last played", "Attempt date", "Score", "Max score", "Attempt %", "Completed"],
      ...rows.flatMap((row) => (row.history.length ? row.history : [null]).map((attempt) =>
        [row.name, row.email, row.attempts, row.latest, row.average, row.highest, row.latestAt || "",
          attempt?.playedAt || "", attempt?.score ?? "", attempt?.maxScore ?? "", attempt?.percentage ?? "",
          attempt === null ? "" : attempt.completed ? "Yes" : "No"]))];
    const blob = new Blob(["\ufeff", lines.map((line) => line.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `quackslate-${gameCode}-scores.csv`;
    link.click(); URL.revokeObjectURL(link.href);
  };

  return (
    <section className="quack-bank-page">
      <div className="quack-page-head">
        <div><small>TEACHER-CODED QUACKSLATE</small><h2>Plan a classroom session</h2><p>Create a code, choose or add questions, then set the play window. The activity starts and ends automatically.</p></div>
        <button className="primary-button" onClick={generate}><Sparkles size={17} />Create class code</button>
      </div>
      <div className="slate-studio">
        <div className="slate-panel">
          <div className="slate-panel-heading"><div><small>YOUR SESSIONS</small><h3>Class codes</h3></div><button className="soft-button" onClick={() => void load()}><RefreshCw size={15} />Refresh</button></div>
          <div className="slate-directory-tabs"><button className={sessionFilter === "ACTIVE" ? "active" : ""} onClick={() => setSessionFilter("ACTIVE")}>Upcoming & live</button><button className={sessionFilter === "DRAFT" ? "active" : ""} onClick={() => setSessionFilter("DRAFT")}>Drafts</button><button className={sessionFilter === "ENDED" ? "active" : ""} onClick={() => setSessionFilter("ENDED")}>Finished</button></div>
          <div className="slate-code-grid">{visibleSessions.map((item) => <button key={item.gameCode} className={`slate-code-card ${gameCode === item.gameCode ? "selected" : ""}`} onClick={() => void openSession(item.gameCode)}><strong>{item.gameCode}</strong><span className={`slate-status ${item.status.toLowerCase()}`}>{item.status}</span><small>{item.startsAt ? new Date(item.startsAt).toLocaleString() : "Not scheduled"} · {item.questionCount} questions · {item.joinedCount} joined</small></button>)}</div>
          {!visibleSessions.length && <p>No {sessionFilter === "ACTIVE" ? "upcoming or live" : sessionFilter.toLowerCase()} sessions. {sessionFilter === "DRAFT" ? "Create a code to begin." : "Use the tabs to view other sessions."}</p>}
        </div>

        {gameCode && session && <>
          <div className="slate-panel slate-code-banner"><div><small>ACTIVE CODE · {session.status}</small><strong>{gameCode}</strong><span>{session.startsAt && session.endsAt ? `${new Date(session.startsAt).toLocaleString()} – ${new Date(session.endsAt).toLocaleString()}` : "Choose questions and schedule below"}</span></div><button className="soft-button" onClick={() => void navigator.clipboard.writeText(gameCode)}><Copy size={16} />Copy code</button></div>
          {status && <p className="bank-status" role="status">{status}</p>}
          {session.status === "DRAFT" && <>
            <div className="slate-panel"><div className="slate-panel-heading"><div><small>STEP 1 · CONTENT</small><h3>Choose questions</h3><p>Use the question bank or write one for this class. Select 1–30.</p></div><button className="soft-button" onClick={() => setCustomOpen((value) => !value)}><Plus size={16} />Add question</button></div>
              {customOpen && <form className="slate-custom-grid" onSubmit={(event) => { event.preventDefault(); void addCustom(); }}>
                <label>Situation / prompt<input required value={custom.prompt} onChange={(event) => setCustom({...custom,prompt:event.target.value})} /></label>
                <label>Japanese model<input required value={custom.translation} onChange={(event) => setCustom({...custom,translation:event.target.value})} /></label>
                <label>Word tiles, separated by commas<input required value={custom.options} onChange={(event) => setCustom({...custom,options:event.target.value})} /></label>
                <label>Correct tile order, separated by spaces<input required value={custom.correctAnswer} onChange={(event) => setCustom({...custom,correctAnswer:event.target.value})} /></label>
                <label>Category<input value={custom.category} onChange={(event) => setCustom({...custom,category:event.target.value})} /></label>
                <label>Difficulty<select value={custom.difficulty} onChange={(event) => setCustom({...custom,difficulty:event.target.value})}><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
                <label className="slate-wide">Explanation<input required value={custom.explanation} onChange={(event) => setCustom({...custom,explanation:event.target.value})} /></label>
                <button className="primary-button" type="submit">Add and select</button>
              </form>}
              <div className="bank-toolbar"><div>{categories.map((category) => <button key={category} className={filter === category ? "active" : ""} onClick={() => setFilter(category)}>{category}</button>)}</div><span>{selected.length} selected</span></div>
              <div className="question-bank-grid">{visible.map((question) => { const active = selected.includes(question.id); return <button key={question.id} className={`question-bank-card ${active ? "selected" : ""}`} onClick={() => setSelected((items) => active ? items.filter((id) => id !== question.id) : [...items, question.id])}><span className="question-check">{active ? <Check size={16} /> : <Plus size={16} />}</span><small>{question.category} · {question.difficulty}</small><h3>{question.prompt}</h3><p lang="ja">{question.translation}</p><div className="tile-preview">{question.options.map((option, index) => <span key={`${index}-${option}`}>{option}</span>)}</div><em>{question.explanation}</em></button>; })}</div>
              <button className="soft-button" onClick={() => void saveSelection()} disabled={!selected.length}>Save {selected.length} questions</button>
            </div>
            <div className="slate-panel"><small>STEP 2 · PLAY WINDOW</small><h3>Set the start and end</h3><p>Students may join with the code early, but play only during this window. At the end, the game closes automatically.</p><div className="slate-schedule-grid"><label>Start time<input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} /></label><label>End time<input type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} /></label><button className="primary-button" disabled={!startAt || !endAt || !selected.length} onClick={() => void schedule()}>Publish schedule</button></div></div>
          </>}
          {session.status !== "DRAFT" && <div className="slate-panel"><small>SESSION STATUS</small><h3>{session.status === "UPCOMING" ? "Opens automatically" : session.status === "LIVE" ? "Students are playing" : "Session finished"}</h3><p>{session.questionCount} questions · {session.joinedCount} enrolled · {session.endsAt ? `Closes ${new Date(session.endsAt).toLocaleString()}` : ""}</p></div>}
          <div className="slate-panel"><div className="slate-panel-heading"><div><small>CLASS SCORE SHEET</small><h3>Every enrolled student</h3><p>Latest, average and highest scores across all attempts.</p></div><div className="session-controls"><button className="soft-button" onClick={exportSheet} disabled={!sheet?.rows.length}>Download CSV</button><button className="soft-button" onClick={() => void teacherApi.getSlateScoreSheet(gameCode).then(setSheet)}><RefreshCw size={15} />Refresh scores</button></div></div>
            <label className="slate-student-select">View <select value={studentFilter} onChange={(event) => setStudentFilter(event.target.value)}><option value="all">All students</option>{sheet?.rows.map((row) => <option key={row.email} value={row.email}>{row.name || row.email}</option>)}</select></label>
            <div className="slate-sheet-scroll"><table className="slate-sheet"><thead><tr><th>Student</th><th>Attempts</th><th>Latest</th><th>Average</th><th>Highest</th><th>Last played</th></tr></thead><tbody>{sheet?.rows.filter((row) => studentFilter === "all" || row.email === studentFilter).map((row) => <tr key={row.email}><td><strong>{row.name || row.email}</strong><small>{row.email}</small></td><td>{row.attempts}</td><td>{row.latest === null ? "—" : `${row.latest}%`}</td><td>{row.average === null ? "—" : `${row.average}%`}</td><td>{row.highest === null ? "—" : `${row.highest}%`}</td><td>{row.latestAt ? new Date(row.latestAt).toLocaleString() : "Not played"}</td></tr>)}</tbody></table></div>
            {!sheet?.rows.length && <p>No students have joined this code yet.</p>}
            {studentFilter !== "all" && sheet?.rows.find((row) => row.email === studentFilter)?.history.map((attempt, index) => <p key={index}>Attempt {index + 1}: {attempt.score}/{attempt.maxScore} ({attempt.percentage}%) · {new Date(attempt.playedAt).toLocaleString()} {attempt.completed ? "" : "· Ended early"}</p>)}
          </div>
        </>}
        {!gameCode && status && <p className="bank-status" role="status">{status}</p>}
      </div>
    </section>
  );
}
