import { describe, it, expect, afterAll } from "vitest";
import { prisma, resetDatabase } from "./index.js";

// Integration tests need a real database. Skip (don't fail) when DATABASE_URL is
// absent so local `pnpm test` stays green without Postgres; CI sets it via the
// Postgres service container.
const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("db harness", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("connects and runs a query", async () => {
    const rows = await prisma.$queryRaw<{ result: number }[]>`SELECT 1 as result`;
    expect(rows[0]?.result).toBe(1);
  });

  it("resetDatabase tolerates a schema with no application tables", async () => {
    await expect(resetDatabase()).resolves.toBeUndefined();
  });
});
