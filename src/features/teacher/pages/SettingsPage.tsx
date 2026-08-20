import { Bell, Globe2, Moon, ShieldCheck } from "lucide-react";
import { useState } from "react";
import PageHeader from "../components/PageHeader";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [compact, setCompact] = useState(false);

  return (
    <section className="full-panel">
      <PageHeader
        eyebrow="PORTAL PREFERENCES"
        title="Settings"
        description="Manage local teacher portal display and notification preferences."
      />
      <div className="settings-list">
        <article>
          <span>
            <Bell />
          </span>
          <div>
            <b>Teacher notifications</b>
            <small>Show updates for classes, assignments, and reports.</small>
          </div>
          <button
            className={notifications ? "toggle on" : "toggle"}
            onClick={() => setNotifications(!notifications)}
          >
            <i />
          </button>
        </article>
        <article>
          <span>
            <Moon />
          </span>
          <div>
            <b>Compact workspace</b>
            <small>Reduce spacing for larger classroom data tables.</small>
          </div>
          <button
            className={compact ? "toggle on" : "toggle"}
            onClick={() => setCompact(!compact)}
          >
            <i />
          </button>
        </article>
        <article>
          <span>
            <Globe2 />
          </span>
          <div>
            <b>Portal language</b>
            <small>English interface with Japanese learning terminology.</small>
          </div>
          <b>English</b>
        </article>
        <article>
          <span>
            <ShieldCheck />
          </span>
          <div>
            <b>Account security</b>
            <small>
              Authentication is verified through the existing Spring Boot user
              service.
            </small>
          </div>
          <b>Protected</b>
        </article>
      </div>
    </section>
  );
}
