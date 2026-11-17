interface Props {
  error: string | null;
  className?: string;
}

export function ServerErrorAlert({ error, className }: Props) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className={[
        "flex min-w-0 items-start gap-3 border-2 border-solid border-danger bg-danger-bg p-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        aria-hidden="true"
        className="flex h-5 w-5 shrink-0 items-center justify-center bg-danger text-fg-inverse"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
          <path d="M12 5v9M12 17v2" strokeWidth="3" strokeLinecap="square" />
        </svg>
      </span>
      <p className="m-0 min-w-0 break-words text-sm font-bold text-danger">{error}</p>
    </div>
  );
}
