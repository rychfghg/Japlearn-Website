import type { StudentLessonProgress } from "../types";

export const LESSON_STAGES = [
  { key: "hiragana", label: "Hiragana", fields: ["hiragana1", "hiragana2", "hiragana3"] as const },
  { key: "katakana", label: "Katakana", fields: ["katakana1", "katakana2", "katakana3"] as const },
  { key: "vocab", label: "Vocabulary", fields: ["vocab1", "vocab2", "vocab3"] as const },
  { key: "sentence", label: "Grammar", fields: ["sentence"] as const },
] satisfies Array<{ key: string; label: string; fields: ReadonlyArray<keyof StudentLessonProgress> }>;

export const ALL_LESSON_FIELDS = LESSON_STAGES.flatMap((stage) => stage.fields);

/** Percentage (0-100) of the 10 built-in curriculum milestones a student has completed. */
export function masteryPercent(progress: StudentLessonProgress | undefined): number {
  if (!progress) return 0;
  const completed = ALL_LESSON_FIELDS.filter((field) => progress[field]).length;
  return Math.round((completed / ALL_LESSON_FIELDS.length) * 100);
}

export function progressMapByEmail(entries: StudentLessonProgress[]): Map<string, StudentLessonProgress> {
  const map = new Map<string, StudentLessonProgress>();
  entries.forEach((entry) => map.set(entry.email, entry));
  return map;
}
