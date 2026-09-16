export type ClassRecord = {
  id?: number | string;
  classCodes: string;
};

export type Student = {
  id?: number | string;
  fname: string;
  lname: string;
  email: string;
  classCode?: string;
};

export type StudentLessonProgress = {
  email: string;
  hiragana1: boolean;
  hiragana2: boolean;
  hiragana3: boolean;
  katakana1: boolean;
  katakana2: boolean;
  katakana3: boolean;
  vocab1: boolean;
  vocab2: boolean;
  vocab3: boolean;
  sentence: boolean;
};

export type Lesson = {
  id: number | string;
  lessonTitle?: string;
  title?: string;
  lessonDescription?: string;
  description?: string;
  classId?: string;
  classIds?: string[];
  lesson_title?: string;
  lesson_type?: string;
  lesson_description?: string;
  ownerTeacherEmail?: string;
  sourceFileName?: string;
  pdfPageCount?: number;
  sections?: Array<{ heading: string; body: string }>;
  quiz?: Array<{ prompt: string; type: "MULTIPLE_CHOICE"|"TRUE_FALSE"|"FILL_BLANK"|"IDENTIFICATION"; choices: string[]; correctAnswer?: string; explanation?: string }>;
  quizTimerSeconds?: number | null;
  createdAt?: string;
};

export type LessonQuizAttempt = { id:string; lessonId:string; classCode:string; studentEmail:string; studentName:string; score:number; maxScore:number; percentage:number; submittedAt:string; answers:string[] };

export type CommunicationAnalytics = {
  quackTalkAccuracy: number;
  quackSituateAccuracy: number;
  quackResponseAccuracy: number;
  completedActivities: number;
  weakAreaCount: number;
  strengths: string[];
  weakAreas: string[];
  recommendation: string;
  recognitionAccuracy?: number;
  expressionMatchAccuracy?: number;
  politenessAccuracy?: number;
  quackamoleAccuracy?: number;
  quackmanAccuracy?: number;
  quackslateAccuracy?: number;
  arcadeCompletedActivities?: number;
  quackTalkPracticeSessions?: number;
  quackTalkPracticeSeconds?: number;
  quackTalkEvaluationStatus?: "PRACTICE_ONLY" | "EVALUATED";
};

export type QuackTalkSession = {
  id: string;
  email: string;
  name: string;
  roomType: "TALK_WITH_SUMI" | "GUIDED_PHRASE";
  language: "JAPANESE" | "ENGLISH";
  durationSeconds: number;
  completed: boolean;
  evaluated: boolean;
  score?: number | null;
  practicedAt: string;
};

export type GameAttempt = {
  id: string;
  game: string;
  activity: string;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  playedAt: string | null;
  status: "COMPLETED" | "IN_PROGRESS";
  mode: string | null;
  feedbackSummary: string | null;
  pronunciationScore: number | null;
  accuracyScore: number | null;
  fluencyScore: number | null;
  completenessScore: number | null;
  contextualAccuracy: number | null;
  areasForImprovement: string[];
  expressionsPracticed: string[];
  conversationTurns: number | null;
};

export type GameScoreSummary = {
  label: string;
  attempts: number;
  scoredAttempts: number;
  latest: number | null;
  average: number | null;
  highest: number | null;
  latestAt: string | null;
};

export type TeacherGamePerformance = {
  studentEmail: string;
  totalAttempts: number;
  games: Array<{
    name: string;
    summary: GameScoreSummary;
    activities: GameScoreSummary[];
  }>;
  attempts: GameAttempt[];
};

export type ReplyCoachAttempt = {
  id: string;
  email: string;
  chapterId: string;
  chapterTitle: string;
  attemptNumber: number;
  status: "IN_PROGRESS" | "COMPLETED";
  score: number;
  maximumScore: number;
  finalPercentage: number;
  bestCount: number;
  acceptableCount: number;
  awkwardCount: number;
  impoliteCount: number;
  rudeCount: number;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type CommunicationReport = {
  studentEmail: string;
  completionRate: number;
  masteryProgress: number;
  reinforcementCompleted: number;
  repeatedMistakes: string[];
  masteryHistory: Array<{ stage: string; status: string; score: number }>;
  generatedDate?: string;
};

export type AssignableActivity = {
  id: string;
  title: string;
  description?: string;
  module?: string;
  activityType?: string;
};

export type SituationalAttempt = {
  id: string;
  email: string;
  name: string;
  gameType: string;
  difficulty: string;
  score: number;
  maxScore?: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  completed: boolean;
  completedAt: string;
  level?: number;
  setNumber?: number;
  topic?: string;
};

export type ArcadeScore = {
  id: string;
  email: string;
  name: string;
  game: string;
  score: number;
  maxScore?: number;
  correctAnswers?: number;
  totalQuestions?: number;
  completed?: boolean;
  mode?: string;
  date: string;
};

export type SlateQuestion = {
  id: string;
  prompt: string;
  translation: string;
  category: string;
  difficulty: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  createdBy?: string;
};

export type SlateSession = {
  gameCode: string;
  status: "DRAFT" | "UPCOMING" | "LIVE" | "ENDED";
  serverNow: string;
  startsAt: string | null;
  endsAt: string | null;
  remainingSeconds: number;
  questionCount: number;
  joinedCount: number;
};

export type SlateScoreSheet = {
  gameCode: string;
  joinedCount: number;
  submittedCount: number;
  rows: Array<{
    email: string;
    name: string;
    attempts: number;
    latest: number | null;
    average: number | null;
    highest: number | null;
    latestAt: string | null;
    history: Array<{ score: number; maxScore: number; percentage: number; playedAt: string; completed: boolean }>;
  }>;
};
