import { useEffect, useState } from "react";
import { BookOpenCheck, CheckCircle2, GraduationCap, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { API_URL } from "../../../lib/api";

type UserRecord = { role: string; approved: boolean; emailConfirmed: boolean };

export default function AdminOverviewPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [questions, setQuestions] = useState<unknown[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/users`).then((response) => response.ok ? response.json() : Promise.reject()),
      fetch(`${API_URL}/api/quackslate/question-bank`).then((response) => response.ok ? response.json() : Promise.reject()),
    ]).then(([userData, questionData]) => { setUsers(userData); setQuestions(questionData); }).catch(() => setError(`Could not connect to ${API_URL}. Start the updated Spring Boot backend, then refresh.`));
  }, []);

  const students = users.filter((user) => user.role?.toLowerCase() === "student");
  const teachers = users.filter((user) => user.role?.toLowerCase() === "teacher");
  const pending = users.filter((user) => user.emailConfirmed && !user.approved);

  return <div className="admin-dashboard-page">
    <header className="admin-welcome"><div><small>ADMINISTRATION</small><h1>JapLearn control center</h1><p>Manage access, educators, learners, and the shared QuackSlate content library.</p></div><div className="admin-status"><CheckCircle2 />System workspace</div></header>
    {error && <div className="admin-error">{error}</div>}
    <div className="admin-stat-grid">
      <Link to="/admin/students"><span className="violet"><Users /></span><div><b>{students.length}</b><p>Student accounts</p></div></Link>
      <Link to="/admin/teachers"><span className="green"><GraduationCap /></span><div><b>{teachers.length}</b><p>Teacher accounts</p></div></Link>
      <Link to="/admin/students"><span className="orange"><CheckCircle2 /></span><div><b>{pending.length}</b><p>Awaiting approval</p></div></Link>
      <Link to="/admin/quackslate"><span className="blue"><BookOpenCheck /></span><div><b>{questions.length}</b><p>QuackSlate questions</p></div></Link>
    </div>
    <section className="admin-action-panel"><div><small>ACCOUNT REVIEW</small><h2>{pending.length ? `${pending.length} account${pending.length === 1 ? "" : "s"} need attention` : "All confirmed accounts are reviewed"}</h2><p>Approve verified registrations before learners or teachers use protected JapLearn features.</p></div><Link to="/admin/students">Review accounts</Link></section>
  </div>;
}
