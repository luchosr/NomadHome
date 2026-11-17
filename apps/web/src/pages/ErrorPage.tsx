import { useEffect, useRef, useState } from "react";
import { useRouteError, useNavigate } from "react-router-dom";
import { t } from "@nomadhome/shared";

function isChunkLoadError(err: unknown): boolean {
  return (
    err instanceof TypeError && err.message.includes("Failed to fetch dynamically imported module")
  );
}

const CHUNK_RELOAD_KEY = "nh_chunk_reload";

function hasReloadedOnce(): boolean {
  try {
    return sessionStorage.getItem(CHUNK_RELOAD_KEY) !== null;
  } catch {
    // Storage unavailable: we cannot guard against a loop, so never reload.
    return true;
  }
}

export function ErrorPage() {
  const err = useRouteError();
  const navigate = useNavigate();
  const isChunkError = isChunkLoadError(err);

  // Decided once per mount from a read-only check, so renders stay idempotent.
  const [shouldReload] = useState(() => isChunkError && !hasReloadedOnce());
  const handled = useRef(false);

  // Stale deployment: chunk hash no longer exists. Reload once to get the fresh
  // bundle; the flag survives the reload so a second failure shows the error UI.
  useEffect(() => {
    if (!isChunkError || handled.current) return;
    handled.current = true;
    try {
      if (shouldReload) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
        window.location.reload();
      } else {
        // Reload already tried and it still fails: reset so a later deploy can retry.
        sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      }
    } catch {
      // Storage unavailable: show the error UI.
    }
  }, [isChunkError, shouldReload]);

  if (shouldReload) return null;

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
