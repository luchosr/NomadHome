import type { ReactNode } from "react";

interface Props {
  labelledBy: string;
  children: ReactNode;
}

export function Modal({ labelledBy, children }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div className="mx-4 w-full max-w-md rounded-card bg-elevated p-6 shadow-md">{children}</div>
    </div>
  );
}
