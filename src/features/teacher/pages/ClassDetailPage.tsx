import {
  BookOpen,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clipboard,
  Copy,
  Gamepad2,
  GraduationCap,
  Hash,
  Languages,
  Mail,
  MessageCircleMore,
  MessagesSquare,
  Puzzle,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  TrendingUp,
  Plus,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StatusMessage from "../components/StatusMessage";
import { teacherApi } from "../services/teacherApi";
import type { ClassRecord, Lesson, Student, StudentLessonProgress } from "../types";
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
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "learning">("overview");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [classroom, setClassroom] = useState<ClassRecord | null>(null);

  const refresh = async () => {
    try {
      const [studentData, lessonData, classData] = await Promise.all([
        teacherApi.getStudentsByClass(decodedCode),
        teacherApi.getTeacherLessons(),
        teacherApi.getClasses(),
      ]);
      setStudents(studentData);
      setLessons(lessonData.filter((lesson) => lesson.classId === decodedCode || lesson.classIds?.includes(decodedCode)));
      setClassroom(classData.find((item) => item.classCodes === decodedCode) || null);
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

  const visibleStudents = students.filter((student) =>
    `${student.fname} ${student.lname} ${student.email}`.toLowerCase().includes(query.toLowerCase()),
  );

  const copyCode = async () => {
    await navigator.clipboard.writeText(decodedCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

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
      <Link className="classroom-back" to="/teacher/classes"><ChevronLeft /> All classes</Link>
      <div className="classroom-code-hero">
        <span className="classroom-code-icon"><Clipboard /></span>
        <div className="classroom-code-copy">
          <small>CLASSROOM</small>
          <h1>{classroom?.classTitle || decodedCode}</h1>
          {classroom?.classTitle && <span className="classroom-code-inline"><Hash /> {decodedCode}</span>}
        </div>
        <button type="button" onClick={() => void copyCode()}>{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy code"}</button>
        <div className="classroom-code-metrics">
          <span><b>{students.length}</b><small>Learners</small></span>
          <span><b>{lessons.length}</b><small>Lessons</small></span>
          <span><b>{avgMastery}%</b><small>Mastery</small></span>
        </div>
      </div>

      {error && <StatusMessage>{error}</StatusMessage>}
      {notice && <StatusMessage type="success">{notice}</StatusMessage>}

      <nav className="classroom-tabs" aria-label="Classroom sections">
        <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}><GraduationCap />Overview</button>
        <button className={activeTab === "students" ? "active" : ""} onClick={() => setActiveTab("students")}><Users />Students <em>{students.length}</em></button>
        <button className={activeTab === "learning" ? "active" : ""} onClick={() => setActiveTab("learning")}><BookOpen />Learning</button>
      </nav>

      {activeTab === "overview" && <div className="classroom-overview-grid">
        <button className="classroom-overview-action people" onClick={() => setActiveTab("students")}>
          <Users className="classroom-card-watermark" aria-hidden="true" />
          <span className="classroom-card-icon"><Users /></span>
          <div className="classroom-card-copy"><small>PEOPLE</small><h2>Manage {students.length} learners</h2><p>Add accounts, find a learner, and review mastery without leaving the classroom.</p></div>
          <div className="classroom-card-footer"><b>{students.length || "No"} learner{students.length === 1 ? "" : "s"} enrolled</b><span>Open roster <ArrowUpRight /></span></div>
        </button>
        <button className="classroom-overview-action learning" onClick={() => setActiveTab("learning")}>
          <BookOpen className="classroom-card-watermark" aria-hidden="true" />
          <span className="classroom-card-icon"><BookOpen /></span>
          <div className="classroom-card-copy"><small>CLASSWORK</small><h2>{lessons.length} teacher lesson{lessons.length === 1 ? "" : "s"}</h2><p>Review class lessons, built-in exercises, and games available in the app.</p></div>
          <div className="classroom-card-footer"><b>{GAMES.length} learning games</b><span>Open learning <ArrowUpRight /></span></div>
        </button>
        <section className="classroom-pulse">
          <TrendingUp className="classroom-card-watermark" aria-hidden="true" />
          <span className="classroom-card-icon"><TrendingUp /></span>
          <div className="classroom-card-copy"><small>CLASS PULSE</small><h2>Mastery snapshot</h2><p>{students.length ? "Based on the latest lesson progress from this roster." : "Add learners to begin measuring class progress."}</p></div>
          <div className="classroom-mastery-ring" style={{ "--mastery": `${avgMastery * 3.6}deg` } as React.CSSProperties}><span><b>{avgMastery}%</b><small>average</small></span></div>
          <div className="classroom-card-footer"><b>{students.length ? "Progress is up to date" : "Waiting for learner activity"}</b><span className="pulse-status"><i /> Live snapshot</span></div>
        </section>
      </div>}

      {activeTab === "students" && <div className="classroom-student-workspace">
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

          <label className="classroom-roster-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email" /></label>

          <div className="class-enrollment-box">
            <span className="class-enrollment-icon"><UserPlus /></span>
            <div className="class-enrollment-copy"><b>Add a learner</b><small>Enter the email used for their JapLearn student account.</small></div>
            <form className="class-enrollment-form" onSubmit={addStudent}>
              <label><Mail /><input aria-label="Student account email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="learner@example.com" required /></label>
              <button disabled={adding}>{adding ? "Adding…" : "Add to class"}<UserPlus /></button>
            </form>
          </div>

          {visibleStudents.length ? (
            <div className="roster-list">
              {visibleStudents.map((student, index) => {
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
                <b>{students.length ? "No matching learners" : "Your class is ready for learners"}</b>
                <small>{students.length ? "Try another name or email." : "Add a student account above or share the class code."}</small>
              </div>
            </div>
          )}
        </section>

      </div>}

      {activeTab === "learning" && <section className="class-available-section classroom-learning-workspace">
      <div className="tile-head">
        <div>
          <span className="eyebrow">LEARNING LIBRARY</span>
          <h3><BookOpen /> Lessons and practice</h3>
        </div>
        <Link className="classroom-manage-lessons" to={`/teacher/lessons?class=${encodeURIComponent(decodedCode)}`}><BookOpen />Manage lessons</Link>
      </div>
      <div className="classroom-teacher-lessons">
        <div className="class-catalog-label"><GraduationCap /><div><b>Teacher lessons</b><small>Published specifically for this classroom</small></div><Link to={`/teacher/lessons/new?class=${encodeURIComponent(decodedCode)}`}><Plus />New lesson</Link></div>
        <div className="classroom-lesson-row">
          {lessons.length ? lessons.map((lesson, index) => <article key={lesson.id}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{lesson.lesson_type || "LESSON"}</small><b>{lesson.lessonTitle || lesson.title || "Untitled lesson"}</b><p>{lesson.lessonDescription || lesson.description || "Japanese lesson"}</p></div><BookOpen /></article>) : <div className="lesson-empty"><BookOpen /><div><b>No teacher lessons yet</b><small>Create the first learning milestone for this class.</small></div></div>}
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
      </section>}
    </section>
  );
}
