import type { NextFunction, Request, Response } from "express";
import { MemoryStore, rateLimit } from "express-rate-limit";
import { t } from "@nomadhome/shared";

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 5;

/**
 * `AUTH_RATE_LIMIT_MAX` is intentionally undocumented in `.env.example` and
 * unset in production/dev: its only purpose is to let integration tests that
 * legitimately log in more than 5 times per file (e.g. seeding several users
 * via a `tokenFor()`-style helper) raise the ceiling for themselves, via
 * vitest's `test.env`, without weakening the real 5 req/min/IP limit from the
 * delta spec. `auth.login.test.ts` and `auth.register.test.ts` — which assert
 * the throttling itself — explicitly clear it back to the default in
 * `beforeAll` so those tests still exercise the real production limit.
 */
function readPositiveInt(envVar: string, fallback: number): number {
  const raw = process.env[envVar];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Own the store instance (instead of letting `rateLimit` create one
 * internally) so tests can call `authRateLimitStore.resetAll()` between
 * cases. That keeps unrelated pre-existing tests in the same file from
 * tripping the limiter due to shared in-memory hit counts, without weakening
 * the limiter itself or special-casing it by `NODE_ENV`.
 */
export const authRateLimitStore = new MemoryStore();

/**
 * Throttle brute-force attempts against `/auth/login` and `/auth/register`
 * to 5 requests per minute per source IP (openspec/changes/
 * harden-auth-security-gaps). A throttled request is rejected before it
 * reaches the controller, so it never touches credential checks, account
 * creation, or the audit log.
 *
 * `limit` is read per-request (not memoized at import time) so a test file's
 * `beforeAll` can adjust `AUTH_RATE_LIMIT_MAX` regardless of ESM import
 * ordering. With no env override — always true in production — this is
 * exactly `rateLimit({ windowMs: 60_000, limit: 5, ... })` per the delta spec.
 */
export const authRateLimit = rateLimit({
  windowMs: DEFAULT_WINDOW_MS,
  limit: (_req: Request) => readPositiveInt("AUTH_RATE_LIMIT_MAX", DEFAULT_LIMIT),
  standardHeaders: true,
  legacyHeaders: false,
  store: authRateLimitStore,
  handler: (_req: Request, res: Response, _next: NextFunction) => {
    res.status(429).json({ error: "RATE_LIMITED", message: t("error.rate_limited") });
  },
});
