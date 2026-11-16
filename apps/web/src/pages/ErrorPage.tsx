import { useRouteError, useNavigate } from "react-router-dom";
import { t } from "@nomadhome/shared";

function isChunkLoadError(err: unknown): boolean {
  return (
    err instanceof TypeError && err.message.includes("Failed to fetch dynamically imported module")
  );
}

export function ErrorPage() {
  const err = useRouteError();
  const navigate = useNavigate();

  // Stale deployment: chunk hash no longer exists — reload once to get fresh bundle
  if (isChunkLoadError(err)) {
    const key = "nh_chunk_reload";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      window.location.reload();
      return null;
    }
    // Already reloaded once and still failing — fall through to error UI
    sessionStorage.removeItem(key);
  }

  const message = err instanceof Error ? err.message : t("error.unexpected");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="font-display text-3xl text-fg">{t("error.title")}</h1>
      <p className="max-w-md text-fg-subtle">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-border-muted px-4 py-2 text-sm text-fg-muted hover:bg-surface-inset"
        >
          {t("error.go_back")}
        </button>
        <button
          onClick={() => navigate("/")}
          className="rounded-lg bg-action px-4 py-2 text-sm text-action-fg hover:bg-action-hover"
        >
          {t("error.go_home")}
        </button>
      </div>
    </div>
  );
}
