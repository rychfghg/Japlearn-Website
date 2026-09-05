import { teacherApi } from "../services/teacherApi";
import type {
  ArcadeScore,
  QuackTalkSession,
  ReplyCoachAttempt,
  SituationalAttempt,
  Student,
  StudentLessonProgress,
} from "../types";
import { ALL_LESSON_FIELDS } from "./mastery";

export const SCORE_PER_MILESTONE = 20;
export const LESSON_MAX_SCORE = ALL_LESSON_FIELDS.length * SCORE_PER_MILESTONE;

/** Report sections a teacher can include. Each maps to one backend source. */
export const REPORT_SECTIONS = [
  {
    key: "lessons",
    label: "Lesson milestones",
    hint: "Hiragana, Katakana, Words and Grammar records",
    perStudentCall: false,
  },
  {
    key: "arcade",
    label: "Arcade games",
    hint: "Quack-a-Mole, Quackman and QuackSlate best scores",
    perStudentCall: true,
  },
  {
    key: "situate",
    label: "QuackSituate",
    hint: "Situational attempts, accuracy and best score",
    perStudentCall: true,
  },
  {
    key: "talk",
    label: "QuackTalk",
    hint: "Speaking practice sessions and evaluated scores",
    perStudentCall: true,
  },
  {
    key: "reply",
    label: "Reply Coach",
    hint: "QuackResponse chapters and politeness results",
    perStudentCall: true,
  },
] as const;

export type SectionKey = (typeof REPORT_SECTIONS)[number]["key"];

export type Scorecard = {
  student: Student;
  lessons?: {
    completed: number;
    total: number;
    score: number;
    max: number;
    percent: number;
  };
  arcade?: {
    games: { game: string; score: number; max?: number }[];
    total: number;
    percent: number | null;
  };
  situate?: {
    attempts: number;
    completed: number;
    avgAccuracy: number;
    bestScore: number;
  };
  talk?: {
    sessions: number;
    minutes: number;
    evaluatedAvg: number | null;
  };
  reply?: {
    chapters: number;
    completed: number;
    bestPercent: number;
  };
  /** Average of every percentage signal that could actually be measured. */
  overall: number | null;
};

/**
 * Runs `task` over `items` a few at a time. The game endpoints are per-student,
 * so a whole-class report would otherwise fire hundreds of parallel requests at
 * the Spring Boot backend at once.
 */
async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>,
  onSettled?: (done: number, total: number) => void,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  let done = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await task(items[index], index);
      done += 1;
      onSettled?.(done, items.length);
    }
  });

  await Promise.all(runners);
  return results;
}

/** A failing optional section must not sink the whole report. */
async function safe<T>(request: Promise<T>, fallback: T): Promise<T> {
  try {
    return await request;
  } catch {
    return fallback;
  }
}

function lessonSummary(progress: StudentLessonProgress | undefined) {
  const completed = progress
    ? ALL_LESSON_FIELDS.filter((field) => progress[field]).length
    : 0;
  const total = ALL_LESSON_FIELDS.length;
  return {
    completed,
    total,
    score: completed * SCORE_PER_MILESTONE,
    max: LESSON_MAX_SCORE,
    percent: Math.round((completed / total) * 100),
  };
}

function arcadeSummary(scores: ArcadeScore[]) {
  const bestByGame = new Map<string, { game: string; score: number; max?: number }>();
  scores.forEach((entry) => {
    const current = bestByGame.get(entry.game);
    if (!current || entry.score > current.score) {
      bestByGame.set(entry.game, {
        game: entry.game,
        score: entry.score,
        max: entry.maxScore,
      });
    }
  });

  const games = [...bestByGame.values()];
  const total = games.reduce((sum, game) => sum + game.score, 0);
  const scored = games.filter((game) => game.max);
  const percent = scored.length
    ? Math.round(
        (scored.reduce((sum, game) => sum + game.score / (game.max || 1), 0) /
          scored.length) *
          100,
      )
    : null;

  return { games, total, percent };
}

function situateSummary(attempts: SituationalAttempt[]) {
  const completed = attempts.filter((attempt) => attempt.completed).length;
  const avgAccuracy = attempts.length
    ? Math.round(
        attempts.reduce((sum, attempt) => sum + (attempt.accuracy || 0), 0) /
          attempts.length,
      )
    : 0;
  const bestScore = attempts.reduce(
    (best, attempt) => Math.max(best, attempt.score || 0),
    0,
  );
  return { attempts: attempts.length, completed, avgAccuracy, bestScore };
}

function talkSummary(sessions: QuackTalkSession[]) {
  const evaluated = sessions.filter(
    (session) => session.evaluated && session.score != null,
  );
  return {
    sessions: sessions.length,
    minutes: Math.round(
      sessions.reduce((sum, session) => sum + (session.durationSeconds || 0), 0) / 60,
    ),
    evaluatedAvg: evaluated.length
      ? Math.round(
          evaluated.reduce((sum, session) => sum + (session.score || 0), 0) /
            evaluated.length,
        )
      : null,
  };
}

function replySummary(attempts: ReplyCoachAttempt[]) {
  const chapters = new Set(attempts.map((attempt) => attempt.chapterId)).size;
  const completed = attempts.filter((attempt) => attempt.status === "COMPLETED").length;
  const bestPercent = attempts.reduce(
    (best, attempt) => Math.max(best, attempt.finalPercentage || 0),
    0,
  );
  return { chapters, completed, bestPercent };
}

function overallOf(card: Omit<Scorecard, "overall">): number | null {
  const signals: number[] = [];
  if (card.lessons) signals.push(card.lessons.percent);
  if (card.situate?.attempts) signals.push(card.situate.avgAccuracy);
  if (card.reply?.chapters) signals.push(card.reply.bestPercent);
  if (card.talk?.evaluatedAvg != null) signals.push(card.talk.evaluatedAvg);
  if (card.arcade?.percent != null) signals.push(card.arcade.percent);
  if (!signals.length) return null;
  return Math.round(signals.reduce((sum, value) => sum + value, 0) / signals.length);
}

/**
 * Pulls names + scoring for every requested student.
 * Lesson progress arrives in one bulk call; the game sources are per student
 * and are fetched with a small concurrency window.
 */
export async function buildScorecards(
  students: Student[],
  sections: SectionKey[],
  onProgress?: (done: number, total: number) => void,
): Promise<Scorecard[]> {
  const wants = (key: SectionKey) => sections.includes(key);

  const progressByEmail = new Map<string, StudentLessonProgress>();
  if (wants("lessons")) {
    const allProgress = await safe(teacherApi.getAllLessonProgress(), []);
    allProgress.forEach((entry) => {
      if (entry?.email) progressByEmail.set(entry.email.toLowerCase(), entry);
    });
  }

  const needsPerStudent = REPORT_SECTIONS.some(
    (section) => section.perStudentCall && wants(section.key),
  );

  if (!needsPerStudent) {
    onProgress?.(students.length, students.length);
    return students.map((student) => {
      const base = {
        student,
        lessons: wants("lessons")
          ? lessonSummary(progressByEmail.get(student.email?.toLowerCase()))
          : undefined,
      };
      return { ...base, overall: overallOf(base) };
    });
  }

  return mapWithLimit(
    students,
    4,
    async (student) => {
      const email = student.email;
      const [arcade, situate, talk, reply] = await Promise.all([
        wants("arcade") ? safe(teacherApi.getArcadeScores(email), []) : Promise.resolve([]),
        wants("situate")
          ? safe(teacherApi.getSituationalAttempts(email), [])
          : Promise.resolve([]),
        wants("talk")
          ? safe(teacherApi.getQuackTalkSessions(email), [])
          : Promise.resolve([]),
        wants("reply")
          ? safe(teacherApi.getReplyCoachAttempts(email), [])
          : Promise.resolve([]),
      ]);

      const base = {
        student,
        lessons: wants("lessons")
          ? lessonSummary(progressByEmail.get(email?.toLowerCase()))
          : undefined,
        arcade: wants("arcade") ? arcadeSummary(arcade) : undefined,
        situate: wants("situate") ? situateSummary(situate) : undefined,
        talk: wants("talk") ? talkSummary(talk) : undefined,
        reply: wants("reply") ? replySummary(reply) : undefined,
      };

      return { ...base, overall: overallOf(base) };
    },
    onProgress,
  );
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

/** One row per student, columns grouped by the sections that were included. */
export function scorecardsToCsv(cards: Scorecard[], sections: SectionKey[]): string {
  const wants = (key: SectionKey) => sections.includes(key);

  const header = ["Student", "Email", "Class"];
  if (wants("lessons"))
    header.push(
      "Lessons completed",
      "Lesson score",
      "Lesson maximum",
      "Lesson completion %",
    );
  if (wants("arcade")) header.push("Arcade games played", "Arcade best total", "Arcade accuracy %");
  if (wants("situate"))
    header.push("QuackSituate attempts", "QuackSituate completed", "QuackSituate accuracy %", "QuackSituate best score");
  if (wants("talk")) header.push("QuackTalk sessions", "QuackTalk minutes", "QuackTalk evaluated average %");
  if (wants("reply")) header.push("Reply Coach chapters", "Reply Coach completed", "Reply Coach best %");
  header.push("Overall %");

  const rows = cards.map((card) => {
    const cells: (string | number)[] = [
      `${card.student.fname} ${card.student.lname}`.trim(),
      card.student.email,
      card.student.classCode || "Unassigned",
    ];

    if (wants("lessons"))
      cells.push(
        `${card.lessons?.completed ?? 0} of ${card.lessons?.total ?? 0}`,
        card.lessons?.score ?? 0,
        card.lessons?.max ?? LESSON_MAX_SCORE,
        card.lessons?.percent ?? 0,
      );
    if (wants("arcade"))
      cells.push(
        card.arcade?.games.map((game) => `${game.game} ${game.score}`).join(" | ") || "No record",
        card.arcade?.total ?? 0,
        card.arcade?.percent ?? "n/a",
      );
    if (wants("situate"))
      cells.push(
        card.situate?.attempts ?? 0,
        card.situate?.completed ?? 0,
        card.situate?.avgAccuracy ?? 0,
        card.situate?.bestScore ?? 0,
      );
    if (wants("talk"))
      cells.push(
        card.talk?.sessions ?? 0,
        card.talk?.minutes ?? 0,
        card.talk?.evaluatedAvg ?? "Not evaluated",
      );
    if (wants("reply"))
      cells.push(
        card.reply?.chapters ?? 0,
        card.reply?.completed ?? 0,
        card.reply?.bestPercent ?? 0,
      );

    cells.push(card.overall ?? "No data");
    return cells;
  });

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const link = document.createElement("a");
  // Leading BOM keeps Excel from mangling Japanese text.
  link.href = URL.createObjectURL(
    new Blob([String.fromCharCode(0xfeff), csv], { type: "text/csv;charset=utf-8" }),
  );
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
