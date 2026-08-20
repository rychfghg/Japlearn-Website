import { API_URL } from "../../../lib/api";
import type {
  AssignableActivity,
  ClassRecord,
  CommunicationAnalytics,
  CommunicationReport,
  Lesson,
  Student,
  StudentLessonProgress,
  SituationalAttempt,
} from "../types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, options);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status}).`);
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

export const teacherApi = {
  getClasses: () => request<ClassRecord[]>("/api/classes/getAllClasses"),
  addClass: (classCodes: string) =>
    request<void>("/api/classes/addClass", json("POST", { classCodes })),
  removeClass: (classCode: string) =>
    request<void>(
      `/api/classes/removeClass?classCode=${encodeURIComponent(classCode)}`,
      {
        method: "DELETE",
      },
    ),

  getAllStudents: () => request<Student[]>("/api/students/getAllStudents"),
  getAllLessonProgress: () => request<StudentLessonProgress[]>("/api/progress"),
  getLessonProgress: (email: string) =>
    request<StudentLessonProgress>(
      `/api/progress/${encodeURIComponent(email)}`,
    ),
  getStudentsByClass: (classCode: string) =>
    request<Student[]>(
      `/api/students/getByClassCode?classCode=${encodeURIComponent(classCode)}`,
    ),
  joinStudent: (email: string, classCode: string) =>
    request<void>(
      `/api/students/joinClass?email=${encodeURIComponent(email)}&classCode=${encodeURIComponent(classCode)}`,
      { method: "POST" },
    ),
  removeStudent: (classCode: string, student: Student) =>
    request<void>(
      "/api/students/removeStudent",
      json("DELETE", { classCode, name: `${student.fname} ${student.lname}` }),
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
};
