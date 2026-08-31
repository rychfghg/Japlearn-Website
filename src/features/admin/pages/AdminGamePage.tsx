import { Gamepad2 } from "lucide-react";

export default function AdminGamePage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="admin-page">
      <header className="admin-page-heading">
        <div>
          <small>GAME MANAGEMENT</small>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <span className="admin-status">
          <Gamepad2 />
          Connected game
        </span>
      </header>

      <section className="admin-hold">
        <Gamepad2 size={42} />
        <h2>{title} workspace</h2>
        <p>
          This main game page is ready for its dedicated content controls. Its
          existing app routes, scores, and backend services remain unchanged.
        </p>
      </section>
    </main>
  );
}
