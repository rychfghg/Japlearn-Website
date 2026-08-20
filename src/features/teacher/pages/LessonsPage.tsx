import {
  ArrowRight,
  BookCopy,
  BookOpen,
  FileSpreadsheet,
  Languages,
  MessageCircleMore,
  Plus,
  Trash2,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusMessage from "../components/StatusMessage";
import { teacherApi } from "../services/teacherApi";
import type { ClassRecord, Lesson } from "../types";

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

      <div className="lesson-toolbar">
        <label>
          Class
          <select
            value={classCode}
            onChange={(event) => setClassCode(event.target.value)}
          >
            {classes.map((item) => (
              <option key={item.classCodes}>{item.classCodes}</option>
            ))}
          </select>
        </label>
      </div>

      <form className="lesson-create" onSubmit={createLesson}>
        <span>
          <Plus />
        </span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Lesson title"
          required
        />
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Short description"
        />
        <select
          value={lessonType}
          onChange={(event) => setLessonType(event.target.value)}
        >
          <option value="KANA">Kana</option>
          <option value="WORDS">Words</option>
          <option value="GRAMMAR">Grammar</option>
          <option value="ENRICHMENT">Enrichment</option>
        </select>
        <button>Create lesson</button>
      </form>

      <div className="lesson-layout">
        <section>
          <h3>
            <BookOpen /> Lessons in {classCode || "class"}
          </h3>
          <div className="lesson-cards">
            {lessons.map((lesson) => (
              <article key={lesson.id}>
                <span>日</span>
                <div>
                  <b>
                    {lesson.lessonTitle || lesson.lesson_title || lesson.title}
                  </b>
                  <p>
                    {lesson.lessonDescription ||
                      lesson.lesson_description ||
                      lesson.lesson_type ||
                      lesson.description ||
                      "Japanese lesson content"}
                  </p>
                </div>
                <button onClick={() => deleteLesson(lesson)}>
                  <Trash2 />
                </button>
              </article>
            ))}
          </div>
        </section>
        <aside>
          <h3>
            <BookCopy /> Lesson databank
          </h3>
          <p>
            Reusable lessons available through the existing databank endpoint.
          </p>
          {databank.slice(0, 8).map((lesson) => (
            <article key={lesson.id}>
              <b>{lesson.lessonTitle || lesson.title}</b>
              <small>{lesson.lessonDescription || lesson.description}</small>
            </article>
          ))}
        </aside>
      </div>
    </section>
  );
}
