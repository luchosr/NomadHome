import pkg from "@prisma/client";
const { PrismaClient } = pkg;
// Re-export generated Prisma types and enums so apps depend on @nomadhome/db only.
export * from "@prisma/client";
export { pkg as Prisma };
/**
 * The single shared Prisma client for the whole workspace.
 *
 * Apps and packages import this instance rather than constructing their own,
 * so connection pooling and configuration live in one place
 * (openspec/specs/build-tooling — "Shared Prisma client and database reset helper").
 */
export const prisma = new PrismaClient();

/**
 * Empty every application table in the `public` schema for test isolation.
 *
 * Discovers tables at runtime so it keeps working as capability tickets add
 * models. Preserves the schema and Prisma's migration history table, and is a
 * no-op when no application tables exist yet.
 */
export async function resetDatabase(): Promise<void> {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length === 0) return;

  const list = tables.map((t) => `"public"."${t.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}
