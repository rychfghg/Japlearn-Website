import { API_URL } from "../../../lib/api";
import { session } from "../../../lib/auth";
import type {
  AssignableActivity,
  ClassRecord,
  CommunicationAnalytics,
  CommunicationReport,
  Lesson,
  Student,
  StudentLessonProgress,
  SituationalAttempt,
  ArcadeScore,
  QuackTalkSession,
  ReplyCoachAttempt,
  TeacherGamePerformance,
  SlateQuestion,
  SlateSession,
  SlateScoreSheet,
} from "../types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = session.get()?.portalSessionToken;
  if (!token) throw new Error("Your teacher session has expired. Please sign in again.");
  const headers = new Headers(options?.headers);
  headers.set("X-Teacher-Token", token);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const text = await response.text();
    let message = "";
    try { const error = JSON.parse(text); message = error.message || error.detail || ""; }
    catch { if (text && !text.startsWith("<")) message = text; }
    throw new Error(message || (response.status === 400 ? "Please check the required fields and try again."
      : response.status === 401 || response.status === 403 ? "Your session cannot access this record. Please sign in again."
      : response.status === 404 ? "This record or service is unavailable. Please refresh after the backend is updated."
      : "The request could not be completed. Please try again."));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const teacherEmail = () => {
  const email = session.get()?.email?.trim().toLowerCase();
  if (!email) throw new Error("Your teacher session has expired. Please sign in again.");
  return email;
};

const teacherQuery = () => `teacherEmail=${encodeURIComponent(teacherEmail())}`;

export const teacherApi = {
  getClasses: () => request<ClassRecord[]>(`/api/classes/getAllClasses?${teacherQuery()}`),
  addClass: (classCodes: string) =>
    request<void>(`/api/classes/addClass?${teacherQuery()}`, json("POST", { classCodes })),
  removeClass: (classCode: string) =>
    request<void>(
      `/api/classes/removeClass?classCode=${encodeURIComponent(classCode)}&${teacherQuery()}`,
      {
        method: "DELETE",
      },
    ),

  getAllStudents: () => request<Student[]>(`/api/students/getAllStudents?${teacherQuery()}`),
  getAllLessonProgress: () => request<StudentLessonProgress[]>(`/api/progress/teacher?${teacherQuery()}`),
  getLessonProgress: (email: string) =>
    request<StudentLessonProgress>(
      `/api/progress/${encodeURIComponent(email)}`,
    ),
  getStudentsByClass: (classCode: string) =>
    request<Student[]>(
      `/api/students/getByClassCode?classCode=${encodeURIComponent(classCode)}&${teacherQuery()}`,
    ),
  joinStudent: (email: string, classCode: string) =>
    request<void>(
      `/api/students/joinClass?email=${encodeURIComponent(email)}&classCode=${encodeURIComponent(classCode)}&${teacherQuery()}`,
      { method: "POST" },
    ),
  removeStudent: (classCode: string, student: Student) =>
    request<void>(
      "/api/students/removeStudent",
      json("DELETE", { classCode, name: `${student.fname} ${student.lname}`, teacherEmail: teacherEmail() }),
    ),

  getLessons: (classCode: string) =>
    request<Lesson[]>(
      `/api/lesson/getLessonByClass/${encodeURIComponent(classCode)}`,
    ),
  getDatabankLessons: () =>
    request<Lesson[]>("/api/DatabankLesson/getAllDatabankLessons"),
  createLesson: (payload: unknown) =>
    request<Lesson>("/api/lesson/createLesson", json("POST", payload)),
  editLesson: (lessonId: string | number, payload: unknown) =>
    request<Lesson>(`/api/lesson/editLesson/${lessonId}`, json("PUT", payload)),
  deleteLesson: (lessonId: string | number) =>
    request<void>(`/api/lesson/deleteLesson?classId=${lessonId}`, {
      method: "DELETE",
    }),

  getActivities: () =>
    request<AssignableActivity[]>("/api/assignableActivities/getAll"),
  assignActivities: (payload: unknown) =>
    request<void>("/api/activityAssignments/assign", json("POST", payload)),

  getAnalytics: (email: string) =>
    request<CommunicationAnalytics>(
      `/api/communicationAnalytics/getStudentAnalytics?email=${encodeURIComponent(email)}`,
    ),
  getReport: (email: string) =>
    request<CommunicationReport>(
      `/api/communicationReports/getStudentReport?email=${encodeURIComponent(email)}`,
    ),
  generateReport: (email: string) =>
    request<CommunicationReport>(
      "/api/communicationReports/generate",
      json("POST", { email }),
    ),
  reportExportUrl: (email: string) =>
    `${API_URL}/api/communicationReports/export?email=${encodeURIComponent(email)}`,
  getRecognitionAttempts: (email: string) =>
    request<SituationalAttempt[]>(
      `/api/situational/attempts?email=${encodeURIComponent(email)}&gameType=RECOGNITION`,
    ),
  getSituationalAttempts: (email: string) =>
    request<SituationalAttempt[]>(
      `/api/situational/attempts?email=${encodeURIComponent(email)}`,
    ),
  getArcadeScores: (email: string) =>
    request<ArcadeScore[]>(
      `/api/scores/student?email=${encodeURIComponent(email)}`,
    ),
  getQuackTalkSessions: (email: string) =>
    request<QuackTalkSession[]>(
      `/api/quackTalkSessions?email=${encodeURIComponent(email)}`,
    ),
  getReplyCoachAttempts: (email: string) =>
    request<ReplyCoachAttempt[]>(
      `/api/reply-coach/attempts?email=${encodeURIComponent(email)}`,
    ),
  getGamePerformance: (email: string) =>
    request<TeacherGamePerformance>(
      `/api/teacher/game-performance?studentEmail=${encodeURIComponent(email)}&${teacherQuery()}`,
    ),
  getSlateQuestions: () => request<SlateQuestion[]>(`/api/teacher/quackslate/questions?${teacherQuery()}`),
  addSlateQuestion: (question: Omit<SlateQuestion, "id">) =>
    request<SlateQuestion>(`/api/teacher/quackslate/questions?${teacherQuery()}`, json("POST", question)),
  getSlateSessions: () => request<SlateSession[]>(`/api/teacher/quackslate/sessions?${teacherQuery()}`),
  createSlateSession: () => request<SlateSession>(`/api/teacher/quackslate/sessions?${teacherQuery()}`, { method: "POST" }),
  deleteSlateSession: (code: string) => request<void>(`/api/teacher/quackslate/sessions/${encodeURIComponent(code)}?${teacherQuery()}`, { method: "DELETE" }),
  getSlateSession: (code: string) => request<{ session: SlateSession; questionIds: string[] }>(
    `/api/teacher/quackslate/sessions/${encodeURIComponent(code)}?${teacherQuery()}`),
  setSlateQuestions: (code: string, ids: string[]) => request<SlateSession>(
    `/api/teacher/quackslate/sessions/${encodeURIComponent(code)}/questions?${teacherQuery()}`,
    json("PUT", ids)),
  scheduleSlateSession: (code: string, startsAt: string, endsAt: string) => request<SlateSession>(
    `/api/teacher/quackslate/sessions/${encodeURIComponent(code)}/schedule?${teacherQuery()}`,
    json("POST", { startsAt, endsAt })),
  getSlateScoreSheet: (code: string) => request<SlateScoreSheet>(
    `/api/teacher/quackslate/sessions/${encodeURIComponent(code)}/sheet?${teacherQuery()}`),
};
