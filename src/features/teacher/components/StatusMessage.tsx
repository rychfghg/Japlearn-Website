import type { ReactNode } from "react";

type Props = {
  type?: "error" | "success";
  children: ReactNode;
};

export default function StatusMessage({ type = "error", children }: Props) {
  return <div className={`dashboard-error ${type}`}>{children}</div>;
}
