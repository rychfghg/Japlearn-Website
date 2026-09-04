import {
  BookOpen,
  ChevronLeft,
  Gamepad2,
  GraduationCap,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StatusMessage from "../components/StatusMessage";
import { teacherApi } from "../services/teacherApi";
import type { Lesson, Student, StudentLessonProgress } from "../types";
import { masteryPercent, progressMapByEmail } from "../utils/mastery";

const EDITORS = [
  { character: "あ", tone: "", title: "Quackamole", text: "Character recognition content" },
  { character: "文", tone: "tone-green", title: "QuackSlate", text: "Grammar challenge content" },
  { character: "語", tone: "tone-orange", title: "QuackMan", text: "Vocabulary and hint content" },
];

export default function ClassDetailPage() {
  const { classCode = "" } = useParams();
  const decodedCode = decodeURIComponent(classCode);
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonProgress, setLessonProgress] = useState<StudentLessonProgress[]>([]);
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
    teacherApi
      .getAllLessonProgress()
      .then(setLessonProgress)
      .catch(() => undefined);
  }, [decodedCode]);

  const progressByEmail = useMemo(() => progressMapByEmail(lessonProgress), [lessonProgress]);

  const avgMastery = students.length
    ? Math.round(
        students.reduce((sum, student) => sum + masteryPercent(progressByEmail.get(student.email)), 0) /
          students.length,
      )
    : 0;

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
    <section className="class-detail-page">
      <div className="hero-banner">
        <span className="hero-glyph">組</span>
        <Link className="hero-back" to="/teacher/classes">
          <ChevronLeft /> Back to classes
        </Link>
        <div className="hero-top">
          <div>
            <span className="hero-kicker"><GraduationCap /> ACTIVE CLASSROOM</span>
            <h2>{decodedCode}</h2>
            <p>Manage live enrollment, lessons, and interactive activities for this class.</p>
          </div>
          <Link
            className="hero-action"
            to={`/teacher/lessons?class=${encodeURIComponent(decodedCode)}`}
          >
            <BookOpen /> Manage lessons
          </Link>
        </div>
        <div className="hero-stats">
          <div><b>{students.length}</b><small>Enrolled learners</small></div>
          <div><b>{lessons.length}</b><small>Class lessons</small></div>
          <div><b>{avgMastery}%</b><small>Avg. mastery</small></div>
        </div>
      </div>

      {error && <StatusMessage>{error}</StatusMessage>}

      <div className="bento bento-2">
        <section className="bento-tile">
          <div className="tile-head">
            <div>
              <span className="eyebrow">CLASS ROSTER</span>
              <h3><Users /> Enrolled students</h3>
            </div>
            <span className="tile-count">
              {students.length} learner{students.length === 1 ? "" : "s"}
            </span>
          </div>

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

          {students.length ? (
            <div className="roster-list">
              {students.map((student, index) => {
                const percent = masteryPercent(progressByEmail.get(student.email));
                return (
                  <article className="roster-row compact" key={student.id || student.email}>
                    <div className="roster-who">
                      <span className={`roster-avatar tone-${(index % 4) + 1}`}>
                        {student.fname?.[0]}
                        {student.lname?.[0]}
                      </span>
                      <div>
                        <b>
                          {student.fname} {student.lname}
                        </b>
                        <small>{student.email}</small>
                      </div>
                    </div>
                    <div className="roster-meter">
                      <div className="mastery-bar-track small">
                        <div className="mastery-bar-fill" style={{ width: `${percent}%` }} />
                      </div>
                      <b>{percent}%</b>
                    </div>
                    <button
                      type="button"
                      className="row-delete"
                      onClick={() => removeStudent(student)}
                      aria-label={`Remove ${student.fname}`}
                    >
                      <Trash2 />
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="lesson-empty">
              <Users />
              <div>
                <b>No learners yet</b>
                <small>Share the class code {decodedCode} so students can join.</small>
              </div>
            </div>
          )}
        </section>

        <aside className="bento-tile">
          <div className="tile-head">
            <div>
              <span className="eyebrow">LESSON PLANS</span>
              <h3><BookOpen /> Class lessons</h3>
            </div>
            <span className="tile-count">{lessons.length}</span>
          </div>
          <div className="lesson-cards">
            {lessons.length ? (
              lessons.map((lesson) => (
                <article key={lesson.id}>
                  <span className="purple">
                    <BookOpen />
                  </span>
                  <div>
                    <b>{lesson.lessonTitle || lesson.title || "Untitled lesson"}</b>
                    <p>
                      {lesson.lessonDescription || lesson.description || "Japanese lesson"}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <div className="lesson-empty">
                <BookOpen />
                <div>
                  <b>No lessons assigned yet</b>
                  <small>Add lesson plans for this class from the lessons page.</small>
                </div>
              </div>
            )}
          </div>
          <Link
            className="tile-link"
            to={`/teacher/lessons?class=${encodeURIComponent(decodedCode)}`}
            style={{ marginTop: 14 }}
          >
            Manage lessons <BookOpen />
          </Link>
        </aside>
      </div>

      <div className="tile-head" style={{ marginTop: 26 }}>
        <div>
          <span className="eyebrow">ACTIVITY CONTENT</span>
          <h3><Gamepad2 /> Interactive activity editors</h3>
          <p>The same game content services used by the mobile teacher app.</p>
        </div>
      </div>
      <div className="family-grid">
        {EDITORS.map((editor) => (
          <article key={editor.title} className={`family-card ${editor.tone}`}>
            <span className="family-glyph">{editor.character}</span>
            <h3>{editor.title}</h3>
            <p>{editor.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
