import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { prisma, resetDatabase } from "@nomadhome/db";
import { createApp } from "./app.js";
import { authRateLimitStore } from "./middleware/rate-limit.js";

// DB-backed; runs in CI (Postgres service) and skips locally without DATABASE_URL.
const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("POST /auth/register", () => {
  const originalAuthRateLimitMax = process.env.AUTH_RATE_LIMIT_MAX;

  beforeAll(() => {
    // vitest.config.ts raises AUTH_RATE_LIMIT_MAX suite-wide so unrelated
    // integration files that register/log in several times aren't
    // throttled. This file asserts the real throttling behavior, so it
    // restores the actual production default (5 req/min/IP) for the
    // duration of its tests.
    delete process.env.AUTH_RATE_LIMIT_MAX;
  });
  beforeEach(async () => {
    await resetDatabase();
    // The auth rate limiter is a module-level singleton shared by every
    // `createApp()` call in this file, so it accumulates hits across test
    // cases. Reset it between tests so unrelated earlier requests never
    // count toward (or dilute) the dedicated 429 test below.
    await authRateLimitStore.resetAll();
  });
  afterAll(async () => {
    await prisma.$disconnect();
    if (originalAuthRateLimitMax === undefined) {
      delete process.env.AUTH_RATE_LIMIT_MAX;
    } else {
      process.env.AUTH_RATE_LIMIT_MAX = originalAuthRateLimitMax;
    }
  });

  it("creates a guest account with a hashed password, a verification token, and an audit event", async () => {
    const res = await request(createApp())
      .post("/auth/register")
      .send({ email: "lucia@example.com", password: "password123" });

    expect(res.status).toBe(201);
    // No session established at registration.
    expect(res.body.accessToken).toBeUndefined();
    expect(res.body.refreshToken).toBeUndefined();

    const user = await prisma.user.findUnique({
      where: { email: "lucia@example.com" },
      include: { emailVerificationTokens: true, authAuditEvents: true },
    });
    expect(user?.roles).toEqual(["guest"]);
    expect(user?.passwordHash).not.toBe("password123");
    expect(user?.passwordHash.startsWith("$2")).toBe(true);
    expect(user?.emailVerificationTokens).toHaveLength(1);
    expect(user?.emailVerificationTokens[0]?.usedAt).toBeNull();
    expect(user?.authAuditEvents.some((e) => e.event === "registered")).toBe(true);
  });

  it("rejects a duplicate email case-insensitively without revealing existence and audits the failure", async () => {
    await request(createApp())
      .post("/auth/register")
      .send({ email: "Lucia@Example.com", password: "password123" });

    const res = await request(createApp())
      .post("/auth/register")
      .send({ email: "lucia@example.com", password: "password123" });

    expect(res.status).toBe(409);
    expect(JSON.stringify(res.body)).not.toMatch(/exist/i);
    expect(await prisma.user.count()).toBe(1);

    const failed = await prisma.authAuditEvent.findMany({
      where: { event: "registration_failed" },
    });
    expect(failed).toHaveLength(1);
    expect(failed[0]?.metadata).toMatchObject({ reason: "duplicate_email" });
  });

  it("rejects a weak password without creating an account", async () => {
    const res = await request(createApp())
      .post("/auth/register")
      .send({ email: "weak@example.com", password: "short" });

    expect(res.status).toBe(400);
    expect(await prisma.user.count()).toBe(0);
  });

  it("returns 429 on the 6th /auth/register request from the same IP within a minute", async () => {
    const app = createApp();

    let last;
    for (let i = 0; i < 6; i += 1) {
      last = await request(app)
        .post("/auth/register")
        .send({ email: `throttle-${i}@example.com`, password: "password123" });
    }

    expect(last?.status).toBe(429);
    // The throttled 6th request never reaches registration logic: no account created for it.
    expect(await prisma.user.count()).toBe(5);
  });
});
