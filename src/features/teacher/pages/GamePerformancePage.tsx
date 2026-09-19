import { BarChart3, Clock3, Gamepad2, ListOrdered, MessageCircleMore, RotateCw, Trophy, TriangleAlert, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ScopeBar, { DEFAULT_SCOPE, type Scope, scopeLabel, studentsInScope } from "../components/ScopeBar";
import { teacherApi } from "../services/teacherApi";
import type { GameAttempt, Student, TeacherGamePerformance } from "../types";

const pct = (value: number | null) => (value == null ? "—" : `${Math.round(value)}%`);
const when = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

type Summary = { attempts: number; latest: number | null; average: number | null; highest: number | null; latestAt: string | null };

/** Latest / average / highest over the scored attempts in `attempts`. */
function summarize(attempts: GameAttempt[]): Summary {
  const sorted = [...attempts].sort((a, b) => new Date(b.playedAt || 0).getTime() - new Date(a.playedAt || 0).getTime());
  const scored = sorted.filter((a) => a.percentage != null);
  const values = scored.map((a) => a.percentage as number);
  return {
    attempts: attempts.length,
    latest: scored[0]?.percentage ?? null,
    average: values.length ? values.reduce((s, v) => s + v, 0) / values.length : null,
    highest: values.length ? Math.max(...values) : null,
    latestAt: sorted[0]?.playedAt ?? null,
  };
}

function SpeakingFeedback({ attempt }: { attempt: GameAttempt }) {
  const scores = [
    ["Pronunciation", attempt.pronunciationScore], ["Accuracy", attempt.accuracyScore],
    ["Fluency", attempt.fluencyScore], ["Completeness", attempt.completenessScore],
    ["Conversation", attempt.contextualAccuracy],
  ] as const;
  const hasDetails = Boolean(attempt.feedbackSummary || attempt.areasForImprovement?.length
    || attempt.expressionsPracticed?.length || scores.some(([, value]) => value != null));
  if (!hasDetails) return null;
  return (
    <details className="gs-feedback">
      <summary><MessageCircleMore /> Speaking feedback</summary>
      <div>
        {attempt.feedbackSummary && <p>{attempt.feedbackSummary}</p>}
        <div className="gs-feedback-scores">
          {scores.filter(([, v]) => v != null).map(([label, v]) => <span key={label}><small>{label}</small><b>{pct(v)}</b></span>)}
        </div>
        {attempt.areasForImprovement?.length > 0 && <p><b>Practice next:</b> {attempt.areasForImprovement.join(" · ")}</p>}
        {attempt.expressionsPracticed?.length > 0 && <p><b>Expressions practiced:</b> {attempt.expressionsPracticed.join(" · ")}</p>}
      </div>
    </details>
  );
}

export default function GamePerformancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [scope, setScope] = useState<Scope>(DEFAULT_SCOPE);
  const [rosterError, setRosterError] = useState("");
  const [performances, setPerformances] = useState<Record<string, TeacherGamePerformance>>({});
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);
  const [game, setGame] = useState("All games");
  const [activity, setActivity] = useState("All activities");
  const [view, setView] = useState<"board" | "log">("board");

  useEffect(() => {
    let active = true;
    teacherApi.getAllStudents()
      .then((data) => { if (active) setStudents(data); })
      .catch(() => { if (active) setRosterError("Your class roster could not be loaded. Please refresh or sign in again."); });
    return () => { active = false; };
  }, []);

  const targets = useMemo(() => studentsInScope(students, scope), [students, scope]);

  useEffect(() => {
    const emails = targets.map((s) => s.email);
    if (!emails.length) { setPerformances({}); setLoading(false); return; }
    let active = true;
    setLoading(true); setPerformances({}); setLoadError("");
    void (async () => {
      const loaded: Record<string, TeacherGamePerformance> = {};
      let failed = 0;
      // Bounded batches so a whole-class sheet doesn't flood the API.
      for (let start = 0; start < emails.length; start += 4) {
        const batch = await Promise.allSettled(emails.slice(start, start + 4).map((email) => teacherApi.getGamePerformance(email)));
        batch.forEach((result, index) => {
          if (result.status === "fulfilled") loaded[emails[start + index].toLowerCase()] = result.value;
          else failed += 1;
        });
        if (!active) return;
      }
      setPerformances(loaded);
      if (failed) setLoadError(`${failed} learner record${failed === 1 ? "" : "s"} could not be loaded, so this sheet is incomplete. Try Refresh.`);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [targets, reload]);

  useEffect(() => { setGame("All games"); setActivity("All activities"); }, [scope]);

  const loadedStudents = targets.filter((s) => performances[s.email.toLowerCase()]);
  const attemptsOf = (email: string) => performances[email.toLowerCase()]?.attempts ?? [];
  const allAttempts = useMemo(
    () => loadedStudents.flatMap((s) => attemptsOf(s.email).map((attempt) => ({ student: s, attempt })))
      .sort((a, b) => new Date(b.attempt.playedAt || 0).getTime() - new Date(a.attempt.playedAt || 0).getTime()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [performances, targets],
  );
  const games = useMemo(() => [...new Set(allAttempts.map((r) => r.attempt.game))].sort(), [allAttempts]);
  const activities = useMemo(
    () => [...new Set(allAttempts.filter((r) => r.attempt.game === game).map((r) => r.attempt.activity))].sort(),
    [allAttempts, game],
  );
  const matches = (a: GameAttempt) =>
    (game === "All games" || a.game === game) && (activity === "All activities" || a.activity === activity);

  const inView = allAttempts.filter((r) => matches(r.attempt));
  const overall = summarize(inView.map((r) => r.attempt));
  const single = scope.mode === "student";

  const rows = loadedStudents
    .map((s) => ({ student: s, summary: summarize(attemptsOf(s.email).filter(matches)) }))
    .sort((a, b) => (b.summary.average ?? -1) - (a.summary.average ?? -1));

  // For one learner: a card per game, or per activity once a game is picked.
  const cardGroups = single && loadedStudents[0]
    ? (game === "All games" ? games : activities).map((name) => ({
        name,
        summary: summarize(attemptsOf(loadedStudents[0].email).filter((a) => (game === "All games" ? a.game === name : a.game === game && a.activity === name))),
      })).filter((g) => g.summary.attempts > 0)
    : [];

  return (
    <section className="gs-page">
      <ScopeBar students={students} scope={scope} onChange={setScope} disabled={loading}>
        <button type="button" className="rp-secondary" onClick={() => setReload((n) => n + 1)} disabled={!targets.length || loading}>
          <RotateCw className={loading ? "rp-spin" : ""} /> Refresh
        </button>
      </ScopeBar>

      {rosterError && <p className="rp-alert" role="alert"><TriangleAlert /> {rosterError}</p>}
      {loadError && <p className="rp-alert" role="alert"><TriangleAlert /> {loadError}</p>}

      {loading && (
        <div className="rp-loading"><div className="rp-loading-track indeterminate"><span /></div><p>Loading scores for {scopeLabel(students, scope)}…</p></div>
      )}

      {!loading && !targets.length && !rosterError && (
        <div className="rp-empty"><span><Users /></span><h3>No learners here yet</h3><p>No students match this selection.</p></div>
      )}

      {!loading && targets.length > 0 && (
        <>
          <div className="rp-stats">
            <div><span className="rp-stat-icon violet"><Users /></span><b>{loadedStudents.length}</b><small>{single ? "Learner" : "Learners"}</small></div>
            <div><span className="rp-stat-icon green"><Gamepad2 /></span><b>{overall.attempts}</b><small>Attempts</small></div>
            <div><span className="rp-stat-icon orange"><Trophy /></span><b>{pct(overall.average)}</b><small>Average score</small></div>
            <div><span className="rp-stat-icon pink"><Clock3 /></span><b>{when(overall.latestAt)}</b><small>Last played</small></div>
          </div>

          <div className="gs-toolbar">
            <div className="gs-games" role="tablist" aria-label="Game">
              {["All games", ...games].map((name) => (
                <button key={name} type="button" role="tab" aria-selected={game === name} className={game === name ? "on" : ""}
                  onClick={() => { setGame(name); setActivity("All activities"); }}>
                  {name}
                </button>
              ))}
            </div>
            <div className="gs-view">
              <button type="button" className={view === "board" ? "on" : ""} onClick={() => setView("board")}><BarChart3 /> Scoreboard</button>
              <button type="button" className={view === "log" ? "on" : ""} onClick={() => setView("log")}><ListOrdered /> Attempt log</button>
            </div>
          </div>

          {game !== "All games" && activities.length > 1 && (
            <div className="gs-activities">
              {["All activities", ...activities].map((name) => (
                <button key={name} type="button" className={activity === name ? "on" : ""} onClick={() => setActivity(name)}>{name}</button>
              ))}
            </div>
          )}

          {view === "board" && (single ? (
            cardGroups.length ? (
              <div className="gs-cards">
                {cardGroups.map(({ name, summary }) => (
                  <article key={name} className="gs-card">
                    <header><span><Gamepad2 /></span><div><b>{name}</b><small>{summary.attempts} attempt{summary.attempts === 1 ? "" : "s"} · {when(summary.latestAt)}</small></div></header>
                    <div className="gs-card-main"><b>{pct(summary.average)}</b><small>average</small></div>
                    <div className="rp-bar"><span style={{ width: `${summary.average ?? 0}%` }} /></div>
                    <footer>
                      <div><small>Latest</small><b>{pct(summary.latest)}</b></div>
                      <div><small>Highest</small><b>{pct(summary.highest)}</b></div>
                    </footer>
                  </article>
                ))}
              </div>
            ) : <div className="rp-empty"><span><Gamepad2 /></span><h3>No games played yet</h3><p>Scores appear here once this learner finishes a game.</p></div>
          ) : (
            <div className="rp-table-wrap">
              <table className="rp-table gs-table">
                <thead>
                  <tr><th>#</th><th>Learner</th><th>Attempts</th><th>Latest</th><th>Average</th><th>Highest</th><th>Last played</th></tr>
                </thead>
                <tbody>
                  {rows.map(({ student, summary }, index) => (
                    <tr key={student.email} className={summary.attempts ? "" : "gs-idle"}>
                      <td className="rp-rank">{summary.average == null ? "–" : index + 1}</td>
                      <td>
                        <div className="rp-learner">
                          <span>{student.fname?.[0]}{student.lname?.[0]}</span>
                          <div><b>{student.fname} {student.lname}</b><small>{student.classCode || "Unassigned"}</small></div>
                        </div>
                      </td>
                      <td>{summary.attempts}</td>
                      <td className={summary.latest == null ? "rp-muted" : ""}>{pct(summary.latest)}</td>
                      <td>
                        <div className="rp-overall">
                          <div className="rp-bar"><span style={{ width: `${summary.average ?? 0}%` }} /></div>
                          <b>{pct(summary.average)}</b>
                        </div>
                      </td>
                      <td className={summary.highest == null ? "rp-muted" : ""}>{pct(summary.highest)}</td>
                      <td className="rp-muted">{when(summary.latestAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {view === "log" && (inView.length ? (
            <div className="gs-log">
              {inView.map(({ student, attempt }, index) => (
                <article key={`${student.email}-${attempt.game}-${attempt.id || index}`} className="gs-log-row">
                  <div className="gs-log-score" data-tone={attempt.percentage == null ? "none" : attempt.percentage >= 85 ? "great" : attempt.percentage >= 60 ? "good" : "low"}>
                    {pct(attempt.percentage)}
                  </div>
                  <div className="gs-log-body">
                    <b>{attempt.activity}</b>
                    <small>
                      {attempt.game}
                      {!single && <> · {student.fname} {student.lname}</>}
                      {attempt.score != null && <> · {attempt.score}{attempt.maxScore ? `/${attempt.maxScore}` : ""} pts</>}
                    </small>
                    {attempt.game === "QuackTalk" && <SpeakingFeedback attempt={attempt} />}
                  </div>
                  <div className="gs-log-meta">
                    <span className={`rp-pill ${attempt.status === "COMPLETED" ? "great" : "none"}`}>{attempt.status === "COMPLETED" ? "Completed" : "In progress"}</span>
                    <small>{when(attempt.playedAt)}</small>
                  </div>
                </article>
              ))}
            </div>
          ) : <div className="rp-empty"><span><ListOrdered /></span><h3>No attempts yet</h3><p>Nothing matches this selection.</p></div>)}
        </>
      )}
    </section>
  );
}
