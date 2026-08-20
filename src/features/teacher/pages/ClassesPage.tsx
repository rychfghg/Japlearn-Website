import { ChevronRight, GraduationCap, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
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
    <section className="full-panel">
      <PageHeader
        eyebrow="CLASS MANAGEMENT"
        title="All classrooms"
        description="Create, open, and manage the classrooms connected to your students."
        action={
          <button
            type="button"
            className="primary"
            onClick={() => setModalOpen(true)}
          >
            <Plus />
            New class
          </button>
        }
      />

      {error && <StatusMessage>{error}</StatusMessage>}

      {loading ? (
        <div className="skeleton-list tall" />
      ) : classes.length > 0 ? (
        <div className="class-grid">
          {classes.map((classItem, index) => (
            <article key={classItem.classCodes}>
              <div className={`class-cover cover-${index % 4}`}>
                <span>{["日", "本", "語", "学"][index % 4]}</span>
                <small>ACTIVE CLASS</small>
              </div>
              <div className="class-info">
                <h3>{classItem.classCodes}</h3>
                <p>Japanese language classroom</p>
                <div>
                  <Link
                    to={`/teacher/classes/${encodeURIComponent(classItem.classCodes)}`}
                  >
                    Open classroom
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
              </div>
            </article>
          ))}
        </div>
      ) : (
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
