import { ChevronRight, GraduationCap, Plus, Search, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StatusMessage from "../components/StatusMessage";
import { teacherApi } from "../services/teacherApi";
import type { ClassRecord } from "../types";

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
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
  }, []);

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return classes.filter((item) => item.classCodes.toLowerCase().includes(query));
  }, [classes, search]);

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
      <div className="directory-title-row">
        <div><span>MY CLASSES</span><h2>Your classrooms</h2><p>Everything you need to organize and open your classes.</p></div>
        <button type="button" className="primary" onClick={() => setModalOpen(true)}><Plus /> New class</button>
      </div>

      <div className="class-directory-toolbar">
        <div className="directory-count"><span><GraduationCap /></span><div><b>{classes.length}</b><small>Active classroom{classes.length === 1 ? "" : "s"}</small></div></div>
        <label className="directory-search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search class codes…" aria-label="Search classrooms" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear classroom search"><X /></button>}</label>
      </div>

      {error && <StatusMessage>{error}</StatusMessage>}

      {loading ? (
        <div className="skeleton-list tall" />
      ) : filteredClasses.length > 0 ? (
        <div className="class-grid">
          {filteredClasses.map((classItem, index) => (
            <article className={`class-directory-card accent-${index % 4}`} key={classItem.classCodes}>
              <div className="class-card-heading">
                <span className="class-kanji">{["日", "本", "語", "学"][index % 4]}</span>
                <span className="class-ready"><i /> Active</span>
                <small>CLASS {String(index + 1).padStart(2, "0")}</small>
              </div>
              <div className="class-card-content">
                <h3>{classItem.classCodes}</h3>
                <p>Japanese learning classroom</p>
              </div>
              <div className="class-card-footer">
                  <Link
                    to={`/teacher/classes/${encodeURIComponent(classItem.classCodes)}`}
                  >
                    Enter classroom
                    <ChevronRight />
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
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="empty">
          <span>
            <GraduationCap />
          </span>
          <h3>Create your first classroom</h3>
          <p>Class codes connect students to lessons and activities.</p>
          <button type="button" onClick={() => setModalOpen(true)}>
            <Plus />
            Create class
          </button>
        </div>
      ) : (
        <div className="directory-no-results"><Search /><h3>No matching classroom</h3><p>Try another class code or clear your search.</p><button type="button" onClick={() => setSearch("")}>Clear search</button></div>
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
