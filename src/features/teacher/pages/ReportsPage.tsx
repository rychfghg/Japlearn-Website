import { Download, FileBarChart, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import StatusMessage from "../components/StatusMessage";
import { teacherApi } from "../services/teacherApi";
import type { CommunicationReport, Student } from "../types";

export default function ReportsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [report, setReport] = useState<CommunicationReport | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    teacherApi
      .getAllStudents()
      .then((data) => {
        setStudents(data);
        if (data[0]) setSelectedEmail(data[0].email);
      })
      .catch((error) => setMessage(error.message));
  }, []);

  useEffect(() => {
    if (!selectedEmail) return;
    teacherApi
      .getReport(selectedEmail)
      .then(setReport)
      .catch(() => setReport(null));
  }, [selectedEmail]);

  const generate = async () => {
    try {
      setReport(await teacherApi.generateReport(selectedEmail));
      setMessage("Communication progress report generated successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not generate report.",
      );
    }
  };

  return (
    <section className="full-panel">
      <PageHeader
        eyebrow="REPORT CENTER"
        title="Communication progress reports"
        description="Generate and export the same student reports connected to the mobile teacher app."
      />
      {message && (
        <StatusMessage
          type={message.includes("successfully") ? "success" : "error"}
        >
          {message}
        </StatusMessage>
      )}
      <div className="report-toolbar">
        <label>
          Student
          <select
            value={selectedEmail}
            onChange={(event) => setSelectedEmail(event.target.value)}
          >
            {students.map((student) => (
              <option key={student.email} value={student.email}>
                {student.fname} {student.lname}
              </option>
            ))}
          </select>
        </label>
        <button onClick={generate}>
          <RefreshCw />
          Generate report
        </button>
        <a href={teacherApi.reportExportUrl(selectedEmail)}>
          <Download />
          Export
        </a>
      </div>
      {report ? (
        <>
          <div className="report-metrics">
            <article>
              <small>COMPLETION RATE</small>
              <b>{report.completionRate}%</b>
            </article>
            <article>
              <small>MASTERY PROGRESS</small>
              <b>{report.masteryProgress}%</b>
            </article>
            <article>
              <small>REINFORCEMENT</small>
              <b>{report.reinforcementCompleted}</b>
            </article>
          </div>
          <div className="report-history">
            <h3>Mastery progression</h3>
            {report.masteryHistory?.map((item) => (
              <article key={item.stage}>
                <span>{item.score}</span>
                <div>
                  <b>{item.stage}</b>
                  <small>{item.status}</small>
                </div>
                <i style={{ width: `${item.score}%` }} />
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="empty">
          <span>
            <FileBarChart />
          </span>
          <h3>No report generated</h3>
          <p>
            Select a student and generate their communication progress report.
          </p>
        </div>
      )}
    </section>
  );
}
