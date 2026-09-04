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
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import StatusMessage from "../components/StatusMessage";
import { teacherApi } from "../services/teacherApi";
import type { ClassRecord, Lesson, Student, StudentLessonProgress } from "../types";
import { LESSON_STAGES, progressMapByEmail } from "../utils/mastery";

const LESSON_TYPES: Record<string, { label: string; tone: string; icon: typeof Languages }> = {
  KANA: { label: "Kana", tone: "purple", icon: Languages },
  WORDS: { label: "Words", tone: "green", icon: MessageCircleMore },
  GRAMMAR: { label: "Grammar", tone: "orange", icon: BookOpen },
  ENRICHMENT: { label: "Enrichment", tone: "pink", icon: Sparkles },
};

function typeMeta(type?: string) {
  return LESSON_TYPES[type || ""] ?? { label: "Lesson", tone: "purple", icon: BookOpen };
}

/** The three built-in learning paths, mapped onto the curriculum milestones. */
const PATHS = [
  {
    key: "kana",
    tone: "",
    icon: Languages,
    eyebrow: "PATH 01 · 6 SETS",
    title: "Kana",
    text: "Hiragana Basics 1–3 and Katakana Basics 1–3, each followed by a character exercise.",
    stages: ["hiragana", "katakana"],
  },
  {
    key: "words",
    tone: "tone-green",
    icon: MessageCircleMore,
    eyebrow: "PATH 02 · 3 LESSONS",
    title: "Words",
    text: "Three vocabulary collections recorded through the vocab1, vocab2, and vocab3 milestones.",
    stages: ["vocab"],
  },
  {
    key: "grammar",
    tone: "tone-orange",
    icon: BookOpen,
    eyebrow: "PATH 03 · 1 LESSON",
    title: "Grammar",
    text: "The sentence and grammar lesson recorded through the existing sentence milestone.",
    stages: ["sentence"],
  },
] as const;

export default function LessonsPage() {
  const [params] = useSearchParams();
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [classCode, setClassCode] = useState(params.get("class") || "");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [databank, setDatabank] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [lessonProgress, setLessonProgress] = useState<StudentLessonProgress[]>([]);
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

    Promise.all([teacherApi.getAllStudents(), teacherApi.getAllLessonProgress()])
      .then(([studentData, progressData]) => {
        setStudents(studentData);
        setLessonProgress(progressData);
      })
      .catch(() => undefined);
  }, []);

  const loadLessons = () => {
    if (!classCode) return;
    teacherApi
      .getLessons(classCode)
      .then(setLessons)
      .catch((requestError) => setError(requestError.message));
  };

  useEffect(loadLessons, [classCode]);

  const progressByEmail = useMemo(() => progressMapByEmail(lessonProgress), [lessonProgress]);

  /** Average completion of each built-in path across every student. */
  const pathStats = useMemo(() => {
    const map = new Map<string, number>();
    PATHS.forEach((path) => {
      const fields = LESSON_STAGES.filter((stage) =>
        (path.stages as readonly string[]).includes(stage.key),
      ).flatMap((stage) => stage.fields);
      if (!students.length || !fields.length) {
        map.set(path.key, 0);
        return;
      }
      const total = students.reduce((sum, student) => {
        const progress = progressByEmail.get(student.email);
        const done = progress ? fields.filter((field) => progress[field]).length : 0;
        return sum + done / fields.length;
      }, 0);
      map.set(path.key, Math.round((total / students.length) * 100));
    });
    return map;
  }, [students, progressByEmail]);

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
    <section className="lesson-page">
      {error && <StatusMessage>{error}</StatusMessage>}

      <div className="tile-head">
        <div>
          <span className="eyebrow">JAPLEARN BUILT-IN CURRICULUM</span>
          <h3><Sparkles /> Automatic student lessons</h3>
          <p>
            These three learning paths are available to students automatically
            and are monitored through their required exercises.
          </p>
        </div>
        <Link to="/teacher/lessons/progress" className="head-action">
          <FileSpreadsheet /> Progress masterlist
        </Link>
      </div>

      <div className="path-grid">
        {PATHS.map((path) => {
          const Icon = path.icon;
          const percent = pathStats.get(path.key) ?? 0;
          return (
            <article key={path.key} className={`path-card ${path.tone}`}>
              <span><Icon /></span>
              <small>{path.eyebrow}</small>
              <h3>{path.title}</h3>
              <p>{path.text}</p>
              <div className="path-meter">
                <div>
                  <span>Class completion</span>
                  <b>{percent}%</b>
                </div>
                <div className="mastery-bar-track small">
                  <div className="mastery-bar-fill" style={{ width: `${percent}%` }} />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="bento-tile tinted lesson-composer" ref={composerRef}>
        <div className="tile-head">
          <div>
            <span className="eyebrow">CUSTOM LESSONS</span>
            <h3><Plus /> Add a lesson to a class</h3>
          </div>
        </div>
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

      <div className="bento bento-2">
        <section className="bento-tile">
          <div className="tile-head">
            <div>
              <span className="eyebrow">CUSTOM LESSONS</span>
              <h3><BookOpen /> Lessons in {classCode || "class"}</h3>
            </div>
            <span className="tile-count">
              {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="lesson-cards">
            {lessons.length ? (
              lessons.map((lesson) => {
                const meta = typeMeta(lesson.lesson_type);
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
                  <small>Use the form above, or pull one from the databank.</small>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="bento-tile">
          <div className="tile-head">
            <div>
              <span className="eyebrow">REUSABLE CONTENT</span>
              <h3><BookCopy /> Lesson databank</h3>
              <p>Pull a ready-made lesson into {classCode || "your class"}.</p>
            </div>
            <span className="tile-count">{databank.length}</span>
          </div>
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

      <Link className="tile-link lesson-foot-link" to="/teacher/lessons/progress">
        Open the full progress masterlist <ArrowRight />
      </Link>
    </section>
  );
}
