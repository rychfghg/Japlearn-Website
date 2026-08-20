import {
  BookOpen,
  ChevronLeft,
  Gamepad2,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusMessage from "../components/StatusMessage";
import { teacherApi } from "../services/teacherApi";
import type { Lesson, Student } from "../types";

export default function ClassDetailPage() {
  const { classCode = "" } = useParams();
  const decodedCode = decodeURIComponent(classCode);
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const refresh = async () => {
    try {
      const [studentData, lessonData] = await Promise.all([
        teacherApi.getStudentsByClass(decodedCode),
        teacherApi.getLessons(decodedCode),
      ]);
      setStudents(studentData);
      setLessons(lessonData);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not open classroom.",
      );
    }
  };

  useEffect(() => {
    refresh();
  }, [decodedCode]);

  const addStudent = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await teacherApi.joinStudent(email, decodedCode);
      setEmail("");
      await refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not add student.",
      );
    }
  };

  const removeStudent = async (student: Student) => {
    if (!window.confirm(`Remove ${student.fname} ${student.lname}?`)) return;
    await teacherApi.removeStudent(decodedCode, student);
    await refresh();
  };

  return (
    <section className="full-panel">
      <Link className="back-inline" to="/teacher/classes">
        <ChevronLeft /> Back to classes
      </Link>
      <PageHeader
        eyebrow="ACTIVE CLASSROOM"
        title={decodedCode}
        description="Manage live enrollment, lessons, and interactive activities for this class."
      />
      {error && <StatusMessage>{error}</StatusMessage>}

      <div className="class-detail-grid">
        <section className="class-detail-panel">
          <header>
            <Users />
            <div>
              <b>Enrolled students</b>
              <small>{students.length} learners</small>
            </div>
          </header>
          <form className="mini-add" onSubmit={addStudent}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Student email"
              required
            />
            <button>
              <UserPlus /> Add
            </button>
          </form>
          <div className="class-student-list">
            {students.map((student) => (
              <article key={student.id || student.email}>
                <span>
                  {student.fname?.[0]}
                  {student.lname?.[0]}
                </span>
                <div>
                  <b>
                    {student.fname} {student.lname}
                  </b>
                  <small>{student.email}</small>
                </div>
                <button onClick={() => removeStudent(student)}>
                  <Trash2 />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="class-detail-panel">
          <header>
            <BookOpen />
            <div>
              <b>Class lessons</b>
              <small>{lessons.length} lesson plans</small>
            </div>
          </header>
          <div className="lesson-mini-list">
            {lessons.length ? (
              lessons.map((lesson) => (
                <article key={lesson.id}>
                  <span>文</span>
                  <div>
                    <b>
                      {lesson.lessonTitle || lesson.title || "Untitled lesson"}
                    </b>
                    <small>
                      {lesson.lessonDescription ||
                        lesson.description ||
                        "Japanese lesson"}
                    </small>
                  </div>
                </article>
              ))
            ) : (
              <p>No lessons assigned to this class yet.</p>
            )}
          </div>
          <Link
            className="panel-link"
            to={`/teacher/lessons?class=${encodeURIComponent(decodedCode)}`}
          >
            Manage lessons
          </Link>
        </section>
      </div>

      <section className="class-games">
        <header>
          <Gamepad2 />
          <div>
            <b>Interactive activity editors</b>
            <small>
              The same game content services used by the mobile teacher app.
            </small>
          </div>
        </header>
        <div>
          <article>
            <span>あ</span>
            <b>Quackamole</b>
            <small>Character recognition content</small>
          </article>
          <article>
            <span>文</span>
            <b>QuackSlate</b>
            <small>Grammar challenge content</small>
          </article>
          <article>
            <span>語</span>
            <b>QuackMan</b>
            <small>Vocabulary and hint content</small>
          </article>
        </div>
      </section>
    </section>
  );
}
