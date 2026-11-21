import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface Props {
  labelledBy: string;
  /** Called on Escape and on a backdrop click. The parent decides whether the dialog unmounts. */
  onClose: () => void;
  children: ReactNode;
}

/**
 * Native <dialog> opened with showModal(): the browser provides the focus move, Tab containment,
 * inert background and top layer. Escape and backdrop clicks only call `onClose`; the parent
 * unmounts the dialog (so a pending submit can swallow them with a noop).
 */
export function Modal({ labelledBy, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  // Captured during the first render, before showModal() (or an autoFocus) moves focus.
  const [opener] = useState(() => document.activeElement);
  // A backdrop click counts only when the press and the release both happened on the dialog itself.
  const gesture = useRef({ down: false, up: false });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const { body, documentElement: root } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const gutterBefore = window.innerWidth - root.clientWidth;
    body.style.overflow = "hidden";
    // `scrollbar-gutter: stable` (index.css) already keeps the space for native scrollbars. Where
    // the gutter does not apply (for example custom ::-webkit-scrollbar), pad by what vanished.
    const lost = gutterBefore - (window.innerWidth - root.clientWidth);
    if (lost > 0) {
      body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + lost}px`;
    }
    if (!dialog.open) dialog.showModal();
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
      if (dialog.open) dialog.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [opener]);

  return (
    <dialog
      ref={ref}
      aria-modal="true"
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onMouseDown={(e) => {
        gesture.current = { down: e.target === e.currentTarget, up: false };
      }}
      onMouseUp={(e) => {
        gesture.current.up = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        const { down, up } = gesture.current;
        gesture.current = { down: false, up: false };
        if (e.target === e.currentTarget && down && up) onClose();
      }}
      className="fixed inset-0 m-auto w-[28rem] max-w-[calc(100%-2rem)] border-0 bg-transparent p-0 text-fg backdrop-filter-none backdrop:bg-ink/40"
    >
      <div className="w-full max-w-md rounded-card border-2 border-border bg-surface-raised p-6">
        {children}
      </div>
    </dialog>
  );
}
