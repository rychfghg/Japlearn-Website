import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { ShieldAlert, X } from "lucide-react"; 




type Options = { confirmLabel?: string; description?: string };
let pending: Promise<boolean> | null = null;

function Confirmation({ title, options, finish }: { title: string; options: Options; finish: (answer: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => { dialog.current?.showModal(); cancel.current?.focus(); }, []);
  return <dialog ref={dialog} className="portal-confirm" aria-labelledby="portal-confirm-title" aria-describedby="portal-confirm-description"
    onCancel={(event) => { event.preventDefault(); finish(false); }}>
    <button className="portal-confirm-close" aria-label="Cancel" onClick={() => finish(false)}><X size={19} /></button>
    <span className="portal-confirm-icon"><ShieldAlert size={28} /></span>
    <h2 id="portal-confirm-title">{title}</h2>
    <p id="portal-confirm-description">{options.description || "Please review this change before continuing. Cancel to keep everything as it is."}</p>
    <div className="portal-confirm-actions"><button ref={cancel} onClick={() => finish(false)}>Cancel</button>
      <button className="portal-confirm-accept" onClick={() => finish(true)}>{options.confirmLabel || "Confirm change"}</button></div>
  </dialog>;
}

/** One confirmation at a time; native dialog supplies focus trapping and Escape handling. */
export function confirmAction(title: string, options: Options = {}): Promise<boolean> {
  if (pending) return Promise.resolve(false);
  const previousFocus = document.activeElement;
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  pending = new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (answer: boolean) => {
      if (settled) return;
      settled = true;
      resolve(answer);
      window.setTimeout(() => { root.unmount(); host.remove(); pending = null;
        if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus(); }, 0);
    };
    root.render(<Confirmation title={title} options={options} finish={finish} />);
  });
  return pending;
}
