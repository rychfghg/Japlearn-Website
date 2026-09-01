import {
  CheckCircle2,
  Edit3,
  Eye,
  MessagesSquare,
  Volume2,
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
  imageUrl: string;
  imageAlt: string;
  secondaryImageUrl: string;
  secondaryImageAlt: string;
  audioUrl: string;
  speaker: string;
  characterKey: string;
  npcLine: string;
  npcRomaji: string;
  scenario: string;
  secondaryScenario: string;
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
  imageUrl: "",
  imageAlt: "Japanese situational scene",
  secondaryImageUrl: "",
  secondaryImageAlt: "Alternative Japanese gesture",
  audioUrl: "",
  speaker: "Sumi",
  characterKey: "SUMI",
  npcLine: "",
  npcRomaji: "",
  scenario: "",
  secondaryScenario: "",
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingSecondaryImage, setUploadingSecondaryImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [expressionTarget, setExpressionTarget] = useState<"FIRST" | "SECOND">("FIRST");

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
    setExpressionTarget("FIRST");
    setForm({
      ...emptyForm,
      gameType: type,
      difficulty: type === "EXPRESSION_MATCH" ? "EASY" : "STARTER",
      order: questions.filter((item) => item.gameType === type).length + 1,
    });
  };
  const setChoice = (index: number, key: keyof Choice, value: string) => {
    setForm({
      ...form,
      choices: form.choices.map((choice, choiceIndex) =>
        choiceIndex === index ? { ...choice, [key]: value } : choice,
      ),
      ...(gameType === "EXPRESSION_MATCH" && index === 0 && key === "japanese"
        ? { correctAnswer: value }
        : {}),
    });
  };

  const uploadSceneImage = async (file?: File) => {
    if (!file) return;
    setUploadingImage(true);
    setMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`${API_URL}/api/situational/media`, {
        method: "POST",
        body,
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const result = (await response.json()) as { url: string };
      setForm((current) => ({ ...current, imageUrl: result.url }));
      setMessage("Scene image uploaded. Save the mission to publish this picture.");
    } catch {
      setMessage("Scene image could not be uploaded. Check the backend connection and file type.");
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadSecondarySceneImage = async (file?: File) => {
    if (!file) return;
    setUploadingSecondaryImage(true);
    setMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`${API_URL}/api/situational/media`, {
        method: "POST",
        body,
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const result = (await response.json()) as { url: string };
      setForm((current) => ({
        ...current,
        secondaryImageUrl: result.url,
      }));
      setMessage("Second gesture image uploaded. Save the item to keep it.");
    } catch {
      setMessage("The second gesture image could not be uploaded.");
    } finally {
      setUploadingSecondaryImage(false);
    }
  };

  const uploadSceneAudio = async (file?: File) => {
    if (!file) return;
    setUploadingAudio(true);
    setMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`${API_URL}/api/situational/media`, {
        method: "POST",
        body,
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const result = (await response.json()) as { url: string };
      setForm((current) => ({ ...current, audioUrl: result.url }));
      setMessage("Moment audio uploaded. Save the mission to keep it.");
    } catch {
      setMessage("Moment audio could not be uploaded. Use MP3, M4A, WAV, or OGG and check the backend.");
    } finally {
      setUploadingAudio(false);
    }
  };

  const mediaPreview = (url: string) =>
    !url ? "" : url.startsWith("http") ? url : `${API_URL}${url}`;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      gameType === "EXPRESSION_MATCH" &&
      (
        !form.imageUrl.trim() ||
        !form.secondaryImageUrl.trim() ||
        !form.scenario.trim() ||
        !form.secondaryScenario.trim()
      )
    ) {
      setMessage(
        "Add two pictures and one short situation for each picture before saving.",
      );
      return;
    }
    const cleanChoices = form.choices
      .map((choice) => ({
        japanese: choice.japanese.trim(),
        romaji: choice.romaji.trim(),
      }))
      .filter((choice) => choice.japanese && choice.romaji);
    if (
      cleanChoices.length < (gameType === "EXPRESSION_MATCH" ? 1 : 3) ||
      !cleanChoices.some(
        (choice) => choice.japanese === form.correctAnswer.trim(),
      )
    ) {
      setMessage(
        gameType === "EXPRESSION_MATCH"
          ? "Add one draggable Japanese phrase with its romaji."
          : "Add at least three complete choices and select one of them as the correct answer.",
      );
      return;
    }
    const expressionImages = expressionTarget === "FIRST"
      ? {
          imageUrl: form.imageUrl,
          imageAlt: form.imageAlt,
          scenario: form.scenario,
          secondaryImageUrl: form.secondaryImageUrl,
          secondaryImageAlt: form.secondaryImageAlt,
          secondaryScenario: form.secondaryScenario,
        }
      : {
          imageUrl: form.secondaryImageUrl,
          imageAlt: form.secondaryImageAlt,
          scenario: form.secondaryScenario,
          secondaryImageUrl: form.imageUrl,
          secondaryImageAlt: form.imageAlt,
          secondaryScenario: form.scenario,
        };
    setSaving(true);
    setMessage("");
    const response = await fetch(
      `${API_URL}/api/situational/questions${editingId ? `/${editingId}` : ""}`,
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ...(gameType === "EXPRESSION_MATCH" ? expressionImages : {}),
          gameType,
          setNumber: gameType === "EXPRESSION_MATCH" ? 1 : form.setNumber,
          choices: gameType === "EXPRESSION_MATCH" ? cleanChoices.slice(0, 1) : cleanChoices,
        }),
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
    setExpressionTarget("FIRST");
    setForm({
      ...question,
      imageUrl: question.imageUrl || "",
      imageAlt: question.imageAlt || question.location || "Japanese situational scene",
      secondaryImageUrl: question.secondaryImageUrl || "",
      secondaryImageAlt: question.secondaryImageAlt || "Second Japanese situation",
      audioUrl: question.audioUrl || "",
      speaker: question.speaker || (question.characterKey === "HARU" ? "Haru" : "Sumi"),
      characterKey: question.characterKey || "SUMI",
      npcLine: question.npcLine || "",
      npcRomaji: question.npcRomaji || "",
      secondaryScenario: question.secondaryScenario || "",
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
                Difficulty group
                <select
                  value={form.level}
                  onChange={(event) => {
                    const level = Number(event.target.value);
                    setForm({
                      ...form,
                      level,
                      setNumber: 1,
                      difficulty: level === 1 ? "EASY" : level === 2 ? "MEDIUM" : "HARD",
                    });
                  }}
                >
                  <option value={1}>Easy</option>
                  <option value={2}>Medium</option>
                  <option value={3}>Hard</option>
                </select>
              </label>
              <div className="response-field-note">
                Choose the journey and its order. The app uses one phrase, two pictures, and one correct picture.
              </div>
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
              <label>
                Character shown in the game
                <select value={form.characterKey} onChange={(event) => setForm({ ...form, characterKey: event.target.value, speaker: event.target.value === "HARU" ? "Haru" : "Sumi" })}>
                  <option value="SUMI">Sumi</option>
                  <option value="HARU">Haru</option>
                </select>
              </label>
              <label>
                Speaker name
                <input value={form.speaker} onChange={(event) => setForm({ ...form, speaker: event.target.value })} placeholder="Sumi, Haru, Professor Tanaka..." />
              </label>
              <label className="wide">
                Character dialogue (Japanese)
                <input lang="ja" required value={form.npcLine} onChange={(event) => setForm({ ...form, npcLine: event.target.value })} placeholder="おはようございます。" />
              </label>
              <label className="wide">
                Character dialogue (romaji)
                <input required value={form.npcRomaji} onChange={(event) => setForm({ ...form, npcRomaji: event.target.value })} placeholder="Ohayou gozaimasu." />
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
          {gameType !== "EXPRESSION_MATCH" && (
            <label>
              Difficulty
              <select
                value={form.difficulty}
                onChange={(event) =>
                  setForm({ ...form, difficulty: event.target.value })
                }
              >
                <option>STARTER</option>
                <option>MEDIUM</option>
                <option>HARD</option>
              </select>
            </label>
          )}
          {gameType !== "EXPRESSION_MATCH" && (
            <>
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
                Scene category
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
            </>
          )}
          <label className="wide">
            {gameType === "EXPRESSION_MATCH" ? "Correct situation image URL" : "Scene picture URL"}
            <input
              value={form.imageUrl}
              onChange={(event) =>
                setForm({ ...form, imageUrl: event.target.value })
              }
              placeholder="Upload below or paste a complete HTTPS image URL"
            />
          </label>
          <label className="wide">
            {gameType === "EXPRESSION_MATCH" ? "Upload correct situation image" : "Upload scene picture"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={uploadingImage}
              onChange={(event) => void uploadSceneImage(event.target.files?.[0])}
            />
            <small>{uploadingImage ? "Uploading picture..." : "PNG, JPG, WebP, or GIF. Stored through the JapLearn backend."}</small>
          </label>
          <label className="wide">
            {gameType === "EXPRESSION_MATCH" ? "Picture 1 description (optional)" : "Image description"}
            <input
              value={form.imageAlt}
              onChange={(event) =>
                setForm({ ...form, imageAlt: event.target.value })
              }
              placeholder="School hallway in the morning"
            />
          </label>
          {form.imageUrl && (
            <div className="wide response-image-preview">
              <img src={mediaPreview(form.imageUrl)} alt={form.imageAlt || "Recognition scene preview"} />
              <button type="button" className="soft-button" onClick={() => setForm({ ...form, imageUrl: "" })}>
                <X /> Remove uploaded picture
              </button>
            </div>
          )}
          {gameType === "EXPRESSION_MATCH" && (
            <>
              <label className="wide">
                Comparison situation image URL
                <input
                  value={form.secondaryImageUrl}
                  onChange={(event) =>
                    setForm({ ...form, secondaryImageUrl: event.target.value })
                  }
                  placeholder="Upload below or paste a complete HTTPS image URL"
                />
              </label>
              <label className="wide">
                Upload comparison situation image
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  disabled={uploadingSecondaryImage}
                  onChange={(event) =>
                    void uploadSecondarySceneImage(event.target.files?.[0])
                  }
                />
                <small>
                  {uploadingSecondaryImage
                    ? "Uploading second picture..."
                    : "PNG, JPG, WebP, or GIF. The app preserves the complete image without stretching."}
                </small>
              </label>
              <label className="wide">
                Picture 2 description (optional)
                <input
                  value={form.secondaryImageAlt}
                  onChange={(event) =>
                    setForm({ ...form, secondaryImageAlt: event.target.value })
                  }
                  placeholder="Person bowing politely"
                />
              </label>
              {form.secondaryImageUrl && (
                <div className="wide response-image-preview">
                  <img
                    src={mediaPreview(form.secondaryImageUrl)}
                    alt={form.secondaryImageAlt || "Second gesture preview"}
                  />
                  <button
                    type="button"
                    className="soft-button"
                    onClick={() => setForm({ ...form, secondaryImageUrl: "" })}
                  >
                    <X /> Remove second picture
                  </button>
                </div>
              )}
            </>
          )}
          <label className="wide">
            {gameType === "POLITENESS" ? "Character dialogue audio URL" : gameType === "EXPRESSION_MATCH" ? "Phrase audio URL (optional)" : "Gesture audio URL"}
            <input
              value={form.audioUrl}
              onChange={(event) =>
                setForm({ ...form, audioUrl: event.target.value })
              }
              placeholder="Upload below or paste a complete HTTPS audio URL"
            />
          </label>
          <label className="wide">
            {gameType === "POLITENESS" ? "Upload character dialogue audio" : "Upload gesture audio"}
            <input
              type="file"
              accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg"
              disabled={uploadingAudio}
              onChange={(event) => void uploadSceneAudio(event.target.files?.[0])}
            />
            <small>
              {uploadingAudio
                ? "Uploading audio..."
                : "Optional pronunciation or situational audio stored through the backend."}
            </small>
          </label>
          {form.audioUrl && (
            <div className="wide response-image-preview">
              <Volume2 size={20} />
              <audio controls preload="metadata" src={mediaPreview(form.audioUrl)} />
              <button
                type="button"
                className="soft-button"
                onClick={() => setForm({ ...form, audioUrl: "" })}
              >
                <X /> Remove audio
              </button>
            </div>
          )}
          <label className="wide">
            {gameType === "EXPRESSION_MATCH" ? "Picture 1 situation" : "Scenario"}
            <textarea
              required
              value={form.scenario}
              onChange={(event) =>
                setForm({ ...form, scenario: event.target.value })
              }
              placeholder="You meet your professor in the hallway in the morning. What should you say?"
            />
          </label>
          {gameType === "EXPRESSION_MATCH" && (
            <label className="wide">
              Picture 2 situation
              <textarea
                required
                value={form.secondaryScenario}
                onChange={(event) =>
                  setForm({ ...form, secondaryScenario: event.target.value })
                }
                placeholder="You politely greet someone at the entrance."
              />
            </label>
          )}
          <label className="wide">
            Small hint {gameType === "EXPRESSION_MATCH" ? "(optional)" : ""}
            <textarea
              required={gameType !== "EXPRESSION_MATCH"}
              value={form.hint}
              onChange={(event) =>
                setForm({ ...form, hint: event.target.value })
              }
            />
          </label>
        </div>
        <div className="choice-editor">
          <div>
            <small>
              {gameType === "EXPRESSION_MATCH"
                ? "DRAGGABLE EXPRESSION"
                : "ANSWER CHOICES"}
            </small>
            <h3>
              {gameType === "EXPRESSION_MATCH"
                ? "The one phrase the player will drag"
                : "Japanese and romaji"}
            </h3>
          </div>
          {form.choices
            .slice(0, gameType === "EXPRESSION_MATCH" ? 1 : 4)
            .map((choice, index) => (
            <div className="choice-edit-row" key={index}>
              <b>
                {gameType === "EXPRESSION_MATCH"
                  ? "PHRASE"
                  : String.fromCharCode(65 + index)}
              </b>
              <input
                lang="ja"
                required={gameType === "EXPRESSION_MATCH" || index < 3}
                placeholder="おはようございます"
                value={choice.japanese}
                onChange={(event) =>
                  setChoice(index, "japanese", event.target.value)
                }
              />
              <input
                required={gameType === "EXPRESSION_MATCH" || index < 3}
                placeholder="Ohayou gozaimasu"
                value={choice.romaji}
                onChange={(event) =>
                  setChoice(index, "romaji", event.target.value)
                }
              />
              {gameType !== "EXPRESSION_MATCH" && (
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
              )}
            </div>
          ))}
          {gameType === "EXPRESSION_MATCH" && (
            <div className="response-field-note">
              <strong>Which uploaded picture matches this phrase?</strong>
              <label className="correct-choice">
                <input
                  type="radio"
                  name="expression-target"
                  checked={expressionTarget === "FIRST"}
                  onChange={() => setExpressionTarget("FIRST")}
                />
                Picture 1
              </label>
              <label className="correct-choice">
                <input
                  type="radio"
                  name="expression-target"
                  checked={expressionTarget === "SECOND"}
                  onChange={() => setExpressionTarget("SECOND")}
                />
                Picture 2
              </label>
              <small>
                The app randomizes whether the correct picture appears above or below. You only choose which uploaded picture is correct.
              </small>
            </div>
          )}
        </div>
        <label className="response-explanation">
          Correct-answer explanation {gameType === "EXPRESSION_MATCH" ? "(optional)" : ""}
          <textarea
            required={gameType !== "EXPRESSION_MATCH"}
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
                {question.imageUrl && (
                  <img
                    className="mission-scene-thumb"
                    src={mediaPreview(question.imageUrl)}
                    alt={question.imageAlt || question.location}
                  />
                )}
                {gameType === "EXPRESSION_MATCH" && question.secondaryImageUrl && (
                  <img
                    className="mission-scene-thumb"
                    src={mediaPreview(question.secondaryImageUrl)}
                    alt={question.secondaryImageAlt || "Second gesture"}
                  />
                )}
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
