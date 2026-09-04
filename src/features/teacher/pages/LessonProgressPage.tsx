import {
  Check,
  ChevronLeft,
  Download,
  Search,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ClassFilter from "../components/ClassFilter";
import { teacherApi } from "../services/teacherApi";
import type { Student, StudentLessonProgress } from "../types";

const columns = [
  ["Hiragana Basics 1", "hiragana1"],
  ["Hiragana Basics 2", "hiragana2"],
  ["Hiragana Basics 3", "hiragana3"],
  ["Katakana Basics 1", "katakana1"],
  ["Katakana Basics 2", "katakana2"],
  ["Katakana Basics 3", "katakana3"],
  ["Words 1", "vocab1"],
  ["Words 2", "vocab2"],
  ["Words 3", "vocab3"],
  ["Grammar", "sentence"],
] as const;

/** The same ten milestones, grouped so the matrix reads in four blocks. */
const GROUPS = [
  { label: "Hiragana", tone: 1, steps: [["1", "hiragana1"], ["2", "hiragana2"], ["3", "hiragana3"]] },
  { label: "Katakana", tone: 2, steps: [["1", "katakana1"], ["2", "katakana2"], ["3", "katakana3"]] },
  { label: "Words", tone: 3, steps: [["1", "vocab1"], ["2", "vocab2"], ["3", "vocab3"]] },
  { label: "Grammar", tone: 4, steps: [["·", "sentence"]] },
] as const;

const SCORE_PER_RECORD = 20;
const TOTAL_RECORDS = columns.length;
const MAXIMUM_SCORE = TOTAL_RECORDS * SCORE_PER_RECORD;

type MasterRow = Student & { progress?: StudentLessonProgress };

export default function LessonProgressPage() {
  const [rows, setRows] = useState<MasterRow[]>([]);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi.getAllStudents().then(async (students) => {
      const progress = await Promise.allSettled(
        students.map((student) => teacherApi.getLessonProgress(student.email)),
      );
      setRows(
        students.map((student, index) => {
          const result = progress[index];
          return {
            ...student,
            progress: result.status === "fulfilled" ? result.value : undefined,
          };
        }),
      );
      setLoading(false);
    });
  }, []);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesClass = !selectedClass || row.classCode === selectedClass;
      const matchesStudent = !selectedStudent || row.email === selectedStudent;
      const matchesSearch =
        `${row.fname} ${row.lname} ${row.email} ${row.classCode || ""}`
          .toLowerCase()
          .includes(query);
      return matchesClass && matchesStudent && matchesSearch;
    });
  }, [rows, search, selectedClass, selectedStudent]);

  const classes = [
    ...new Set(rows.map((row) => row.classCode).filter(Boolean)),
  ] as string[];
  const availableStudents = rows.filter(
    (row) => !selectedClass || row.classCode === selectedClass,
  );

  const classOptions = useMemo(
    () => classes.map((classCode) => ({ classCodes: classCode })),
    [classes.join("|")],
  );
  const classCounts = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((row) => {
      if (!row.classCode) return;
      map.set(row.classCode, (map.get(row.classCode) ?? 0) + 1);
    });
    return map;
  }, [rows]);

  const exportCsv = () => {
    const header = [
      "Student",
      "Email",
      "Class",
      ...columns.flatMap(([name]) => [`${name} Status`, `${name} Score`]),
      "Total Score",
      "Overall Status",
    ];
    const records = filteredRows.map((row) => {
      const completed = columns.filter(([, field]) =>
        Boolean(row.progress?.[field]),
      ).length;
      return [
        `${row.fname} ${row.lname}`,
        row.email,
        row.classCode || "",
        ...columns.flatMap(([, field]) => [
          row.progress?.[field] ? "Completed" : "Not completed",
          row.progress?.[field] ? SCORE_PER_RECORD : 0,
        ]),
        completed * SCORE_PER_RECORD,
        completed === TOTAL_RECORDS
          ? "Completed"
          : completed > 0
            ? "In progress"
            : "Not started",
      ];
    });
    const csv = [header, ...records]
      .map((record) =>
        record
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      // Leading BOM keeps Excel from mangling Japanese text.
      new Blob([String.fromCharCode(0xfeff), csv], { type: "text/csv;charset=utf-8" }),
    );
    link.download = `japlearn-student-progress-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const completedCounts = filteredRows.map(
    (row) => columns.filter(([, field]) => Boolean(row.progress?.[field])).length,
  );
  const avgCompletion = completedCounts.length
    ? Math.round(
        (completedCounts.reduce((sum, count) => sum + count, 0) /
          (completedCounts.length * TOTAL_RECORDS)) *
          100,
      )
    : 0;
  const fullyComplete = completedCounts.filter((count) => count === TOTAL_RECORDS).length;

  return (
    <section className="progress-master-page">
      <Link className="back-inline" to="/teacher/lessons">
        <ChevronLeft /> Back to lessons
      </Link>

      <div className="tool-bar matrix-toolbar">
        <div className="tool-metrics">
          <div><b>{filteredRows.length}</b><small>Students</small></div>
          <div><b>{avgCompletion}%</b><small>Avg. completion</small></div>
          <div><b>{fullyComplete}</b><small>Completed all</small></div>
        </div>

        <ClassFilter
          value={selectedClass}
          classes={classOptions}
          counts={classCounts}
          totalCount={rows.length}
          onChange={(classCode) => {
            setSelectedClass(classCode);
            setSelectedStudent("");
          }}
        />

        <label className="matrix-select">
          <span>Student</span>
          <select
            value={selectedStudent}
            onChange={(event) => setSelectedStudent(event.target.value)}
          >
            <option value="">All students</option>
            {availableStudents.map((student) => (
              <option key={student.email} value={student.email}>
                {student.fname} {student.lname}
              </option>
            ))}
          </select>
        </label>

        <label className="tool-search">
          <Search />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student, email, or class…"
            aria-label="Search the masterlist"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
              <X />
            </button>
          )}
        </label>

        <button type="button" className="head-action" onClick={exportCsv}>
          <Download /> Export CSV
        </button>
      </div>

      {loading ? (
        <div className="skeleton-list tall" />
      ) : filteredRows.length ? (
        <div className="matrix-shell">
          <div className="matrix-wrap">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th className="matrix-sticky" rowSpan={2}>Student</th>
                  <th rowSpan={2}>Class</th>
                  <th rowSpan={2}>Progress</th>
                  {GROUPS.map((group) => (
                    <th
                      key={group.label}
                      className={`matrix-group tone-${group.tone}`}
                      colSpan={group.steps.length}
                    >
                      <span>{group.label}</span>
                    </th>
                  ))}
                  <th rowSpan={2}>Score</th>
                  <th rowSpan={2}>Overall</th>
                </tr>
                <tr>
                  {GROUPS.flatMap((group) =>
                    group.steps.map(([label, field], stepIndex) => (
                      <th
                        key={field}
                        className={`matrix-step ${stepIndex === 0 ? "first" : ""}`}
                      >
                        {label}
                      </th>
                    )),
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, rowIndex) => {
                  const completed = columns.filter(([, field]) =>
                    Boolean(row.progress?.[field]),
                  ).length;
                  const percent = Math.round((completed / TOTAL_RECORDS) * 100);
                  return (
                    <tr key={row.email}>
                      <td className="matrix-sticky">
                        <div className={`matrix-student tone-${(rowIndex % 4) + 1}`}>
                          <span>
                            {row.fname?.[0]}
                            {row.lname?.[0]}
                          </span>
                          <div>
                            <b>
                              {row.fname} {row.lname}
                            </b>
                            <small>{row.email}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`matrix-class ${row.classCode ? "" : "none"}`}>
                          {row.classCode || "Unassigned"}
                        </span>
                      </td>

                      <td>
                        <div className="matrix-progress">
                          <div className="mastery-bar-track small">
                            <div className="mastery-bar-fill" style={{ width: `${percent}%` }} />
                          </div>
                          <b>{percent}%</b>
                        </div>
                      </td>

                      {GROUPS.flatMap((group) =>
                        group.steps.map(([label, field], stepIndex) => {
                          const done = Boolean(row.progress?.[field]);
                          return (
                            <td
                              key={field}
                              className={`matrix-cell ${stepIndex === 0 ? "first" : ""}`}
                            >
                              <span
                                className={`matrix-dot ${done ? `done tone-${group.tone}` : ""}`}
                                title={`${group.label} ${label} — ${done ? `Completed (${SCORE_PER_RECORD} pts)` : "Not completed"}`}
                              >
                                {done ? <Check /> : null}
                              </span>
                            </td>
                          );
                        }),
                      )}

                      <td className="matrix-score">
                        {completed * SCORE_PER_RECORD}
                        <small>of {MAXIMUM_SCORE}</small>
                      </td>

                      <td>
                        <span
                          className={`matrix-status ${
                            completed === TOTAL_RECORDS ? "done" : completed ? "partial" : "none"
                          }`}
                        >
                          {completed === TOTAL_RECORDS
                            ? "Completed"
                            : completed
                              ? "In progress"
                              : "Not started"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="matrix-foot">
            <span><i className="matrix-dot done tone-2"><Check /></i> Completed · {SCORE_PER_RECORD} pts</span>
            <span><i className="matrix-dot" /> Not completed · 0 pts</span>
            <em>Maximum {MAXIMUM_SCORE} points across {TOTAL_RECORDS} records</em>
          </div>
        </div>
      ) : (
        <div className="state-empty">
          <span><Users /></span>
          <h3>No students match these filters</h3>
          <p>Try another class, student, or clear your search.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedClass("");
              setSelectedStudent("");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
