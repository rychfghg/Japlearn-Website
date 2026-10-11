import { FormEvent, useEffect, useState } from "react";
import { Edit3, Plus, Save, Trash2, X } from "lucide-react";
import { API_URL, portalFetch as fetch } from "../../../lib/api";
import { confirmAction } from "../../../lib/confirmAction";

type Word = { id: string; romajiWord: string; description: string };

// The romaji tiles the Quackman game can show (same list as the app and the server).
const SYLLABLES = new Set([
  "a", "i", "u", "e", "o", "ka", "ki", "ku", "ke", "ko", "sa", "shi", "su", "se", "so", "ta", "chi", "tsu", "te", "to",
  "na", "ni", "nu", "ne", "no", "ha", "hi", "fu", "he", "ho", "ma", "mi", "mu", "me", "mo", "ya", "yu", "yo", "ra", "ri",
  "ru", "re", "ro", "wa", "wo", "n", "ga", "gi", "gu", "ge", "go", "za", "ji", "zu", "ze", "zo", "da", "de",
  "do", "ba", "bi", "bu", "be", "bo", "pa", "pi", "pu", "pe", "po",
]);
const MAX_HINT = 140;

/** Splits a romaji word into game tiles, or returns null if a part cannot be spelled. */
function toTiles(word: string): string[] | null {
  const w = word.trim().toLowerCase();
  if (!/^[a-z]+$/.test(w)) return null;
  const tiles: string[] = [];
  for (let i = 0; i < w.length; ) {
    let found = false;
    for (let len = 3; len > 0 && !found; len--) {
      const part = w.slice(i, i + len);
      if (part.length === len && SYLLABLES.has(part)) { tiles.push(part); i += len; found = true; }
    }
    if (!found) return null;
  }
  return tiles;
}

const empty = { romajiWord: "", description: "" };

export default function AdminQuackmanPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const response = await fetch(`${API_URL}/api/quackmancontent`);
      if (!response.ok) throw new Error();
      setWords(await response.json());
    } catch {
      setMessage("The Quackman words could not be loaded. Check that the backend is running, then refresh.");
    }
  };
  useEffect(() => { void load(); }, []);

  const tiles = toTiles(form.romajiWord);
  const hintLength = form.description.trim().length;

  const resetForm = () => { setForm(empty); setEditingId(null); };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!tiles) { setMessage("Use romaji letters that match the game tiles (for example sa-ku-ra). Combined sounds like kyo or sha are not available."); return; }
    if (tiles.length < 2 || tiles.length > 8) { setMessage("Words must have 2 to 8 syllables."); return; }
    if (!hintLength) { setMessage("Please write a hint."); return; }
    if (hintLength > MAX_HINT) { setMessage(`Keep the hint under ${MAX_HINT} characters so it fits the game screen.`); return; }
    setSaving(true);
    try {
      const response = await fetch(editingId ? `${API_URL}/api/quackmancontent/${editingId}` : `${API_URL}/api/quackmancontent`, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ romajiWord: form.romajiWord.trim().toLowerCase(), description: form.description.trim() }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "The word could not be saved.");
      setMessage(editingId ? "Word updated. Students see it the next time they play." : "Word added. Students see it the next time they play.");
      resetForm();
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The word could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (word: Word) => {
    setEditingId(word.id);
    setForm({ romajiWord: word.romajiWord, description: word.description });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (word: Word) => {
    if (!await confirmAction(`Delete "${word.romajiWord}" from Quackman?`, { confirmLabel: "Delete word", description: "Students will no longer get this word in the game." })) return;
    const response = await fetch(`${API_URL}/api/quackmancontent/${word.id}`, { method: "DELETE" });
    setMessage(response.ok ? "Word deleted." : "The word could not be deleted.");
    if (editingId === word.id) resetForm();
    await load();
  };

  return (
    <main className="admin-question-page">
      <header>
        <div>
          <small>GAME CONTENT</small>
          <h1>Quackman words</h1>
          <p>Add, edit, or remove the words and hints students guess in Quackman. Words appear in a random order each game.</p>
        </div>
        <div className="bank-summary"><b>{words.length}</b><span>Words in the game</span></div>
      </header>

      <form className="admin-question-form" onSubmit={save}>
        <div className="form-title-row">
          <h2>{editingId ? <Edit3 /> : <Plus />}{editingId ? "Edit word" : "Add a word"}</h2>
          {editingId && <button type="button" className="soft-button" onClick={resetForm}><X size={16} />Cancel edit</button>}
        </div>
        <div className="form-grid">
          <label>Word in romaji
            <input required value={form.romajiWord} maxLength={24} placeholder="sakura"
              onChange={(event) => setForm({ ...form, romajiWord: event.target.value.toLowerCase().replace(/[^a-z]/g, "") })} />
          </label>
          <label>Game tiles
            <div className="tile-preview">{tiles ? tiles.map((tile, index) => <span key={`${tile}-${index}`}>{tile}</span>) : form.romajiWord ? <span>Not playable with the game tiles</span> : <span>Type a word</span>}</div>
          </label>
          <label className="wide">Hint shown to students ({hintLength}/{MAX_HINT})
            <textarea required value={form.description} maxLength={MAX_HINT} placeholder="Pink flowers that bloom in Japan every spring."
              onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
        </div>
        {message && <p className="bank-status">{message}</p>}
        <button className="primary-button" type="submit" disabled={saving}>
          <Save size={17} />{saving ? "Saving..." : editingId ? "Save changes" : "Add word"}
        </button>
      </form>

      <div className="admin-question-list">
        {words.map((word) => (
          <article key={word.id}>
            <div>
              <small>{(toTiles(word.romajiWord) ?? []).length} syllables · {word.description.length} characters</small>
              <h3>{word.romajiWord}</h3>
              <div className="tile-preview">{(toTiles(word.romajiWord) ?? [word.romajiWord]).map((tile, index) => <span key={`${tile}-${index}`}>{tile}</span>)}</div>
              <em>{word.description}</em>
            </div>
            <div className="question-actions">
              <button onClick={() => edit(word)}><Edit3 size={15} />Edit</button>
              <button className="delete" aria-label={`Delete ${word.romajiWord}`} onClick={() => void remove(word)}><Trash2 size={16} /></button>
            </div>
          </article>
        ))}
        {!words.length && <article><div><h3>No words yet</h3><em>Add the first Quackman word above.</em></div></article>}
      </div>
    </main>
  );
}
