import {
  ArrowRight,
  GraduationCap,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StatusMessage from "../components/StatusMessage";
import { teacherApi } from "../services/teacherApi";
import type { ClassRecord, Student, StudentLessonProgress } from "../types";
import { masteryPercent, progressMapByEmail } from "../utils/mastery";

const KANJI = ["日", "本", "語", "学"];

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [lessonProgress, setLessonProgress] = useState<StudentLessonProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const loadClasses = async () => {
    setLoading(true);
    setError("");

    try {
      setClasses(await teacherApi.getClasses());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load classes.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
    Promise.all([teacherApi.getAllStudents(), teacherApi.getAllLessonProgress()])
      .then(([studentData, progressData]) => {
        setStudents(studentData);
        setLessonProgress(progressData);
      })
      .catch(() => undefined);
  }, []);

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return classes.filter((item) => item.classCodes.toLowerCase().includes(query));
  }, [classes, search]);

  const progressByEmail = useMemo(() => progressMapByEmail(lessonProgress), [lessonProgress]);

  const classStats = useMemo(() => {
    const map = new Map<string, { roster: Student[]; avgMastery: number }>();
    classes.forEach((item) => {
      const roster = students.filter((student) => student.classCode === item.classCodes);
      const avgMastery = roster.length
        ? Math.round(
            roster.reduce((sum, student) => sum + masteryPercent(progressByEmail.get(student.email)), 0) /
              roster.length,
          )
        : 0;
      map.set(item.classCodes, { roster, avgMastery });
    });
    return map;
  }, [classes, students, progressByEmail]);

  const enrolled = students.filter((student) => student.classCode).length;
  const overallMastery = students.length
    ? Math.round(
        students.reduce((sum, student) => sum + masteryPercent(progressByEmail.get(student.email)), 0) /
          students.length,
      )
    : 0;

  const createClass = async (event: FormEvent) => {
    event.preventDefault();

    if (!classCode.trim()) return;

    setSaving(true);
    try {
      await teacherApi.addClass(classCode.trim());
      setClassCode("");
      setModalOpen(false);
      await loadClasses();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not create class.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteClass = async (code: string) => {
    if (!window.confirm(`Delete class ${code}?`)) return;

    try {
      await teacherApi.removeClass(code);
      await loadClasses();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not delete class.",
      );
    }
  };

  return (
    <section className="class-directory-page">
      <div className="tool-bar">
        <div className="tool-metrics">
          <div><b>{classes.length}</b><small>Classes</small></div>
          <div><b>{enrolled}</b><small>Learners</small></div>
          <div><b>{overallMastery}%</b><small>Avg. mastery</small></div>
        </div>
        <label className="tool-search">
          <Search />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search class codes…"
            aria-label="Search classrooms"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear classroom search">
              <X />
            </button>
          )}
        </label>
        <button type="button" className="head-action" onClick={() => setModalOpen(true)}>
          <Plus /> New class
        </button>
      </div>

      {error && <StatusMessage>{error}</StatusMessage>}

      {loading ? (
        <div className="skeleton-list tall" />
      ) : filteredClasses.length > 0 ? (
        <div className="class-bento">
          {filteredClasses.map((classItem, index) => {
            const stats = classStats.get(classItem.classCodes) ?? { roster: [], avgMastery: 0 };
            const active = stats.roster.length > 0;
            return (
              <article className={`class-tile tone-${(index % 4) + 1}`} key={classItem.classCodes}>
                <div className="class-tile-cover">
                  <span className="class-tile-kanji">{KANJI[index % 4]}</span>
                  <small className={active ? "" : "idle"}>
                    <i /> {active ? "Active" : "Awaiting learners"}
                  </small>
                  <h3>{classItem.classCodes}</h3>
                </div>

                <div className="class-tile-body">
                  <div className="class-tile-meter">
                    <div>
                      <span>Class mastery</span>
                      <b>{stats.avgMastery}%</b>
                    </div>
                    <div className="mastery-bar-track small">
                      <div className="mastery-bar-fill" style={{ width: `${stats.avgMastery}%` }} />
                    </div>
                  </div>

                  <div className="class-tile-roster">
                    {stats.roster.length ? (
                      <>
                        <div className="avatar-stack">
                          {stats.roster.slice(0, 4).map((student) => (
                            <span key={student.email}>
                              {student.fname?.[0]}
                              {student.lname?.[0]}
                            </span>
                          ))}
                          {stats.roster.length > 4 && (
                            <span className="more">+{stats.roster.length - 4}</span>
                          )}
                        </div>
                        <small>
                          {stats.roster.length} learner{stats.roster.length === 1 ? "" : "s"} enrolled
                        </small>
                      </>
                    ) : (
                      <small>Share this code so learners can join.</small>
                    )}
                  </div>
                </div>

                <div className="class-tile-foot">
                  <Link to={`/teacher/classes/${encodeURIComponent(classItem.classCodes)}`}>
                    Enter classroom <ArrowRight />
                  </Link>
                  <button
                    type="button"
                    className="trash"
                    onClick={() => deleteClass(classItem.classCodes)}
                    aria-label={`Delete ${classItem.classCodes}`}
                  >
                    <Trash2 />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : classes.length === 0 ? (
        <div className="state-empty">
          <span><GraduationCap /></span>
          <h3>Create your first classroom</h3>
          <p>Class codes connect students to lessons and activities.</p>
          <button type="button" onClick={() => setModalOpen(true)}>
            <Plus /> Create class
          </button>
        </div>
      ) : (
        <div className="state-empty">
          <span><Search /></span>
          <h3>No matching classroom</h3>
          <p>Try another class code or clear your search.</p>
          <button type="button" onClick={() => setSearch("")}>Clear search</button>
        </div>
      )}

      {modalOpen && (
        <div className="modal-wrap">
          <button
            type="button"
            className="modal-dismiss"
            onClick={() => setModalOpen(false)}
            aria-label="Close dialog"
          />
          <form className="create-modal" onSubmit={createClass}>
            <button
              type="button"
              className="modal-x"
              onClick={() => setModalOpen(false)}
            >
              <X />
            </button>
            <span className="modal-icon">
              <GraduationCap />
            </span>
            <small>NEW CLASSROOM</small>
            <h2>Create a class</h2>
            <p>Enter the class code your students will use to join.</p>
            <label>
              Class code
              <input
                value={classCode}
                onChange={(event) => setClassCode(event.target.value)}
                placeholder="e.g. NIHONGO-101"
                autoFocus
              />
            </label>
            <button className="submit" disabled={saving}>
              {saving ? "Creating…" : "Create class"}
              <span>→</span>
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
