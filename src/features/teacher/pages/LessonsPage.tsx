import {
  ArrowRight,
  BookCopy,
  BookOpen,
  FileSpreadsheet,
  Languages,
  MessageCircleMore,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusMessage from "../components/StatusMessage";
import { teacherApi } from "../services/teacherApi";
import type { ClassRecord, Lesson } from "../types";

const LESSON_TYPES: Record<string, { label: string; tone: string; icon: typeof Languages }> = {
  KANA: { label: "Kana", tone: "purple", icon: Languages },
  WORDS: { label: "Words", tone: "green", icon: MessageCircleMore },
  GRAMMAR: { label: "Grammar", tone: "orange", icon: BookOpen },
  ENRICHMENT: { label: "Enrichment", tone: "pink", icon: Sparkles },
};

function typeMeta(type?: string) {
  return LESSON_TYPES[type || ""] ?? { label: "Lesson", tone: "purple", icon: BookOpen };
}

export default function LessonsPage() {
  const [params] = useSearchParams();
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [classCode, setClassCode] = useState(params.get("class") || "");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [databank, setDatabank] = useState<Lesson[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lessonType, setLessonType] = useState("WORDS");
  const [error, setError] = useState("");
  const composerRef = useRef<HTMLElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([teacherApi.getClasses(), teacherApi.getDatabankLessons()])
      .then(([classData, databankData]) => {
        setClasses(classData);
        setDatabank(databankData);
        if (!classCode && classData[0]) setClassCode(classData[0].classCodes);
      })
      .catch((requestError) => setError(requestError.message));
  }, []);

  const loadLessons = () => {
    if (!classCode) return;
    teacherApi
      .getLessons(classCode)
      .then(setLessons)
      .catch((requestError) => setError(requestError.message));
  };

  useEffect(loadLessons, [classCode]);

  const createLesson = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await teacherApi.createLesson({
        classId: classCode,
        lesson_title: title,
        lesson_type: lessonType,
        lesson_description: description,
      });
      setTitle("");
      setDescription("");
      loadLessons();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not create lesson.",
      );
    }
  };

  const deleteLesson = async (lesson: Lesson) => {
    if (!window.confirm("Delete this lesson?")) return;
    await teacherApi.deleteLesson(lesson.id);
    loadLessons();
  };

  const useFromDatabank = (lesson: Lesson) => {
    setTitle(lesson.lessonTitle || lesson.lesson_title || lesson.title || "");
    setDescription(lesson.lessonDescription || lesson.lesson_description || lesson.description || "");
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    titleInputRef.current?.focus();
  };

  return (
    <section className="full-panel">
      <PageHeader
        eyebrow="LESSON MANAGEMENT"
        title="Class lessons"
        description="Create original lessons or reference the reusable lesson databank from the mobile teacher workflow."
      />
      {error && <StatusMessage>{error}</StatusMessage>}

      <div className="automatic-curriculum">
        <div className="automatic-heading">
          <div>
            <small>JAPLEARN BUILT-IN CURRICULUM</small>
            <h3>Automatic student lessons</h3>
            <p>
              These three learning paths are available to students automatically
              and are monitored through their required exercises.
            </p>
          </div>
          <Link to="/teacher/lessons/progress">
            <FileSpreadsheet /> Open progress masterlist <ArrowRight />
          </Link>
        </div>
        <div className="automatic-grid">
          <article>
            <span className="purple">
              <Languages />
            </span>
            <div>
              <small>PATH 01 · 6 SETS</small>
              <h3>Kana</h3>
              <p>
                Hiragana Basics 1–3 and Katakana Basics 1–3, each followed by a
                character exercise.
              </p>
            </div>
          </article>
          <article>
            <span className="green">
              <MessageCircleMore />
            </span>
            <div>
              <small>PATH 02 · 3 LESSONS</small>
              <h3>Words</h3>
              <p>
                Three vocabulary collections recorded through the vocab1,
                vocab2, and vocab3 milestones.
              </p>
            </div>
          </article>
          <article>
            <span className="orange">
              <BookOpen />
            </span>
            <div>
              <small>PATH 03 · 1 LESSON</small>
              <h3>Grammar</h3>
              <p>
                The sentence and grammar lesson recorded through the existing
                sentence milestone.
              </p>
            </div>
          </article>
        </div>
      </div>

      <section className="lesson-composer" ref={composerRef}>
        <header>
          <div>
            <span>CUSTOM LESSONS</span>
            <h3>Add a lesson to a class</h3>
          </div>
        </header>
        <form className="lesson-composer-form" onSubmit={createLesson}>
          <label>
            Class
            <select value={classCode} onChange={(event) => setClassCode(event.target.value)}>
              {classes.map((item) => (
                <option key={item.classCodes}>{item.classCodes}</option>
              ))}
            </select>
          </label>
          <label>
            Lesson title
            <input
              ref={titleInputRef}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Ordering at a restaurant"
              required
            />
          </label>
          <label>
            Type
            <select value={lessonType} onChange={(event) => setLessonType(event.target.value)}>
              <option value="KANA">Kana</option>
              <option value="WORDS">Words</option>
              <option value="GRAMMAR">Grammar</option>
              <option value="ENRICHMENT">Enrichment</option>
            </select>
          </label>
          <label className="lesson-composer-desc">
            Description
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Short description for your students"
            />
          </label>
          <button className="submit" disabled={!classCode}>
            <Plus /> Create lesson
          </button>
        </form>
      </section>

      <div className="lesson-layout">
        <section>
          <header className="lesson-panel-head">
            <div>
              <span>CUSTOM LESSONS</span>
              <h3><BookOpen /> Lessons in {classCode || "class"}</h3>
            </div>
            <small>{lessons.length} lesson{lessons.length === 1 ? "" : "s"}</small>
          </header>
          <div className="lesson-cards">
            {lessons.length ? (
              lessons.map((lesson) => {
                const type = lesson.lesson_type;
                const meta = typeMeta(type);
                const Icon = meta.icon;
                return (
                  <article key={lesson.id}>
                    <span className={meta.tone}>
                      <Icon />
                    </span>
                    <div>
                      <b>
                        {lesson.lessonTitle || lesson.lesson_title || lesson.title}
                      </b>
                      <p>
                        {lesson.lessonDescription ||
                          lesson.lesson_description ||
                          lesson.description ||
                          "Japanese lesson content"}
                      </p>
                    </div>
                    <em className={`lesson-type-tag ${meta.tone}`}>{meta.label}</em>
                    <button onClick={() => deleteLesson(lesson)} aria-label="Delete lesson">
                      <Trash2 />
                    </button>
                  </article>
                );
              })
            ) : (
              <div className="lesson-empty">
                <BookOpen />
                <div>
                  <b>No custom lessons yet</b>
                  <small>Use the form above, or pull one from the databank on the right.</small>
                </div>
              </div>
            )}
          </div>
        </section>
        <aside>
          <header className="lesson-panel-head">
            <div>
              <span>REUSABLE CONTENT</span>
              <h3><BookCopy /> Lesson databank</h3>
            </div>
            <small>{databank.length} available</small>
          </header>
          <p>
            Pull a ready-made lesson into {classCode || "your class"} instead of
            writing one from scratch.
          </p>
          {databank.length ? (
            databank.slice(0, 8).map((lesson) => (
              <article key={lesson.id}>
                <div>
                  <b>{lesson.lessonTitle || lesson.title}</b>
                  <small>{lesson.lessonDescription || lesson.description}</small>
                </div>
                <button
                  type="button"
                  className="databank-use"
                  onClick={() => useFromDatabank(lesson)}
                >
                  <Wand2 /> Use
                </button>
              </article>
            ))
          ) : (
            <div className="lesson-empty">
              <BookCopy />
              <div>
                <b>Databank is empty</b>
                <small>Reusable lessons will appear here once available.</small>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
