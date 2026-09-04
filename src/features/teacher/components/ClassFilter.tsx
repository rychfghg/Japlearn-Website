import { Check, ChevronDown, GraduationCap, Search, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ClassRecord } from "../types";

type Props = {
  value: string;
  classes: ClassRecord[];
  counts: Map<string, number>;
  totalCount: number;
  onChange: (classCode: string) => void;
};

/** Searchable class picker — stays usable whether a teacher has 2 or 200 classes. */
export default function ClassFilter({ value, classes, counts, totalCount, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    searchRef.current?.focus();

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search
      ? classes.filter((item) => item.classCodes.toLowerCase().includes(search))
      : classes;
  }, [classes, query]);

  const select = (classCode: string) => {
    onChange(classCode);
    setOpen(false);
  };

  return (
    <div className={`class-filter ${open ? "open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="class-filter-trigger"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="class-filter-icon">
          {value ? <GraduationCap /> : <Users />}
        </span>
        <span className="class-filter-value">
          <small>Class</small>
          <b>{value || "All students"}</b>
        </span>
        <span className="class-filter-count">
          {value ? (counts.get(value) ?? 0) : totalCount}
        </span>
        <ChevronDown className="class-filter-caret" />
      </button>

      {open && (
        <div className="class-filter-panel" role="listbox">
          {classes.length > 6 && (
            <label className="class-filter-search">
              <Search />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find a class…"
                aria-label="Find a class"
              />
            </label>
          )}

          <div className="class-filter-options">
            <button
              type="button"
              role="option"
              aria-selected={!value}
              className={`class-filter-option ${value ? "" : "on"}`}
              onClick={() => select("")}
            >
              <span className="class-filter-dot all"><Users /></span>
              <span className="class-filter-label">
                <b>All students</b>
                <small>Every learner in your workspace</small>
              </span>
              <em>{totalCount}</em>
              {!value && <Check className="class-filter-check" />}
            </button>

            {visible.map((item) => {
              const active = value === item.classCodes;
              const count = counts.get(item.classCodes) ?? 0;
              return (
                <button
                  key={item.classCodes}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`class-filter-option ${active ? "on" : ""}`}
                  onClick={() => select(item.classCodes)}
                >
                  <span className="class-filter-dot"><GraduationCap /></span>
                  <span className="class-filter-label">
                    <b>{item.classCodes}</b>
                    <small>
                      {count} learner{count === 1 ? "" : "s"} enrolled
                    </small>
                  </span>
                  <em>{count}</em>
                  {active && <Check className="class-filter-check" />}
                </button>
              );
            })}

            {!visible.length && <p className="class-filter-empty">No class matches “{query}”.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
