import type { ReactNode } from "react";

interface Props {
  labelledBy: string;
  children: ReactNode;
}

export function Modal({ labelledBy, children }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div className="mx-4 w-full max-w-md rounded-card border-2 border-border bg-surface-raised p-6">
        {children}
      </div>
    </div>
  );
}
