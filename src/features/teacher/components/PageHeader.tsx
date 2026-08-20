import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: Props) {
  return (
    <header className="class-page-head">
      <div>
        <span className="section-kicker">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}
