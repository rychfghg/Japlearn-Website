import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { API_URL } from "../../../lib/api";
import { session } from "../../../lib/auth";
type Node = {
  id: string;
  sumiJapanese: string;
  sumiRomaji: string;
  englishMeaning: string;
  acceptedResponses: string[];
  keywords: string[];
  register: string;
  hints: string[];
  successReply: string;
  retryReply: string;
  nextNodeId?: string;
  ending: boolean;
};
type Scenario = {
  id?: string;
  title: string;
  category: string;
  roleName: string;
  introduction: string;
  objective: string;
  difficulty: string;
  published: boolean;
  allowedTopics: string[];
  allowedVocabulary: string[];
  allowedGrammar: string[];
  targetExpressions: string[];
  progressiveHints: string[];
  nodes: Node[];
};
const newNode = (i: number): Node => ({
  id: `turn-${i + 1}`,
  sumiJapanese: "",
  sumiRomaji: "",
  englishMeaning: "",
  acceptedResponses: [],
  keywords: [],
  register: "POLITE",
  hints: [],
  successReply: "いいですね！",
  retryReply: "惜しい！もう一度やってみましょう。",
  ending: false,
});
const fresh = (): Scenario => ({
  title: "",
  category: "TRAVEL",
  roleName: "Sumi",
  introduction: "",
  objective: "",
  difficulty: "BEGINNER",
  published: false,
  allowedTopics: [],
  allowedVocabulary: [],
  allowedGrammar: [],
  targetExpressions: [],
  progressiveHints: [],
  nodes: [newNode(0)],
});
export default function AdminGuidedPracticeManager() {
  const token = session.get()?.apiToken || "";
  const headers = { Authorization: `Bearer ${token}` };
  const [items, setItems] = useState<Scenario[]>([]);
  const [edit, setEdit] = useState<Scenario | null>(null);
  const [error, setError] = useState("");
  const load = () =>
    fetch(`${API_URL}/api/guidedPractice/scenarios/admin`, { headers })
      .then(async (r) => {
        if (!r.ok)
          throw new Error("Sign in again to manage Guided Phrase content.");
        setItems(await r.json());
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  const node = (i: number, key: keyof Node, value: unknown) =>
    setEdit((s) =>
      s
        ? {
            ...s,
            nodes: s.nodes.map((n, x) =>
              x === i ? { ...n, [key]: value } : n,
            ),
          }
        : s,
    );
  const save = async () => {
    if (!edit) return;
    const body = {
      ...edit,
      nodes: [],
    };
    const response = await fetch(
      `${API_URL}/api/guidedPractice/scenarios/admin${edit.id ? `/${edit.id}` : ""}`,
      {
        method: edit.id ? "PUT" : "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!response.ok) {
      setError(await response.text());
      return;
    }
    setEdit(null);
    await load();
  };
  const remove = async (id?: string) => {
    if (!id || !confirm("Delete this scenario?")) return;
    const r = await fetch(
      `${API_URL}/api/guidedPractice/scenarios/admin/${id}`,
      { method: "DELETE", headers },
    );
    if (r.ok) await load();
    else setError("Only an administrator can permanently delete a scenario.");
  };
  return (
    <>
      <section className="admin-talk-records">
        <div className="admin-talk-toolbar">
          <div>
            <small>GUIDED CONTENT</small>
            <h2>Real-life conversation scenarios</h2>
          </div>
          <button className="admin-talk-add" onClick={() => setEdit(fresh())}>
            <Plus />
            New scenario
          </button>
        </div>
        {error && <div className="admin-error">{error}</div>}
        <div className="guided-admin-grid">
          {items.map((s) => (
            <article className="guided-admin-card" key={s.id}>
              <small>
                {s.category} · {s.difficulty}
              </small>
              <h3>{s.title}</h3>
              <p>{s.introduction}</p>
              <div className="guided-admin-card-meta">
                <span>AI-generated flow</span>
                <span className={s.published ? "published" : ""}>
                  {s.published ? "Published" : "Hidden"}
                </span>
              </div>
              <div className="guided-admin-actions">
                <button onClick={() => setEdit(structuredClone(s))}>
                  Edit
                </button>
                <button onClick={() => void remove(s.id)}>
                  <Trash2 />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      {edit && (
        <div className="guided-editor-shade">
          <div className="guided-editor">
            <header>
              <div>
                <small>CONTROLLED CONVERSATION</small>
                <h2>{edit.id ? "Edit scenario" : "Create scenario"}</h2>
              </div>
              <button onClick={() => setEdit(null)}>×</button>
            </header>
            <div className="guided-editor-fields">
              <label>
                Scenario title
                <input
                  value={edit.title}
                  onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                />
              </label>
              <label>
                Category
                <select
                  value={edit.category}
                  onChange={(e) =>
                    setEdit({ ...edit, category: e.target.value })
                  }
                >
                  <option>EMPLOYMENT</option>
                  <option>TRAVEL</option>
                  <option>SOCIAL</option>
                  <option>SCHOOL</option>
                </select>
              </label>
              <label>
                Role Sumi is playing
                <input
                  value={edit.roleName}
                  onChange={(e) =>
                    setEdit({ ...edit, roleName: e.target.value })
                  }
                />
              </label>
              <label className="wide">
                Opening situation
                <textarea
                  value={edit.introduction}
                  onChange={(e) =>
                    setEdit({ ...edit, introduction: e.target.value })
                  }
                />
              </label>
            <label className="wide">
              Learning objective
                <textarea
                  value={edit.objective}
                  onChange={(e) =>
                    setEdit({ ...edit, objective: e.target.value })
                  }
                />
            </label>
            <label className="wide">
              Target expressions (one per line)
              <textarea
                value={(edit.targetExpressions || []).join("\n")}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    targetExpressions: e.target.value.split("\n").filter(Boolean),
                  })
                }
              />
            </label>
            <label className="wide">
              Allowed topics (one per line)
              <textarea value={(edit.allowedTopics || []).join("\n")} onChange={(e) => setEdit({...edit, allowedTopics:e.target.value.split("\n").filter(Boolean)})}/>
            </label>
            <label className="wide">
              Beginner vocabulary boundaries (one per line)
              <textarea value={(edit.allowedVocabulary || []).join("\n")} onChange={(e) => setEdit({...edit, allowedVocabulary:e.target.value.split("\n").filter(Boolean)})}/>
            </label>
            <label className="wide">
              Allowed grammar (one per line)
              <textarea value={(edit.allowedGrammar || []).join("\n")} onChange={(e) => setEdit({...edit, allowedGrammar:e.target.value.split("\n").filter(Boolean)})}/>
            </label>
            <label className="wide">
              Progressive help: meaning, vocabulary, structure, example (one per line)
              <textarea
                value={(edit.progressiveHints || []).join("\n")}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    progressiveHints: e.target.value.split("\n").filter(Boolean),
                  })
                }
              />
            </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={edit.published}
                  onChange={(e) =>
                    setEdit({ ...edit, published: e.target.checked })
                  }
                />
                Published in the learner app
              </label>
            </div>
        <h3 className="legacy-guidance-fields">Legacy guidance fields</h3>
            {edit.nodes.map((n, i) => (
          <article className="guided-node legacy-guidance-fields" key={n.id}>
                <div className="guided-node-head">
                  <b>Turn {i + 1}</b>
                  {edit.nodes.length > 1 && (
                    <button
                      onClick={() =>
                        setEdit({
                          ...edit,
                          nodes: edit.nodes.filter((_, x) => x !== i),
                        })
                      }
                    >
                      <Trash2 />
                      Remove
                    </button>
                  )}
                </div>
                <label>
                  Sumi’s Japanese
                  <textarea
                    value={n.sumiJapanese}
                    onChange={(e) => node(i, "sumiJapanese", e.target.value)}
                  />
                </label>
                <div className="guided-editor-fields">
                  <label>
                    Romaji
                    <input
                      value={n.sumiRomaji}
                      onChange={(e) => node(i, "sumiRomaji", e.target.value)}
                    />
                  </label>
                  <label>
                    English meaning
                    <input
                      value={n.englishMeaning}
                      onChange={(e) =>
                        node(i, "englishMeaning", e.target.value)
                      }
                    />
                  </label>
                  <label className="wide">
                    Accepted phrases/keywords (comma separated)
                    <input
                      value={n.acceptedResponses.join(", ")}
                      onChange={(e) => {
                        const v = e.target.value
                          .split(",")
                          .map((x) => x.trim())
                          .filter(Boolean);
                        node(i, "acceptedResponses", v);
                        node(i, "keywords", v);
                      }}
                    />
                  </label>
                  <label>
                    Natural success reaction
                    <input
                      value={n.successReply}
                      onChange={(e) => node(i, "successReply", e.target.value)}
                    />
                  </label>
                  <label>
                    Supportive correction
                    <input
                      value={n.retryReply}
                      onChange={(e) => node(i, "retryReply", e.target.value)}
                    />
                  </label>
                  <label className="wide">
                    Progressive hints (one per line)
                    <textarea
                      value={n.hints.join("\n")}
                      onChange={(e) =>
                        node(
                          i,
                          "hints",
                          e.target.value.split("\n").filter(Boolean),
                        )
                      }
                    />
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={n.ending}
                      onChange={(e) => node(i, "ending", e.target.checked)}
                    />
                    This turn completes the scenario
                  </label>
                </div>
              </article>
            ))}
        <button
          className="guided-add-turn legacy-guidance-fields"
              onClick={() =>
                setEdit({
                  ...edit,
                  nodes: [...edit.nodes, newNode(edit.nodes.length)],
                })
              }
            >
              <Plus />
              Add conversation turn
            </button>
            <footer>
              <button onClick={() => setEdit(null)}>Cancel</button>
              <button onClick={() => void save()}>
                <Save />
                Save scenario
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
