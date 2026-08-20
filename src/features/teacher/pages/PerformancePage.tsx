import { BarChart3, CheckCircle2, Target, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import StatusMessage from "../components/StatusMessage";
import { teacherApi } from "../services/teacherApi";
import type { CommunicationAnalytics, SituationalAttempt, Student } from "../types";

export default function PerformancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [analytics, setAnalytics] = useState<CommunicationAnalytics | null>(
    null,
  );
  const [studentError, setStudentError] = useState("");
  const [analyticsError, setAnalyticsError] = useState("");
  const [recognitionError, setRecognitionError] = useState("");
  const [recognitionAttempts, setRecognitionAttempts] = useState<SituationalAttempt[]>([]);

  useEffect(() => {
    teacherApi
      .getAllStudents()
      .then((data) => {
        setStudents(data);
        if (data[0]) setSelectedEmail(data[0].email);
      })
      .catch(() => setStudentError("Student list could not be loaded. Confirm that the Spring Boot backend is running."));
  }, []);

  useEffect(() => {
    if (!selectedEmail) return;
    setAnalyticsError("");
    setRecognitionError("");
    teacherApi
      .getAnalytics(selectedEmail)
      .then((data) => {
        setAnalytics(data);
        setAnalyticsError("");
      })
      .catch(() => {
        setAnalytics(null);
        setAnalyticsError("Communication summary is temporarily unavailable. Recognition records below are loaded separately.");
      });
    teacherApi.getRecognitionAttempts(selectedEmail)
      .then((data) => {
        setRecognitionAttempts(data);
        setRecognitionError("");
      })
      .catch(() => {
        setRecognitionAttempts([]);
        setRecognitionError("Recognition records could not be reached. Restart the updated Spring Boot backend, then refresh this page.");
      });
  }, [selectedEmail]);

  const metrics = analytics
    ? [
        ["QuackTalk", analytics.quackTalkAccuracy],
        ["QuackSituate", analytics.quackSituateAccuracy],
        ["QuackResponse", analytics.quackResponseAccuracy],
      ]
    : [];

  return (
    <section className="full-panel">
      <PageHeader
        eyebrow="PERFORMANCE MONITOR"
        title="Student communication performance"
        description="Live analytics from the existing communication analytics service."
      />
      {studentError && <StatusMessage>{studentError}</StatusMessage>}
      <label className="student-picker">
        Student
        <select
          value={selectedEmail}
          onChange={(event) => setSelectedEmail(event.target.value)}
        >
          {students.map((student) => (
            <option key={student.email} value={student.email}>
              {student.fname} {student.lname} · {student.email}
            </option>
          ))}
        </select>
      </label>
      {analytics && (
        <>
          <div className="performance-metrics">
            {metrics.map(([label, value]) => (
              <article key={String(label)}>
                <span>
                  <BarChart3 />
                </span>
                <small>{label}</small>
                <b>{value}%</b>
                <div>
                  <i style={{ width: `${value}%` }} />
                </div>
              </article>
            ))}
          </div>
          <div className="analysis-grid">
            <article>
              <CheckCircle2 />
              <h3>Strengths</h3>
              {analytics.strengths?.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </article>
            <article>
              <TriangleAlert />
              <h3>Areas to reinforce</h3>
              {analytics.weakAreas?.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </article>
            <article>
              <Target />
              <h3>Coach recommendation</h3>
              <p>{analytics.recommendation}</p>
              <small>
                {analytics.completedActivities} completed activities
              </small>
            </article>
          </div>
        </>
      )}
      {analyticsError && <div className="analytics-inline-notice"><TriangleAlert /><span>{analyticsError}</span></div>}
      <section className="recognition-records">
        <div><small>QUACKSITUATE · RECOGNITION</small><h2>Recognition attempt history</h2><p>Detailed results from the learner's standard and hard situational-response missions.</p></div>
        <div className="recognition-record-table">
          <div className="recognition-record-row heading"><span>Date</span><span>Score</span><span>Correct</span><span>Accuracy</span><span>Status</span></div>
          {recognitionError ? <p className="recognition-fetch-error">{recognitionError}</p> : recognitionAttempts.length ? recognitionAttempts.map((attempt) => <div className="recognition-record-row" key={attempt.id}><span>{new Date(attempt.completedAt).toLocaleString()}</span><b>{attempt.score}</b><span>{attempt.correctAnswers} / {attempt.totalQuestions}</span><strong>{attempt.accuracy}%</strong><i>Completed</i></div>) : <p className="empty-recognition-record">No completed Recognition run has been recorded for this student yet.</p>}
        </div>
      </section>
    </section>
  );
}
