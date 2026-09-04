import { Search, Trash2, UserPlus, Users } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
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
        .then(setStudents)
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
      <div className="directory-title-row student-directory-title">
        <div><span>LEARNER DIRECTORY</span><h2>Students</h2><p>Find learners and manage enrollment from one focused view.</p></div>
        <div className="student-summary"><span><Users /></span><div><b>{students.length}</b><small>{selectedClass ? `In ${selectedClass}` : "Learners shown"}</small></div></div>
      </div>

      {error && <StatusMessage>{error}</StatusMessage>}

      <div className="student-toolbar directory-student-toolbar">
        <label>
          Class
          <select
            value={selectedClass}
            onChange={(event) => setSelectedClass(event.target.value)}
          >
            <option value="">All students</option>
            {classes.map((item) => (
              <option key={item.classCodes} value={item.classCodes}>
                {item.classCodes}
              </option>
            ))}
          </select>
        </label>
        <div className="student-search">
          <Search />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email…"
          />
        </div>
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
      ) : filteredStudents.length > 0 ? (
        <div className="student-table-wrap">
          <table className="student-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Class</th>
                <th>Status</th>
                <th>Lesson progress</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => {
                const progress = lessonProgress.find(
                  (item) => item.email?.toLowerCase() === student.email?.toLowerCase(),
                );
                const percent = masteryPercent(progress);
                const status = statusFor(percent);
                return (
                <tr key={student.id || student.email}>
                  <td>
                    <span className={`student-avatar tone-${(index % 4) + 1}`}>
                      {student.fname?.[0]}
                      {student.lname?.[0]}
                    </span>
                    <b>
                      {student.fname} {student.lname}
                    </b>
                  </td>
                  <td>{student.email}</td>
                  <td>
                    {student.classCode || selectedClass || "Not assigned"}
                  </td>
                  <td>
                    <span className={`student-status-pill tone-${status.tone}`}>{status.label}</span>
                  </td>
                  <td>
                    <div className="student-progress-cell">
                      <div className="mastery-bar-track small">
                        <div className="mastery-bar-fill" style={{ width: `${percent}%` }} />
                      </div>
                      <b>{percent}%</b>
                    </div>
                  </td>
                  <td>
                    {selectedClass && (
                      <button
                        type="button"
                        className="row-delete"
                        onClick={() => deleteStudent(student)}
                        aria-label={`Remove ${student.fname}`}
                      >
                        <Trash2 />
                      </button>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <span>
            <Users />
          </span>
          <h3>No students found</h3>
          <p>Try another search or add a student to the selected class.</p>
        </div>
      )}
    </section>
  );
}
