import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import request from "supertest";
import { prisma, resetDatabase } from "@nomadhome/db";
import { createApp } from "./app.js";
import { authRateLimitStore } from "./middleware/rate-limit.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);

async function seedUser(opts: { email: string; password: string; disabled?: boolean }) {
  return prisma.user.create({
    data: {
      email: opts.email,
      passwordHash: await bcrypt.hash(opts.password, 12),
      emailVerifiedAt: new Date(),
      disabledAt: opts.disabled ? new Date() : null,
    },
  });
}

describe.skipIf(!hasDatabase)("auth login + session", () => {
  const originalAuthRateLimitMax = process.env.AUTH_RATE_LIMIT_MAX;

  beforeAll(() => {
    process.env.JWT_SECRET ??= "test-secret";
    // vitest.config.ts raises AUTH_RATE_LIMIT_MAX suite-wide so unrelated
    // integration files that log in several times aren't throttled. This
    // file asserts the real throttling behavior, so it restores the actual
    // production default (5 req/min/IP) for the duration of its tests.
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

  it("issues an access + refresh token on valid credentials and audits success", async () => {
    await seedUser({ email: "lucia@example.com", password: "password123" });

    const res = await request(createApp())
      .post("/auth/login")
      .send({ email: "lucia@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe("string");
    expect(typeof res.body.refreshToken).toBe("string");
    expect(await prisma.refreshToken.count()).toBe(1);
    const audit = await prisma.authAuditEvent.findMany({ where: { event: "login_succeeded" } });
    expect(audit).toHaveLength(1);
  });

  it("rejects wrong password generically and audits the failure", async () => {
    await seedUser({ email: "lucia@example.com", password: "password123" });

    const res = await request(createApp())
      .post("/auth/login")
      .send({ email: "lucia@example.com", password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("INVALID_CREDENTIALS");
    expect(typeof res.body.message).toBe("string");
    expect(res.body.message.length).toBeGreaterThan(0);
    expect(await prisma.refreshToken.count()).toBe(0);
    const audit = await prisma.authAuditEvent.findMany({ where: { event: "login_failed" } });
    expect(audit).toHaveLength(1);
  });

  it("rejects an unknown email with the same generic error", async () => {
    const res = await request(createApp())
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: "password123" });

    expect(res.status).toBe(401);
    expect(await prisma.refreshToken.count()).toBe(0);
  });

  it("rejects a disabled account with the same generic error", async () => {
    await seedUser({ email: "off@example.com", password: "password123", disabled: true });

    const res = await request(createApp())
      .post("/auth/login")
      .send({ email: "off@example.com", password: "password123" });

    expect(res.status).toBe(401);
    expect(await prisma.refreshToken.count()).toBe(0);
  });

  it("returns the current user from /auth/me with a valid access token", async () => {
    await seedUser({ email: "lucia@example.com", password: "password123" });
    const login = await request(createApp())
      .post("/auth/login")
      .send({ email: "lucia@example.com", password: "password123" });

    const res = await request(createApp())
      .get("/auth/me")
      .set("Authorization", `Bearer ${login.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("lucia@example.com");
    expect(res.body.roles).toEqual(["guest"]);
  });

  it("rejects an expired access token on a protected route", async () => {
    const user = await seedUser({ email: "lucia@example.com", password: "password123" });
    const expired = jwt.sign({ roles: user.roles }, process.env.JWT_SECRET as string, {
      subject: user.id,
      expiresIn: -10,
    });

    const res = await request(createApp())
      .get("/auth/me")
      .set("Authorization", `Bearer ${expired}`);

    expect(res.status).toBe(401);
  });

  it("rejects a protected route with no token", async () => {
    const res = await request(createApp()).get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 429 on the 6th /auth/login request from the same IP within a minute", async () => {
    const app = createApp();
    const payload = { email: "nobody@example.com", password: "password123" };

    let last;
    for (let i = 0; i < 6; i += 1) {
      last = await request(app).post("/auth/login").send(payload);
    }

    expect(last?.status).toBe(429);
    // The throttled request never reaches login logic: no audit event for the 6th attempt.
    const audit = await prisma.authAuditEvent.findMany({ where: { event: "login_failed" } });
    expect(audit).toHaveLength(5);
  });
});
