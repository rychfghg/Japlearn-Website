import {
  Activity,
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
import { type CSSProperties, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import mascot from "../../../assets/hello.png";
import { session } from "../../../lib/auth";
import { teacherApi } from "../services/teacherApi";
import type { ClassRecord, Student } from "../types";

export default function OverviewPage() {
  const user = session.get()!;
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    Promise.all([teacherApi.getClasses(), teacherApi.getAllStudents()])
      .then(([classData, studentData]) => {
        setClasses(classData);
        setStudents(studentData);
      })
      .catch(() => undefined);
  }, []);

  const recentClasses = classes.slice(0, 4);
  const studentsWithClasses = students.filter((student) => student.classCode).length;
  const enrollmentRate = students.length
    ? Math.round((studentsWithClasses / students.length) * 100)
    : 0;

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
            <small>LESSONS</small>
            <b>—</b>
            <p>Class learning plans</p>
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
