import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { prisma, resetDatabase } from "@nomadhome/db";
import { createApp } from "./app.js";

// DB-backed; runs in CI (Postgres service) and skips locally without DATABASE_URL.
const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("POST /auth/register", () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await prisma.$disconnect();
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
});
