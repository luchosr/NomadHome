import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import request from "supertest";
import { prisma, resetDatabase } from "@nomadhome/db";
import { createApp } from "./app.js";

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
  beforeAll(() => {
    process.env.JWT_SECRET ??= "test-secret";
  });
  beforeEach(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await prisma.$disconnect();
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
});
