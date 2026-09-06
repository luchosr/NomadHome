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
    <div className="flex flex-col items-center gap-4 rounded-xl border border-subtle bg-elevated px-6 py-12 text-center">
      <svg
        className="h-10 w-10 text-fg-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 3v6M16 3v6M3 11h18" />
      </svg>
      <p className="text-fg-2">{message}</p>
      {ctaLabel && ctaTo && (
        <Link to={ctaTo}>
          <Button variant="secondary">{ctaLabel}</Button>
        </Link>
      )}
    </div>
  );
}
