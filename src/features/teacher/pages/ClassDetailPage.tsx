import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Gamepad2,
  Languages,
  Mail,
  MessageCircleMore,
  MessagesSquare,
  Puzzle,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusMessage from "../components/StatusMessage";
import { teacherApi } from "../services/teacherApi";
import type { Lesson, Student, StudentLessonProgress } from "../types";
import { masteryPercent, progressMapByEmail } from "../utils/mastery";
import { confirmAction } from "../../../lib/confirmAction";

const GAMES = [
  { icon: Puzzle, tone: "purple", title: "Quack-a-Mole", text: "Kana recognition and recall" },
  { icon: Sparkles, tone: "green", title: "QuackMan", text: "Vocabulary and clue practice" },
  { icon: Languages, tone: "orange", title: "QuackSlate", text: "Solo and teacher-coded grammar" },
  { icon: MessagesSquare, tone: "pink", title: "QuackSituate", text: "Real-life expression practice" },
  { icon: MessageCircleMore, tone: "blue", title: "QuackResponse", text: "Response and etiquette games" },
  { icon: Gamepad2, tone: "violet", title: "QuackTalk", text: "Guided and open speaking practice" },
];
const EXERCISES = [
  { title: "Hiragana practice", text: "Three lesson sets with recognition exercises", label: "LESSON EXERCISE" },
  { title: "Katakana practice", text: "Three lesson sets with recognition exercises", label: "LESSON EXERCISE" },
  { title: "Vocabulary practice", text: "Three word collections and individual review", label: "LESSON + INDIVIDUAL" },
  { title: "Sentence practice", text: "Grammar lesson and individual sentence review", label: "LESSON + INDIVIDUAL" },
];

export default function ClassDetailPage() {
  const { classCode = "" } = useParams();
  const decodedCode = decodeURIComponent(classCode);
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonProgress, setLessonProgress] = useState<StudentLessonProgress[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [adding, setAdding] = useState(false);

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
    if (adding) return;
    setAdding(true); setError(""); setNotice("");
    try {
      await teacherApi.joinStudent(email, decodedCode);
      setEmail("");
      await refresh();
      setNotice("Learner added to this classroom.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not add student.",
      );
    } finally { setAdding(false); }
  };

  const removeStudent = async (student: Student) => {
    if (!await confirmAction(`Remove ${student.fname} ${student.lname}?`, { confirmLabel: "Remove student", description: "Remove this student from this class? Their account will remain available." })) return;
    await teacherApi.removeStudent(decodedCode, student);
    await refresh();
  };

  return (
    <section className="class-detail-page">
      <Link className="back-inline" to="/teacher/classes">
        <ChevronLeft /> Back to classes
      </Link>
      <PageHeader
        eyebrow="ACTIVE CLASSROOM"
        title={decodedCode}
        description="Keep your learner list, assigned lessons, and available practice in one organized classroom."
        action={
          <Link
            className="head-action"
            to={`/teacher/lessons?class=${encodeURIComponent(decodedCode)}`}
          >
            <BookOpen /> Manage lessons
          </Link>
        }
      />

      <div className="tool-bar">
        <div className="tool-metrics">
          <div><b>{students.length}</b><small>Learners</small></div>
          <div><b>{lessons.length}</b><small>Lessons</small></div>
          <div><b>{avgMastery}%</b><small>Avg. mastery</small></div>
        </div>
      </div>

      {error && <StatusMessage>{error}</StatusMessage>}
      {notice && <StatusMessage type="success">{notice}</StatusMessage>}

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

          <div className="class-enrollment-box">
            <span className="class-enrollment-icon"><UserPlus /></span>
            <div className="class-enrollment-copy"><b>Add a learner</b><small>Enter the email used for their JapLearn student account.</small></div>
            <form className="class-enrollment-form" onSubmit={addStudent}>
              <label><Mail /><input aria-label="Student account email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="learner@example.com" required /></label>
              <button disabled={adding}>{adding ? "Adding…" : "Add to class"}<UserPlus /></button>
            </form>
          </div>

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
              <UserPlus />
              <div>
                <b>Your class is ready for learners</b>
                <small>Add a student account above or share class code {decodedCode}.</small>
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

      <section className="class-available-section">
      <div className="tile-head">
        <div>
          <span className="eyebrow">AVAILABLE TO THIS CLASS</span>
          <h3><Gamepad2 /> Games and exercises</h3>
          <p>A clear view of the practice already available in JapLearn. Game content is played in the student app.</p>
        </div>
      </div>
      <div className="class-catalog-label"><Gamepad2 /><div><b>JapLearn games</b><small>Individual, guided, and teacher-coded activities</small></div><span>{GAMES.length} available</span></div>
      <div className="class-game-catalog">
        {GAMES.map((game) => { const Icon = game.icon; return (
          <article key={game.title} className={`class-game-item ${game.tone}`}>
            <span><Icon /></span><div><b>{game.title}</b><small>{game.text}</small></div><CheckCircle2 />
          </article>
        ); })}
      </div>
      <div className="class-catalog-label exercise"><BookOpen /><div><b>Lesson and individual exercises</b><small>Practice connected to the learning paths</small></div><span>{EXERCISES.length} available</span></div>
      <div className="class-exercise-list">
        {EXERCISES.map((exercise, index) => (
          <article key={exercise.title}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{exercise.label}</small><b>{exercise.title}</b><p>{exercise.text}</p></div><ShieldCheck /></article>
        ))}
      </div>
      </section>
    </section>
  );
}
