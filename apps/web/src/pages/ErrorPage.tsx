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
      <h1 className="font-serif text-3xl text-ink-900">{t("error.title")}</h1>
      <p className="max-w-md text-ink-500">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-ink-200 px-4 py-2 text-sm text-ink-700 hover:bg-ink-50"
        >
          {t("error.go_back")}
        </button>
        <button
          onClick={() => navigate("/")}
          className="rounded-lg bg-forest-700 px-4 py-2 text-sm text-white hover:bg-forest-900"
        >
          {t("error.go_home")}
        </button>
      </div>
    </div>
  );
}
