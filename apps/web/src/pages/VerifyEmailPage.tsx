import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authApi } from "../api/auth.js";

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
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
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        {status === "pending" && <p className="text-ink-500">Verifying your email…</p>}
        {status === "success" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-forest-50">
              <svg
                className="h-8 w-8 text-forest-700"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h1 className="font-serif text-3xl text-ink-900">Email verified!</h1>
            <p className="mt-3 text-ink-500">Your account is confirmed. You can now log in.</p>
            <Link
              to="/login"
              className="mt-8 inline-block rounded-xl bg-forest-700 px-8 py-3 text-sm font-medium text-sand-50 transition-colors hover:bg-forest-900 no-underline"
            >
              Log in
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-terracotta-50">
              <svg
                className="h-8 w-8 text-terracotta-700"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </div>
            <h1 className="font-serif text-3xl text-ink-900">Link invalid or expired</h1>
            <p className="mt-3 text-ink-500">
              This verification link has already been used or has expired. Please register again.
            </p>
            <Link
              to="/register"
              className="mt-8 inline-block rounded-xl bg-forest-700 px-8 py-3 text-sm font-medium text-sand-50 transition-colors hover:bg-forest-900 no-underline"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
