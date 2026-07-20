interface Props {
  error: string | null;
  className?: string;
}

export function ServerErrorAlert({ error, className }: Props) {
  if (!error) return null;
  return (
    <p role="alert" className={["text-sm text-danger", className].filter(Boolean).join(" ")}>
      {error}
    </p>
  );
}
