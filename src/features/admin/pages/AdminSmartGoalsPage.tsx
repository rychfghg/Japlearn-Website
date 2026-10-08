import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDashed, ClipboardCheck, Compass, Download, FileUp, ListChecks, MessagesSquare, Printer, RefreshCw, Sparkles, Users } from "lucide-react";
import { API_URL, portalFetch as fetch } from "../../../lib/api";

type GoalKey = "SMART1" | "SMART2" | "SMART3" | "SMART4";
type Goal = {
  key: GoalKey; name: string; target: number; correct: number; total: number; percentage: number | null;
  status: "ACHIEVED" | "NOT_ACHIEVED" | "INSUFFICIENT_DATA"; eligibleStudents: number; participatingStudents: number;
  noParticipation: number | null; incomplete: number | null; lastUpdated: string | null; evidence: string; limitations: string[]; areas?: Area[];
  studentsMet?: number; studentsBelow?: number; answerCorrect?: number; answerTotal?: number; answerPercentage?: number | null;
};
type Metric = { correct: number; total: number; percentage: number | null; status: "MEASURED" | "INCOMPLETE" | "NO_PARTICIPATION"; activities?: ActivityStatus[] };
type ActivityStatus = { key: string; status: "COMPLETED" | "STARTED" | "NOT_STARTED"; completedAt: string | null };
type StudentRow = { studentId: string; code: string; name: string; classCode: string | null; classTitle: string | null; runsAttempted: number; runsCompleted: number; assessmentDates: string[] } & Record<GoalKey, Metric>;
type Report = {
  replyCoachEvaluations?: Record<string, number>;
  methodVersion: string; computedAt: string; rules: string[]; eligibleStudents: number; goals: Goal[]; students: StudentRow[];
  classes: { classCode: string; classTitle: string | null }[]; studentOptions: { id: string; code: string; name: string }[];
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
const ACTIVITY_LABEL: Record<string, string> = {
  RECOGNITION: "Ahiru Rescue", EXPRESSION_MATCH: "Expression Match", POLITENESS: "Politeness",
  REPLY_COACH: "Reply Coach", RESPONSE_RUSH: "Response Rush", DIALOGUE_RELAY: "Dialogue Relay",
  TALK_WITH_SUMI: "Talk with Sumi", GUIDED_PHRASE: "Guided Phrase",
};
const ACTIVITY_SHORT: Record<string, string> = {
  RECOGNITION: "AR", EXPRESSION_MATCH: "EM", POLITENESS: "PO", REPLY_COACH: "RC",
  RESPONSE_RUSH: "RR", DIALOGUE_RELAY: "DR", TALK_WITH_SUMI: "TS", GUIDED_PHRASE: "GP",
};
const ACTIVITY_STATUS_LABEL = { COMPLETED: "Completed", STARTED: "Started, not finished", NOT_STARTED: "Not started" } as const;

/** Eight small squares, one per communication activity: filled = completed, outlined = started only. */
function ActivityStrip({ items }: { items: ActivityStatus[] }) {
  return <span className="smart-strip">{items.map((item) => <i key={item.key} className={item.status.toLowerCase()} title={`${ACTIVITY_LABEL[item.key] ?? item.key}: ${ACTIVITY_STATUS_LABEL[item.status]}${item.completedAt ? ` (${new Date(item.completedAt).toLocaleDateString()})` : ""}`}>{ACTIVITY_SHORT[item.key] ?? "?"}</i>)}</span>;
}
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
  const label = { INCOMPLETE: "Incomplete", NO_PARTICIPATION: "No participation", }[metric.status];
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

  const survey = surveys.find((item) => item.id === surveyId) ?? null;
  const surveyGroup = (key: string) => survey?.groups.find((group) => group.key === key) ?? null;

  const improvements = useMemo(() => {
    if (!report) return [];
    const items: string[] = [];
    for (const goal of report.goals) {
      if (goal.status === "NOT_ACHIEVED" && goal.percentage !== null) items.push(`${goal.name}: ${pct(goal.percentage)} measured against a ${goal.target}% target (${(goal.target - goal.percentage).toFixed(1)} points short). Review the items and activities behind this result before deciding on changes.`);
      if (goal.status === "INSUFFICIENT_DATA") items.push(`${goal.name}: not measurable from the current records. ${goal.key === "SMART4" ? "No finished or started communication activities were found for these students in the selected period." : "More evaluation attempts are needed in the selected period."}`);
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
    <div className="smart-topbar smart-no-print">
      <div className="header-actions"><button className="soft-button" onClick={() => void load()} disabled={loading}><RefreshCw size={16} />{loading ? "Loading…" : "Refresh"}</button><button className="soft-button" onClick={exportSummary} disabled={!report}><Download size={16} />Export CSV</button><button className="primary-button" onClick={() => window.print()} disabled={!report}><Printer size={16} />Summary PDF</button></div></div>

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
              {goal.key === "SMART4"
                ? <div><dt>Activities completed / expected</dt><dd>{goal.correct.toLocaleString()} / {goal.total.toLocaleString()}</dd></div>
                : <div className="smart-dl-main"><dt>Students reaching {goal.target}%</dt><dd>{goal.correct} of {goal.total} qualified</dd></div>}
              {goal.key !== "SMART4" && <div><dt>Below target · no records</dt><dd>{goal.studentsBelow ?? 0} · {(goal.noParticipation ?? 0) + (goal.incomplete ?? 0)}</dd></div>}
              {goal.key !== "SMART4" && <div><dt>Answer accuracy (measured only)</dt><dd>{pct(goal.answerPercentage)} <small>{goal.answerCorrect ?? 0}/{goal.answerTotal ?? 0}</small></dd></div>}
              <div><dt>Students with records</dt><dd>{goal.participatingStudents} of {goal.eligibleStudents}</dd></div>
              <div><dt>Last updated</dt><dd>{date(goal.lastUpdated)}</dd></div>
            </dl>
            <p className="smart-evidence">{goal.evidence}</p>
          </article>;
        })}
      </section>

      <section className="smart-section">
        <div className="smart-section-head"><div><small>EVIDENCE SIDE BY SIDE</small><h2>Game accuracy and questionnaire agreement</h2></div>
          <div className="smart-legend"><span><i className="game" />Game records (students reaching target; completion for SMART 4)</span><span><i className="survey" />Questionnaire (Agree or Strongly Agree)</span><span><i className="target" />Target</span></div></div>
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
          <thead><tr><th>Student</th><th>Class</th><th>Situational</th><th>Conversational</th><th>Politeness</th><th>Completion <span className="smart-th-target">done / 8</span></th><th>Runs attempted / completed</th><th>Assessment dates</th></tr></thead>
          <tbody>
            {report.students.map((row) => <tr key={row.studentId}>
              <td><b>{row.name}</b><small>{row.code}</small></td>
              <td>{row.classCode ? <><b>{row.classCode}</b>{row.classTitle && <small>{row.classTitle}</small>}</> : <small>No class</small>}</td>
              {GOAL_KEYS.map((key) => <td key={key}><MetricCell metric={row[key]} goal={key} />{key === "SMART4" && row.SMART4.activities && <ActivityStrip items={row.SMART4.activities} />}</td>)}
              <td>{row.runsAttempted} / {row.runsCompleted}</td>
              <td className="smart-dates">{row.assessmentDates.length ? <>{row.assessmentDates.slice(-4).join(", ")}{row.assessmentDates.length > 4 && <small>+{row.assessmentDates.length - 4} more</small>}</> : <small>None</small>}</td>
            </tr>)}
            {!report.students.length && <tr><td colSpan={8} className="smart-empty">No eligible students match these filters.</td></tr>}
          </tbody>
        </table></div>
      </section>

    </>}

    <SurveyPanel surveys={surveys} survey={survey} setSurveyId={setSurveyId} onUploaded={async (id) => { await loadSurveys(); setSurveyId(id); }} setNotice={setNotice} />

    {survey && <ComparisonPanel comparison={comparison} hasIdentifier={!!survey.identifierHeader} />}

    {report && <RefactoringPanel report={report} survey={survey} comparison={comparison} setNotice={setNotice} />}

    {report && <section className="smart-section smart-summary">
      <div className="smart-section-head"><div><small>EVALUATION SUMMARY</small><h2>JapLearn 2.0 SMART objectives</h2></div><p>Period {String(report.filters.from ?? "start")} to {String(report.filters.to ?? "today")} · class {String(report.filters.classCode || "all")} · module {String(report.filters.module)} · {report.filters.population === "SURVEY_MATCHED" ? "survey respondents only (email matched)" : "all eligible students"} · {report.methodVersion}</p></div>
      <p className="smart-note">Game accuracy and questionnaire agreement are separate evidence sources. They are shown side by side and are never combined into one score. No student names or emails appear in this summary.</p>
      <div className="smart-table-wrap"><table className="smart-table smart-summary-table">
        <thead><tr><th>Objective</th><th>Target</th><th>Measured (game records)<span className="smart-th-target">students at target</span></th><th>Status</th><th>Students measured</th><th>Questionnaire agreement</th></tr></thead>
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

const ACTUAL_EMPTY: Record<string, string> = { NO_PARTICIPATION: "No records", INCOMPLETE: "Incomplete", INSUFFICIENT_DATA: "Insufficient data" };
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

type Area = { label: string; correct: number; total: number; percentage: number | null; students: number; started: number };
type Priority = { id?: string; goalKey: string; rank: number; included: boolean; learned: string; evidence: string; objective: string; aspect: string; expectedImprovement: string; updatedAt?: string; updatedBy?: string };

const QUESTIONS_5 = [
  ["learned", "1. What did we learn from the MVP validation?"],
  ["evidence", "2. What stakeholder feedback or evidence supports it?"],
  ["objective", "3. Which SMART objective or measurable outcome is affected?"],
  ["aspect", "4. What aspect of the requirements or design should be improved?"],
  ["expectedImprovement", "5. How is the change expected to improve the measurable outcome?"],
] as const;

const SURVEY_GROUP_OF: Record<GoalKey, number[]> = { SMART1: [1, 2], SMART2: [3, 4], SMART3: [5, 6], SMART4: [9, 10] };

/** Builds a starting draft from the measured evidence. The team must review and confirm the interpretation. */
function draftFor(goal: Goal, report: Report, survey: Survey | null, comparison: Comparison | null): Priority {
  const areas = (goal.areas ?? []).filter((item) => item.total > 0);
  const weakest = areas[0];
  const short = SHORT[goal.key];
  const group = survey?.groups.find((item) => item.key === goal.key) ?? null;
  const overall = comparison?.overall.find((item) => item.key === goal.key) ?? null;
  const statements = survey ? survey.questions.filter((q) => SURVEY_GROUP_OF[goal.key].includes(q.number)).sort((a, b) => (a.percentage ?? 101) - (b.percentage ?? 101)) : [];
  const lowStatement = statements[0];
  const isCompletion = goal.key === "SMART4";

  let learned: string;
  if (goal.status === "INSUFFICIENT_DATA") learned = `${goal.name} could not be measured yet: there are not enough validation records for the selected students and period.`;
  else if (goal.status === "NOT_ACHIEVED") learned = `${isCompletion ? `${goal.name} reached ${pct(goal.percentage)}` : `Only ${goal.correct} of ${goal.total} qualified students (${pct(goal.percentage)}) reached ${goal.target}% ${SHORT[goal.key].toLowerCase()} accuracy`} against the ${goal.target}% target (${(goal.target - (goal.percentage ?? 0)).toFixed(1)} points short).${weakest ? ` The weakest area was ${weakest.label} at ${pct(weakest.percentage)}.` : ""}`;
  else learned = `${goal.name} met the ${goal.target}% target at ${pct(goal.percentage)}${weakest ? `, but ${weakest.label} remained the lowest area at ${pct(weakest.percentage)}` : ""}.`;
  if (group?.percentage != null) learned += ` ${group.percentage}% of respondents agreed the app helped with this objective${overall?.difference != null ? `; matched students' measured result was ${Math.abs(overall.difference).toFixed(1)} points ${overall.difference >= 0 ? "above" : "below"} their perception` : ""}.`;

  const evidence: string[] = [];
  evidence.push(isCompletion
    ? `Game records: ${goal.correct} activities completed out of ${goal.total} expected (${pct(goal.percentage)}), ${goal.participatingStudents} of ${goal.eligibleStudents} students with records.`
    : `Game records: ${goal.correct} of ${goal.total} qualified students reached ${goal.target}% (${pct(goal.percentage)}); ${goal.studentsBelow ?? 0} were below target and ${(goal.noParticipation ?? 0) + (goal.incomplete ?? 0)} had no measured records. Answer accuracy among measured students: ${pct(goal.answerPercentage)} (${goal.answerCorrect ?? 0}/${goal.answerTotal ?? 0}).`);
  for (const item of areas.slice(0, 4)) evidence.push(isCompletion
    ? `${item.label}: completed by ${item.correct} of ${item.total} students (${pct(item.percentage)})${item.started ? `, ${item.started} started but did not finish` : ""}.`
    : `${item.label}: ${item.correct}/${item.total} correct (${pct(item.percentage)}) across ${item.students} students.`);
  if ((goal.key === "SMART2" || goal.key === "SMART3") && report.replyCoachEvaluations) {
    const ev = report.replyCoachEvaluations; const all = Object.values(ev).reduce((sum, value) => sum + value, 0);
    const poor = (ev.IMPOLITE ?? 0) + (ev.RUDE ?? 0) + (ev.AWKWARD ?? 0);
    if (all) evidence.push(`Reply Coach first-attempt ratings: ${poor} of ${all} answers were Awkward, Impolite or Rude (${(poor * 100 / all).toFixed(1)}%).`);
  }
  if (group) evidence.push(`Questionnaire (${group.questions}): ${pct(group.percentage)} agreement from ${group.valid} valid responses.`);
  if (lowStatement) evidence.push(`Lowest statement: Q${lowStatement.number} "${lowStatement.statement}" at ${pct(lowStatement.percentage)} agreement.`);

  const target = weakest?.label ?? "the activities linked to this objective";
  const aspect = {
    SMART1: `Situational scenario design in ${target}: review scenario context clarity, difficulty progression between levels, and the feedback shown after a wrong choice, so learners understand why a reply fits the situation.`,
    SMART2: `Response-feedback design in ${target}: explain why the best response fits the context, contrast it with awkward or impolite choices, and add a reinforcement attempt before the activity ends.`,
    SMART3: `Politeness instruction and assessment in ${target}: make formal vs informal cues explicit, explain keigo choices in feedback, and increase the number of items that explicitly assess politeness.`,
    SMART4: `Activity flow of the least-completed activities (${areas.slice(0, 2).map((item) => item.label).join(", ") || "none measured"}): review session length, how the activity is reached in the app, and progress reminders so students finish what they start.`,
  }[goal.key];

  return {
    goalKey: goal.key, rank: { SMART1: 1, SMART2: 2, SMART3: 3, SMART4: 4 }[goal.key], included: goal.status !== "INSUFFICIENT_DATA",
    learned, evidence: evidence.join("\n"),
    objective: `SMART ${goal.key.slice(-1)}: ${goal.name} (target ≥ ${goal.target}%)`,
    aspect,
    expectedImprovement: goal.percentage === null
      ? `Once measurable, the change should move ${short.toLowerCase()} results toward the ${goal.target}% target; to be verified on this dashboard with the same rules (${report.methodVersion}).`
      : `Expected to raise ${short.toLowerCase()} from ${pct(goal.percentage)}${weakest ? ` (and ${weakest.label} from ${pct(weakest.percentage)})` : ""} toward the ${goal.target}% target; to be verified by re-measuring on this dashboard after the change with the same rules (${report.methodVersion}).`,
  };
}

function RefactoringPanel({ report, survey, comparison, setNotice }: { report: Report; survey: Survey | null; comparison: Comparison | null; setNotice: (text: string) => void }) {
  const [saved, setSaved] = useState<Priority[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Priority>>({});
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`${API_URL}/api/admin/smart-goals/refactoring`).catch(() => null);
    if (response?.ok) setSaved(await response.json());
  }, []);
  useEffect(() => { void load(); }, [load]);

  const save = async (item: Priority, key: string) => {
    setBusy(key);
    try {
      const response = await fetch(`${API_URL}/api/admin/smart-goals/refactoring`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
      if (!response.ok) throw new Error();
      setDrafts((current) => { const next = { ...current }; delete next[key]; return next; });
      await load();
      setNotice("Refactoring priority saved.");
    } catch { setNotice("The refactoring priority could not be saved."); }
    finally { setBusy(""); }
  };
  const remove = async (item: Priority) => {
    if (!item.id || !window.confirm("Delete this refactoring priority?")) return;
    await fetch(`${API_URL}/api/admin/smart-goals/refactoring/${encodeURIComponent(item.id)}`, { method: "DELETE" });
    await load();
  };
  const edit = (key: string, base: Priority, field: keyof Priority, value: string | boolean | number) =>
    setDrafts((current) => ({ ...current, [key]: { ...(current[key] ?? base), [field]: value } }));

  const exportCsv = () => {
    const rows = saved.filter((item) => item.included).sort((a, b) => a.rank - b.rank);
    downloadCsv(`japlearn-refactoring-priorities-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["#", "SMART objective", ...QUESTIONS_5.map(([, label]) => label)],
      ...rows.map((item, index) => [index + 1, item.goalKey, item.learned, item.evidence, item.objective, item.aspect, item.expectedImprovement]),
    ]);
  };

  return <section className="smart-section smart-refactor">
    <div className="smart-section-head"><div><small>REQUIREMENTS &amp; DESIGN REFACTORING</small><h2>Refactoring priorities from MVP validation</h2></div>
      <div className="header-actions smart-no-print"><button className="soft-button" onClick={exportCsv} disabled={!saved.some((item) => item.included)}><Download size={16} />Export priorities CSV</button></div></div>

    <div className="smart-flow" aria-label="Refactoring progression">{["MVP validation", "Stakeholder feedback & evidence", "Improvement opportunities", "Requirements & design refactoring", "Improved system"].map((step, index) => <span key={step}><b>{index + 1}</b>{step}</span>)}</div>
    <div className="smart-refactor-guide">
      <div><h3>What counts as a refactoring priority</h3><p>A change to requirements or design that should make JapLearn better at reaching a SMART objective: accuracy, effectiveness, reliability, efficiency or quality of the learning outcome, backed by validation evidence.</p></div>
      <div><h3>What does not</h3><p>Bug fixes, minor UI/UX or cosmetic changes, fixing implementation problems, features already in the original MVP, or features not tied to an objective. A new feature qualifies only when the evidence shows it is needed for a SMART objective.</p></div>
    </div>

    {report.goals.map((goal) => {
      const Icon = GOAL_ICON[goal.key];
      const areas = (goal.areas ?? []).filter((item) => item.total > 0);
      const group = survey?.groups.find((item) => item.key === goal.key) ?? null;
      const overall = comparison?.overall.find((item) => item.key === goal.key) ?? null;
      const mine = saved.filter((item) => item.goalKey === goal.key);
      const draftKey = `new-${goal.key}`;
      return <article key={goal.key} className={`smart-refactor-goal ${goal.status.toLowerCase()}`}>
        <header><span className="smart-goal-icon"><Icon /></span><div><small>{goal.key.replace("SMART", "SMART ")} · target ≥ {goal.target}%</small><h3>{goal.name}</h3></div><em className={`smart-status ${goal.status.toLowerCase()}`}>{STATUS_LABEL[goal.status]}</em></header>
        <div className="smart-refactor-body">
          <div className="smart-evidence-card">
            <h4>Evidence from validation</h4>
            <div className="smart-evidence-kpis">
              <div><small>Measured</small><b>{pct(goal.percentage)}</b><span>{goal.correct}/{goal.total}</span></div>
              <div><small>Survey agreement</small><b className="survey">{group ? pct(group.percentage) : "—"}</b><span>{group ? `${group.valid} responses` : "no questionnaire"}</span></div>
              <div><small>Actual − survey</small><b>{overall?.difference == null ? "—" : diffLabel(overall.difference)}</b><span>matched students</span></div>
            </div>
            <h5>{goal.key === "SMART4" ? "Least-completed activities" : "Weakest specific areas"}</h5>
            {areas.length ? <ul className="smart-area-list">{areas.slice(0, 5).map((item) => <li key={item.label}>
              <span>{item.label}</span>
              <Meter value={item.percentage} target={goal.target} tone={(item.percentage ?? 0) >= goal.target ? "good" : "low"} label={`${item.label}: ${pct(item.percentage)}`} />
              <b>{pct(item.percentage)}</b><small>{goal.key === "SMART4" ? `${item.correct}/${item.total} students${item.started ? ` · ${item.started} unfinished` : ""}` : `${item.correct}/${item.total} · ${item.students} students`}</small>
            </li>)}</ul> : <p className="smart-note">No measured records for this objective in the current selection.</p>}
          </div>

          <div className="smart-priority-stack">
            {mine.map((item) => { const key = item.id!; const value = drafts[key] ?? item; return <PriorityForm key={key} value={value} dirty={!!drafts[key]} busy={busy === key}
              onChange={(field, next) => edit(key, item, field, next)} onSave={() => void save(value, key)} onDelete={() => void remove(item)} />; })}
            {drafts[draftKey]
              ? <PriorityForm value={drafts[draftKey]} dirty busy={busy === draftKey} isNew onChange={(field, next) => edit(draftKey, drafts[draftKey], field, next)} onSave={() => void save(drafts[draftKey], draftKey)} onDelete={() => setDrafts((current) => { const next = { ...current }; delete next[draftKey]; return next; })} />
              : <div className="smart-priority-actions smart-no-print">
                <button className="primary-button" onClick={() => setDrafts((current) => ({ ...current, [draftKey]: draftFor(goal, report, survey, comparison) }))}><Sparkles size={16} />{mine.length ? "Draft another from evidence" : "Draft from evidence"}</button>
                <button className="soft-button" onClick={() => setDrafts((current) => ({ ...current, [draftKey]: { goalKey: goal.key, rank: 9, included: true, learned: "", evidence: "", objective: `SMART ${goal.key.slice(-1)}: ${goal.name} (target ≥ ${goal.target}%)`, aspect: "", expectedImprovement: "" } }))}>Write blank</button>
              </div>}
          </div>
        </div>
      </article>;
    })}
    <p className="smart-note">Drafts are generated only from the numbers on this dashboard. Review each one with your team and add the stakeholders' own words (interview notes, comments from the form) before submitting. Nothing is saved until you click Save.</p>
  </section>;
}

function PriorityForm({ value, dirty, busy, isNew, onChange, onSave, onDelete }: { value: Priority; dirty: boolean; busy: boolean; isNew?: boolean; onChange: (field: keyof Priority, value: string | boolean | number) => void; onSave: () => void; onDelete: () => void }) {
  return <div className={`smart-priority ${value.included ? "" : "excluded"}`}>
    <div className="smart-priority-top">
      <span className={`smart-chip ${isNew ? "draft" : dirty ? "draft" : "saved"}`}>{isNew ? "Draft" : dirty ? "Unsaved changes" : "Saved"}</span>
      <label className="smart-check"><input type="checkbox" checked={value.included} onChange={(event) => onChange("included", event.target.checked)} />Include in submission</label>
      <label className="smart-rank">Priority<input type="number" min={1} max={99} value={value.rank} onChange={(event) => onChange("rank", Number(event.target.value) || 1)} /></label>
    </div>
    {QUESTIONS_5.map(([field, label]) => <label key={field} className="smart-q"><span>{label}</span>
      <textarea rows={field === "evidence" ? 5 : field === "objective" ? 1 : 3} maxLength={3000} value={String(value[field] ?? "")} onChange={(event) => onChange(field, event.target.value)} /></label>)}
    <div className="smart-priority-foot smart-no-print">
      {value.updatedAt && !dirty && <small>Saved {new Date(value.updatedAt).toLocaleString()}{value.updatedBy ? ` by ${value.updatedBy}` : ""}</small>}
      <button className="soft-button" onClick={onDelete}>{isNew ? "Discard" : "Delete"}</button>
      <button className="primary-button" onClick={onSave} disabled={busy || (!dirty && !isNew)}>{busy ? "Saving…" : "Save"}</button>
    </div>
  </div>;
}
