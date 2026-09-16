import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CalendarClock, CalendarDays, Check, ClipboardList, Clock3, Copy, FileSpreadsheet, Hash, HelpCircle, Library, PencilLine, Plus, RefreshCw, Search, Trash2, Users } from "lucide-react";
import { confirmAction } from "../../../lib/confirmAction";
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
  const [step, setStep] = useState<"content" | "schedule" | "results">("content");
  const [source, setSource] = useState<"bank" | "custom" | "selected">("bank");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [distractors, setDistractors] = useState("");
  const [custom, setCustom] = useState({prompt:"",translation:"",category:"Custom",difficulty:"Easy",options:"",correctAnswer:"",explanation:""});

  const load = async () => {
    const [bank, codes] = await Promise.allSettled([teacherApi.getSlateQuestions(), teacherApi.getSlateSessions()]);
    if (bank.status === "fulfilled") setQuestions(bank.value);
    else setStatus(bank.reason instanceof Error ? bank.reason.message : "The question bank could not be loaded.");
    if (codes.status === "fulfilled") setSessions(codes.value);
    else setStatus(codes.reason instanceof Error ? codes.reason.message : "Class codes could not be loaded.");
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
  const visible = questions.filter((question) => (filter === "All" || question.category === filter)
    && (source !== "selected" || selected.includes(question.id))
    && `${question.prompt} ${question.translation} ${question.category}`.toLowerCase().includes(search.toLowerCase()));

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const created = await teacherApi.createSlateSession();
      setGameCode(created.gameCode);
      setSession(created);
      setSelected([]);
      setSheet(null);
      setSessions((items) => [created, ...items]);
      setSessionFilter("DRAFT");
      setStep("content"); setSource("bank"); setStartAt(""); setEndAt("");
      setStatus("Code created. Choose questions, then schedule when students can play.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not create a code."); }
    finally { setBusy(false); }
  };

  const openSession = async (code: string) => {
    try {
      const [detail, scores] = await Promise.all([teacherApi.getSlateSession(code), teacherApi.getSlateScoreSheet(code)]);
      setGameCode(code); setSession(detail.session); setSelected(detail.questionIds); setSheet(scores);
      setStudentFilter("all"); setStatus("");
      setStep(detail.session.status === "DRAFT" ? "content" : "results"); setSource("bank");
      setStartAt(detail.session.startsAt ? localInputTime(detail.session.startsAt) : "");
      setEndAt(detail.session.endsAt ? localInputTime(detail.session.endsAt) : "");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not open session."); }
  };

  const saveSelection = async () => {
    if (busy) return;
    setBusy(true);
    try { const updated = await teacherApi.setSlateQuestions(gameCode, selected); setSession(updated); setStatus(`${updated.questionCount} questions saved.`); setStep("schedule"); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Questions could not be saved."); }
    finally { setBusy(false); }
  };

  const schedule = async () => {
    if (busy) return;
    if (!startAt || !endAt || new Date(endAt) <= new Date(startAt)) { setStatus("Choose an end time after the start time."); return; }
    setBusy(true);
    try {
      await teacherApi.setSlateQuestions(gameCode, selected);
      const updated = await teacherApi.scheduleSlateSession(gameCode, new Date(startAt).toISOString(), new Date(endAt).toISOString());
      setSession(updated); setSessions((items) => items.map((item) => item.gameCode === gameCode ? updated : item));
      setStatus("Scheduled. The session opens and closes automatically; you do not need to wait.");
      setStep("results");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Schedule could not be saved."); }
    finally { setBusy(false); }
  };

  const addCustom = async () => {
    if (busy) return;
    const answerTiles = custom.options.split(/[,，、\n]/).map((part) => part.trim()).filter(Boolean);
    const extraTiles = distractors.split(/[,，、\n]/).map((part) => part.trim()).filter(Boolean);
    const tiles = [...answerTiles, ...extraTiles];
    if (!custom.prompt.trim() || answerTiles.length < 2 || tiles.length > 12) { setStatus("Add a prompt and 2–12 tiles. Enter the answer tiles in the correct order, separated by commas."); return; }
    if (tiles.some((tile) => /\s/.test(tile)) || new Set(tiles).size !== tiles.length) { setStatus("Use one word or phrase without spaces per tile, and avoid duplicate tiles."); return; }
    if (selected.length >= 30) { setStatus("This session already has 30 questions. Remove a selection first."); return; }
    setBusy(true);
    try {
      const added = await teacherApi.addSlateQuestion({...custom, translation: custom.translation.trim() || answerTiles.join(""), correctAnswer: answerTiles.join(" "), options: tiles});
      setQuestions((items) => [added, ...items]); setSelected((items) => [...items, added.id]); setSource("selected"); setDistractors("");
      setCustom({prompt:"",translation:"",category:"Custom",difficulty:"Easy",options:"",correctAnswer:"",explanation:""});
      setStatus("Question added and selected. Save the selection before scheduling.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Question could not be added."); }
    finally { setBusy(false); }
  };
  const deleteCode = async () => {
    if (!session || busy) return;
    if (!await confirmAction(`Delete code ${gameCode}?`, { confirmLabel: "Delete code", description: "This unused code and its schedule will be removed. Questions stay in the bank." })) return;
    setBusy(true); setDeleting(true);
    try { await teacherApi.deleteSlateSession(gameCode); setSessions((items) => items.filter((item) => item.gameCode !== gameCode)); setGameCode(""); setSession(null); setSheet(null); setSelected([]); setStatus("Code deleted. Your question bank is unchanged."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Could not delete this code."); }
    finally { setBusy(false); setDeleting(false); }
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
    <section className="slate-workbench">
      <div className="slate-studio">
        {!gameCode && <div className="slate-panel">
          <div className="slate-panel-heading slate-directory-title"><div><span className="slate-heading-icon"><ClipboardList size={24} /></span><small>LIVE QUACKSLATE</small><h3>Your class sessions</h3><p>Create a code, prepare the questions, and schedule when students can play.</p></div><div className="session-controls"><button className="soft-button" onClick={() => void load()}><RefreshCw size={15} />Refresh</button><button className="primary-button" onClick={generate} disabled={busy}><Plus size={18} />{busy ? "Creating…" : "Create a code"}</button></div></div>
          <details className="slate-how-it-works"><summary><HelpCircle size={17}/><b>How Live QuackSlate works</b><span>View guide</span></summary><div><article><strong>1</strong><p><b>Create and build</b><small>Generate a class code, then choose questions from the bank or write your own.</small></p></article><article><strong>2</strong><p><b>Schedule automatically</b><small>Set the opening and closing time. The session runs without requiring you to wait.</small></p></article><article><strong>3</strong><p><b>Review the score sheet</b><small>See every enrolled learner’s latest, average, highest, and attempt history.</small></p></article></div></details>
          <div className="slate-directory-tabs"><button className={sessionFilter === "ACTIVE" ? "active" : ""} onClick={() => setSessionFilter("ACTIVE")}>Upcoming & live</button><button className={sessionFilter === "DRAFT" ? "active" : ""} onClick={() => setSessionFilter("DRAFT")}>Drafts</button><button className={sessionFilter === "ENDED" ? "active" : ""} onClick={() => setSessionFilter("ENDED")}>Finished</button></div>
          <div className="slate-code-grid">{visibleSessions.map((item) => <button key={item.gameCode} className={`slate-code-card ${gameCode === item.gameCode ? "selected" : ""}`} onClick={() => void openSession(item.gameCode)}><strong>{item.gameCode}</strong><span className={`slate-status ${item.status.toLowerCase()}`}>{item.status}</span><small>{item.startsAt ? new Date(item.startsAt).toLocaleString() : "Not scheduled"} · {item.questionCount} questions · {item.joinedCount} joined</small></button>)}</div>
          {!visibleSessions.length && <p>No {sessionFilter === "ACTIVE" ? "upcoming or live" : sessionFilter.toLowerCase()} sessions. {sessionFilter === "DRAFT" ? "Create a code to begin." : "Use the tabs to view other sessions."}</p>}
        </div>}

        {gameCode && session && <>
          <div className="slate-session-top"><button className="soft-button" disabled={busy} onClick={() => { setGameCode(""); setSession(null); setStatus(""); void load(); }}><ArrowLeft size={17} />All sessions</button>
            {(session.status === "DRAFT" || session.status === "UPCOMING") && session.joinedCount === 0 && <button className="slate-delete" disabled={busy} onClick={() => void deleteCode()}><Trash2 size={16} />{deleting ? "Deleting…" : "Delete code"}</button>}</div>
          <div className="slate-session-identity"><span className="slate-heading-icon"><Hash size={25} /></span><div><small>CLASS CODE · {session.status}</small><h2>{gameCode}</h2></div><button className="soft-button" onClick={() => void navigator.clipboard.writeText(gameCode).then(() => setStatus("Code copied.")).catch(() => setStatus(`Your code is ${gameCode}. Select the code to copy it.`))}><Copy size={16} />Copy</button><span className="slate-identity-count"><BookOpen size={16} />{selected.length} questions</span></div>
          <nav className="slate-step-navigation" aria-label="Session setup">
            <button className={step === "content" ? "active" : ""} onClick={() => setStep("content")}><Library size={18} /><span>Content<small>Bank or your own</small></span></button>
            <button className={step === "schedule" ? "active" : ""} onClick={() => setStep("schedule")}><CalendarClock size={18} /><span>Schedule<small>Start and end</small></span></button>
            <button className={step === "results" ? "active" : ""} onClick={() => setStep("results")}><Users size={18} /><span>Results<small>Students and scores</small></span></button>
          </nav>
          {status && <p className="bank-status" role="status">{status}</p>}
          {step === "content" && <>
            <div className="slate-panel"><div className="slate-panel-heading"><div><h3>{session.status === "DRAFT" ? "Build your activity" : "Session questions"}</h3><p>{session.status === "DRAFT" ? "Select up to 30 questions from the bank, or write your own." : "Published content is fixed so every student receives the same activity."}</p></div><span className="slate-selection-count">{selected.length} / 30 selected</span></div>
              {session.status === "DRAFT" && <div className="slate-source-tabs"><button className={source === "bank" ? "active" : ""} onClick={() => setSource("bank")}><Library size={17} />Question bank</button><button className={source === "custom" ? "active" : ""} onClick={() => setSource("custom")}><PencilLine size={17} />Write a question</button><button className={source === "selected" ? "active" : ""} onClick={() => setSource("selected")}><Check size={17} />Selected ({selected.length})</button></div>}
              {source === "custom" && session.status === "DRAFT" && <form className="slate-custom-grid" onSubmit={(event) => { event.preventDefault(); void addCustom(); }}>
                <label>Situation / prompt<input required value={custom.prompt} onChange={(event) => setCustom({...custom,prompt:event.target.value})} /></label>
                <label>Japanese sentence (optional)<input value={custom.translation} placeholder="Built from your answer tiles if left blank" onChange={(event) => setCustom({...custom,translation:event.target.value})} /></label>
                <label className="slate-wide">Answer tiles in the correct order<input required placeholder="わたし, は, がくせい, です" value={custom.options} onChange={(event) => setCustom({...custom,options:event.target.value})} /><small>Separate each tile with a comma. Students will see these shuffled.</small></label>
                <label className="slate-wide">Extra distractor tiles (optional)<input placeholder="せんせい, こんにちは" value={distractors} onChange={(event) => setDistractors(event.target.value)} /></label>
                <label>Category<input value={custom.category} onChange={(event) => setCustom({...custom,category:event.target.value})} /></label>
                <label>Difficulty<select value={custom.difficulty} onChange={(event) => setCustom({...custom,difficulty:event.target.value})}><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
                <label className="slate-wide">Explanation (optional)<input value={custom.explanation} onChange={(event) => setCustom({...custom,explanation:event.target.value})} /></label>
                <div className="slate-answer-preview slate-wide"><small>Correct order preview</small><div className="tile-preview">{custom.options.split(/[,，、\n]/).filter((tile) => tile.trim()).map((tile, index) => <span key={index}>{tile.trim()}</span>)}</div></div>
                <button className="primary-button" type="submit" disabled={busy}><Plus size={17} />{busy ? "Saving…" : "Add to my bank & select"}</button>
              </form>}
              {source !== "custom" && <><div className="slate-bank-search"><label><Search size={17} /><input aria-label="Search question bank" placeholder="Search questions or Japanese phrases" value={search} onChange={(event) => setSearch(event.target.value)} /></label><select aria-label="Question category" value={filter} onChange={(event) => setFilter(event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select><button className="soft-button" onClick={() => void load()} aria-label="Refresh question bank"><RefreshCw size={16} /></button></div>
              <div className="slate-question-list">{visible.filter((question) => session.status === "DRAFT" || selected.includes(question.id)).map((question) => { const active = selected.includes(question.id); return <button key={question.id} disabled={session.status !== "DRAFT" || busy || (!active && selected.length >= 30)} className={`slate-question-option ${active ? "selected" : ""}`} aria-pressed={active} onClick={() => setSelected((items) => active ? items.filter((id) => id !== question.id) : [...items, question.id])}><span className="slate-question-toggle">{active ? <Check size={17} /> : <Plus size={17} />}</span><div><small>{question.category} · {question.difficulty}</small><h4>{question.prompt}</h4><p lang="ja">{question.translation}</p><div className="tile-preview">{question.options.map((option, index) => <span key={`${index}-${option}`}>{option}</span>)}</div></div></button>; })}</div>
              {!visible.length && <div className="slate-empty"><Library size={30} /><h3>{source === "selected" ? "Choose your first question" : "No matching questions"}</h3><p>{source === "selected" ? "Open Question bank to add existing content." : "Refresh the bank or change your search. You can also write a question."}</p></div>}</>}
              {session.status === "DRAFT" && <div className="slate-step-footer"><span>{selected.length} questions in this activity</span><button className="primary-button" onClick={() => void saveSelection()} disabled={!selected.length || busy}>Save & schedule <ArrowRight size={17} /></button></div>}
            </div>
          </>}
          {step === "schedule" && <div className="slate-panel slate-schedule-panel"><span className="slate-heading-icon"><CalendarClock size={25} /></span><h3>When can your class play?</h3><p>The activity opens and closes automatically. Times use your device’s local timezone.</p>
            <div className="slate-schedule-grid">
              <label className="slate-date-card"><span><CalendarDays size={18} />Start date and time</span><input type="datetime-local" disabled={session.status !== "DRAFT"} value={startAt} onChange={(event) => setStartAt(event.target.value)} /></label>
              <label className="slate-date-card"><span><Clock3 size={18} />End date and time</span><input type="datetime-local" disabled={session.status !== "DRAFT"} min={startAt || undefined} value={endAt} onChange={(event) => setEndAt(event.target.value)} /></label>
            </div>
            {session.status === "DRAFT" && <div className="slate-time-presets"><span>Quick timing</span><button type="button" onClick={() => { const now = new Date(); now.setMinutes(now.getMinutes() + 10); const end = new Date(now.getTime() + 30*60_000); setStartAt(localInputTime(now.toISOString())); setEndAt(localInputTime(end.toISOString())); }}>Starts in 10 min · 30 min round</button><button type="button" onClick={() => { if (startAt) setEndAt(localInputTime(new Date(new Date(startAt).getTime() + 60*60_000).toISOString())); }}>One hour from start</button></div>}
            {startAt && endAt && <p className="slate-time-summary"><CalendarClock size={16} />{new Date(startAt).toLocaleString()} – {new Date(endAt).toLocaleTimeString()} · {Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60_000)} minutes</p>}
            <div className="slate-schedule-note"><Users size={20} /><p>Late arrivals receive only the time remaining. Share <strong>{gameCode}</strong> when your activity is ready.</p></div>
            {session.status === "DRAFT" ? <div className="slate-step-footer"><button className="soft-button" onClick={() => setStep("content")}><ArrowLeft size={16} />Edit content</button><button className="primary-button" disabled={!startAt || !endAt || !selected.length || busy} onClick={() => void schedule()}>{busy ? "Publishing…" : "Publish schedule"}<Check size={17} /></button></div> : <p className="slate-selection-count">{session.status} · Schedule published</p>}</div>}
          {step === "results" && <div className="slate-panel"><div className="slate-panel-heading"><div><small>CLASS SCORE SHEET</small><h3>Students & results</h3><p>{session.joinedCount} joined · Latest, average and highest scores.</p></div><div className="session-controls"><button className="soft-button" onClick={exportSheet} disabled={!sheet?.rows.length}><FileSpreadsheet size={16} />Download CSV</button><button className="soft-button" onClick={() => void teacherApi.getSlateScoreSheet(gameCode).then(setSheet).catch((error) => setStatus(error.message))}><RefreshCw size={15} />Refresh</button></div></div>
            <label className="slate-student-select">View <select value={studentFilter} onChange={(event) => setStudentFilter(event.target.value)}><option value="all">All students</option>{sheet?.rows.map((row) => <option key={row.email} value={row.email}>{row.name || row.email}</option>)}</select></label>
            <div className="slate-sheet-scroll"><table className="slate-sheet"><thead><tr><th>Student</th><th>Attempts</th><th>Latest</th><th>Average</th><th>Highest</th><th>Last played</th></tr></thead><tbody>{sheet?.rows.filter((row) => studentFilter === "all" || row.email === studentFilter).map((row) => <tr key={row.email}><td><strong>{row.name || row.email}</strong><small>{row.email}</small></td><td>{row.attempts}</td><td>{row.latest === null ? "—" : `${row.latest}%`}</td><td>{row.average === null ? "—" : `${row.average}%`}</td><td>{row.highest === null ? "—" : `${row.highest}%`}</td><td>{row.latestAt ? new Date(row.latestAt).toLocaleString() : "Not played"}</td></tr>)}</tbody></table></div>
            {!sheet?.rows.length && <p>No students have joined this code yet.</p>}
            {studentFilter !== "all" && sheet?.rows.find((row) => row.email === studentFilter)?.history.map((attempt, index) => <p key={index}>Attempt {index + 1}: {attempt.score}/{attempt.maxScore} ({attempt.percentage}%) · {new Date(attempt.playedAt).toLocaleString()} {attempt.completed ? "" : "· Ended early"}</p>)}
          </div>}
        </>}
        {!gameCode && status && <p className="bank-status" role="status">{status}</p>}
      </div>
    </section>
  );
}
