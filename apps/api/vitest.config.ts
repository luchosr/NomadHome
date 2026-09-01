import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Integration tests share one Postgres database and reset it between tests,
    // so test files must not run in parallel against it.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["lcov", "text"],
      include: ["src/**"],
      exclude: ["src/**/*.test.ts"],
    },
  },
});
