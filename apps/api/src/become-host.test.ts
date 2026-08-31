import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import request from "supertest";
import { prisma, resetDatabase } from "@nomadhome/db";
import { createApp } from "./app.js";
import { requireAuth } from "./middleware/require-auth.js";
import { requireRole } from "./middleware/require-role.js";

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

async function registerUnverifiedAndLogin(email: string) {
  await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash("password123", 12),
      emailVerifiedAt: null,
    },
  });
  const res = await request(createApp())
    .post("/auth/login")
    .send({ email, password: "password123" });
  return res.body as { accessToken: string; refreshToken: string };
}

const validForm = { displayName: "Lucia", payoutEmail: "pay@example.com", acceptedTerms: true };

describe.skipIf(!hasDatabase)("POST /users/me/become-host", () => {
  beforeAll(() => {
    process.env.JWT_SECRET ??= "test-secret";
  });
  beforeEach(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("adds the host role, creates the profile, audits, and returns a host-bearing token", async () => {
    const { accessToken } = await registerAndLogin("guest@example.com");

    const res = await request(createApp())
      .post("/users/me/become-host")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validForm);

    expect(res.status).toBe(201);
    expect(res.body.roles).toEqual(["guest", "host"]);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "guest@example.com" },
      include: { hostProfile: true, authAuditEvents: true },
    });
    expect(user.roles).toEqual(["guest", "host"]);
    expect(user.hostProfile?.displayName).toBe("Lucia");
    expect(user.hostProfile?.payoutEmail).toBe("pay@example.com");
    expect(user.hostProfile?.acceptedTermsVersion).toBeTruthy();
    expect(user.authAuditEvents.some((e) => e.event === "role_added")).toBe(true);

    // The returned token carries the host role.
    const claims = jwt.verify(res.body.accessToken, process.env.JWT_SECRET as string) as {
      roles: string[];
    };
    expect(claims.roles).toContain("host");
  });

  it("rejects a second onboarding for an existing host with 409", async () => {
    const { accessToken } = await registerAndLogin("again@example.com");
    await request(createApp())
      .post("/users/me/become-host")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validForm);

    const res = await request(createApp())
      .post("/users/me/become-host")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validForm);

    expect(res.status).toBe(409);
    expect(await prisma.hostProfile.count()).toBe(1);
  });

  it("rejects an unauthenticated request with 401", async () => {
    const res = await request(createApp()).post("/users/me/become-host").send(validForm);
    expect(res.status).toBe(401);
    expect(await prisma.hostProfile.count()).toBe(0);
  });

  it("rejects onboarding for an unverified email with 403 EMAIL_NOT_VERIFIED", async () => {
    const { accessToken } = await registerUnverifiedAndLogin("unverified@example.com");

    const res = await request(createApp())
      .post("/users/me/become-host")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validForm);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("EMAIL_NOT_VERIFIED");
    expect(await prisma.hostProfile.count()).toBe(0);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "unverified@example.com" },
    });
    expect(user.roles).toEqual(["guest"]);
  });
});

describe("requireRole", () => {
  // Pure middleware unit test — no DB needed.
  function appWith(role: string) {
    const secret = (process.env.JWT_SECRET ??= "test-secret");
    const app = express();
    app.get("/host-only", requireAuth, requireRole("host"), (_req, res) => res.json({ ok: true }));
    const token = jwt.sign({ roles: [role] }, secret, { subject: "u1", expiresIn: "5m" });
    return { app, token };
  }

  it("allows a user holding the role", async () => {
    const { app, token } = appWith("host");
    const res = await request(app).get("/host-only").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("forbids a user lacking the role with 403", async () => {
    const { app, token } = appWith("guest");
    const res = await request(app).get("/host-only").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
