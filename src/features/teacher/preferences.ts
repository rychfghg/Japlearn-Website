/**
 * Teacher workspace preferences.
 *
 * The chosen options are applied to <body> so every teacher screen honours them,
 * not only the Settings page, and they are restored on the next sign-in.
 */
const SETTINGS_KEY = "japlearn_teacher_preferences";

export type Density = "comfortable" | "compact";
export type TextSize = "default" | "large";

export type TeacherPreferences = {
  density: Density;
  textSize: TextSize;
  reducedMotion: boolean;
  helpfulTips: boolean;
  stickyHeader: boolean;
  startPage: string;
};

export const START_PAGES = [
  { value: "/teacher", label: "Overview" },
  { value: "/teacher/classes", label: "My classes" },
  { value: "/teacher/students", label: "Students" },
  { value: "/teacher/activities", label: "Activities" },
  { value: "/teacher/reports", label: "Reports" },
] as const;

export const defaultPreferences: TeacherPreferences = {
  density: "comfortable",
  textSize: "default",
  reducedMotion: false,
  helpfulTips: true,
  stickyHeader: true,
  startPage: "/teacher",
};

const listeners = new Set<(preferences: TeacherPreferences) => void>();

export function loadPreferences(): TeacherPreferences {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") as Partial<TeacherPreferences> & { compact?: boolean };
    // Older builds stored a single "compact" flag.
    const density: Density = stored.density ?? (stored.compact ? "compact" : "comfortable");
    const startPage = START_PAGES.some((page) => page.value === stored.startPage)
      ? (stored.startPage as string)
      : defaultPreferences.startPage;
    return { ...defaultPreferences, ...stored, density, startPage };
  } catch {
    return defaultPreferences;
  }
}

export function applyPreferences(preferences: TeacherPreferences) {
  const body = document.body;
  body.classList.toggle("teacher-compact", preferences.density === "compact");
  body.classList.toggle("teacher-text-large", preferences.textSize === "large");
  body.classList.toggle("teacher-reduced-motion", preferences.reducedMotion);
  body.classList.toggle("teacher-hide-tips", !preferences.helpfulTips);
  body.classList.toggle("teacher-static-header", !preferences.stickyHeader);
}

/** Remove every workspace class, so signing out or visiting an admin screen is unaffected. */
export function clearPreferenceClasses() {
  document.body.classList.remove(
    "teacher-compact",
    "teacher-text-large",
    "teacher-reduced-motion",
    "teacher-hide-tips",
    "teacher-static-header",
  );
}

export function savePreferences(preferences: TeacherPreferences) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences));
  applyPreferences(preferences);
  listeners.forEach((listener) => listener(preferences));
}

export function subscribePreferences(listener: (preferences: TeacherPreferences) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Where a teacher lands right after signing in. */
export function startPage(): string {
  return loadPreferences().startPage;
}
