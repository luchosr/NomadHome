import { Link } from "react-router-dom";
import { Button } from "@nomadhome/ui";

interface Props {
  message: string;
  ctaLabel?: string;
  ctaTo?: string;
}

/** Bare-message placeholder for an empty list, with an optional next-step CTA. */
export function EmptyState({ message, ctaLabel, ctaTo }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 border-2 border-dashed border-border bg-surface-raised px-6 py-12 text-center">
      <svg
        aria-hidden="true"
        focusable={false}
        className="h-8 w-8 text-fg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="square"
        strokeLinejoin="miter"
      >
        <path d="M4 6H20V20H4ZM4 12H20M8 3V8M16 3V8" />
      </svg>
      <p className="m-0 min-w-0 break-words text-fg-muted">{message}</p>
      {ctaLabel && ctaTo && (
        <Link to={ctaTo}>
          <Button variant="secondary">{ctaLabel}</Button>
        </Link>
      )}
    </div>
  );
}
