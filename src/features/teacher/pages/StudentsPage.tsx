import { Search, Trash2, UserPlus, Users, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import ClassFilter from "../components/ClassFilter";
import StatusMessage from "../components/StatusMessage";
import { teacherApi } from "../services/teacherApi";
import type { ClassRecord, Student, StudentLessonProgress } from "../types";
import { masteryPercent } from "../utils/mastery";

function statusFor(percent: number): { label: string; tone: string } {
  if (percent >= 80) return { label: "Mastering", tone: "mastering" };
  if (percent >= 40) return { label: "Progressing", tone: "progressing" };
  if (percent > 0) return { label: "Starting out", tone: "starting" };
  return { label: "Not started", tone: "none" };
}

export default function StudentsPage() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  /** Unfiltered roster, kept so the class picker can show accurate counts. */
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [lessonProgress, setLessonProgress] = useState<StudentLessonProgress[]>(
    [],
  );
  const [selectedClass, setSelectedClass] = useState("");
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [classData, studentData] = await Promise.all([
          teacherApi.getClasses(),
          teacherApi.getAllStudents(),
        ]);
        setClasses(classData);
        setStudents(studentData);
        setAllStudents(studentData);
        Promise.allSettled(
          studentData.map((student) =>
            teacherApi.getLessonProgress(student.email),
          ),
        ).then((results) =>
          setLessonProgress(
            results.flatMap((result) =>
              result.status === "fulfilled" ? [result.value] : [],
            ),
          ),
        );
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Could not load students.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      teacherApi
        .getAllStudents()
        .then((studentData) => {
          setStudents(studentData);
          setAllStudents(studentData);
        })
        .catch(() => undefined);
      return;
    }

    setLoading(true);
    teacherApi
      .getStudentsByClass(selectedClass)
      .then(setStudents)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [selectedClass]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) =>
      `${student.fname} ${student.lname} ${student.email}`
        .toLowerCase()
        .includes(query),
    );
  }, [search, students]);

  const rows = useMemo(
    () =>
      filteredStudents.map((student) => {
        const progress = lessonProgress.find(
          (item) => item.email?.toLowerCase() === student.email?.toLowerCase(),
        );
        const percent = masteryPercent(progress);
        return { student, percent, status: statusFor(percent) };
      }),
    [filteredStudents, lessonProgress],
  );

  /** Learner count per class code, always taken from the unfiltered roster. */
  const classCounts = useMemo(() => {
    const map = new Map<string, number>();
    allStudents.forEach((student) => {
      if (!student.classCode) return;
      map.set(student.classCode, (map.get(student.classCode) ?? 0) + 1);
    });
    return map;
  }, [allStudents]);

  const addStudent = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedClass || !email.trim()) return;

    try {
      await teacherApi.joinStudent(email.trim().toLowerCase(), selectedClass);
      setEmail("");
      setStudents(await teacherApi.getStudentsByClass(selectedClass));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not add student.",
      );
    }
  };

  const deleteStudent = async (student: Student) => {
    if (!selectedClass) return;
    if (
      !window.confirm(
        `Remove ${student.fname} ${student.lname} from ${selectedClass}?`,
      )
    )
      return;

    try {
      await teacherApi.removeStudent(selectedClass, student);
      setStudents(await teacherApi.getStudentsByClass(selectedClass));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not remove student.",
      );
    }
  };

  return (
    <section className="student-directory-page">
      {error && <StatusMessage>{error}</StatusMessage>}

      <div className="tool-bar">
        <ClassFilter
          value={selectedClass}
          classes={classes}
          counts={classCounts}
          totalCount={allStudents.length}
          onChange={setSelectedClass}
        />
        <label className="tool-search">
          <Search />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email…"
            aria-label="Search students"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
              <X />
            </button>
          )}
        </label>
      </div>

      {selectedClass && (
        <form className="inline-add-student" onSubmit={addStudent}>
          <UserPlus />
          <div>
            <b>Add a student to {selectedClass}</b>
            <small>Use an existing student account email.</small>
          </div>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="student@email.com"
            required
          />
          <button>Add student</button>
        </form>
      )}

      {loading ? (
        <div className="skeleton-list tall" />
      ) : rows.length > 0 ? (
        <>
          <div className="roster-head">
            <span>Student</span>
            <span>Email</span>
            <span>Class</span>
            <span>Lesson mastery</span>
            <span />
          </div>
          <div className="roster-list">
            {rows.map(({ student, percent, status }, index) => (
              <article className="roster-row" key={student.id || student.email}>
                <div className="roster-who">
                  <span className={`roster-avatar tone-${(index % 4) + 1}`}>
                    {student.fname?.[0]}
                    {student.lname?.[0]}
                  </span>
                  <div>
                    <b>
                      {student.fname} {student.lname}
                    </b>
                    <small>
                      <span className={`student-status-pill tone-${status.tone}`}>
                        {status.label}
                      </span>
                    </small>
                  </div>
                </div>

                <div className="roster-mail">{student.email}</div>

                <span
                  className={`roster-class ${student.classCode || selectedClass ? "" : "none"}`}
                >
                  {student.classCode || selectedClass || "Unassigned"}
                </span>

                <div className="roster-meter">
                  <div className="mastery-bar-track small">
                    <div className="mastery-bar-fill" style={{ width: `${percent}%` }} />
                  </div>
                  <b>{percent}%</b>
                </div>

                {selectedClass ? (
                  <button
                    type="button"
                    className="row-delete"
                    onClick={() => deleteStudent(student)}
                    aria-label={`Remove ${student.fname}`}
                  >
                    <Trash2 />
                  </button>
                ) : (
                  <span />
                )}
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="state-empty">
          <span><Users /></span>
          <h3>No students found</h3>
          <p>Try another search or add a student to the selected class.</p>
        </div>
      )}
    </section>
  );
}
