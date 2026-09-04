import { ArrowRight, Check, Eye, GraduationCap, Languages, LayoutPanelTop, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const SETTINGS_KEY = "japlearn_teacher_preferences";
type TeacherPreferences = { compact: boolean; reducedMotion: boolean; helpfulTips: boolean };
const defaults: TeacherPreferences = { compact: false, reducedMotion: false, helpfulTips: true };

function loadPreferences(): TeacherPreferences {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; }
  catch { return defaults; }
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState(loadPreferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences));
    document.body.classList.toggle("teacher-compact", preferences.compact);
    document.body.classList.toggle("teacher-reduced-motion", preferences.reducedMotion);
    document.body.classList.toggle("teacher-hide-tips", !preferences.helpfulTips);
    setSaved(true);
    const timer = window.setTimeout(() => setSaved(false), 1400);
    return () => window.clearTimeout(timer);
  }, [preferences]);

  const toggle = (key: keyof TeacherPreferences) => setPreferences((current) => ({ ...current, [key]: !current[key] }));
  const reset = () => setPreferences(defaults);

  return (
    <section className="teacher-settings-page">
      <header className="settings-hero">
        <div><span><Sparkles /> YOUR WORKSPACE</span><h2>Make JapLearn feel right for you.</h2><p>Adjust how your teacher workspace looks and moves. Changes apply immediately and are remembered on this device.</p></div>
        <div className="settings-hero-mark" aria-hidden="true"><span>設</span><b>定</b></div>
      </header>

      <div className="settings-layout">
        <main className="settings-content-card">
          <header><div><small>DISPLAY & EXPERIENCE</small><h3>Workspace preferences</h3></div>{saved && <span className="settings-saved"><Check /> Saved</span>}</header>
          <div className="settings-option-list">
            <article><span className="settings-option-icon violet"><LayoutPanelTop /></span><div><b>Compact workspace</b><small>Use tighter spacing to fit more classroom information on screen.</small></div><div className="setting-control"><em>{preferences.compact ? "On" : "Off"}</em><button type="button" role="switch" aria-checked={preferences.compact} aria-label="Compact workspace" className={preferences.compact ? "toggle on" : "toggle"} onClick={() => toggle("compact")}><i /></button></div></article>
            <article><span className="settings-option-icon green"><Eye /></span><div><b>Reduce motion</b><small>Minimize hover movement and transitions throughout the teacher portal.</small></div><div className="setting-control"><em>{preferences.reducedMotion ? "On" : "Off"}</em><button type="button" role="switch" aria-checked={preferences.reducedMotion} aria-label="Reduce motion" className={preferences.reducedMotion ? "toggle on" : "toggle"} onClick={() => toggle("reducedMotion")}><i /></button></div></article>
            <article><span className="settings-option-icon orange"><Sparkles /></span><div><b>Helpful guidance</b><small>Keep contextual tips visible while you manage classes and learning tools.</small></div><div className="setting-control"><em>{preferences.helpfulTips ? "On" : "Off"}</em><button type="button" role="switch" aria-checked={preferences.helpfulTips} aria-label="Helpful guidance" className={preferences.helpfulTips ? "toggle on" : "toggle"} onClick={() => toggle("helpfulTips")}><i /></button></div></article>
          </div>
          <section className="settings-language-row"><span className="settings-option-icon pink"><Languages /></span><div><b>Portal language</b><small>The teacher portal currently uses English with Japanese learning terminology.</small></div><span className="settings-language-value"><Check /> English</span></section>
          <button type="button" className="settings-reset" onClick={reset}><RotateCcw /> Restore default preferences</button>
        </main>

        <aside className="settings-side-column">
          <section className="settings-account-card"><span><ShieldCheck /></span><small>ACCOUNT & SECURITY</small><h3>Your educator account</h3><p>Review the identity connected to this teacher workspace.</p><Link to="/teacher/profile">View teacher profile <ArrowRight /></Link></section>
          <section className="settings-classroom-card"><span><GraduationCap /></span><div><small>CLASSROOM READY</small><b>Your preferences will not affect learner accounts.</b></div></section>
        </aside>
      </div>
    </section>
  );
}
