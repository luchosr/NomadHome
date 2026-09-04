import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Integration tests share one Postgres database and reset it between tests,
    // so test files must not run in parallel against it.
    fileParallelism: false,
    // Several pre-existing integration files legitimately call POST
    // /auth/login more than 5 times per file (e.g. a `tokenFor()` helper
    // logging in several seeded users). Raise the auth rate limiter's ceiling
    // suite-wide so those are unaffected; `auth.login.test.ts` and
    // `auth.register.test.ts` explicitly clear this back to the real 5
    // req/min/IP default in `beforeAll` so they still test actual throttling.
    env: {
      AUTH_RATE_LIMIT_MAX: "1000",
    },
    coverage: {
      provider: "v8",
      reporter: ["lcov", "text"],
      include: ["src/**"],
      exclude: ["src/**/*.test.ts"],
    },
  },
});
