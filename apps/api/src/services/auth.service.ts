import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import type { LoginInput, RegisterInput } from "@nomadhome/shared";
import type { User } from "@nomadhome/db";
import type { UserRepository } from "../repositories/user.repository.js";
import type { EmailService } from "./email.service.js";
import { tokenService, type TokenService } from "./token.service.js";

/** bcrypt cost — above the project floor of 10 (see design.md). */
const BCRYPT_COST = 12;
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface RegisterCommand extends RegisterInput {
  ipAddress: string;
  userAgent?: string;
}

export interface LoginCommand extends LoginInput {
  ipAddress: string;
  userAgent?: string;
}

export interface RefreshCommand {
  refreshToken: string;
  ipAddress: string;
  userAgent?: string;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

/** Thrown when an email is already registered. Mapped to a generic error at the edge. */
export class DuplicateEmailError extends Error {
  constructor() {
    super("duplicate_email");
    this.name = "DuplicateEmailError";
  }
}

/** Thrown for any failed login (unknown email, wrong password, disabled account). */
export class InvalidCredentialsError extends Error {
  constructor() {
    super("invalid_credentials");
    this.name = "InvalidCredentialsError";
  }
}

/** Thrown when a refresh token is unknown, revoked, expired, or reused. */
export class InvalidRefreshTokenError extends Error {
  constructor() {
    super("invalid_refresh_token");
    this.name = "InvalidRefreshTokenError";
  }
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly email: EmailService,
    private readonly tokens: TokenService = tokenService,
  ) {}

  /**
   * Register a new guest account. Rejects duplicate emails without leaking
   * existence, issues a single-use verification token, dispatches the email,
   * and appends an audit event. Issues no session — login does that.
   */
  async register(cmd: RegisterCommand): Promise<{ userId: string }> {
    const existing = await this.users.findByEmail(cmd.email);
    if (existing) {
      await this.users.recordAuditEvent({
        event: "registration_failed",
        ipAddress: cmd.ipAddress,
        userAgent: cmd.userAgent,
        metadata: { reason: "duplicate_email" },
      });
      throw new DuplicateEmailError();
    }

    const passwordHash = await bcrypt.hash(cmd.password, BCRYPT_COST);
    const rawToken = randomBytes(32).toString("hex");
    const verificationTokenHash = createHash("sha256").update(rawToken).digest("hex");

    const user = await this.users.createWithVerification({
      email: cmd.email,
      passwordHash,
      verificationTokenHash,
      verificationExpiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    });

    await this.users.recordAuditEvent({
      userId: user.id,
      event: "registered",
      ipAddress: cmd.ipAddress,
      userAgent: cmd.userAgent,
    });

    await this.email.sendVerificationEmail(cmd.email, rawToken);

    return { userId: user.id };
  }

  /**
   * Authenticate credentials and issue a session. Unknown email, wrong password,
   * and disabled accounts all fail with the same generic error (no enumeration).
   */
  async login(cmd: LoginCommand): Promise<SessionTokens> {
    const user = await this.users.findByEmail(cmd.email);
    const passwordOk = user ? await bcrypt.compare(cmd.password, user.passwordHash) : false;

    if (!user || user.disabledAt || !passwordOk) {
      await this.users.recordAuditEvent({
        userId: user?.id,
        event: "login_failed",
        ipAddress: cmd.ipAddress,
        userAgent: cmd.userAgent,
      });
      throw new InvalidCredentialsError();
    }

    const accessToken = this.tokens.signAccessToken(user.id, user.roles);
    const refresh = this.tokens.mintRefreshToken();
    await this.users.createRefreshToken({
      userId: user.id,
      tokenHash: refresh.tokenHash,
      expiresAt: refresh.expiresAt,
      userAgent: cmd.userAgent,
    });

    await this.users.recordAuditEvent({
      userId: user.id,
      event: "login_succeeded",
      ipAddress: cmd.ipAddress,
      userAgent: cmd.userAgent,
    });

    return { accessToken, refreshToken: refresh.raw };
  }

  /**
   * Rotate a refresh token: issue a fresh access + refresh token and revoke the
   * presented one. A revoked token presented again is treated as theft — every
   * active token for that user is revoked. Unknown/expired tokens are rejected.
   */
  async refresh(cmd: RefreshCommand): Promise<SessionTokens> {
    const tokenHash = this.tokens.hashRefreshToken(cmd.refreshToken);
    const presented = await this.users.findRefreshTokenByHash(tokenHash);

    if (!presented) {
      throw new InvalidRefreshTokenError();
    }

    if (presented.revokedAt) {
      // Reuse of an already-revoked token — revoke the whole family.
      await this.users.revokeAllActiveForUser(presented.userId);
      await this.users.recordAuditEvent({
        userId: presented.userId,
        event: "refresh_token_reuse_detected",
        ipAddress: cmd.ipAddress,
        userAgent: cmd.userAgent,
      });
      throw new InvalidRefreshTokenError();
    }

    if (presented.expiresAt.getTime() <= Date.now()) {
      throw new InvalidRefreshTokenError();
    }

    const user = await this.users.findById(presented.userId);
    if (!user || user.disabledAt) {
      throw new InvalidRefreshTokenError();
    }

    const next = this.tokens.mintRefreshToken();
    await this.users.rotateRefreshToken(presented.id, {
      userId: user.id,
      tokenHash: next.tokenHash,
      expiresAt: next.expiresAt,
      userAgent: cmd.userAgent,
    });

    return {
      accessToken: this.tokens.signAccessToken(user.id, user.roles),
      refreshToken: next.raw,
    };
  }

  /** Revoke only the presented refresh token. Idempotent and existence-blind. */
  async logout(refreshToken: string): Promise<void> {
    const presented = await this.users.findRefreshTokenByHash(
      this.tokens.hashRefreshToken(refreshToken),
    );
    if (presented && !presented.revokedAt) {
      await this.users.revokeRefreshToken(presented.id);
    }
  }

  getProfile(userId: string): Promise<User | null> {
    return this.users.findById(userId);
  }
}
