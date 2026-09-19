import { ChevronDown, GraduationCap, UserRound, Users } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { teacherApi } from "../services/teacherApi";
import type { Student } from "../types";

export type ScopeMode = "all" | "section" | "student";
export type Scope = { mode: ScopeMode; section: string; email: string };

export const DEFAULT_SCOPE: Scope = { mode: "all", section: "", email: "" };

/** Students the current scope covers. */
export function studentsInScope(students: Student[], scope: Scope) {
  if (scope.mode === "section") return students.filter((s) => s.classCode === scope.section);
  if (scope.mode === "student") return students.filter((s) => s.email === scope.email);
  return students;
}

export function scopeLabel(students: Student[], scope: Scope) {
  if (scope.mode === "section") return scope.section ? `Section ${scope.section}` : "Choose a section";
  if (scope.mode === "student") {
    const student = students.find((s) => s.email === scope.email);
    return student ? `${student.fname} ${student.lname}` : "Choose a student";
  }
  return "Everyone";
}

type Props = {
  students: Student[];
  scope: Scope;
  onChange: (scope: Scope) => void;
  disabled?: boolean;
  children?: ReactNode;
};

/** Everyone / By section / By student, shared by Reports and Game scores. */
export default function ScopeBar({ students, scope, onChange, disabled, children }: Props) {
  const [classCodes, setClassCodes] = useState<string[]>([]);

  useEffect(() => {
    teacherApi.getClasses().then((data) => setClassCodes(data.map((c) => c.classCodes))).catch(() => undefined);
  }, []);

  const sections = useMemo(() => {
    const fromRoster = students.map((s) => s.classCode).filter(Boolean) as string[];
    return [...new Set([...classCodes, ...fromRoster])].sort();
  }, [classCodes, students]);

  const countIn = (section: string) => students.filter((s) => s.classCode === section).length;

  const setMode = (mode: ScopeMode) => {
    if (mode === scope.mode) return;
    onChange({
      mode,
      section: mode === "section" ? scope.section || sections[0] || "" : scope.section,
      email: mode === "student" ? scope.email || students[0]?.email || "" : scope.email,
    });
  };

  const modes: Array<{ key: ScopeMode; label: string; icon: typeof Users; hint: string }> = [
    { key: "all", label: "Everyone", icon: Users, hint: `${students.length} learners` },
    { key: "section", label: "By section", icon: GraduationCap, hint: `${sections.length} sections` },
    { key: "student", label: "By student", icon: UserRound, hint: "One learner" },
  ];

  return (
    <div className="scope-bar">
      <div className="scope-modes" role="tablist" aria-label="Report scope">
        {modes.map(({ key, label, icon: Icon, hint }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={scope.mode === key}
            className={scope.mode === key ? "on" : ""}
            disabled={disabled}
            onClick={() => setMode(key)}
          >
            <span className="scope-mode-icon"><Icon /></span>
            <span><b>{label}</b><small>{hint}</small></span>
          </button>
        ))}
      </div>

      <div className="scope-controls">
        {scope.mode === "section" && (
          <label className="scope-select">
            <span>Section</span>
            <div>
              <select value={scope.section} disabled={disabled || !sections.length} onChange={(e) => onChange({ ...scope, section: e.target.value })}>
                {!sections.length && <option value="">No sections yet</option>}
                {sections.map((code) => (
                  <option key={code} value={code}>{code} · {countIn(code)} learner{countIn(code) === 1 ? "" : "s"}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
        )}
        {scope.mode === "student" && (
          <label className="scope-select">
            <span>Student</span>
            <div>
              <select value={scope.email} disabled={disabled || !students.length} onChange={(e) => onChange({ ...scope, email: e.target.value })}>
                {students.map((s) => (
                  <option key={s.email} value={s.email}>{s.fname} {s.lname}{s.classCode ? ` · ${s.classCode}` : ""}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
        )}
        <div className="scope-actions">{children}</div>
      </div>
    </div>
  );
}
