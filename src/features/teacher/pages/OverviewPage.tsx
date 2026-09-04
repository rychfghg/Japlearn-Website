import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  CircleCheck,
  Clock3,
  GraduationCap,
  MessageSquareText,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import mascot from "../../../assets/hello.png";
import { session } from "../../../lib/auth";
import { teacherApi } from "../services/teacherApi";
import type { ClassRecord, Student, StudentLessonProgress } from "../types";
import { LESSON_STAGES, masteryPercent, progressMapByEmail } from "../utils/mastery";

export default function OverviewPage() {
  const user = session.get()!;
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [lessonProgress, setLessonProgress] = useState<StudentLessonProgress[]>([]);

  useEffect(() => {
    Promise.all([
      teacherApi.getClasses(),
      teacherApi.getAllStudents(),
      teacherApi.getAllLessonProgress(),
    ])
      .then(([classData, studentData, progressData]) => {
        setClasses(classData);
        setStudents(studentData);
        setLessonProgress(progressData);
      })
      .catch(() => undefined);
  }, []);

  const recentClasses = classes.slice(0, 4);
  const studentsWithClasses = students.filter((student) => student.classCode).length;
  const enrollmentRate = students.length
    ? Math.round((studentsWithClasses / students.length) * 100)
    : 0;

  const progressByEmail = useMemo(() => progressMapByEmail(lessonProgress), [lessonProgress]);

  const studentMastery = useMemo(
    () =>
      students.map((student) => ({
        ...student,
        percent: masteryPercent(progressByEmail.get(student.email)),
      })),
    [students, progressByEmail],
  );

  const avgMastery = studentMastery.length
    ? Math.round(studentMastery.reduce((sum, student) => sum + student.percent, 0) / studentMastery.length)
    : 0;

  const stageStats = useMemo(
    () =>
      LESSON_STAGES.map((stage) => {
        if (!students.length) return { ...stage, percent: 0 };
        const total = students.reduce((sum, student) => {
          const progress = progressByEmail.get(student.email);
          const completed = progress ? stage.fields.filter((field) => progress[field]).length : 0;
          return sum + completed / stage.fields.length;
        }, 0);
        return { ...stage, percent: Math.round((total / students.length) * 100) };
      }),
    [students, progressByEmail],
  );

  const needsAttention = useMemo(
    () =>
      studentMastery
        .filter((student) => student.classCode && student.percent < 100)
        .sort((a, b) => a.percent - b.percent)
        .slice(0, 3),
    [studentMastery],
  );

  return (
    <>
      <section className="welcome-card">
        <div>
          <span className="welcome-kicker">
            おはようございます、{user.fname}先生
          </span>
          <h2>
            Ready to guide today’s
            <br />
            Japanese journey?
          </h2>
          <p>Your synchronized classroom workspace is ready.</p>
          <div>
            <Link className="primary" to="/teacher/classes">
              <Plus /> Manage classes
            </Link>
            <Link className="soft" to="/teacher/lessons">
              <BookOpen /> Plan a lesson
            </Link>
          </div>
        </div>
        <div className="welcome-art">
          <div className="welcome-sun" />
          <div className="mini-fuji" />
          <img src={mascot} alt="Ahiru welcoming the teacher" />
          <span>
            一緒に頑張りましょう！<small>Let’s do our best together!</small>
          </span>
        </div>
      </section>

      <section className="overview-section-head">
        <div>
          <span>CLASSROOM PULSE</span>
          <h2>Today at a glance</h2>
        </div>
        <small><Clock3 /> Live workspace summary</small>
      </section>

      <section className="metric-grid overview-metrics">
        <article>
          <span className="purple">
            <GraduationCap />
          </span>
          <div>
            <small>ACTIVE CLASSES</small>
            <b>{classes.length}</b>
            <p>Connected classrooms</p>
          </div>
          <TrendingUp className="metric-trend" />
        </article>
        <article>
          <span className="green">
            <Users />
          </span>
          <div>
            <small>STUDENTS</small>
            <b>{students.length}</b>
            <p>Live student accounts</p>
          </div>
          <TrendingUp className="metric-trend" />
        </article>
        <article>
          <span className="orange">
            <BookOpen />
          </span>
          <div>
            <small>CURRICULUM MASTERY</small>
            <b>{avgMastery}%</b>
            <p>Avg. lesson completion</p>
          </div>
          <BookOpen className="metric-trend" />
        </article>
        <article>
          <span className="pink">
            <Activity />
          </span>
          <div>
            <small>ACTIVITIES</small>
            <b>6</b>
            <p>Game and communication tools</p>
          </div>
          <Sparkles className="metric-trend" />
        </article>
      </section>

      <section className="overview-mastery">
        <header>
          <div><span>CLASS PROGRESS</span><h3>How your class is progressing</h3></div>
          <Link to="/teacher/lessons/progress">Full masterlist <ArrowRight /></Link>
        </header>
        <div className="mastery-bars">
          {stageStats.map((stage) => (
            <div key={stage.key}>
              <div className="mastery-bar-label">
                <span>{stage.label}</span>
                <b>{stage.percent}%</b>
              </div>
              <div className="mastery-bar-track">
                <div className="mastery-bar-fill" style={{ width: `${stage.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="overview-dashboard-grid">
        <section className="overview-class-panel">
          <header>
            <div><span>YOUR CLASSROOMS</span><h3>Continue where you left off</h3></div>
            <Link to="/teacher/classes">View all <ArrowRight /></Link>
          </header>
          <div className="overview-class-list">
            {recentClasses.length ? recentClasses.map((classroom, index) => {
              const classStudents = students.filter((student) => student.classCode === classroom.classCodes).length;
              return (
                <Link to={`/teacher/classes/${encodeURIComponent(classroom.classCodes)}`} key={classroom.id ?? classroom.classCodes}>
                  <span className={`class-orb tone-${(index % 4) + 1}`}><GraduationCap /></span>
                  <div><b>{classroom.classCodes}</b><small>{classStudents} learner{classStudents === 1 ? "" : "s"} enrolled</small></div>
                  <span className="open-class">Open <ChevronRight /></span>
                </Link>
              );
            }) : (
              <div className="overview-empty-class">
                <GraduationCap />
                <div><b>Your first class starts here</b><small>Create a classroom and invite your learners.</small></div>
                <Link to="/teacher/classes"><Plus /> Create class</Link>
              </div>
            )}
          </div>
        </section>

        <aside className="overview-insight-panel">
          <span>LEARNER SNAPSHOT</span>
          <h3>Enrollment health</h3>
          <div className="overview-ring" style={{ "--progress": `${enrollmentRate * 3.6}deg` } as CSSProperties}>
            <div><b>{enrollmentRate}%</b><small>connected</small></div>
          </div>
          <p><CircleCheck /> {studentsWithClasses} of {students.length} learners are connected to a class.</p>
          <Link to="/teacher/students">Review learners <ArrowRight /></Link>

          {needsAttention.length > 0 && (
            <div className="overview-attention">
              <span className="overview-attention-title"><AlertCircle /> Needs a nudge</span>
              <ul>
                {needsAttention.map((student) => (
                  <li key={student.email}>
                    <div>
                      <b>{student.fname} {student.lname}</b>
                      <small>{student.classCode || "Unassigned"}</small>
                    </div>
                    <span>{student.percent}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      <section className="overview-section-head overview-actions-head">
        <div><span>QUICK START</span><h2>What would you like to do?</h2></div>
      </section>
      <div className="overview-links overview-action-cards">
        <Link to="/teacher/classes"><span><GraduationCap /></span><div><small>CLASSROOM</small><b>Open classrooms</b><p>Enrollment, lessons, and activities</p></div><ArrowRight /></Link>
        <Link to="/teacher/communication"><span><MessageSquareText /></span><div><small>COMMUNICATION</small><b>Guide communication</b><p>Performance, assignments, and practice</p></div><ArrowRight /></Link>
        <Link to="/teacher/reports"><span><BarChart3 /></span><div><small>INSIGHTS</small><b>Generate reports</b><p>Mastery, progress, and reinforcement</p></div><ArrowRight /></Link>
      </div>
    </>
  );
}
