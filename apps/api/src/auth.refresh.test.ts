import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import request from "supertest";
import { prisma, resetDatabase } from "@nomadhome/db";
import { createApp } from "./app.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);

async function registerAndLogin(email: string) {
  await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash("password123", 12),
      emailVerifiedAt: new Date(),
    },
  });
  const res = await request(createApp())
    .post("/auth/login")
    .send({ email, password: "password123" });
  return res.body as { accessToken: string; refreshToken: string };
}

describe.skipIf(!hasDatabase)("auth refresh + logout", () => {
  beforeAll(() => {
    process.env.JWT_SECRET ??= "test-secret";
  });
  beforeEach(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rotates a valid refresh token, revoking the presented one", async () => {
    const { refreshToken } = await registerAndLogin("rot@example.com");

    const res = await request(createApp()).post("/auth/refresh").send({ refreshToken });

    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe("string");
    expect(res.body.refreshToken).not.toBe(refreshToken);

    // One revoked (presented) + one active (new).
    expect(await prisma.refreshToken.count({ where: { revokedAt: { not: null } } })).toBe(1);
    expect(await prisma.refreshToken.count({ where: { revokedAt: null } })).toBe(1);

    const fresh = await prisma.refreshToken.findFirst({ where: { revokedAt: null } });
    const days = (fresh!.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(days).toBeGreaterThan(29);
    expect(days).toBeLessThanOrEqual(30);
  });

  it("rejects an unknown refresh token", async () => {
    await registerAndLogin("x@example.com");
    const res = await request(createApp()).post("/auth/refresh").send({ refreshToken: "nope" });
    expect(res.status).toBe(401);
  });

  it("rejects a refresh token after absolute expiry", async () => {
    const { refreshToken } = await registerAndLogin("exp@example.com");
    await prisma.refreshToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

    const res = await request(createApp()).post("/auth/refresh").send({ refreshToken });
    expect(res.status).toBe(401);
  });

  it("detects reuse of a rotated token and revokes the whole family", async () => {
    const first = await registerAndLogin("reuse@example.com");
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "reuse@example.com" } });
    // A second active session for the same user.
    await request(createApp())
      .post("/auth/login")
      .send({ email: "reuse@example.com", password: "password123" });

    // Rotate the first token (it becomes revoked), then present it again.
    await request(createApp()).post("/auth/refresh").send({ refreshToken: first.refreshToken });
    const res = await request(createApp())
      .post("/auth/refresh")
      .send({ refreshToken: first.refreshToken });

    expect(res.status).toBe(401);
    // Reuse cascade: no active refresh tokens remain for the user.
    expect(await prisma.refreshToken.count({ where: { userId: user.id, revokedAt: null } })).toBe(
      0,
    );
    const audit = await prisma.authAuditEvent.findMany({
      where: { userId: user.id, event: "refresh_token_reuse_detected" },
    });
    expect(audit).toHaveLength(1);
  });

  it("logout revokes only the presented token; other sessions still rotate", async () => {
    const a = await registerAndLogin("multi@example.com");
    const b = await request(createApp())
      .post("/auth/login")
      .send({ email: "multi@example.com", password: "password123" });
    const tokenB = (b.body as { refreshToken: string }).refreshToken;

    const logout = await request(createApp())
      .post("/auth/logout")
      .send({ refreshToken: a.refreshToken });
    expect(logout.status).toBe(204);

    // Only A is revoked; B remains active and continues to rotate.
    // (Presenting A to /refresh is not exercised here — a revoked token at the
    // refresh endpoint is, by spec, a reuse signal that revokes the whole family.)
    expect(await prisma.refreshToken.count({ where: { revokedAt: null } })).toBe(1);
    expect(
      (await request(createApp()).post("/auth/refresh").send({ refreshToken: tokenB })).status,
    ).toBe(200);
  });
});
