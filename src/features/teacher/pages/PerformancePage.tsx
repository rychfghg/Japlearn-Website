import { BarChart3, CheckCircle2, Target, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import StatusMessage from "../components/StatusMessage";
import { teacherApi } from "../services/teacherApi";
import type {
  ArcadeScore,
  CommunicationAnalytics,
  SituationalAttempt,
  Student,
  QuackTalkSession,
} from "../types";

export default function PerformancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [analytics, setAnalytics] = useState<CommunicationAnalytics | null>(
    null,
  );
  const [studentError, setStudentError] = useState("");
  const [analyticsError, setAnalyticsError] = useState("");
  const [recognitionError, setRecognitionError] = useState("");
  const [recognitionAttempts, setRecognitionAttempts] = useState<
    SituationalAttempt[]
  >([]);
  const [arcadeScores, setArcadeScores] = useState<ArcadeScore[]>([]);
  const [talkSessions, setTalkSessions] = useState<QuackTalkSession[]>([]);

  useEffect(() => {
    teacherApi
      .getAllStudents()
      .then((data) => {
        setStudents(data);
        if (data[0]) setSelectedEmail(data[0].email);
      })
      .catch(() =>
        setStudentError(
          "Student list could not be loaded. Confirm that the Spring Boot backend is running.",
        ),
      );
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
        setAnalyticsError(
          "Communication summary is temporarily unavailable. Recognition records below are loaded separately.",
        );
      });
    teacherApi
      .getSituationalAttempts(selectedEmail)
      .then((data) => {
        setRecognitionAttempts(data);
        setRecognitionError("");
      })
      .catch(() => {
        setRecognitionAttempts([]);
        setRecognitionError(
          "Recognition records could not be reached. Restart the updated Spring Boot backend, then refresh this page.",
        );
      });
    teacherApi
      .getArcadeScores(selectedEmail)
      .then(setArcadeScores)
      .catch(() => setArcadeScores([]));
    teacherApi
      .getQuackTalkSessions(selectedEmail)
      .then(setTalkSessions)
      .catch(() => setTalkSessions([]));
  }, [selectedEmail]);

  const metrics = analytics
    ? [
        ["QuackTalk", analytics.quackTalkAccuracy],
        ["QuackSituate", analytics.quackSituateAccuracy],
        ["QuackResponse", analytics.quackResponseAccuracy],
        ["Recognition", analytics.recognitionAccuracy || 0],
        ["Expression Match", analytics.expressionMatchAccuracy || 0],
        ["Politeness", analytics.politenessAccuracy || 0],
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
      {analyticsError && (
        <div className="analytics-inline-notice">
          <TriangleAlert />
          <span>{analyticsError}</span>
        </div>
      )}
      <section className="recognition-records">
        <div>
          <small>COMPLETE GAME RECORD</small>
          <h2>Student game progress</h2>
          <p>
            Detailed QuackSituate attempts and arcade personal-best records for
            this learner.
          </p>
        </div>
        <div className="recognition-record-table">
          <div className="recognition-record-row heading">
            <span>Speaking room / date</span>
            <span>Duration</span>
            <span>Language</span>
            <span>Evaluation</span>
            <span>Status</span>
          </div>
          {talkSessions.length ? (
            talkSessions.map((session) => (
              <div className="recognition-record-row" key={session.id}>
                <span>
                  <b>{session.roomType.replaceAll("_", " ")}</b>
                  <br />
                  {new Date(session.practicedAt).toLocaleString()}
                </span>
                <b>
                  {Math.floor(session.durationSeconds / 60)}m{" "}
                  {session.durationSeconds % 60}s
                </b>
                <span>{session.language}</span>
                <strong>
                  {session.evaluated && session.score != null
                    ? `${session.score}%`
                    : "Not evaluated"}
                </strong>
                <i>Practice saved</i>
              </div>
            ))
          ) : (
            <p className="empty-recognition-record">
              No Talk with Sumi or Guided Phrase practice is available yet.
            </p>
          )}
        </div>
        <div className="recognition-record-table">
          <div className="recognition-record-row heading">
            <span>Game / date</span>
            <span>Score</span>
            <span>Progress</span>
            <span>Accuracy</span>
            <span>Status</span>
          </div>
          {recognitionError ? (
            <p className="recognition-fetch-error">{recognitionError}</p>
          ) : recognitionAttempts.length ? (
            recognitionAttempts.map((attempt) => (
              <div className="recognition-record-row" key={attempt.id}>
                <span>
                  <b>{attempt.gameType.replaceAll("_", " ")}</b>
                  <br />
                  {new Date(attempt.completedAt).toLocaleString()}
                </span>
                <b>{attempt.score}</b>
                <span>
                  {attempt.level
                    ? `Level ${attempt.level} · Set ${attempt.setNumber}`
                    : `${attempt.correctAnswers} / ${attempt.totalQuestions}`}
                </span>
                <strong>{attempt.accuracy}%</strong>
                <i>{attempt.completed ? "Completed" : "In progress"}</i>
              </div>
            ))
          ) : (
            <p className="empty-recognition-record">
              No QuackSituate attempt has been recorded for this student yet.
            </p>
          )}
        </div>
        <div className="recognition-record-table">
          <div className="recognition-record-row heading">
            <span>Arcade game</span>
            <span>Best score</span>
            <span>Date</span>
            <span>Record</span>
            <span>Status</span>
          </div>
          {arcadeScores.length ? (
            arcadeScores.map((score) => (
              <div className="recognition-record-row" key={score.id}>
                <b>{score.game}</b>
                <strong>{score.score}</strong>
                <span>{score.date || "—"}</span>
                <span>Personal best</span>
                <i>Recorded</i>
              </div>
            ))
          ) : (
            <p className="empty-recognition-record">
              No Quack-a-Mole, Quackman, or QuackSlate score is available yet.
            </p>
          )}
        </div>
      </section>
    </section>
  );
}
