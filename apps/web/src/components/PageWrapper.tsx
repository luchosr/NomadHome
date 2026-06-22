import type { ReactNode } from "react";

export function PageWrapper({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>;
}
