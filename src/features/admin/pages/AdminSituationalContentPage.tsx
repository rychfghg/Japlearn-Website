import {
  CheckCircle2,
  Edit3,
  Eye,
  MessagesSquare,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../../lib/api";

type Choice = { japanese: string; romaji: string };
type Question = {
  id: string;
  gameType: string;
  difficulty: string;
  order: number;
  level: number;
  setNumber: number;
  topic: string;
  location: string;
  sceneKey: string;
  scenario: string;
  hint: string;
  choices: Choice[];
  correctAnswer: string;
  explanation: string;
  active: boolean;
};
type FormState = Omit<Question, "id" | "choices"> & { choices: Choice[] };

const emptyForm: FormState = {
  gameType: "RECOGNITION",
  difficulty: "STARTER",
  order: 1,
  level: 1,
  setNumber: 1,
  topic: "Everyday greetings",
  location: "School hallway",
  sceneKey: "school",
  scenario: "",
  hint: "",
  choices: Array.from({ length: 4 }, () => ({ japanese: "", romaji: "" })),
  correctAnswer: "",
  explanation: "",
  active: true,
};

export default function AdminSituationalContentPage({
  initialGameType = "RECOGNITION",
}: {
  initialGameType?: string;
}) {
  const [gameType, setGameType] = useState(initialGameType);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () => questions.filter((item) => item.gameType === gameType),
    [questions, gameType],
  );
  const starterCount = filtered.filter(
    (item) => item.difficulty === "STARTER",
  ).length;
  const hardCount = filtered.filter(
    (item) => item.difficulty === "HARD",
  ).length;

  const load = async () => {
    try {
      const groups = await Promise.all(
        ["RECOGNITION", "EXPRESSION_MATCH", "POLITENESS"].map(async (type) => {
          const response = await fetch(
            `${API_URL}/api/situational/questions?gameType=${type}&activeOnly=false`,
          );
          if (!response.ok)
            throw new Error(`Server returned ${response.status}`);
          return response.json() as Promise<Question[]>;
        }),
      );
      setQuestions(groups.flat());
      setMessage("");
    } catch (error) {
      setMessage(
        `Content could not load from ${API_URL}. Start the updated Spring Boot backend and retry.`,
      );
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const reset = (type = gameType) => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      gameType: type,
      order: questions.filter((item) => item.gameType === type).length + 1,
    });
  };
  const setChoice = (index: number, key: keyof Choice, value: string) =>
    setForm({
      ...form,
      choices: form.choices.map((choice, choiceIndex) =>
        choiceIndex === index ? { ...choice, [key]: value } : choice,
      ),
    });

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanChoices = form.choices
      .map((choice) => ({
        japanese: choice.japanese.trim(),
        romaji: choice.romaji.trim(),
      }))
      .filter((choice) => choice.japanese && choice.romaji);
    if (
      cleanChoices.length < 3 ||
      !cleanChoices.some(
        (choice) => choice.japanese === form.correctAnswer.trim(),
      )
    ) {
      setMessage(
        "Add at least three complete choices and select one of them as the correct answer.",
      );
      return;
    }
    setSaving(true);
    setMessage("");
    const response = await fetch(
      `${API_URL}/api/situational/questions${editingId ? `/${editingId}` : ""}`,
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, gameType, choices: cleanChoices }),
      },
    );
    setSaving(false);
    if (!response.ok) {
      setMessage(
        "The mission could not be saved. Check the backend connection and required fields.",
      );
      return;
    }
    setMessage(
      editingId
        ? "Mission updated successfully."
        : "New mission added successfully.",
    );
    reset();
    await load();
  };

  const edit = (question: Question) => {
    setGameType(question.gameType);
    setEditingId(question.id);
    setForm({
      ...question,
      choices: [
        ...question.choices,
        ...Array.from(
          { length: Math.max(0, 4 - question.choices.length) },
          () => ({ japanese: "", romaji: "" }),
        ),
      ],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const remove = async (question: Question) => {
    if (!window.confirm(`Delete mission ${question.order}?`)) return;
    await fetch(`${API_URL}/api/situational/questions/${question.id}`, {
      method: "DELETE",
    });
    await load();
  };
  const toggle = async (question: Question) => {
    await fetch(`${API_URL}/api/situational/questions/${question.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...question, active: !question.active }),
    });
    await load();
  };

  return (
    <main className="admin-response-page">
      <header className="response-admin-header">
        <div>
          <small>COMMUNICATION GAME STUDIO</small>
          <h1>QuackSituate content</h1>
          <p>
            Publish, hide, and manage Recognition, Expression Match, and
            Politeness missions.
          </p>
        </div>
        <div className="response-summary">
          <span>
            <b>{filtered.length}</b>missions
          </span>
          <span>
            <b>{starterCount}</b>starter
          </span>
          <span>
            <b>{hardCount}</b>hard
          </span>
        </div>
      </header>
      <nav className="response-tabs">
        {[
          ["RECOGNITION", Eye, "Recognition"],
          ["EXPRESSION_MATCH", MessagesSquare, "Expression Match"],
          ["POLITENESS", Sparkles, "Politeness"],
        ].map(([key, Icon, label]) => (
          <button
            key={String(key)}
            className={gameType === key ? "active" : ""}
            onClick={() => {
              setGameType(String(key));
              reset(String(key));
            }}
          >
            <Icon />
            {String(label)}
          </button>
        ))}
      </nav>
      <form className="response-editor" onSubmit={save}>
        <div className="response-editor-title">
          <div>
            <small>{editingId ? "EDITING MISSION" : "NEW MISSION"}</small>
            <h2>
              {editingId
                ? `Update ${gameType.toLowerCase().replace("_", " ")}`
                : `Add ${gameType.toLowerCase().replace("_", " ")} content`}
            </h2>
          </div>
          {editingId && (
            <button
              type="button"
              className="soft-button"
              onClick={() => reset()}
            >
              <X />
              Cancel
            </button>
          )}
        </div>
        <div className="response-form-grid">
          {gameType === "EXPRESSION_MATCH" && (
            <>
              <label>
                Level
                <select
                  value={form.level}
                  onChange={(event) =>
                    setForm({ ...form, level: Number(event.target.value) })
                  }
                >
                  {[1, 2, 3, 4, 5].map((level) => (
                    <option key={level} value={level}>
                      Level {level}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Set / round
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={form.setNumber}
                  onChange={(event) =>
                    setForm({ ...form, setNumber: Number(event.target.value) })
                  }
                />
              </label>
              <label className="wide">
                Covered topic
                <input
                  required
                  value={form.topic}
                  onChange={(event) =>
                    setForm({ ...form, topic: event.target.value })
                  }
                  placeholder="School greetings and formal courtesy"
                />
              </label>
            </>
          )}
          {gameType === "POLITENESS" && (
            <>
              <label>
                Progression level
                <select
                  value={form.level}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      level: Number(event.target.value),
                      difficulty:
                        event.target.value === "1"
                          ? "EASY"
                          : event.target.value === "2"
                            ? "MEDIUM"
                            : "HARD",
                    })
                  }
                >
                  <option value={1}>Level 1 · Easy</option>
                  <option value={2}>Level 2 · Medium</option>
                  <option value={3}>Level 3 · Hard</option>
                </select>
              </label>
              <label className="wide">
                Covered relationship
                <input
                  required
                  value={form.topic}
                  onChange={(event) =>
                    setForm({ ...form, topic: event.target.value })
                  }
                  placeholder="Professor, classmate, service staff, or workplace senior"
                />
              </label>
            </>
          )}
          <label>
            Mission number
            <input
              type="number"
              min="1"
              required
              value={form.order}
              onChange={(event) =>
                setForm({ ...form, order: Number(event.target.value) })
              }
            />
          </label>
          <label>
            Difficulty
            <select
              value={form.difficulty}
              onChange={(event) =>
                setForm({ ...form, difficulty: event.target.value })
              }
            >
              <option>STARTER</option>
              <option>HARD</option>
            </select>
          </label>
          <label>
            Scene location
            <input
              required
              value={form.location}
              onChange={(event) =>
                setForm({ ...form, location: event.target.value })
              }
            />
          </label>
          <label>
            Scene image
            <select
              value={form.sceneKey}
              onChange={(event) =>
                setForm({ ...form, sceneKey: event.target.value })
              }
            >
              <option value="school">School hallway</option>
              <option value="classroom">Classroom</option>
              <option value="station">Station</option>
              <option value="office">Office</option>
              <option value="meal">Meal setting</option>
              <option value="home">Home</option>
            </select>
          </label>
          <label className="wide">
            Scenario
            <textarea
              required
              value={form.scenario}
              onChange={(event) =>
                setForm({ ...form, scenario: event.target.value })
              }
              placeholder="You meet your professor in the hallway in the morning. What should you say?"
            />
          </label>
          <label className="wide">
            Small hint
            <textarea
              required
              value={form.hint}
              onChange={(event) =>
                setForm({ ...form, hint: event.target.value })
              }
            />
          </label>
        </div>
        <div className="choice-editor">
          <div>
            <small>ANSWER CHOICES</small>
            <h3>Japanese and romaji</h3>
          </div>
          {form.choices.slice(0, 4).map((choice, index) => (
            <div className="choice-edit-row" key={index}>
              <b>{String.fromCharCode(65 + index)}</b>
              <input
                lang="ja"
                required={index < 3}
                placeholder="おはようございます"
                value={choice.japanese}
                onChange={(event) =>
                  setChoice(index, "japanese", event.target.value)
                }
              />
              <input
                required={index < 3}
                placeholder="Ohayou gozaimasu"
                value={choice.romaji}
                onChange={(event) =>
                  setChoice(index, "romaji", event.target.value)
                }
              />
              <label className="correct-choice">
                <input
                  type="radio"
                  name="correct"
                  checked={
                    form.correctAnswer === choice.japanese &&
                    Boolean(choice.japanese)
                  }
                  onChange={() =>
                    setForm({ ...form, correctAnswer: choice.japanese })
                  }
                />
                Correct
              </label>
            </div>
          ))}
        </div>
        <label className="response-explanation">
          Correct-answer explanation
          <textarea
            required
            value={form.explanation}
            onChange={(event) =>
              setForm({ ...form, explanation: event.target.value })
            }
            placeholder="Explain why this response fits the person, place, and time."
          />
        </label>
        {message && <p className="bank-status">{message}</p>}
        <button className="primary-button" disabled={saving}>
          <Save />
          {saving
            ? "Saving..."
            : editingId
              ? "Save mission changes"
              : "Add mission"}
        </button>
      </form>
      <section className="response-mission-list">
        <div className="mission-list-head">
          <div>
            <small>LIVE CONTENT</small>
            <h2>{gameType.replace("_", " ")} missions</h2>
          </div>
          <button className="soft-button" onClick={() => reset()}>
            <Plus />
            New mission
          </button>
        </div>
        {filtered.length === 0 ? (
          <div className="response-empty">
            <MessagesSquare />
            <h3>No missions in this game yet</h3>
            <p>
              Recognition is implemented first. Use the editor above when you
              are ready to add this game’s content.
            </p>
          </div>
        ) : (
          filtered.map((question) => (
            <article
              key={question.id}
              className={!question.active ? "inactive" : ""}
            >
              <div className="mission-index">
                <small>MISSION</small>
                <b>{String(question.order).padStart(2, "0")}</b>
              </div>
              <div className="mission-main">
                <div className="mission-meta">
                  <span>{question.difficulty}</span>
                  <span>{question.location}</span>
                  {question.active && (
                    <span className="live">
                      <CheckCircle2 />
                      LIVE
                    </span>
                  )}
                </div>
                <h3>{question.scenario}</h3>
                <div className="answer-preview">
                  <b lang="ja">{question.correctAnswer}</b>
                  <span>
                    {
                      question.choices.find(
                        (choice) => choice.japanese === question.correctAnswer,
                      )?.romaji
                    }
                  </span>
                </div>
                <p>{question.explanation}</p>
              </div>
              <div className="mission-actions">
                <button onClick={() => toggle(question)}>
                  {question.active ? "Unpublish" : "Publish"}
                </button>
                <button onClick={() => edit(question)}>
                  <Edit3 />
                  Edit
                </button>
                <button className="delete" onClick={() => remove(question)}>
                  <Trash2 />
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

