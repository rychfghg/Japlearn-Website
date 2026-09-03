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
  lesson_title?: string;
  lesson_type?: string;
  lesson_description?: string;
};

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
  scenarioTitle?: string;
  conversationTurns?: number;
  averagePronunciationScore?: number;
  averageAccuracyScore?: number;
  averageFluencyScore?: number;
  contextualAccuracy?: number;
  registerPerformance?: string;
  hintsUsed?: number;
  feedbackSummary?: string;
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
