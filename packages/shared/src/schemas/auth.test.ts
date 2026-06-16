import { describe, it, expect } from "vitest";
import { RegisterSchema, LoginSchema } from "./auth.js";

describe("RegisterSchema", () => {
  it("accepts a valid email and compliant password", () => {
    const result = RegisterSchema.safeParse({
      email: "lucia@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(RegisterSchema.safeParse({ email: "nope", password: "password123" }).success).toBe(
      false,
    );
  });

  it("rejects a password shorter than 10 characters", () => {
    expect(RegisterSchema.safeParse({ email: "a@b.com", password: "pass1" }).success).toBe(false);
  });

  it("rejects a password with no letter", () => {
    expect(RegisterSchema.safeParse({ email: "a@b.com", password: "1234567890" }).success).toBe(
      false,
    );
  });

  it("rejects a password with no digit", () => {
    expect(RegisterSchema.safeParse({ email: "a@b.com", password: "abcdefghij" }).success).toBe(
      false,
    );
  });
});

describe("LoginSchema", () => {
  it("accepts a valid email and a non-empty password", () => {
    expect(LoginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(LoginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(LoginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});
