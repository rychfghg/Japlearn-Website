import { Award, CalendarDays, Download, FileBarChart, Loader2, Sparkles, TrendingUp, TriangleAlert, Users } from "lucide-react";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import ScopeBar, { DEFAULT_SCOPE, type Scope, scopeLabel, studentsInScope } from "../components/ScopeBar";
import { teacherApi } from "../services/teacherApi";
import type { Student } from "../types";
import { buildScorecards, downloadCsv, REPORT_SECTIONS, scorecardsToCsv, type Scorecard, type SectionKey } from "../utils/reportBuilder";

/** One comparable percentage per activity group, or null when nothing was measured. */
function sectionValue(card: Scorecard, key: SectionKey): { value: number | null; detail: string } {
  switch (key) {
    case "lessons": return card.lessons ? { value: card.lessons.percent, detail: `${card.lessons.completed}/${card.lessons.total} milestones` } : { value: null, detail: "—" };
    case "arcade": return card.arcade ? { value: card.arcade.percent, detail: `${card.arcade.games.length} game${card.arcade.games.length === 1 ? "" : "s"} played` } : { value: null, detail: "—" };
    case "situate": return card.situate?.attempts ? { value: card.situate.avgAccuracy, detail: `${card.situate.attempts} attempts` } : { value: null, detail: "No attempts" };
    case "talk": return card.talk ? { value: card.talk.evaluatedAvg, detail: `${card.talk.sessions} session${card.talk.sessions === 1 ? "" : "s"}` } : { value: null, detail: "—" };
    case "reply": return card.reply?.chapters ? { value: card.reply.bestPercent, detail: `${card.reply.completed}/${card.reply.chapters} chapters` } : { value: null, detail: "No chapters" };
    case "response": return card.response?.attempts ? { value: card.response.average, detail: `${card.response.attempts} attempts` } : { value: null, detail: "No attempts" };
    default: return { value: null, detail: "—" };
  }
}

function standing(value: number | null) {
  if (value == null) return { label: "No data", tone: "none" };
  if (value >= 85) return { label: "Excellent", tone: "great" };
  if (value >= 60) return { label: "On track", tone: "good" };
  return { label: "Needs support", tone: "low" };
}

const pct = (value: number | null) => (value == null ? "—" : `${Math.round(value)}%`);

export default function ReportsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [scope, setScope] = useState<Scope>(DEFAULT_SCOPE);
  const [sections, setSections] = useState<SectionKey[]>(REPORT_SECTIONS.map((s) => s.key));
  const [cards, setCards] = useState<Scorecard[] | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    teacherApi.getAllStudents().then(setStudents).catch((e) => setError(e instanceof Error ? e.message : "Could not load your students."));
  }, []);
  useEffect(() => { setCards(null); }, [scope, sections]);

  const targets = useMemo(() => studentsInScope(students, scope), [students, scope]);
  const activeSections = REPORT_SECTIONS.filter((s) => sections.includes(s.key));

  const generate = async () => {
    if (busy || !targets.length) return;
    setBusy(true); setError(""); setCards(null); setProgress({ done: 0, total: targets.length });
    try {
      const result = await buildScorecards(targets, sections, (done, total) => setProgress({ done, total }));
      setCards(result);
      setGeneratedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not build the report.");
    } finally {
      setBusy(false);
    }
  };

  const ranked = useMemo(() => [...(cards ?? [])].sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1)), [cards]);
  // Columns with no data for anyone only add width; the CSV export still includes every selected group.
  const tableSections = activeSections.filter((s) => ranked.some((c) => sectionValue(c, s.key).value != null));
  const hiddenCount = activeSections.length - tableSections.length;
  const measured = ranked.filter((c) => c.overall != null);
  const average = measured.length ? Math.round(measured.reduce((sum, c) => sum + (c.overall ?? 0), 0) / measured.length) : null;
  const top = measured[0];
  const needSupport = measured.filter((c) => (c.overall ?? 0) < 60).length;
  const label = scopeLabel(students, scope);
  const fileName = `japlearn-report-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;

  return (
    <section className="rp-page">
      <ScopeBar students={students} scope={scope} onChange={setScope} disabled={busy}>
        <button type="button" className="rp-primary" disabled={busy || !targets.length || !sections.length} onClick={generate}>
          {busy ? <Loader2 className="rp-spin" /> : <Sparkles />}
          {busy ? "Generating…" : "Generate report"}
        </button>
        {cards && (
          <button type="button" className="rp-secondary" onClick={() => downloadCsv(fileName, scorecardsToCsv(ranked, sections))}>
            <Download /> Export CSV
          </button>
        )}
      </ScopeBar>

      <div className="rp-include">
        <span>Include</span>
        <div>
          {REPORT_SECTIONS.map((s) => {
            const on = sections.includes(s.key);
            return (
              <button key={s.key} type="button" title={s.hint} disabled={busy} className={on ? "on" : ""}
                onClick={() => setSections((cur) => (on ? cur.filter((k) => k !== s.key) : [...cur, s.key]))}>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="rp-alert" role="alert"><TriangleAlert /> {error}</p>}

      {busy && (
        <div className="rp-loading">
          <div className="rp-loading-track"><span style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} /></div>
          <p>Collecting results · {progress.done} of {progress.total} learners</p>
        </div>
      )}

      {!busy && !cards && (
        <div className="rp-empty">
          <span><FileBarChart /></span>
          <h3>Ready when you are</h3>
          <p>
            {targets.length
              ? <>This report will cover <b>{label}</b> — {targets.length} learner{targets.length === 1 ? "" : "s"}. Choose what to include, then generate.</>
              : "No learners match this selection yet."}
          </p>
        </div>
      )}

      {cards && !busy && (
        <article className="rp-sheet">
          <header className="rp-sheet-head">
            <div>
              <small>PROGRESS REPORT</small>
              <h2>{label}</h2>
            </div>
            <span><CalendarDays /> {generatedAt?.toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
          </header>

          <div className="rp-stats">
            <div><span className="rp-stat-icon violet"><Users /></span><b>{cards.length}</b><small>Learners</small></div>
            <div><span className="rp-stat-icon green"><TrendingUp /></span><b>{pct(average)}</b><small>{cards.length === 1 ? "Overall score" : "Average overall"}</small></div>
            <div><span className="rp-stat-icon orange"><Award /></span><b>{top ? pct(top.overall) : "—"}</b><small>{top && cards.length > 1 ? `Top · ${top.student.fname}` : "Best result"}</small></div>
            <div><span className="rp-stat-icon pink"><TriangleAlert /></span><b>{needSupport}</b><small>Need support</small></div>
          </div>

          {cards.length === 1 ? (
            <SingleReport card={cards[0]} sections={activeSections.map((s) => s.key)} />
          ) : (
            <>
            {hiddenCount > 0 && (
              <p className="rp-note">
                {hiddenCount} activity group{hiddenCount === 1 ? " has" : "s have"} no results yet for these learners, so {hiddenCount === 1 ? "it's" : "they're"} hidden here. The CSV export still includes {hiddenCount === 1 ? "it" : "them"}.
              </p>
            )}
            <div className="rp-table-wrap">
              <table className="rp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Learner</th>
                    {tableSections.map((s) => <th key={s.key}>{s.label}</th>)}
                    <th>Overall</th>
                    <th>Standing</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((card, index) => {
                    const st = standing(card.overall);
                    return (
                      <tr key={card.student.email}>
                        <td className="rp-rank">{card.overall == null ? "–" : index + 1}</td>
                        <td>
                          <div className="rp-learner">
                            <span>{card.student.fname?.[0]}{card.student.lname?.[0]}</span>
                            <div><b>{card.student.fname} {card.student.lname}</b><small>{card.student.classCode || "Unassigned"}</small></div>
                          </div>
                        </td>
                        {tableSections.map((s) => {
                          const v = sectionValue(card, s.key);
                          return <td key={s.key} className={v.value == null ? "rp-muted" : ""}>{pct(v.value)}</td>;
                        })}
                        <td>
                          <div className="rp-overall">
                            <div className="rp-bar"><span style={{ width: `${card.overall ?? 0}%` }} /></div>
                            <b>{pct(card.overall)}</b>
                          </div>
                        </td>
                        <td><span className={`rp-pill ${st.tone}`}>{st.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </article>
      )}
    </section>
  );
}

function SingleReport({ card, sections }: { card: Scorecard; sections: SectionKey[] }) {
  const st = standing(card.overall);
  return (
    <div className="rp-single">
      <aside className="rp-single-hero">
        <div className="rp-ring" style={{ "--p": `${(card.overall ?? 0) * 3.6}deg` } as CSSProperties}>
          <div><b>{pct(card.overall)}</b><small>overall</small></div>
        </div>
        <h3>{card.student.fname} {card.student.lname}</h3>
        <p>{card.student.classCode ? `Section ${card.student.classCode}` : "No section"} · {card.student.email}</p>
        <span className={`rp-pill ${st.tone}`}>{st.label}</span>
      </aside>
      <div className="rp-single-grid">
        {REPORT_SECTIONS.filter((s) => sections.includes(s.key)).map((s) => {
          const v = sectionValue(card, s.key);
          return (
            <div key={s.key} className="rp-source">
              <small>{s.label}</small>
              <b className={v.value == null ? "rp-muted" : ""}>{pct(v.value)}</b>
              <div className="rp-bar"><span style={{ width: `${v.value ?? 0}%` }} /></div>
              <p>{v.detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
