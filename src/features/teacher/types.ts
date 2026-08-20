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
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  completed: boolean;
  completedAt: string;
};
