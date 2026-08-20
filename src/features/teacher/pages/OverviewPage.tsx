import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  GraduationCap,
  MessageSquareText,
  Plus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
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

      <section className="metric-grid">
        <article>
          <span className="purple">
            <GraduationCap />
          </span>
          <div>
            <small>ACTIVE CLASSES</small>
            <b>{classes.length}</b>
            <p>Connected classrooms</p>
          </div>
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
        </article>
      </section>

      <div className="overview-links">
        <Link to="/teacher/classes">
          <GraduationCap />
          <div>
            <b>Open classrooms</b>
            <small>Enrollment, lessons, and activities</small>
          </div>
          <ArrowRight />
        </Link>
        <Link to="/teacher/communication">
          <MessageSquareText />
          <div>
            <b>Communication management</b>
            <small>Performance, assignments, and reports</small>
          </div>
          <ArrowRight />
        </Link>
        <Link to="/teacher/reports">
          <BarChart3 />
          <div>
            <b>Generate reports</b>
            <small>Student mastery and reinforcement</small>
          </div>
          <ArrowRight />
        </Link>
      </div>
    </>
  );
}
