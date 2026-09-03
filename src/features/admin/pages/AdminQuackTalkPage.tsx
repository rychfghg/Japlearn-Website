import { Headphones, Mic2, Radio, TimerReset } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../../lib/api";
import type { QuackTalkSession } from "../../teacher/types";
import AdminGuidedPracticeManager from "./AdminGuidedPracticeManager";

export default function AdminQuackTalkPage() {
  const [sessions, setSessions] = useState<QuackTalkSession[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/quackTalkSessions/all`)
      .then((response) => {
        if (!response.ok) {
          throw new Error();
        }

        return response.json();
      })
      .then(setSessions)
      .catch(() => setError("Speaking practice records could not be loaded."));
  }, []);

  const visibleSessions = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return sessions;
    }

    return sessions.filter((session) =>
      `${session.name} ${session.email} ${session.roomType}`
        .toLowerCase()
        .includes(search),
    );
  }, [query, sessions]);

  const totalSeconds = sessions.reduce(
    (total, session) => total + session.durationSeconds,
    0,
  );

  return (
    <div className="admin-talk-page">
      <header className="admin-talk-header">
        <div>
          <small>SUMI SPEAKING ROOMS</small>
          <h1>QuackTalk practice monitor</h1>
          <p>
            Review real microphone practice without assigning an artificial
            score before voice evaluation is available.
          </p>
        </div>
        <div className="admin-talk-live">
          <Radio />
          Practice records
        </div>
      </header>

      <div className="admin-talk-stats">
        <article>
          <Mic2 />
          <div>
            <b>{sessions.length}</b>
            <span>Saved sessions</span>
          </div>
        </article>
        <article>
          <TimerReset />
          <div>
            <b>{Math.round(totalSeconds / 60)}</b>
            <span>Practice minutes</span>
          </div>
        </article>
        <article>
          <Headphones />
          <div>
            <b>{sessions.filter((session) => session.evaluated).length}</b>
            <span>Evaluated sessions</span>
          </div>
        </article>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <AdminGuidedPracticeManager />

      <section className="admin-talk-records">
        <div className="admin-talk-toolbar">
          <div>
            <small>SPEAKING HISTORY</small>
            <h2>Student practice sessions</h2>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search student or room..."
          />
        </div>
        <div className="admin-talk-row headings">
          <span>Student</span>
          <span>Room</span>
          <span>Language</span>
          <span>Duration</span>
          <span>Result</span>
        </div>
        {visibleSessions.map((session) => (
          <div className="admin-talk-row" key={session.id}>
            <span>
              <b>{session.name || "Student"}</b>
              <small>{session.email}</small>
            </span>
            <span>{session.roomType.replaceAll("_", " ")}</span>
            <span>{session.language}</span>
            <span>
              {Math.floor(session.durationSeconds / 60)}m{" "}
              {session.durationSeconds % 60}s
            </span>
            <i>
              {session.evaluated && session.score != null
                ? `${session.score}%`
                : "Practice only"}
            </i>
          </div>
        ))}
        {!visibleSessions.length && !error && (
          <p className="admin-talk-empty">
            No speaking practice has been recorded yet.
          </p>
        )}
      </section>
    </div>
  );
}
