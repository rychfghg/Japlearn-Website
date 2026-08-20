import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Copy, Play, Plus, RefreshCw, Sparkles } from "lucide-react";
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
};

export default function QuackslatePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [gameCode, setGameCode] = useState("");
  const [filter, setFilter] = useState("All");
  const [status, setStatus] = useState("");
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);

  const load = async () => {
    const response = await fetch(`${API_URL}/api/quackslate/question-bank`);
    if (!response.ok) throw new Error("Question bank unavailable.");
    const data: Question[] = await response.json();
    setQuestions(data);
  };

  useEffect(() => {
    void load().catch((error) => setStatus(error.message));
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(questions.map((question) => question.category)))],
    [questions],
  );
  const visible = filter === "All" ? questions : questions.filter((question) => question.category === filter);

  const generate = async () => {
    setStatus("Preparing the classroom session...");
    const codeResponse = await fetch(`${API_URL}/api/quackslateLevels/generateGameCode`, { method: "POST" });
    if (!codeResponse.ok) {
      setStatus("The class code could not be created.");
      return;
    }
    const { gameCode: code } = await codeResponse.json();
    const chosen = selected.length ? selected : questions.slice(0, 10).map((question) => question.id);
    const sessionResponse = await fetch(`${API_URL}/api/quackslate/question-bank/sessions/${code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chosen),
    });
    if (!sessionResponse.ok) {
      setStatus("The selected questions could not be attached to the session.");
      return;
    }
    setGameCode(code);
    setSessionCount(chosen.length);
    setCurrentQuestion(0);
    setStarted(false);
    setStatus(`${chosen.length} questions are ready. Share the code, then start when your class has joined.`);
  };

  const startSession = async () => {
    const response = await fetch(`${API_URL}/api/quackslateLevels/startQuiz/${gameCode}`, { method: "POST" });
    if (!response.ok) {
      setStatus("The live session could not be started.");
      return;
    }
    setStarted(true);
    setCurrentQuestion(0);
    setStatus("Session is live. Students can now answer question 1.");
  };

  const nextQuestion = async () => {
    const next = currentQuestion + 1;
    if (next >= sessionCount) {
      setStatus("All questions have been presented. The session is complete.");
      return;
    }
    const response = await fetch(`${API_URL}/api/quackslateLevels/setCurrentQuestionIndex/${gameCode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentQuestionIndex: next }),
    });
    if (!response.ok) {
      setStatus("The next question could not be released.");
      return;
    }
    setCurrentQuestion(next);
    setStatus(`Question ${next + 1} of ${sessionCount} is now live.`);
  };

  return (
    <section className="quack-bank-page">
      <div className="quack-page-head">
        <div><small>LIVE GRAMMAR ACTIVITY</small><h2>Build a QuackSlate session</h2><p>Select questions from the shared admin bank, generate a code, and control the lesson from here.</p></div>
        <button className="primary-button" onClick={generate} disabled={!questions.length}><Sparkles size={17} />Generate class code</button>
      </div>

      {gameCode && (
        <div className="session-code">
          <div><small>{started ? "SESSION LIVE" : "SESSION READY"}</small><strong>{gameCode}</strong><span>{status}</span></div>
          <div className="session-controls">
            <button onClick={() => navigator.clipboard.writeText(gameCode)}><Copy size={17} />Copy code</button>
            {!started
              ? <button className="session-start" onClick={startSession}><Play size={17} />Start session</button>
              : <button className="session-start" onClick={nextQuestion} disabled={currentQuestion + 1 >= sessionCount}>Next question <ChevronRight size={17} /></button>}
          </div>
          {started && <div className="session-progress"><span style={{ width: `${((currentQuestion + 1) / sessionCount) * 100}%` }} /></div>}
        </div>
      )}
      {!gameCode && status && <p className="bank-status">{status}</p>}

      <div className="bank-toolbar">
        <div>{categories.map((category) => <button key={category} className={filter === category ? "active" : ""} onClick={() => setFilter(category)}>{category}</button>)}</div>
        <span>{selected.length ? `${selected.length} selected` : "Default: first 10 questions"}</span>
      </div>

      <div className="question-bank-grid">
        {visible.map((question) => {
          const active = selected.includes(question.id);
          return (
            <button key={question.id} className={`question-bank-card ${active ? "selected" : ""}`} onClick={() => setSelected((items) => active ? items.filter((id) => id !== question.id) : [...items, question.id])}>
              <span className="question-check">{active ? <Check size={16} /> : <Plus size={16} />}</span>
              <small>{question.category} · {question.difficulty}</small>
              <h3>{question.prompt}</h3>
              <p lang="ja">{question.translation}</p>
              <div className="tile-preview">{question.options.map((option) => <span key={option}>{option}</span>)}</div>
              <em>{question.explanation}</em>
            </button>
          );
        })}
      </div>
      <button className="soft-button bank-refresh" onClick={() => void load()}><RefreshCw size={15} />Refresh bank</button>
    </section>
  );
}
