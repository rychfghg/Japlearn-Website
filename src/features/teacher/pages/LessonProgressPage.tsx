import {
  CheckCircle2,
  ChevronLeft,
  Download,
  FileSpreadsheet,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
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
  ];
  const availableStudents = rows.filter(
    (row) => !selectedClass || row.classCode === selectedClass,
  );

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
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
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
      <PageHeader
        eyebrow="AUTOMATIC CURRICULUM RECORD"
        title="Student lesson masterlist"
        description="Detailed progress for every built-in JapLearn lesson and its required exercise."
      />

      <div className="tool-bar">
        <div className="tool-metrics">
          <div><b>{filteredRows.length}</b><small>Students shown</small></div>
          <div><b>{avgCompletion}%</b><small>Avg. completion</small></div>
          <div><b>{fullyComplete}</b><small>Fully complete</small></div>
        </div>
      </div>

      <div className="master-toolbar">
        <label>
          Class
          <select
            value={selectedClass}
            onChange={(event) => {
              setSelectedClass(event.target.value);
              setSelectedStudent("");
            }}
          >
            <option value="">All classes</option>
            {classes.map((classCode) => (
              <option key={classCode} value={classCode}>
                {classCode}
              </option>
            ))}
          </select>
        </label>
        <label>
          Student
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
        <div className="student-search">
          <Search />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student, email, or class…"
          />
        </div>
        <button onClick={exportCsv}>
          <Download /> Export CSV for Excel
        </button>
      </div>
      <div className="score-guide">
        <FileSpreadsheet />
        <div>
          <b>Scoring guide</b>
          <small>
            Each completed lesson exercise earns {SCORE_PER_RECORD} points. All
            {` ${TOTAL_RECORDS} `}detailed records produce a maximum score of {MAXIMUM_SCORE}.
          </small>
        </div>
      </div>
      {loading ? (
        <div className="skeleton-list tall" />
      ) : (
        <div className="master-shell">
        <div className="master-table-wrap">
          <table className="master-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                {columns.map(([name]) => (
                  <th key={name}>
                    {name}
                    <small>Lesson + exercise</small>
                  </th>
                ))}
                <th>Total</th>
                <th>Overall</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const completed = columns.filter(([, field]) =>
                  Boolean(row.progress?.[field]),
                ).length;
                return (
                  <tr key={row.email}>
                    <td>
                      <b>
                        {row.fname} {row.lname}
                      </b>
                      <small>{row.email}</small>
                    </td>
                    <td>{row.classCode || "—"}</td>
                    {columns.map(([name, field]) => (
                      <td key={name}>
                        {row.progress?.[field] ? (
                          <span className="score-complete">
                            <CheckCircle2 />
                            Completed <b>{SCORE_PER_RECORD}</b>
                          </span>
                        ) : (
                          <span className="score-pending">
                            Not completed <b>0</b>
                          </span>
                        )}
                      </td>
                    ))}
                    <td>
                      <strong>{completed * SCORE_PER_RECORD} / {MAXIMUM_SCORE}</strong>
                    </td>
                    <td>
                      <span
                        className={
                          completed === TOTAL_RECORDS
                            ? "master-complete"
                            : completed
                              ? "master-progress"
                              : "master-pending"
                        }
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
        <div className="legend-row">
          <span><i className="done" /> Completed exercise · {SCORE_PER_RECORD} pts</span>
          <span><i className="pending" /> Not completed · 0 pts</span>
          <span>Maximum score {MAXIMUM_SCORE} across {TOTAL_RECORDS} records</span>
        </div>
        </div>
      )}
    </section>
  );
}
