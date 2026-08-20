import { useEffect, useMemo, useState } from "react";
import { Check, Edit3, Plus, Save, Trash2, X } from "lucide-react";
import { API_URL } from "../../../lib/api";

type Question = {
  id: string;
  prompt: string;
  translation: string;
  category: string;
  difficulty: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  approved: boolean;
  systemAvailable: boolean;
};

type QuestionForm = Omit<Question, "id" | "options" | "approved" | "systemAvailable"> & {
  options: string;
};

const emptyForm: QuestionForm = {
  prompt: "",
  translation: "",
  category: "Particles",
  difficulty: "Beginner",
  options: "",
  correctAnswer: "",
  explanation: "",
};

export default function AdminQuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState<QuestionForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const availableCount = useMemo(
    () => questions.filter((question) => question.approved && question.systemAvailable).length,
    [questions],
  );

  const load = async () => {
    try {
      const response = await fetch(`${API_URL}/api/quackslate/question-bank`);
      if (!response.ok) throw new Error(`Server returned ${response.status}.`);
      setQuestions(await response.json());
      setMessage("");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Connection unavailable.";
      setMessage(`QuackSlate could not connect to ${API_URL}. ${detail} Start the updated Spring Boot backend, then retry.`);
    }
  };

  useEffect(() => {
    void load().catch((error) => setMessage(error.message));
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const saveQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    const options = form.options.split(",").map((value) => value.trim()).filter(Boolean);
    const answerWords = form.correctAnswer.trim().split(/\s+/);

    if (options.length < 2 || answerWords.some((word) => !options.includes(word))) {
      setMessage("Add at least two tiles and make sure every word in the correct answer appears in the tile list.");
      return;
    }

    setSaving(true);
    setMessage("");
    const existing = questions.find((question) => question.id === editingId);
    const response = await fetch(
      editingId
        ? `${API_URL}/api/quackslate/question-bank/${editingId}`
        : `${API_URL}/api/quackslate/question-bank`,
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          options,
          approved: existing?.approved ?? true,
          systemAvailable: existing?.systemAvailable ?? true,
          createdBy: "ADMIN",
        }),
      },
    );
    setSaving(false);

    if (!response.ok) {
      setMessage("The question could not be saved. Please check the backend connection.");
      return;
    }

    setMessage(editingId ? "Question updated in the master bank." : "Question added to the master bank.");
    resetForm();
    await load();
  };

  const edit = (question: Question) => {
    setEditingId(question.id);
    setForm({
      prompt: question.prompt,
      translation: question.translation,
      category: question.category,
      difficulty: question.difficulty,
      options: question.options.join(", "),
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this question from the QuackSlate master bank?")) return;
    await fetch(`${API_URL}/api/quackslate/question-bank/${id}`, { method: "DELETE" });
    if (editingId === id) resetForm();
    await load();
  };

  const toggle = async (question: Question, key: "approved" | "systemAvailable") => {
    await fetch(`${API_URL}/api/quackslate/question-bank/${question.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...question, [key]: !question[key] }),
    });
    await load();
  };

  return (
    <main className="admin-question-page">
        <header>
          <div>
            <small>MASTER QUESTION BANK</small>
            <h1>QuackSlate content studio</h1>
            <p>Create, revise, approve, and publish questions for solo practice and teacher sessions.</p>
          </div>
          <div className="bank-summary"><b>{questions.length}</b><span>Total questions</span><b>{availableCount}</b><span>Live for practice</span></div>
        </header>

        <form className="admin-question-form" onSubmit={saveQuestion}>
          <div className="form-title-row">
            <h2>{editingId ? <Edit3 /> : <Plus />}{editingId ? "Edit bank question" : "Add a bank question"}</h2>
            {editingId && <button type="button" className="soft-button" onClick={resetForm}><X size={16} />Cancel edit</button>}
          </div>
          <div className="form-grid">
            <label>English prompt<input required value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} /></label>
            <label>Japanese sentence<input required lang="ja" value={form.translation} onChange={(event) => setForm({ ...form, translation: event.target.value })} /></label>
            <label>Category<input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
            <label>Difficulty<select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
            <label className="wide">Word tiles (comma-separated)<input required value={form.options} onChange={(event) => setForm({ ...form, options: event.target.value })} /></label>
            <label className="wide">Correct tile order (space-separated)<input required value={form.correctAnswer} onChange={(event) => setForm({ ...form, correctAnswer: event.target.value })} /></label>
            <label className="wide">Answer explanation<textarea required value={form.explanation} onChange={(event) => setForm({ ...form, explanation: event.target.value })} /></label>
          </div>
          {message && <p className="bank-status">{message}</p>}
          <button className="primary-button" type="submit" disabled={saving}>
            <Save size={17} />{saving ? "Saving..." : editingId ? "Save changes" : "Add to master bank"}
          </button>
        </form>

        <div className="admin-question-list">
          {questions.map((question) => (
            <article key={question.id}>
              <div>
                <small>{question.category} · {question.difficulty}</small>
                <h3>{question.prompt}</h3>
                <p lang="ja">{question.translation}</p>
                <div className="tile-preview">{question.options.map((option) => <span key={option}>{option}</span>)}</div>
                <em>{question.explanation}</em>
              </div>
              <div className="question-actions">
                <button className={question.approved ? "on" : ""} onClick={() => toggle(question, "approved")}><Check size={15} />Approved</button>
                <button className={question.systemAvailable ? "on green" : ""} onClick={() => toggle(question, "systemAvailable")}><Check size={15} />Solo practice</button>
                <button onClick={() => edit(question)}><Edit3 size={15} />Edit</button>
                <button className="delete" aria-label="Delete question" onClick={() => remove(question.id)}><Trash2 size={16} /></button>
              </div>
            </article>
          ))}
        </div>
    </main>
  );
}
