import { GitBranch, MessageCircleQuestion, TimerReset } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

export default function AdminQuackResponseShell() {
  return (
    <main className="quackresponse-admin-shell">
      <nav className="quackresponse-subnav" aria-label="QuackResponse games">
        <NavLink to="reply-coach"><MessageCircleQuestion />Reply Coach</NavLink>
        <NavLink to="response-rush"><TimerReset />Response Rush</NavLink>
        <NavLink to="dialogue-relay"><GitBranch />Dialogue Relay</NavLink>
      </nav>
      <Outlet />
    </main>
  );
}
