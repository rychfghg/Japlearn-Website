import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDashed, ClipboardCheck, Compass, Download, FileUp, ListChecks, MessagesSquare, Printer, RefreshCw, Sparkles, Trash2, Users } from "lucide-react";
import { API_URL, portalFetch as fetch } from "../../../lib/api";
import { confirmAction } from "../../../lib/confirmAction";

type GoalKey = "SMART1" | "SMART2" | "SMART3" | "SMART4";
type Goal = {
  key: GoalKey; name: string; target: number; correct: number; total: number; percentage: number | null;
  status: "ACHIEVED" | "NOT_ACHIEVED" | "INSUFFICIENT_DATA"; eligibleStudents: number; participatingStudents: number;
  noParticipation: number | null; incomplete: number | null; lastUpdated: string | null; evidence: string; limitations: string[];
};
type Metric = { correct: number; total: number; percentage: number | null; status: "MEASURED" | "INCOMPLETE" | "NO_PARTICIPATION" | "NOT_ASSIGNED" };
type StudentRow = { studentId: string; code: string; name: string; classCode: string | null; classTitle: string | null; runsAttempted: number; runsCompleted: number; assessmentDates: string[] } & Record<GoalKey, Metric>;
type Assignment = { id: string; title: string; classCode: string; classTitle: string | null; activityKey: string; level: number | null; chapterId: string | null; requiredCount?: number; startsAt: string; dueAt: string; createdAt: string; assignedStudents?: number; completedStudents?: number };
type Report = {
  methodVersion: string; computedAt: string; rules: string[]; eligibleStudents: number; goals: Goal[]; students: StudentRow[];
  classes: { classCode: string; classTitle: string | null }[]; studentOptions: { id: string; code: string; name: string }[];
  assignments: { counted: Assignment[]; open: Assignment[] };
  filters: Record<string, unknown>; audit: { recordsRead: Record<string, number>; recordsExcluded: Record<string, number> };
};
type SurveyQuestion = { number: number; statement: string; group: string; agree: number; valid: number; percentage: number | null };
type SurveyGroup = { key: string; label: string; questions: string; agree: number; valid: number; percentage: number | null };
type Survey = {
  id: string; fileName: string; sha256: string; uploadedAt: string; uploadedBy: string; identifierHeader: string | null; matchedOnly: boolean;
  totalRows: number; countedRows: number; matchedRows: number; unmatchedRows: number; duplicateRows: number; noIdentifierRows: number;
  questions: SurveyQuestion[]; groups: SurveyGroup[];
};

const GOAL_KEYS: GoalKey[] = ["SMART1", "SMART2", "SMART3", "SMART4"];
const SHORT: Record<GoalKey, string> = { SMART1: "Situational", SMART2: "Conversational", SMART3: "Politeness", SMART4: "Completion" };
const GOAL_LABEL: Record<GoalKey, string> = { SMART1: "Situational Communication Accuracy", SMART2: "Conversational Response Accuracy", SMART3: "Politeness Recognition Accuracy", SMART4: "Communication Activity Completion" };
const MODULES = [
  ["ALL", "All modules"], ["QUACKSITUATE", "QuackSituate (all)"], ["RECOGNITION", "Ahiru Rescue"], ["EXPRESSION_MATCH", "Expression Match"],
  ["POLITENESS", "Politeness"], ["QUACKRESPONSE", "QuackResponse (all)"], ["REPLY_COACH", "Reply Coach"], ["RESPONSE_RUSH", "Response Rush"], ["DIALOGUE_RELAY", "Dialogue Relay"], ["QUACKTALK", "QuackTalk (all)"], ["TALK_WITH_SUMI", "Talk with Sumi"], ["GUIDED_PHRASE", "Guided Phrase Practice"],
] as const;
const ACTIVITIES = [
  ["RECOGNITION", "QuackSituate · Ahiru Rescue"], ["EXPRESSION_MATCH", "QuackSituate · Expression Match"], ["POLITENESS", "QuackSituate · Politeness"],
  ["REPLY_COACH", "QuackResponse · Reply Coach"], ["RESPONSE_RUSH", "QuackResponse · Response Rush"], ["DIALOGUE_RELAY", "QuackResponse · Dialogue Relay"], ["TALK_WITH_SUMI", "QuackTalk · Talk with Sumi"], ["GUIDED_PHRASE", "QuackTalk · Guided Phrase Practice"], ["QUACKTALK", "QuackTalk · any session"],
] as const;
const activityLabel = (key: string) => ACTIVITIES.find(([value]) => value === key)?.[1] ?? key;
const STATUS_LABEL = { ACHIEVED: "Achieved", NOT_ACHIEVED: "Not Achieved", INSUFFICIENT_DATA: "Insufficient Data" } as const;
const pct = (value: number | null | undefined) => value === null || value === undefined ? "—" : `${value.toFixed(1)}%`;
const date = (value: string | null | undefined) => value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

// ---- CSV helpers (the server re-parses and validates the file; this only builds the column mapping)
function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let field = ""; let quoted = false;
  for (let i = text.charCodeAt(0) === 0xfeff ? 1 : 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; } else field += c; }
    else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\r" || c === "\n") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(field); field = ""; rows.push(row); row = []; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}
const LIKERT = new Set(["strongly agree", "agree", "neutral", "neither agree nor disagree", "neither agree or disagree", "undecided", "disagree", "strongly disagree", "1", "2", "3", "4", "5"]);
const isLikertColumn = (rows: string[][], col: number) => {
  const values = rows.slice(1).map((row) => (row[col] ?? "").trim().toLowerCase().replace(/\s+/g, " ")).filter(Boolean);
  return values.length > 0 && values.filter((value) => LIKERT.has(value)).length * 2 >= values.length;
};
const csvCell = (value: unknown) => { const text = String(value ?? ""); return /[",\n\r]/.test(text) || /^[=+\-@]/.test(text) ? `"${(/^[=+\-@]/.test(text) ? "'" : "") + text.replace(/"/g, '""')}"` : text; };
const downloadCsv = (name: string, rows: unknown[][]) => {
  const blob = new Blob(["﻿" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
};

const GOAL_ICON = { SMART1: Compass, SMART2: MessagesSquare, SMART3: Sparkles, SMART4: ListChecks } as const;
const STATUS_ICON = { ACHIEVED: CheckCircle2, NOT_ACHIEVED: AlertTriangle, INSUFFICIENT_DATA: CircleDashed } as const;
const TARGET: Record<GoalKey, number> = { SMART1: 80, SMART2: 75, SMART3: 75, SMART4: 80 };

/** Horizontal bar on a 0–100 scale with a target tick. */
function Meter({ value, target, tone, label }: { value: number | null; target?: number; tone?: string; label: string }) {
  return <span className={`smart-meter ${tone ?? ""}`} role="img" aria-label={label} title={label}>
    <i style={{ width: `${Math.max(0, Math.min(100, value ?? 0))}%` }} />
    {target !== undefined && <s style={{ left: `${target}%` }} />}
  </span>;
}

function MetricCell({ metric, goal }: { metric: Metric; goal: GoalKey }) {
  if (metric.status === "MEASURED") {
    const met = (metric.percentage ?? 0) >= TARGET[goal];
    return <span className="smart-metric"><span><b>{pct(metric.percentage)}</b><small>{metric.correct}/{metric.total}</small></span><Meter value={metric.percentage} target={TARGET[goal]} tone={met ? "good" : "low"} label={`${pct(metric.percentage)} (${metric.correct} of ${metric.total}); target ${TARGET[goal]}%`} /></span>;
  }
  const label = { INCOMPLETE: "Incomplete", NO_PARTICIPATION: "No participation", NOT_ASSIGNED: "Not assigned" }[metric.status];
  return <span className={`smart-metric empty ${metric.status.toLowerCase()}`}>{label}</span>;
}

export default function AdminSmartGoalsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [classCode, setClassCode] = useState("");
  const [studentId, setStudentId] = useState("");
  const [module, setModule] = useState("ALL");
  const [includeUnapproved, setIncludeUnapproved] = useState(false);
  // ALL = every eligible student; SURVEY = only students whose account email matched a questionnaire respondent.
  const [population, setPopulation] = useState<"ALL" | "SURVEY">("ALL");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveyId, setSurveyId] = useState("");
  const [chapters, setChapters] = useState<{ id: string; title: string }[]>([]);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (classCode) params.set("classCode", classCode);
    if (studentId) params.set("studentId", studentId);
    if (module !== "ALL") params.set("module", module);
    if (includeUnapproved) params.set("includeUnapproved", "true");
    if (population === "SURVEY" && surveyId) params.set("surveyId", surveyId);
    return params.toString();
  }, [from, to, classCode, studentId, module, includeUnapproved, population, surveyId]);
  const [comparison, setComparison] = useState<Comparison | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const params = query;
    try {
      const response = await fetch(`${API_URL}/api/admin/smart-goals/report?${params}`);
      if (!response.ok) throw new Error();
      setReport(await response.json());
    } catch {
      setError("The SMART goal report could not be loaded. Make sure the updated backend is running and you are signed in as an admin.");
    } finally { setLoading(false); }
  }, [query]);

  // Per-student comparison for the selected questionnaire, using the same filters as the report.
  useEffect(() => {
    if (!surveyId) { setComparison(null); return; }
    let live = true;
    fetch(`${API_URL}/api/admin/smart-goals/surveys/${encodeURIComponent(surveyId)}/comparison?${query}`)
      .then((response) => response.ok ? response.json() : null)
      .then((body) => { if (live) setComparison(body); })
      .catch(() => { if (live) setComparison(null); });
    return () => { live = false; };
  }, [surveyId, query, report]);

  const loadSurveys = useCallback(async () => {
    const response = await fetch(`${API_URL}/api/admin/smart-goals/surveys`).catch(() => null);
    if (!response?.ok) return;
    const list: Survey[] = await response.json();
    setSurveys(list);
    setSurveyId((current) => list.some((item) => item.id === current) ? current : list[0]?.id ?? "");
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void loadSurveys(); }, [loadSurveys]);
  useEffect(() => {
    fetch(`${API_URL}/api/reply-coach/chapters`).then((response) => response.ok ? response.json() : []).then((list) => setChapters(Array.isArray(list) ? list.map((item: { id: string; title?: string }) => ({ id: item.id, title: item.title || item.id })) : [])).catch(() => undefined);
  }, []);

  const survey = surveys.find((item) => item.id === surveyId) ?? null;
  const surveyGroup = (key: string) => survey?.groups.find((group) => group.key === key) ?? null;

  const improvements = useMemo(() => {
    if (!report) return [];
    const items: string[] = [];
    for (const goal of report.goals) {
      if (goal.status === "NOT_ACHIEVED" && goal.percentage !== null) items.push(`${goal.name}: ${pct(goal.percentage)} measured against a ${goal.target}% target (${(goal.target - goal.percentage).toFixed(1)} points short). Review the items and activities behind this result before deciding on changes.`);
      if (goal.status === "INSUFFICIENT_DATA") items.push(`${goal.name}: not measurable from the current records. ${goal.key === "SMART4" ? "Create class assignments below so completion can be tracked from now on." : "More evaluation attempts are needed in the selected period."}`);
      if (goal.key !== "SMART4" && goal.eligibleStudents > 0 && goal.participatingStudents < goal.eligibleStudents)
        items.push(`${goal.name}: ${goal.participatingStudents} of ${goal.eligibleStudents} eligible students have measured answers (${goal.noParticipation ?? 0} with no participation, ${goal.incomplete ?? 0} incomplete). Low coverage limits how far the result generalises.`);
    }
    if (survey) {
      const lowest = [...survey.questions].filter((question) => question.percentage !== null).sort((a, b) => (a.percentage ?? 0) - (b.percentage ?? 0)).slice(0, 2);
      for (const question of lowest) items.push(`Questionnaire Q${question.number} had the lowest agreement (${pct(question.percentage)}): "${question.statement}". Consider reviewing the related content.`);
    }
    return items;
  }, [report, survey]);

  const exportSummary = () => {
    if (!report) return;
    const rows: unknown[][] = [
      ["JapLearn 2.0 SMART Goals Validation Summary (anonymized)"],
      ["Method", report.methodVersion, "Computed", report.computedAt],
      ["Calculated for", report.filters.population === "SURVEY_MATCHED" ? "Survey respondents matched by email only" : "All eligible students"],
      ["Period", report.filters.from ?? "all", report.filters.to ?? "all", "Class", report.filters.classCode || "all", "Module", report.filters.module],
      [],
      ["Objective", "Target %", "Measured %", "Correct/completed", "Total scored/assigned", "Status", "Students measured", "Eligible students", "Evidence source", "Questionnaire agreement %", "Questionnaire valid responses"],
      ...report.goals.map((goal) => { const group = surveyGroup(goal.key); return [goal.name, goal.target, goal.percentage ?? "Insufficient Data", goal.correct, goal.total, STATUS_LABEL[goal.status], goal.participatingStudents, goal.eligibleStudents, goal.evidence, group?.percentage ?? "", group?.valid ?? ""]; }),
      [],
      ["Student code", "Class", "Situational %", "Conversational %", "Politeness %", "Completion %", "Runs attempted", "Runs completed"],
      ...report.students.map((row) => [row.code, row.classCode ?? "", ...GOAL_KEYS.map((key) => row[key].status === "MEASURED" ? row[key].percentage : row[key].status), row.runsAttempted, row.runsCompleted]),
      [],
      ["Rules"], ...report.rules.map((rule) => [rule]),
    ];
    if (survey) rows.push([], ["Questionnaire", survey.fileName, "SHA-256", survey.sha256, "Counted respondents", survey.countedRows], ["Question", "Group", "Agree or Strongly Agree", "Valid responses", "%"], ...survey.questions.map((question) => [`Q${question.number}`, question.group, question.agree, question.valid, question.percentage ?? ""]));
    downloadCsv(`japlearn-smart-summary-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return <div className="admin-users-page smart-page">
    <header><div><small>EVALUATION</small><h1>SMART Goals Validation</h1><p>Measured game performance and questionnaire results for the four JapLearn 2.0 objectives. Results are read-only and computed from existing records.</p></div>
      <div className="header-actions smart-no-print"><button className="soft-button" onClick={() => void load()} disabled={loading}><RefreshCw size={16} />{loading ? "Loading…" : "Refresh"}</button><button className="soft-button" onClick={exportSummary} disabled={!report}><Download size={16} />Export CSV</button><button className="primary-button" onClick={() => window.print()} disabled={!report}><Printer size={16} />Summary PDF</button></div></header>

    <div className="smart-population smart-no-print" role="radiogroup" aria-label="Calculate SMART goals for">
      <span>Calculate for</span>
      <button type="button" role="radio" aria-checked={population === "ALL"} className={population === "ALL" ? "on" : ""} onClick={() => setPopulation("ALL")}><Users size={15} />All eligible students</button>
      <button type="button" role="radio" aria-checked={population === "SURVEY"} disabled={!surveys.length} className={population === "SURVEY" ? "on" : ""} onClick={() => setPopulation("SURVEY")} title={surveys.length ? undefined : "Upload a questionnaire first"}><ClipboardCheck size={15} />Survey respondents only (email matched)</button>
      {population === "SURVEY" && surveys.length > 0 && <label>Questionnaire<select value={surveyId} onChange={(event) => setSurveyId(event.target.value)}>{surveys.map((item) => <option key={item.id} value={item.id}>{item.fileName} · {item.matchedRows} matched</option>)}</select></label>}
    </div>
    <div className="smart-filters smart-no-print" aria-label="Evaluation filters">
      <label>From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
      <label>To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
      <label>Class<select value={classCode} onChange={(event) => setClassCode(event.target.value)}><option value="">All classes</option>{report?.classes.map((item) => <option key={item.classCode} value={item.classCode}>{item.classTitle ? `${item.classTitle} · ${item.classCode}` : item.classCode}</option>)}</select></label>
      <label>Student<select value={studentId} onChange={(event) => setStudentId(event.target.value)}><option value="">All eligible students</option>{report?.studentOptions.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.code}</option>)}</select></label>
      <label>Module<select value={module} onChange={(event) => setModule(event.target.value)}>{MODULES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="smart-check"><input type="checkbox" checked={includeUnapproved} onChange={(event) => setIncludeUnapproved(event.target.checked)} />Include unapproved accounts</label>
      <button type="button" className="admin-filter-clear" onClick={() => { setFrom(""); setTo(""); setClassCode(""); setStudentId(""); setModule("ALL"); setIncludeUnapproved(false); setPopulation("ALL"); }}>Clear filters</button>
    </div>
    {error && <div className="admin-error">{error}</div>}
    {notice && <div className="admin-notice">{notice}</div>}

    {report && <>
      {(() => {
        const achieved = report.goals.filter((goal) => goal.status === "ACHIEVED").length;
        const notMet = report.goals.filter((goal) => goal.status === "NOT_ACHIEVED").length;
        const noData = report.goals.filter((goal) => goal.status === "INSUFFICIENT_DATA").length;
        const measured = report.students.filter((row) => (["SMART1", "SMART2", "SMART3"] as GoalKey[]).some((key) => row[key].status === "MEASURED")).length;
        return <section className="smart-hero">
          <div className="smart-hero-main"><small>{report.filters.population === "SURVEY_MATCHED" ? "SURVEY RESPONDENTS ONLY · MATCHED BY EMAIL" : "ALL ELIGIBLE STUDENTS"}</small><h2><b>{achieved}</b> of 4 objectives achieved</h2>
            <div className="smart-hero-track" aria-hidden="true">{report.goals.map((goal) => <i key={goal.key} className={goal.status.toLowerCase()} title={`${goal.name}: ${STATUS_LABEL[goal.status]}`} />)}</div>
            <p>{notMet} not achieved · {noData} without enough data</p></div>
          <div className="smart-hero-stat"><Users /><div><b>{report.eligibleStudents}</b><span>{report.filters.population === "SURVEY_MATCHED" ? "matched survey respondents" : "eligible students"}</span></div></div>
          <div className="smart-hero-stat"><ClipboardCheck /><div><b>{measured}</b><span>with measured answers</span></div></div>
          <div className="smart-hero-stat"><RefreshCw /><div><b>{new Date(report.computedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</b><span>computed {date(report.computedAt)}</span></div></div>
        </section>;
      })()}

      <section className="smart-goal-grid" aria-label="Objective results">
        {report.goals.map((goal) => {
          const Icon = GOAL_ICON[goal.key]; const StatusIcon = STATUS_ICON[goal.status];
          const gap = goal.percentage === null ? null : goal.percentage - goal.target;
          return <article key={goal.key} className={`smart-goal-card ${goal.status.toLowerCase()}`}>
            <header><span className="smart-goal-icon"><Icon /></span><span className="smart-goal-key">{goal.key.replace("SMART", "SMART ")}</span><em className={`smart-status ${goal.status.toLowerCase()}`}><StatusIcon />{STATUS_LABEL[goal.status]}</em></header>
            <h3>{goal.name}</h3>
            <div className="smart-goal-value"><b>{goal.percentage === null ? "—" : pct(goal.percentage)}</b>{gap !== null && <span className={gap >= 0 ? "up" : "down"}>{gap >= 0 ? "+" : "−"}{Math.abs(gap).toFixed(1)} pts vs target</span>}</div>
            <div className="smart-goal-bar"><Meter value={goal.percentage} target={goal.target} tone={goal.status === "ACHIEVED" ? "good" : goal.status === "NOT_ACHIEVED" ? "low" : "none"} label={`${goal.name}: ${goal.percentage === null ? "no data" : pct(goal.percentage)}, target ${goal.target}%`} /><div className="smart-goal-scale"><span>0</span><span style={{ left: `${goal.target}%` }}>Target {goal.target}%</span><span>100</span></div></div>
            <dl>
              <div><dt>{goal.key === "SMART4" ? "Completed / assigned" : "Correct / scored"}</dt><dd>{goal.correct.toLocaleString()} / {goal.total.toLocaleString()}</dd></div>
              <div><dt>Students measured</dt><dd>{goal.participatingStudents} of {goal.eligibleStudents}</dd></div>
              {goal.key !== "SMART4" && <div><dt>No participation · incomplete</dt><dd>{goal.noParticipation} · {goal.incomplete}</dd></div>}
              <div><dt>Last updated</dt><dd>{date(goal.lastUpdated)}</dd></div>
            </dl>
            <p className="smart-evidence">{goal.evidence}</p>
          </article>;
        })}
      </section>

      <section className="smart-section">
        <div className="smart-section-head"><div><small>EVIDENCE SIDE BY SIDE</small><h2>Game accuracy and questionnaire agreement</h2></div>
          <div className="smart-legend"><span><i className="game" />Game records (measured)</span><span><i className="survey" />Questionnaire (Agree or Strongly Agree)</span><span><i className="target" />Target</span></div></div>
        <div className="smart-compare">
          {report.goals.map((goal) => { const group = surveyGroup(goal.key); return <div key={goal.key} className="smart-compare-row">
            <div className="smart-compare-name"><b>{goal.name}</b><small>target ≥ {goal.target}%</small></div>
            <div className="smart-compare-bars">
              <div><Meter value={goal.percentage} target={goal.target} tone="game" label={`Game records: ${goal.percentage === null ? "insufficient data" : pct(goal.percentage)} (${goal.correct}/${goal.total})`} /><span>{goal.percentage === null ? "Insufficient data" : pct(goal.percentage)}</span></div>
              <div><Meter value={group?.percentage ?? null} target={goal.target} tone="survey" label={`Questionnaire: ${group ? `${pct(group.percentage)} of ${group.valid} responses` : "no questionnaire"}`} /><span>{group ? pct(group.percentage) : "No questionnaire"}</span></div>
            </div>
          </div>; })}
        </div>
        <p className="smart-note">The two sources are not combined. Game records measure performance; the questionnaire measures how students perceive their learning.</p>
      </section>

      <section className="smart-section smart-no-print">
        <div className="smart-section-head"><div><small>PER STUDENT</small><h2>Student performance</h2></div><p>Percentages use the first evaluation attempt. Blank results are labelled, not scored as zero.</p></div>
        <div className="smart-table-wrap"><table className="smart-table">
          <thead><tr><th>Student</th><th>Class</th><th>Situational</th><th>Conversational</th><th>Politeness</th><th>Completion <span className="smart-th-target">done / assigned</span></th><th>Runs attempted / completed</th><th>Assessment dates</th></tr></thead>
          <tbody>
            {report.students.map((row) => <tr key={row.studentId}>
              <td><b>{row.name}</b><small>{row.code}</small></td>
              <td>{row.classCode ? <><b>{row.classCode}</b>{row.classTitle && <small>{row.classTitle}</small>}</> : <small>No class</small>}</td>
              {GOAL_KEYS.map((key) => <td key={key}><MetricCell metric={row[key]} goal={key} /></td>)}
              <td>{row.runsAttempted} / {row.runsCompleted}</td>
              <td className="smart-dates">{row.assessmentDates.length ? <>{row.assessmentDates.slice(-4).join(", ")}{row.assessmentDates.length > 4 && <small>+{row.assessmentDates.length - 4} more</small>}</> : <small>None</small>}</td>
            </tr>)}
            {!report.students.length && <tr><td colSpan={8} className="smart-empty">No eligible students match these filters.</td></tr>}
          </tbody>
        </table></div>
      </section>

      <AssignmentsPanel report={report} chapters={chapters} onChanged={() => void load()} setNotice={setNotice} />
    </>}

    <SurveyPanel surveys={surveys} survey={survey} setSurveyId={setSurveyId} onUploaded={async (id) => { await loadSurveys(); setSurveyId(id); }} setNotice={setNotice} />

    {survey && <ComparisonPanel comparison={comparison} hasIdentifier={!!survey.identifierHeader} />}

    {report && <section className="smart-section smart-summary">
      <div className="smart-section-head"><div><small>EVALUATION SUMMARY</small><h2>JapLearn 2.0 SMART objectives</h2></div><p>Period {String(report.filters.from ?? "start")} to {String(report.filters.to ?? "today")} · class {String(report.filters.classCode || "all")} · module {String(report.filters.module)} · {report.filters.population === "SURVEY_MATCHED" ? "survey respondents only (email matched)" : "all eligible students"} · {report.methodVersion}</p></div>
      <p className="smart-note">Game accuracy and questionnaire agreement are separate evidence sources. They are shown side by side and are never combined into one score. No student names or emails appear in this summary.</p>
      <div className="smart-table-wrap"><table className="smart-table smart-summary-table">
        <thead><tr><th>Objective</th><th>Target</th><th>Measured (game records)</th><th>Status</th><th>Students measured</th><th>Questionnaire agreement</th></tr></thead>
        <tbody>{report.goals.map((goal) => { const group = surveyGroup(goal.key); return <tr key={goal.key}>
          <td><b>{goal.name}</b><small>{goal.evidence}</small></td><td>≥ {goal.target}%</td>
          <td><b>{pct(goal.percentage)}</b><small>{goal.correct} / {goal.total}</small></td>
          <td><em className={`smart-status ${goal.status.toLowerCase()}`}>{STATUS_LABEL[goal.status]}</em></td>
          <td>{goal.participatingStudents} of {goal.eligibleStudents}</td>
          <td>{group ? <><b>{pct(group.percentage)}</b><small>{group.questions} · {group.valid} valid responses</small></> : <small>No questionnaire selected</small>}</td>
        </tr>; })}
        {survey && (() => { const support = surveyGroup("SUPPORT"); return support ? <tr><td><b>Supporting communication familiarity</b><small>Questionnaire only</small></td><td>—</td><td>—</td><td>—</td><td>—</td><td><b>{pct(support.percentage)}</b><small>{support.questions} · {support.valid} valid responses</small></td></tr> : null; })()}
        </tbody>
      </table></div>
      <div className="smart-summary-grid">
        <div><h3>Measurement limitations</h3><ul>{report.goals.flatMap((goal) => goal.limitations.map((item, index) => <li key={`${goal.key}-${index}`}><b>{SHORT[goal.key]}:</b> {item}</li>))}{survey && <li><b>Questionnaire:</b> {survey.countedRows} of {survey.totalRows} responses counted{survey.duplicateRows ? `, ${survey.duplicateRows} duplicate submissions excluded` : ""}{survey.unmatchedRows ? `, ${survey.unmatchedRows} not matched to a student account` : ""}{survey.noIdentifierRows ? `, ${survey.noIdentifierRows} without an email` : ""}. Agreement is self-reported perception, not measured skill.</li>}</ul></div>
        <div><h3>Areas needing improvement</h3>{improvements.length ? <ul>{improvements.map((item) => <li key={item}>{item}</li>)}</ul> : <p>All measured objectives meet their targets for this selection.</p>}<p className="smart-note">These are priorities to review, such as content difficulty, item wording or how activities are assigned. They do not mean a new feature is needed.</p></div>
      </div>
      <details className="smart-audit"><summary>Calculation rules and audit trail</summary><ol>{report.rules.map((rule) => <li key={rule}>{rule}</li>)}</ol><p>Records read: {Object.entries(report.audit.recordsRead).map(([key, value]) => `${key} ${value}`).join(" · ")}</p><p>Excluded from accuracy: {Object.keys(report.audit.recordsExcluded).length ? Object.entries(report.audit.recordsExcluded).map(([key, value]) => `${key}: ${value}`).join(" · ") : "none"}</p>{survey && <p>Questionnaire file {survey.fileName} · SHA-256 {survey.sha256.slice(0, 16)}… · uploaded {new Date(survey.uploadedAt).toLocaleString()} by {survey.uploadedBy}</p>}</details>
    </section>}
  </div>;
}

const UNIT_NAME: Record<string, string> = {
  RECOGNITION: "finished run", EXPRESSION_MATCH: "level/set", POLITENESS: "level", REPLY_COACH: "chapter",
  RESPONSE_RUSH: "finished run", DIALOGUE_RELAY: "finished run", TALK_WITH_SUMI: "session", GUIDED_PHRASE: "completed session", QUACKTALK: "session",
};
const UNIT_HELP: Record<string, string> = {
  RECOGNITION: "Each finished Ahiru Rescue run counts once. Game-over runs are not saved, so they never count.",
  EXPRESSION_MATCH: "Each distinct finished level/set counts once. Replaying the same set does not add to it.",
  POLITENESS: "Each distinct finished level counts once. Set 3 with no level filter to require all three levels.",
  REPLY_COACH: "Each distinct chapter marked complete counts once. Pick a chapter to require that one only.",
  RESPONSE_RUSH: "Each finished run counts once.", DIALOGUE_RELAY: "Each finished run counts once.",
  TALK_WITH_SUMI: "Each saved session with at least one spoken learner turn counts once.",
  GUIDED_PHRASE: "Each completed (not just started) practice session counts once.", QUACKTALK: "Each saved session with at least one learner turn counts once.",
};

function AssignmentsPanel({ report, chapters, onChanged, setNotice }: { report: Report; chapters: { id: string; title: string }[]; onChanged: () => void; setNotice: (text: string) => void }) {
  const [form, setForm] = useState({ classCode: "", activityKey: "POLITENESS", level: "", chapterId: "", requiredCount: "1", title: "", startsAt: "", dueAt: "" });
  const [saving, setSaving] = useState(false);
  const usesLevel = form.activityKey === "EXPRESSION_MATCH" || form.activityKey === "POLITENESS";
  const all = [...report.assignments.open.map((item) => ({ ...item, open: true })), ...report.assignments.counted.map((item) => ({ ...item, open: false }))];

  const create = async () => {
    if (!form.classCode || !form.startsAt || !form.dueAt) { setNotice("Choose a class, a start date and a due date."); return; }
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/smart-goals/assignments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        classCode: form.classCode, activityKey: form.activityKey, level: usesLevel && form.level ? Number(form.level) : null,
        chapterId: form.activityKey === "REPLY_COACH" && form.chapterId ? form.chapterId : null, requiredCount: Math.min(20, Math.max(1, Number(form.requiredCount) || 1)), title: form.title,
        startsAt: new Date(`${form.startsAt}T00:00:00`).toISOString(), dueAt: new Date(`${form.dueAt}T23:59:59`).toISOString(),
      }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "The assignment could not be saved.");
      setNotice("Assignment saved. Completion is read from the class's game records between the start and due dates.");
      setForm({ ...form, title: "", startsAt: "", dueAt: "" });
      onChanged();
    } catch (error) { setNotice(error instanceof Error ? error.message : "The assignment could not be saved."); }
    finally { setSaving(false); }
  };
  const remove = async (item: Assignment) => {
    if (!await confirmAction(`Remove the assignment "${item.title}"?`, { confirmLabel: "Remove assignment", description: "Only the assignment is removed. Student game records are not changed." })) return;
    const response = await fetch(`${API_URL}/api/admin/smart-goals/assignments/${encodeURIComponent(item.id)}`, { method: "DELETE" });
    setNotice(response.ok ? "Assignment removed." : "The assignment could not be removed.");
    onChanged();
  };

  return <section className="smart-section smart-no-print">
    <div className="smart-section-head"><div><small>SMART 4 · ASSIGNED ACTIVITIES</small><h2>Communication activity assignments</h2></div><p>New tracking. The system had no class assignment records for communication games before this, so completion is counted only for assignments created here, after their due date.</p></div>
    <div className="smart-assign-form">
      <label>Class<select value={form.classCode} onChange={(event) => setForm({ ...form, classCode: event.target.value })}><option value="">Choose a class</option>{report.classes.map((item) => <option key={item.classCode} value={item.classCode}>{item.classTitle ? `${item.classTitle} · ${item.classCode}` : item.classCode}</option>)}</select></label>
      <label>Activity<select value={form.activityKey} onChange={(event) => setForm({ ...form, activityKey: event.target.value })}>{ACTIVITIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      {usesLevel && <label>Level<select value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })}><option value="">Any level</option><option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option></select></label>}
      {form.activityKey === "REPLY_COACH" && <label>Chapter<select value={form.chapterId} onChange={(event) => setForm({ ...form, chapterId: event.target.value })}><option value="">Any chapter</option>{chapters.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}
      <label title={UNIT_HELP[form.activityKey]}>Required to complete<input type="number" min={1} max={20} value={form.requiredCount} onChange={(event) => setForm({ ...form, requiredCount: event.target.value })} /><em className="smart-hint">{form.requiredCount || 1} {UNIT_NAME[form.activityKey]}{Number(form.requiredCount) === 1 ? "" : "s"}</em></label>
      <label>Title<input maxLength={80} placeholder="e.g. Week 3 politeness practice" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
      <label>Starts<input type="date" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></label>
      <label>Due<input type="date" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} /></label>
      <button className="primary-button" onClick={() => void create()} disabled={saving}><ClipboardCheck size={16} />{saving ? "Saving…" : "Assign"}</button>
    </div>
    <div className="smart-table-wrap"><table className="smart-table">
      <thead><tr><th>Assignment</th><th>Class</th><th>Window</th><th>Students completed / assigned</th><th>Counted</th><th /></tr></thead>
      <tbody>
        {all.map((item) => <tr key={item.id}>
          <td><b>{item.title}</b><small>{activityLabel(item.activityKey)}{item.level ? ` · level ${item.level}` : ""}{item.chapterId ? ` · ${chapters.find((chapter) => chapter.id === item.chapterId)?.title ?? item.chapterId}` : ""} · needs {item.requiredCount ?? 1} finished {UNIT_NAME[item.activityKey] ?? "unit"}{(item.requiredCount ?? 1) === 1 ? "" : "s"}</small></td>
          <td>{item.classCode}</td><td>{date(item.startsAt)} – {date(item.dueAt)}</td>
          <td>{item.completedStudents ?? 0} / {item.assignedStudents ?? 0}</td>
          <td>{item.open ? <em className="smart-status insufficient_data">Open</em> : <em className="smart-status achieved">Counted</em>}</td>
          <td><button className="smart-icon-button" onClick={() => void remove(item)} aria-label={`Remove ${item.title}`}><Trash2 size={16} /></button></td>
        </tr>)}
        {!all.length && <tr><td colSpan={6} className="smart-empty">No assignments for the selected classes and period yet.</td></tr>}
      </tbody>
    </table></div>
  </section>;
}

function SurveyPanel({ surveys, survey, setSurveyId, onUploaded, setNotice }: { surveys: Survey[]; survey: Survey | null; setSurveyId: (id: string) => void; onUploaded: (id: string) => Promise<void>; setNotice: (text: string) => void }) {
  const [file, setFile] = useState<{ name: string; text: string; rows: string[][] } | null>(null);
  const [mapping, setMapping] = useState<number[]>([]);
  const [idColumn, setIdColumn] = useState(-1);
  const [matchedOnly, setMatchedOnly] = useState(false);
  const [uploading, setUploading] = useState(false);
  const header = file?.rows[0] ?? [];

  const choose = async (picked: File | undefined) => {
    if (!picked) return;
    if (!picked.name.toLowerCase().endsWith(".csv")) { setNotice("Please choose the .csv file exported from Google Forms."); return; }
    if (picked.size > 1_500_000) { setNotice("The CSV file is too large (limit about 1.5 MB)."); return; }
    const text = await picked.text();
    const rows = parseCsv(text);
    if (rows.length < 2) { setNotice("The CSV needs a header row and at least one response."); return; }
    const likert = rows[0].map((_, index) => index).filter((index) => isLikertColumn(rows, index));
    setFile({ name: picked.name, text, rows });
    setMapping(likert.slice(0, 10));
    setIdColumn(rows[0].findIndex((name) => /e-?mail/i.test(name)));
    setNotice(likert.length < 10 ? `Only ${likert.length} agreement columns were detected. Map the remaining questions manually.` : likert.length > 10 ? `${likert.length} agreement columns were found. The first 10 are mapped; check they are the Learning Effectiveness statements.` : "");
  };
  const upload = async () => {
    if (!file || mapping.length !== 10 || mapping.some((value) => value < 0)) { setNotice("Map all 10 questions before uploading."); return; }
    setUploading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/smart-goals/surveys`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: file.name, csv: file.text, questionColumns: mapping, identifierColumn: idColumn >= 0 ? idColumn : null, matchedOnly }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "The questionnaire could not be uploaded.");
      setFile(null); setNotice("Questionnaire uploaded and stored as a new record."); await onUploaded(body.id);
    } catch (error) { setNotice(error instanceof Error ? error.message : "The questionnaire could not be uploaded."); }
    finally { setUploading(false); }
  };

  return <section className="smart-section">
    <div className="smart-section-head"><div><small>QUESTIONNAIRE</small><h2>Student-Perceived Learning Effectiveness</h2></div><p>Share of valid respondents who chose Agree or Strongly Agree. This is perception data and is kept separate from game accuracy.</p></div>
    <div className="smart-survey-toolbar smart-no-print">
      <label className="smart-file"><FileUp size={16} />Upload Google Forms CSV<input type="file" accept=".csv,text/csv" onChange={(event) => { void choose(event.target.files?.[0]); event.target.value = ""; }} /></label>
      {surveys.length > 0 && <label>Questionnaire upload<select value={survey?.id ?? ""} onChange={(event) => setSurveyId(event.target.value)}>{surveys.map((item) => <option key={item.id} value={item.id}>{item.fileName} · {new Date(item.uploadedAt).toLocaleString()}</option>)}</select></label>}
    </div>
    {file && <div className="smart-mapping smart-no-print">
      <h3>Map the 10 Learning Effectiveness statements · {file.name} ({file.rows.length - 1} rows)</h3>
      <div className="smart-mapping-grid">{Array.from({ length: 10 }, (_, q) => <label key={q}>Q{q + 1} · {["Situational", "Situational", "Conversational", "Conversational", "Politeness", "Politeness", "Familiarity", "Familiarity", "Completion", "Completion"][q]}<select value={mapping[q] ?? -1} onChange={(event) => { const next = [...mapping]; next[q] = Number(event.target.value); setMapping(next); }}><option value={-1}>Choose a column</option>{header.map((name, index) => <option key={index} value={index}>{index + 1}. {name.slice(0, 90)}</option>)}</select></label>)}</div>
      <div className="smart-mapping-grid">
        <label>Respondent email column (optional)<select value={idColumn} onChange={(event) => setIdColumn(Number(event.target.value))}><option value={-1}>None: responses stay anonymous</option>{header.map((name, index) => <option key={index} value={index}>{index + 1}. {name.slice(0, 90)}</option>)}</select></label>
        <label className="smart-check"><input type="checkbox" disabled={idColumn < 0} checked={matchedOnly && idColumn >= 0} onChange={(event) => setMatchedOnly(event.target.checked)} />Count only responses matched to a student account</label>
      </div>
      <p className="smart-note">Responses are matched by email only: the email entered in the form is linked to the student account registered with that email, even if the name on the form is different. Names and student IDs are ignored. Repeat submissions from the same email are flagged and only the first counts. Emails are not stored.</p>
      <div className="header-actions"><button className="soft-button" onClick={() => setFile(null)}>Cancel</button><button className="primary-button" onClick={() => void upload()} disabled={uploading}><FileUp size={16} />{uploading ? "Uploading…" : "Validate and upload"}</button></div>
    </div>}
    {survey ? <>
      <div className="smart-survey-stats">
        <span><b>{survey.countedRows}</b>counted respondents</span><span><b>{survey.totalRows}</b>rows in file</span>
        {survey.identifierHeader && <><span><b>{survey.matchedRows}</b>matched to accounts</span><span className={survey.unmatchedRows ? "warn" : ""}><b>{survey.unmatchedRows}</b>unmatched</span></>}
        <span className={survey.duplicateRows ? "warn" : ""}><b>{survey.duplicateRows}</b>duplicates excluded</span>
        {!survey.identifierHeader && <span><b>—</b>not linked to accounts</span>}
      </div>
      <div className="smart-group-grid">{survey.groups.map((group) => <div key={group.key} className="smart-group"><small>{group.key === "SUPPORT" ? "SUPPORTING" : group.key.replace("SMART", "SMART ")} · {group.questions}</small><b>{pct(group.percentage)}</b><Meter value={group.percentage} tone="survey" label={`${group.label}: ${pct(group.percentage)}`} /><span>{group.label}</span><em>{group.agree} of {group.valid} responses agree</em></div>)}</div>
      <div className="smart-table-wrap"><table className="smart-table">
        <thead><tr><th>#</th><th>Statement</th><th>Objective</th><th>Agree or Strongly Agree</th><th>Valid responses</th></tr></thead>
        <tbody>{survey.questions.map((question) => <tr key={question.number}><td>Q{question.number}</td><td>{question.statement}</td><td>{question.group === "SUPPORT" ? "Supporting" : question.group.replace("SMART", "SMART ")}</td><td><span className="smart-metric"><span><b>{pct(question.percentage)}</b><small>{question.agree} responses</small></span><Meter value={question.percentage} tone="survey" label={`Q${question.number}: ${pct(question.percentage)}`} /></span></td><td>{question.valid}</td></tr>)}</tbody>
      </table></div>
    </> : !file && <div className="smart-empty">No questionnaire uploaded yet. Export the responses from Google Forms (Responses → Download CSV) and upload the file here.</div>}
  </section>;
}

type CompareCell = {
  surveyAgree: number; surveyValid: number; surveyPercentage: number | null; surveyStatus: string;
  actualCorrect: number; actualTotal: number; actualPercentage: number | null; actualStatus: string;
  difference: number | null; meetsTarget: boolean | null;
};
type CompareOverall = {
  key: GoalKey; target: number; surveyAgree: number; surveyValid: number; surveyPercentage: number | null;
  actualCorrect: number; actualTotal: number; actualPercentage: number | null; actualStatus: Goal["status"];
  difference: number | null; studentsWithPerformance: number;
};
type Comparison = {
  surveyId: string; fileName: string; matchedStudents: number;
  students: ({ studentId: string; code: string; name: string; classCode: string | null; rowNumber: number } & Record<GoalKey, CompareCell>)[];
  overall: CompareOverall[];
  flags: { unmatchedRows: number; noIdentifierRows: number; duplicateRows: number; matchedNotEligible: number; legacyMatchedRows: number; unmatchedRowNumbers: number[] };
};

const ACTUAL_EMPTY: Record<string, string> = { NO_PARTICIPATION: "No records", INCOMPLETE: "Incomplete", NOT_ASSIGNED: "Not assigned", INSUFFICIENT_DATA: "Insufficient data" };
const diffLabel = (value: number | null) => value === null ? "—" : `${value > 0 ? "+" : value < 0 ? "−" : "±"}${Math.abs(value).toFixed(1)} pts`;

function CompareCellView({ cell, target }: { cell: CompareCell; target: number }) {
  return <div className="smart-cmp-cell">
    <div className="smart-cmp-line"><span className="smart-cmp-tag actual">Actual</span>{cell.actualPercentage !== null
      ? <><b>{pct(cell.actualPercentage)}</b><small>{cell.actualCorrect}/{cell.actualTotal}</small></>
      : <em className="smart-flag">{ACTUAL_EMPTY[cell.actualStatus] ?? "Insufficient data"}</em>}</div>
    <div className="smart-cmp-line"><span className="smart-cmp-tag survey">Survey</span>{cell.surveyPercentage !== null
      ? <><b>{pct(cell.surveyPercentage)}</b><small>{cell.surveyAgree}/{cell.surveyValid}</small></>
      : <em className="smart-flag">No valid answers</em>}</div>
    <div className="smart-cmp-foot">
      <span className={`smart-diff ${cell.difference === null ? "" : cell.difference >= 0 ? "pos" : "neg"}`} title="Actual minus survey, in percentage points">{diffLabel(cell.difference)}</span>
      {cell.meetsTarget === null ? <span className="smart-target na">Target n/a</span> : cell.meetsTarget ? <span className="smart-target met"><CheckCircle2 />Meets {target}%</span> : <span className="smart-target miss"><AlertTriangle />Below {target}%</span>}
    </div>
  </div>;
}

function ComparisonPanel({ comparison, hasIdentifier }: { comparison: Comparison | null; hasIdentifier: boolean }) {
  if (!hasIdentifier) return <section className="smart-section smart-no-print"><div className="smart-section-head"><div><small>MATCHED RESPONDENTS</small><h2>Perception vs actual performance</h2></div></div><div className="smart-empty">This questionnaire was uploaded without an email column, so respondents cannot be matched to accounts. Upload it again and choose the identifier column.</div></section>;
  if (!comparison) return <section className="smart-section smart-no-print"><div className="smart-empty">Loading the per-student comparison…</div></section>;
  const f = comparison.flags;
  const target = (key: GoalKey) => TARGET[key];
  return <section className="smart-section">
    <div className="smart-section-head"><div><small>MATCHED RESPONDENTS</small><h2>Perception vs actual performance</h2></div>
      <p>Each matched student's questionnaire agreement beside their measured game result. Difference = Actual − Survey in percentage points. The two are never averaged.</p></div>

    <div className="smart-cmp-overall">
      {comparison.overall.map((item) => { const goal = GOAL_LABEL[item.key]; return <article key={item.key} className={item.actualStatus.toLowerCase()}>
        <header><span>{item.key.replace("SMART", "SMART ")}</span><em className={`smart-status ${item.actualStatus.toLowerCase()}`}>{STATUS_LABEL[item.actualStatus]}</em></header>
        <h3>{goal}</h3>
        <div className="smart-cmp-pair">
          <div><small>Actual</small><b>{pct(item.actualPercentage)}</b><span>{item.actualCorrect}/{item.actualTotal}</span></div>
          <div><small>Survey</small><b className="survey">{pct(item.surveyPercentage)}</b><span>{item.surveyAgree}/{item.surveyValid}</span></div>
        </div>
        <Meter value={item.actualPercentage} target={item.target} tone="game" label={`Actual ${pct(item.actualPercentage)}, target ${item.target}%`} />
        <Meter value={item.surveyPercentage} tone="survey" label={`Survey ${pct(item.surveyPercentage)}`} />
        <footer><span className={`smart-diff ${item.difference === null ? "" : item.difference >= 0 ? "pos" : "neg"}`}>{diffLabel(item.difference)}</span><span>{item.studentsWithPerformance} of {comparison.matchedStudents} with records</span></footer>
      </article>; })}
    </div>

    <div className="smart-flags">
      <span><b>{comparison.matchedStudents}</b>matched eligible students</span>
      <span className={f.unmatchedRows ? "warn" : ""} title={f.unmatchedRowNumbers.length ? `CSV rows: ${f.unmatchedRowNumbers.join(", ")}` : undefined}><b>{f.unmatchedRows}</b>unmatched respondents</span>
      <span className={f.noIdentifierRows ? "warn" : ""}><b>{f.noIdentifierRows}</b>without an email</span>
      <span className={f.duplicateRows ? "warn" : ""}><b>{f.duplicateRows}</b>duplicates excluded</span>
      <span className={f.matchedNotEligible ? "warn" : ""}><b>{f.matchedNotEligible}</b>matched but outside filters</span>
      {f.legacyMatchedRows > 0 && <span className="warn"><b>{f.legacyMatchedRows}</b>uploaded before matching was stored: re-upload to compare</span>}
    </div>

    <div className="smart-table-wrap smart-no-print"><table className="smart-table smart-cmp-table">
      <thead><tr><th>Student</th>{GOAL_KEYS.map((key) => <th key={key}>{SHORT[key]} <span className="smart-th-target">≥{target(key)}%</span></th>)}</tr></thead>
      <tbody>
        {comparison.students.map((row) => <tr key={row.studentId}>
          <td><b>{row.name}</b><small>{row.code}{row.classCode ? ` · ${row.classCode}` : ""} · CSV row {row.rowNumber}</small></td>
          {GOAL_KEYS.map((key) => <td key={key}><CompareCellView cell={row[key]} target={target(key)} /></td>)}
        </tr>)}
        {!comparison.students.length && <tr><td colSpan={5} className="smart-empty">No respondents matched an eligible student account for these filters.</td></tr>}
      </tbody>
    </table></div>
    <p className="smart-note">Unmatched respondents and missing game records are shown as insufficient data, never as zero. Respondents are matched by email only. Conversational accuracy uses Reply Coach, Response Rush, Dialogue Relay and Talk with Sumi context scores; pronunciation scores are never used.</p>
  </section>;
}
