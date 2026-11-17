import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { authApi } from "../api/auth.js";

type Status = "pending" | "success" | "error";

const PRIMARY_LINK =
  "mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-sm border-2 border-border bg-action px-[22px] py-[14px] text-sm font-bold text-action-fg no-underline transition-colors duration-med ease-out hover:bg-action-hover sm:w-auto";

const TILE_BASE = "flex h-16 w-16 shrink-0 items-center justify-center border-2";

const GLYPH_PROPS = {
  viewBox: "0 0 32 32",
  className: "h-8 w-8",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3,
  strokeLinecap: "square",
  strokeLinejoin: "miter",
} as const;

/** Decorative state tile: shape (dashed, filled, outlined) carries the state, not colour. */
function StateTile({ status }: { status: Status }) {
  if (status === "pending") {
    return (
      <span aria-hidden="true" className={`${TILE_BASE} border-dashed border-border text-fg`}>
        <svg {...GLYPH_PROPS} fill="currentColor" stroke="none">
          <rect x="3" y="12" width="6" height="8" />
          <rect x="13" y="12" width="6" height="8" />
          <rect x="23" y="12" width="6" height="8" />
        </svg>
      </span>
    );
  }
  if (status === "success") {
    return (
      <span
        aria-hidden="true"
        className={`${TILE_BASE} border-solid border-border bg-fg text-fg-inverse`}
      >
        <svg {...GLYPH_PROPS}>
          <path d="M6 17 13 24 26 8" />
        </svg>
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${TILE_BASE} border-solid border-danger bg-surface-raised text-danger`}
    >
      <svg {...GLYPH_PROPS}>
        <path d="M8 8 24 24M24 8 8 24" />
      </svg>
    </span>
  );
}

const PANEL_BASE = "flex min-w-0 flex-col items-start gap-5 border-2 p-6 text-fg md:p-8";

function Panel({
  status,
  title,
  body,
  action,
}: {
  status: Status;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  const tone = {
    pending: "border-dashed border-border bg-surface-inset",
    success: "border-solid border-border bg-ember",
    error: "border-solid border-border bg-surface-raised",
  }[status];
  return (
    <div
      data-state={status}
      role={status === "error" ? "alert" : undefined}
      className={`${PANEL_BASE} ${tone}`}
    >
      <StateTile status={status} />
      <div className="min-w-0">
        <h1 className="m-0 text-balance break-words text-3xl font-black leading-[0.95] tracking-[-0.03em]">
          {title}
        </h1>
        {body && <p className="m-0 mt-3 break-words text-base font-medium">{body}</p>}
        {action}
      </div>
    </div>
  );
}

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<Status>("pending");
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    if (!token) {
      setStatus("error");
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-16 pt-10 md:pt-16">
      <div
        role={status === "pending" ? "status" : undefined}
        aria-live={status === "error" ? undefined : "polite"}
        aria-busy={status === "pending"}
      >
        {status === "pending" && (
          <Panel status="pending" title={t("identity.verify_email.pending")} />
        )}
        {status === "success" && (
          <Panel
            status="success"
            title={t("identity.verify_email.success_title")}
            body={t("identity.verify_email.success_body")}
            action={
              <Link to="/login" className={PRIMARY_LINK}>
                {t("identity.verify_email.success_cta")}
              </Link>
            }
          />
        )}
        {status === "error" && (
          <Panel
            status="error"
            title={t("identity.verify_email.error_title")}
            body={t("identity.verify_email.error_body")}
            action={
              <Link to="/register" className={PRIMARY_LINK}>
                {t("identity.verify_email.error_cta")}
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
