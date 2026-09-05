import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileBarChart,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import StatusMessage from "../components/StatusMessage";
import { teacherApi } from "../services/teacherApi";
import type { CommunicationReport, Student } from "../types";
import {
  buildScorecards,
  downloadCsv,
  REPORT_SECTIONS,
  scorecardsToCsv,
  type Scorecard,
  type SectionKey,
} from "../utils/reportBuilder";

const ALL_SECTION_KEYS = REPORT_SECTIONS.map((section) => section.key);
const PAGE_SIZE = 5;

/**
 * The backend returns raw Spring Boot error JSON (timestamp/status/path).
 * Turn that into something a teacher can actually read.
 */
function friendlyError(error: unknown, fallback: string): string {
  if (!(error instanceof Error) || !error.message) return fallback;
  try {
    const parsed = JSON.parse(error.message);
    if (parsed && typeof parsed === "object") {
      if (parsed.status === 404) return `${fallback} (endpoint not available on the backend yet)`;
      return parsed.message || parsed.error || fallback;
    }
  } catch {
    // Not JSON — the message was already plain text.
  }
  return error.message;
}

export default function ReportsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsError, setStudentsError] = useState("");

  // Masterlist builder (lessons + games, any student or the whole roster).
  const [scope, setScope] = useState(""); // "" = all students
  const [sections, setSections] = useState<SectionKey[]>(ALL_SECTION_KEYS);
  const [cards, setCards] = useState<Scorecard[] | null>(null);
  const [page, setPage] = useState(0);
  const [building, setBuilding] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [buildError, setBuildError] = useState("");

  // Existing communication mastery report (single student, backend-generated).
  const [selectedEmail, setSelectedEmail] = useState("");
  const [report, setReport] = useState<CommunicationReport | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    teacherApi
      .getAllStudents()
      .then((data) => {
        setStudents(data);
        if (data[0]) setSelectedEmail(data[0].email);
      })
      .catch((error) =>
        setStudentsError(error instanceof Error ? error.message : "Could not load students."),
      );
  }, []);

  useEffect(() => {
    if (!selectedEmail) return;
    teacherApi
      .getReport(selectedEmail)
      .then(setReport)
      .catch(() => setReport(null));
  }, [selectedEmail]);

  const generate = async () => {
    try {
      setReport(await teacherApi.generateReport(selectedEmail));
      setMessage("Communication progress report generated successfully.");
    } catch (error) {
      setMessage(friendlyError(error, "Could not generate report."));
    }
  };

  const toggleSection = (key: SectionKey) => {
    setSections((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  };

  const scopedStudent = useMemo(
    () => students.find((student) => student.email === scope) || null,
    [students, scope],
  );

  const runBuild = async () => {
    if (!sections.length || building) return;
    const targets = scopedStudent ? [scopedStudent] : students;
    if (!targets.length) return;

    setBuilding(true);
    setBuildError("");
    setProgress({ done: 0, total: targets.length });

    try {
      const results = await buildScorecards(targets, sections, (done, total) =>
        setProgress({ done, total }),
      );
      setCards(results);
      setPage(0);

      const csv = scorecardsToCsv(results, sections);
      const stamp = new Date().toISOString().slice(0, 10);
      const scopeLabel = scopedStudent
        ? `${scopedStudent.fname}-${scopedStudent.lname}`.toLowerCase().replace(/\s+/g, "-")
        : "all-students";
      downloadCsv(`japlearn-masterlist-${scopeLabel}-${stamp}.csv`, csv);
    } catch (error) {
      setBuildError(friendlyError(error, "Could not build the masterlist."));
    } finally {
      setBuilding(false);
    }
  };

  const redownload = () => {
    if (!cards) return;
    const stamp = new Date().toISOString().slice(0, 10);
    const scopeLabel = scopedStudent
      ? `${scopedStudent.fname}-${scopedStudent.lname}`.toLowerCase().replace(/\s+/g, "-")
      : "all-students";
    downloadCsv(`japlearn-masterlist-${scopeLabel}-${stamp}.csv`, scorecardsToCsv(cards, sections));
  };

  const pageCount = cards ? Math.max(1, Math.ceil(cards.length / PAGE_SIZE)) : 1;
  const pagedCards = cards?.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE) ?? [];

  const measuredCards = cards?.filter((card) => card.overall != null) ?? [];
  const avgOverall = measuredCards.length
    ? Math.round(
        measuredCards.reduce((sum, card) => sum + (card.overall ?? 0), 0) /
          measuredCards.length,
      )
    : 0;

  return (
    <section className="full-panel">
      {studentsError && <StatusMessage>{studentsError}</StatusMessage>}

      <div className="tile-head">
        <div>
          <span className="eyebrow">REPORT CENTER</span>
          <h3><FileBarChart /> Student masterlist</h3>
          <p>
            Pull real names and scoring straight from lessons and the arcade,
            situational, speaking, and reply-coach services — for one learner
            or your whole roster — and download it as a spreadsheet.
          </p>
        </div>
      </div>

      <div className="tool-bar report-scope-row">
        <select value={scope} onChange={(event) => setScope(event.target.value)}>
          <option value="">All students ({students.length})</option>
          {students.map((student) => (
            <option key={student.email} value={student.email}>
              {student.fname} {student.lname}
            </option>
          ))}
        </select>

        <div className="chip-row">
          {REPORT_SECTIONS.map((section) => (
            <button
              key={section.key}
              type="button"
              className={`chip ${sections.includes(section.key) ? "on" : ""}`}
              onClick={() => toggleSection(section.key)}
              title={section.hint}
            >
              {section.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="build-action"
          onClick={runBuild}
          disabled={building || !sections.length}
        >
          {building ? <Loader2 className="spin" /> : <Download />}
          {building ? "Building…" : "Build & download CSV"}
        </button>
      </div>

      {building && (
        <>
          <div className="build-progress">
            <div style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
          </div>
          <p className="build-progress-label">
            Fetched {progress.done} of {progress.total} student{progress.total === 1 ? "" : "s"}…
          </p>
        </>
      )}
      {buildError && <StatusMessage>{buildError}</StatusMessage>}
      {!sections.length && (
        <StatusMessage>Pick at least one source above to build a masterlist.</StatusMessage>
      )}

      {cards && !building ? (
        <>
          <div className="report-metric-row">
            <div><b>{cards.length}</b><small>{scopedStudent ? "Student" : "Students"}</small></div>
            <div><b>{avgOverall}%</b><small>Avg. overall</small></div>
            <div><b>{sections.length}</b><small>Sources included</small></div>
          </div>
          <div className="score-list">
            {pagedCards.map((card, index) => (
              <article className="score-row" key={card.student.email}>
                <div className="score-who">
                  <span
                    style={{
                      background: TONES[(page * PAGE_SIZE + index) % 4].bg,
                      color: TONES[(page * PAGE_SIZE + index) % 4].fg,
                    }}
                  >
                    {card.student.fname?.[0]}
                    {card.student.lname?.[0]}
                  </span>
                  <div>
                    <b>{card.student.fname} {card.student.lname}</b>
                    <small>{card.student.classCode || "Unassigned"}</small>
                  </div>
                </div>
                <div className="score-metrics">
                  {card.lessons && (
                    <span className="score-chip">
                      Lessons {card.lessons.completed}/{card.lessons.total} · {card.lessons.percent}%
                    </span>
                  )}
                  {card.arcade && (
                    <span className={`score-chip ${card.arcade.games.length ? "" : "muted"}`}>
                      Arcade {card.arcade.games.length} game{card.arcade.games.length === 1 ? "" : "s"}
                    </span>
                  )}
                  {card.situate && (
                    <span className={`score-chip ${card.situate.attempts ? "" : "muted"}`}>
                      QuackSituate {card.situate.attempts ? `${card.situate.avgAccuracy}%` : "no attempts"}
                    </span>
                  )}
                  {card.talk && (
                    <span className={`score-chip ${card.talk.sessions ? "" : "muted"}`}>
                      QuackTalk {card.talk.sessions} session{card.talk.sessions === 1 ? "" : "s"}
                    </span>
                  )}
                  {card.reply && (
                    <span className={`score-chip ${card.reply.chapters ? "" : "muted"}`}>
                      Reply Coach {card.reply.completed}/{card.reply.chapters || 0} done
                    </span>
                  )}
                </div>
                <div className="score-overall">
                  <b>{card.overall != null ? `${card.overall}%` : "—"}</b>
                  <small>Overall</small>
                </div>
              </article>
            ))}
          </div>

          {pageCount > 1 && (
            <div className="pager">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={page === 0}
              >
                <ChevronLeft /> Prev
              </button>
              <span>
                Page {page + 1} of {pageCount} · {cards.length} student{cards.length === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
                disabled={page >= pageCount - 1}
              >
                Next <ChevronRight />
              </button>
            </div>
          )}

          <button type="button" className="tile-link" onClick={redownload} style={{ marginTop: 14 }}>
            Download this masterlist again <Download />
          </button>
        </>
      ) : !building && !cards ? (
        <div className="state-empty">
          <span><FileBarChart /></span>
          <h3>No masterlist yet</h3>
          <p>Pick a scope and sources above, then build the file.</p>
        </div>
      ) : null}

      <div className="tile-head" style={{ marginTop: 26 }}>
        <div>
          <span className="eyebrow">COMMUNICATION MASTERY</span>
          <h3><Users /> Single-student report</h3>
          <p>The same backend-generated communication report used by the mobile teacher app.</p>
        </div>
      </div>

      {message && (
        <StatusMessage type={message.includes("successfully") ? "success" : "error"}>
          {message}
        </StatusMessage>
      )}

      <div className="tool-bar report-scope-row">
        <select value={selectedEmail} onChange={(event) => setSelectedEmail(event.target.value)}>
          {students.map((student) => (
            <option key={student.email} value={student.email}>
              {student.fname} {student.lname}
            </option>
          ))}
        </select>
        <button type="button" className="head-action" onClick={generate}>
          <RefreshCw /> Generate report
        </button>
        <a className="head-action" href={teacherApi.reportExportUrl(selectedEmail)}>
          <Download /> Export
        </a>
      </div>

      {report ? (
        <>
          <div className="report-metric-row">
            <div><b>{report.completionRate}%</b><small>Completion rate</small></div>
            <div><b>{report.masteryProgress}%</b><small>Mastery progress</small></div>
            <div><b>{report.reinforcementCompleted}</b><small>Reinforcement</small></div>
          </div>
          <div className="report-history">
            {report.masteryHistory?.map((item) => (
              <article key={item.stage}>
                <span>{item.score}</span>
                <div>
                  <b>{item.stage}</b>
                  <small>{item.status}</small>
                </div>
                <div className="mastery-bar-track small">
                  <div className="mastery-bar-fill" style={{ width: `${item.score}%` }} />
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="state-empty">
          <span><FileBarChart /></span>
          <h3>No report generated</h3>
          <p>Select a student and generate their communication progress report.</p>
        </div>
      )}
    </section>
  );
}

const TONES = [
  { bg: "#eee3f8", fg: "#7828d0" },
  { bg: "#edf7e6", fg: "#57952e" },
  { bg: "#fff1dc", fg: "#d8841c" },
  { bg: "#fbe7ee", fg: "#c64978" },
];
