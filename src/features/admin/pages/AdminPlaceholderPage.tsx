import { ShieldCheck } from "lucide-react";

export default function AdminPlaceholderPage() {
  return (
    <main className="admin-hold">
      <ShieldCheck size={42} />
      <h1>Admin workspace</h1>
      <p>
        The administration dashboard is reserved for the next development phase.
      </p>
    </main>
  );
}
