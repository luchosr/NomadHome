import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";

const ACCESS_TTL = "15m"; // identity spec — access tokens live 15 minutes
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface AccessClaims {
  sub: string;
  roles: string[];
}

export interface MintedRefreshToken {
  raw: string;
  tokenHash: string;
  expiresAt: Date;
}

/** Signs/verifies access JWTs and mints opaque refresh tokens. */
export class TokenService {
  /** Read the secret lazily so importing the app never crashes when it is unset. */
  private secret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not set");
    return secret;
  }

  signAccessToken(userId: string, roles: string[]): string {
    return jwt.sign({ roles }, this.secret(), { subject: userId, expiresIn: ACCESS_TTL });
  }

  verifyAccessToken(token: string): AccessClaims {
    const payload = jwt.verify(token, this.secret(), { algorithms: ["HS256"] }) as jwt.JwtPayload;
    return { sub: String(payload.sub), roles: (payload.roles as string[]) ?? [] };
  }

  /** Raw token is returned once (to the client); only its hash is persisted. */
  mintRefreshToken(): MintedRefreshToken {
    const raw = randomBytes(32).toString("hex");
    return {
      raw,
      tokenHash: this.hashRefreshToken(raw),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    };
  }

  /** Hash a presented raw refresh token for server-side lookup. */
  hashRefreshToken(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }

  get refreshTtlMs(): number {
    return REFRESH_TTL_MS;
  }
}

/** Shared instance used by the auth service and the requireAuth middleware. */
export const tokenService = new TokenService();
