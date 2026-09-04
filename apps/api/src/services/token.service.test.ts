import { describe, it, expect, afterEach } from "vitest";
import { TokenService } from "./token.service.js";

describe("TokenService secret length check", () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it("throws when JWT_SECRET is set but shorter than 32 characters", () => {
    process.env.JWT_SECRET = "short-secret-14c";
    const tokenService = new TokenService();

    expect(() => tokenService.signAccessToken("user-1", ["guest"])).toThrow(/32 char/i);
  });

  it("succeeds when JWT_SECRET is exactly 32 characters", () => {
    process.env.JWT_SECRET = "a".repeat(32);
    const tokenService = new TokenService();

    expect(() => tokenService.signAccessToken("user-1", ["guest"])).not.toThrow();
  });

  it("succeeds when JWT_SECRET is longer than 32 characters", () => {
    process.env.JWT_SECRET = "a".repeat(40);
    const tokenService = new TokenService();

    expect(() => tokenService.signAccessToken("user-1", ["guest"])).not.toThrow();
  });
});
