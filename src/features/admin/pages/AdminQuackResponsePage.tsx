import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  Copy,
  Eye,
  GitBranch,
  Plus,
  Save,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../../lib/api";

type Choice = {
  id: string;
  text: string;
  japanese: string;
  romaji: string;
  evaluation: "BEST" | "ACCEPTABLE" | "AWKWARD" | "IMPOLITE" | "RUDE";
  points: number;
  explanation: string;
  culturalNote: string;
  reactionText: string;
  reactionCharacterKey: string;
  reactionExpressionKey: string;
  nextNodeId: string;
};
type Node = {
  id: string;
  type: string;
  title: string;
  text: string;
  japanese: string;
  romaji: string;
  speaker: string;
  characterKey: string;
  expressionKey: string;
  secondaryCharacterKey: string;
  secondaryExpressionKey: string;
  backgroundKey: string;
  audioUrl: string;
  bgmUrl: string;
  bgmEnabled: boolean | null;
  bgmVolume: number | null;
  bgmFadeMs: number | null;
  hint: string;
  hintPenalty: number;
  characterPosition: string;
  secondaryCharacterPosition: string;
  spritesVisible: boolean;
  tapToContinue: boolean;
  shuffleChoices: boolean;
  nextNodeId: string;
  choices: Choice[];
};
type Chapter = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  learningObjectives: string[];
  status: "DRAFT" | "PUBLISHED" | "HIDDEN";
  startNodeId: string;
  coverKey: string;
  bgmUrl: string;
  bgmEnabled: boolean;
  bgmVolume: number;
  bgmFadeMs: number;
  storyVersion: number;
  order: number;
  nodes: Node[];
};
type Validation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  nodeCount: number;
  decisionCount: number;
};

const blankNode = (type = "DIALOGUE"): Node => ({
  id: `node-${Date.now()}`,
  type,
  title: "New story node",
  text: "",
  japanese: "",
  romaji: "",
  speaker: type === "DIALOGUE" ? "Sumi" : "",
  characterKey: "SUMI",
  expressionKey: "NEUTRAL",
  secondaryCharacterKey: "HARU",
  secondaryExpressionKey: "NEUTRAL",
  backgroundKey: "station",
  audioUrl: "",
  bgmUrl: "",
  bgmEnabled: null,
  bgmVolume: null,
  bgmFadeMs: null,
  hint: "",
  hintPenalty: 0,
  characterPosition: "CENTER_RIGHT",
  secondaryCharacterPosition: "CENTER_LEFT",
  spritesVisible: type !== "NARRATION",
  tapToContinue: true,
  shuffleChoices: type === "CHOICE",
  nextNodeId: "",
  choices: [],
});

const blankChapter = (): Chapter => ({
  id: "",
  title: "New Reply Coach chapter",
  description: "",
  difficulty: "BEGINNER",
  learningObjectives: [],
  status: "DRAFT",
  startNodeId: "",
  coverKey: "station",
  bgmUrl: "bundled:calm",
  bgmEnabled: true,
  bgmVolume: 0.1,
  bgmFadeMs: 700,
  storyVersion: 2,
  order: 1,
  nodes: [],
});

export default function AdminQuackResponsePage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [uploadingBgm, setUploadingBgm] = useState(false);

  const node = useMemo(
    () => chapter?.nodes.find((item) => item.id === selectedNode) ?? null,
    [chapter, selectedNode],
  );

  useEffect(() => {
    void load();
  }, []);

  const load = async (selectId?: string) => {
    try {
      const response = await fetch(`${API_URL}/api/reply-coach/chapters?publishedOnly=false`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = (await response.json()) as Chapter[];
      setChapters(data);
      const next = data.find((item) => item.id === selectId)
        ?? data.find((item) => item.id === chapter?.id)
        ?? data[0]
        ?? null;
      setChapter(next ? structuredClone(next) : null);
      setSelectedNode(next?.nodes[0]?.id ?? null);
      setMessage("");
    } catch {
      setMessage(`Reply Coach chapters could not load from ${API_URL}.`);
    }
  };

  const updateChapter = <K extends keyof Chapter>(key: K, value: Chapter[K]) => {
    if (!chapter) return;
    setChapter({ ...chapter, [key]: value });
    setValidation(null);
  };

  const updateNode = <K extends keyof Node>(key: K, value: Node[K]) => {
    if (!chapter || !node) return;
    setChapter({
      ...chapter,
      nodes: chapter.nodes.map((item) =>
        item.id === node.id ? { ...item, [key]: value } : item,
      ),
    });
    setValidation(null);
  };

  const updateChoice = <K extends keyof Choice>(index: number, key: K, value: Choice[K]) => {
    if (!node) return;
    updateNode(
      "choices",
      node.choices.map((choice, choiceIndex) =>
        choiceIndex === index ? { ...choice, [key]: value } : choice,
      ),
    );
  };

  const addNode = (type: string) => {
    if (!chapter) return;
    const created = blankNode(type);
    const nodes = [...chapter.nodes, created];
    setChapter({
      ...chapter,
      nodes,
      startNodeId: chapter.startNodeId || created.id,
    });
    setSelectedNode(created.id);
  };

  const duplicateNode = () => {
    if (!chapter || !node) return;
    const copy: Node = {
      ...structuredClone(node),
      id: `${node.id}-copy-${Date.now()}`,
      title: `${node.title} copy`,
      choices: node.choices.map((choice, index) => ({
        ...choice,
        id: `${choice.id}-copy-${index}-${Date.now()}`,
      })),
    };
    const index = chapter.nodes.findIndex((item) => item.id === node.id);
    const nodes = [...chapter.nodes];
    nodes.splice(index + 1, 0, copy);
    setChapter({ ...chapter, nodes });
    setSelectedNode(copy.id);
  };

  const moveNode = (direction: -1 | 1) => {
    if (!chapter || !node) return;
    const current = chapter.nodes.findIndex((item) => item.id === node.id);
    const target = current + direction;
    if (target < 0 || target >= chapter.nodes.length) return;
    const nodes = [...chapter.nodes];
    [nodes[current], nodes[target]] = [nodes[target], nodes[current]];
    setChapter({ ...chapter, nodes });
  };

  const removeNode = () => {
    if (!chapter || !node) return;
    if (!window.confirm(`Delete node “${node.title || node.id}”?`)) return;
    const nodes = chapter.nodes.filter((item) => item.id !== node.id);
    setChapter({
      ...chapter,
      nodes,
      startNodeId: chapter.startNodeId === node.id ? nodes[0]?.id ?? "" : chapter.startNodeId,
    });
    setSelectedNode(nodes[0]?.id ?? null);
  };

  const addChoice = () => {
    if (!node) return;
    updateNode("choices", [
      ...node.choices,
      {
        id: `choice-${Date.now()}`,
        text: "",
        japanese: "",
        romaji: "",
        evaluation: "ACCEPTABLE",
        points: 4,
        explanation: "",
        culturalNote: "",
        reactionText: "",
        reactionCharacterKey: "SUMI",
        reactionExpressionKey: "NEUTRAL",
        nextNodeId: "",
      },
    ]);
  };

  const validate = async () => {
    if (!chapter?.id) {
      setMessage("Save the draft once before running server validation.");
      return null;
    }
    const response = await fetch(`${API_URL}/api/reply-coach/chapters/${chapter.id}/validate`, {
      method: "POST",
    });
    const report = (await response.json()) as Validation;
    setValidation(report);
    return report;
  };

  const save = async (status = chapter?.status) => {
    if (!chapter || !status) return;
    setBusy(true);
    setMessage("");
    try {
      const payload = { ...chapter, status };
      const response = await fetch(
        `${API_URL}/api/reply-coach/chapters${chapter.id ? `/${chapter.id}` : ""}`,
        {
          method: chapter.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setValidation(data as Validation);
        throw new Error("The chapter has critical story-graph errors and cannot be published.");
      }
      setMessage(status === "PUBLISHED" ? "Chapter published for students." : "Chapter saved successfully.");
      await load(data.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chapter could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const removeChapter = async () => {
    if (!chapter?.id || !window.confirm(`Permanently delete “${chapter.title}”? Hiding is safer.`)) return;
    await fetch(`${API_URL}/api/reply-coach/chapters/${chapter.id}`, { method: "DELETE" });
    await load();
  };

  const uploadBgm = async (file: File, target: "chapter" | "node") => {
    setUploadingBgm(true);
    setMessage("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(`${API_URL}/api/reply-coach/media`, {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "BGM upload failed.");
      if (target === "chapter") updateChapter("bgmUrl", data.url);
      else updateNode("bgmUrl", data.url);
      setMessage("Background music uploaded. Save the chapter to apply it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "BGM upload failed.");
    } finally {
      setUploadingBgm(false);
    }
  };

  return (
    <main className="reply-studio">
      <header className="reply-studio-hero">
        <div>
          <small>INTERACTIVE STORY STUDIO</small>
          <h1>Reply Coach chapters</h1>
          <p>Create connected visual-novel journeys with narration, dialogue, cultural coaching, choices, branches, and merge points.</p>
        </div>
        <div className="reply-hero-actions">
          <button className="soft-button" onClick={() => { setChapter(blankChapter()); setSelectedNode(null); }}>
            <Plus /> New chapter
          </button>
          <button className="primary-button" disabled={!chapter || busy} onClick={() => void save()}>
            <Save /> {busy ? "Saving..." : "Save changes"}
          </button>
        </div>
      </header>

      {message && <p className="bank-status">{message}</p>}

      <section className="reply-studio-shell">
        <aside className="reply-chapter-list">
          <div className="reply-panel-heading">
            <span>CHAPTERS</span>
            <b>{chapters.length}</b>
          </div>
          {chapters.map((item) => (
            <button
              key={item.id}
              className={chapter?.id === item.id ? "active" : ""}
              onClick={() => { setChapter(structuredClone(item)); setSelectedNode(item.nodes[0]?.id ?? null); setValidation(null); }}
            >
              <span className={`chapter-status ${item.status.toLowerCase()}`} />
              <div>
                <b>{item.title}</b>
                <small>{item.status} · {item.nodes.length} nodes</small>
              </div>
            </button>
          ))}
        </aside>

        {!chapter ? (
          <section className="reply-empty-studio">
            <BookOpen />
            <h2>Create your first story chapter</h2>
            <p>Build a connected beginning, middle, and ending without changing the mobile app source code.</p>
          </section>
        ) : (
          <section className="reply-workspace">
            <div className="reply-meta-card">
              <div className="reply-section-title">
                <div><small>CHAPTER SETTINGS</small><h2>{chapter.title}</h2></div>
                <div className="reply-publish-actions">
                  <button className="soft-button" onClick={() => void validate()}><TriangleAlert /> Validate</button>
                  <button className="soft-button" onClick={() => setPreview(true)}><Eye /> Preview</button>
                  <select value={chapter.status} onChange={(event) => updateChapter("status", event.target.value as Chapter["status"])}>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="HIDDEN">Hidden</option>
                  </select>
                  <button className="primary-button" onClick={() => void save(chapter.status)}>Apply status</button>
                </div>
              </div>
              <div className="reply-meta-grid">
                <label>Chapter title<input value={chapter.title} onChange={(event) => updateChapter("title", event.target.value)} /></label>
                <label>Difficulty<select value={chapter.difficulty} onChange={(event) => updateChapter("difficulty", event.target.value)}><option>BEGINNER</option><option>INTERMEDIATE</option><option>ADVANCED</option><option>BEGINNER_TO_INTERMEDIATE</option></select></label>
                <label>Story order<input type="number" min="1" value={chapter.order} onChange={(event) => updateChapter("order", Number(event.target.value))} /></label>
                <label>Cover/background key<input value={chapter.coverKey} onChange={(event) => updateChapter("coverKey", event.target.value)} /></label>
                <label>Default BGM URL<input value={chapter.bgmUrl || ""} onChange={(event) => updateChapter("bgmUrl", event.target.value)} placeholder="bundled:calm or uploaded media URL" /></label>
                <label>Upload chapter BGM<input type="file" accept="audio/*" disabled={uploadingBgm} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadBgm(file, "chapter"); }} /></label>
                <label>Default BGM volume<input type="number" min="0" max="0.35" step="0.01" value={chapter.bgmVolume ?? 0.1} onChange={(event) => updateChapter("bgmVolume", Number(event.target.value))} /></label>
                <label>Music crossfade (ms)<input type="number" min="0" max="5000" step="100" value={chapter.bgmFadeMs ?? 700} onChange={(event) => updateChapter("bgmFadeMs", Number(event.target.value))} /></label>
                <label className="inline-check"><input type="checkbox" checked={chapter.bgmEnabled} onChange={(event) => updateChapter("bgmEnabled", event.target.checked)} /> Enable chapter background music</label>
                <label className="wide">Description<textarea value={chapter.description} onChange={(event) => updateChapter("description", event.target.value)} /></label>
                <label>Start node<select value={chapter.startNodeId} onChange={(event) => updateChapter("startNodeId", event.target.value)}><option value="">Select...</option>{chapter.nodes.map((item) => <option key={item.id}>{item.id}</option>)}</select></label>
                <label className="wide">Learning objectives<textarea value={chapter.learningObjectives.join("\n")} onChange={(event) => updateChapter("learningObjectives", event.target.value.split("\n").filter(Boolean))} placeholder="One objective per line" /></label>
              </div>
            </div>

            {validation && (
              <div className={`reply-validation ${validation.valid ? "valid" : "invalid"}`}>
                {validation.valid ? <CheckCircle2 /> : <TriangleAlert />}
                <div>
                  <b>{validation.valid ? "Story graph is publishable" : "Fix critical story connections"}</b>
                  <span>{validation.nodeCount} nodes · {validation.decisionCount} decisions</span>
                  {validation.errors.map((error) => <p key={error}>{error}</p>)}
                  {validation.warnings.map((warning) => <p key={warning}>Warning: {warning}</p>)}
                </div>
              </div>
            )}

            <div className="reply-graph-layout">
              <aside className="reply-node-list">
                <div className="reply-panel-heading"><span>STORY FLOW</span><b>{chapter.nodes.length}</b></div>
                <div className="node-add-row">
                  {["NARRATION", "DIALOGUE", "CHOICE", "REACTION", "CULTURAL_NOTE", "ENDING"].map((type) => (
                    <button key={type} onClick={() => addNode(type)} title={`Add ${type.toLowerCase()}`}><Plus />{type.replace("_", " ")}</button>
                  ))}
                </div>
                <div className="node-flow">
                  {chapter.nodes.map((item, index) => (
                    <button key={item.id} className={selectedNode === item.id ? "active" : ""} onClick={() => setSelectedNode(item.id)}>
                      <span className={`node-type node-${item.type.toLowerCase()}`}>{item.type.replace("_", " ")}</span>
                      <b>{item.title || item.speaker || item.id}</b>
                      <small>{item.id}</small>
                      {index < chapter.nodes.length - 1 && <GitBranch className="flow-connector" />}
                    </button>
                  ))}
                </div>
              </aside>

              <section className="reply-node-editor">
                {!node ? <div className="response-empty"><GitBranch /><h3>Select or add a story node</h3></div> : (
                  <>
                    <div className="reply-section-title">
                      <div><small>{node.type.replace("_", " ")}</small><h2>{node.title || node.id}</h2></div>
                      <div className="node-tools">
                        <button onClick={() => moveNode(-1)}><ArrowUp /></button>
                        <button onClick={() => moveNode(1)}><ArrowDown /></button>
                        <button onClick={duplicateNode}><Copy /></button>
                        <button className="delete" onClick={removeNode}><Trash2 /></button>
                      </div>
                    </div>
                    <div className="reply-meta-grid">
                      <label>Node ID<input value={node.id} readOnly title="Node IDs stay fixed so existing branch connections remain valid." /></label>
                      <label>Node type<select value={node.type} onChange={(event) => updateNode("type", event.target.value)}>{["NARRATION", "DIALOGUE", "CHOICE", "REACTION", "CULTURAL_NOTE", "ENDING"].map((type) => <option key={type}>{type}</option>)}</select></label>
                      <label>Title / location<input value={node.title || ""} onChange={(event) => updateNode("title", event.target.value)} /></label>
                      <label>Background key<input value={node.backgroundKey || ""} onChange={(event) => updateNode("backgroundKey", event.target.value)} /></label>
                      <label className="wide">Narration / dialogue / prompt<textarea value={node.text || ""} onChange={(event) => updateNode("text", event.target.value)} /></label>
                      {!['NARRATION', 'CULTURAL_NOTE', 'ENDING'].includes(node.type) && <>
                        <label>Speaker<input value={node.speaker || ""} onChange={(event) => updateNode("speaker", event.target.value)} /></label>
                        <label>Primary character<select value={node.characterKey || "SUMI"} onChange={(event) => updateNode("characterKey", event.target.value)}><option>SUMI</option><option>HARU</option></select></label>
                        <label>Expression<select value={node.expressionKey || "NEUTRAL"} onChange={(event) => updateNode("expressionKey", event.target.value)}>{["NEUTRAL","SPEAKING","SMILE","HAPPY","SURPRISED","CONFUSED","WORRIED","SAD","EMBARRASSED","ANNOYED","ANGRY","SERIOUS","CORRECT","WRONG"].map((expression) => <option key={expression}>{expression}</option>)}</select></label>
                        <label>Secondary character<select value={node.secondaryCharacterKey || "HARU"} onChange={(event) => updateNode("secondaryCharacterKey", event.target.value)}><option>SUMI</option><option>HARU</option></select></label>
                        <label>Primary position<select value={node.characterPosition || "CENTER_RIGHT"} onChange={(event) => updateNode("characterPosition", event.target.value)}>{["LEFT","CENTER_LEFT","CENTER","CENTER_RIGHT","RIGHT"].map((position) => <option key={position}>{position}</option>)}</select></label>
                        <label>Secondary position<select value={node.secondaryCharacterPosition || "CENTER_LEFT"} onChange={(event) => updateNode("secondaryCharacterPosition", event.target.value)}>{["LEFT","CENTER_LEFT","CENTER","CENTER_RIGHT","RIGHT"].map((position) => <option key={position}>{position}</option>)}</select></label>
                        <label>Japanese<input lang="ja" value={node.japanese || ""} onChange={(event) => updateNode("japanese", event.target.value)} /></label>
                        <label>Romaji<input value={node.romaji || ""} onChange={(event) => updateNode("romaji", event.target.value)} /></label>
                      </>}
                      <label>Optional audio URL<input value={node.audioUrl || ""} onChange={(event) => updateNode("audioUrl", event.target.value)} placeholder="Stored now; playback can be enabled later" /></label>
                      <label>Scene BGM override<input value={node.bgmUrl || ""} onChange={(event) => updateNode("bgmUrl", event.target.value)} placeholder="Leave empty to keep chapter music" /></label>
                      <label>Upload scene BGM<input type="file" accept="audio/*" disabled={uploadingBgm} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadBgm(file, "node"); }} /></label>
                      <label>Scene volume<input type="number" min="0" max="0.35" step="0.01" value={node.bgmVolume ?? ""} onChange={(event) => updateNode("bgmVolume", event.target.value === "" ? null : Number(event.target.value))} placeholder="Use chapter volume" /></label>
                      <label>Scene crossfade (ms)<input type="number" min="0" max="5000" step="100" value={node.bgmFadeMs ?? ""} onChange={(event) => updateNode("bgmFadeMs", event.target.value === "" ? null : Number(event.target.value))} placeholder="Use chapter fade" /></label>
                      <label className="inline-check"><input type="checkbox" checked={node.bgmEnabled !== false} onChange={(event) => updateNode("bgmEnabled", event.target.checked)} /> Music enabled for this scene</label>
                      {node.type !== "CHOICE" && node.type !== "ENDING" && <label>Next node<select value={node.nextNodeId || ""} onChange={(event) => updateNode("nextNodeId", event.target.value)}><option value="">Select destination...</option>{chapter.nodes.filter((item) => item.id !== node.id).map((item) => <option key={item.id}>{item.id}</option>)}</select></label>}
                    </div>

                    {node.type === "CHOICE" && (
                      <div className="choice-graph-editor">
                        <div className="reply-panel-heading"><span>RESPONSE BRANCHES</span><button onClick={addChoice}><Plus /> Add response</button></div>
                        <label className="inline-check"><input type="checkbox" checked={node.shuffleChoices} onChange={(event) => updateNode("shuffleChoices", event.target.checked)} /> Shuffle response positions without changing story order</label>
                        <div className="reply-meta-grid">
                          <label className="wide">Decision hint<textarea value={node.hint || ""} onChange={(event) => updateNode("hint", event.target.value)} placeholder="Guide the learner without revealing the answer." /></label>
                          <label>Hint score adjustment<input type="number" min="0" max="5" value={node.hintPenalty || 0} onChange={(event) => updateNode("hintPenalty", Number(event.target.value))} /></label>
                        </div>
                        {node.choices.map((choice, index) => (
                          <article key={choice.id} className={`choice-branch choice-${choice.evaluation.toLowerCase()}`}>
                            <div className="choice-branch-head">
                              <b>{String.fromCharCode(65 + index)}</b>
                              <input value={choice.id} onChange={(event) => updateChoice(index, "id", event.target.value)} />
                              <select value={choice.evaluation} onChange={(event) => updateChoice(index, "evaluation", event.target.value as Choice["evaluation"])}><option>BEST</option><option>ACCEPTABLE</option><option>AWKWARD</option><option>IMPOLITE</option><option>RUDE</option></select>
                              <input type="number" min="0" max="5" value={choice.points} onChange={(event) => updateChoice(index, "points", Number(event.target.value))} />
                              <button onClick={() => updateNode("choices", node.choices.filter((_, choiceIndex) => choiceIndex !== index))}><Trash2 /></button>
                            </div>
                            <div className="reply-meta-grid">
                              <label>Japanese<input lang="ja" value={choice.japanese} onChange={(event) => updateChoice(index, "japanese", event.target.value)} /></label>
                              <label>Romaji<input value={choice.romaji} onChange={(event) => updateChoice(index, "romaji", event.target.value)} /></label>
                              <label className="wide">English meaning<input value={choice.text} onChange={(event) => updateChoice(index, "text", event.target.value)} /></label>
                              <label className="wide">Character reaction<textarea value={choice.reactionText} onChange={(event) => updateChoice(index, "reactionText", event.target.value)} /></label>
                              <label className="wide">Teaching explanation<textarea value={choice.explanation} onChange={(event) => updateChoice(index, "explanation", event.target.value)} /></label>
                              <label className="wide">Cultural note<textarea value={choice.culturalNote} onChange={(event) => updateChoice(index, "culturalNote", event.target.value)} /></label>
                              <label>Reaction character<select value={choice.reactionCharacterKey} onChange={(event) => updateChoice(index, "reactionCharacterKey", event.target.value)}><option>SUMI</option><option>HARU</option></select></label>
                              <label>Destination node<select value={choice.nextNodeId} onChange={(event) => updateChoice(index, "nextNodeId", event.target.value)}><option value="">Select destination...</option>{chapter.nodes.filter((item) => item.id !== node.id).map((item) => <option key={item.id}>{item.id}</option>)}</select></label>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
            <button className="danger-link" onClick={removeChapter}><Trash2 /> Permanently delete chapter</button>
          </section>
        )}
      </section>

      {preview && chapter && (
        <div className="admin-preview-overlay" onClick={() => setPreview(false)}>
          <div className="admin-story-preview" onClick={(event) => event.stopPropagation()}>
            <button className="preview-close" onClick={() => setPreview(false)}>×</button>
            <small>ADMIN STORY PREVIEW</small>
            <h2>{chapter.title}</h2>
            <p>{chapter.description}</p>
            <div className="preview-flow">
              {chapter.nodes.slice(0, 12).map((item) => <span key={item.id}>{item.type}<b>{item.title || item.speaker}</b></span>)}
            </div>
            <p>Use Preview to inspect pacing and the graph validator before publishing. The student app renders the complete sprite and background experience.</p>
          </div>
        </div>
      )}
    </main>
  );
}
