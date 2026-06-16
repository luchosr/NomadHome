import { prisma, type AuthAuditEventType, type Prisma, type User } from "@nomadhome/db";

export interface CreateUserWithVerification {
  email: string;
  passwordHash: string;
  verificationTokenHash: string;
  verificationExpiresAt: Date;
}

export interface AuthAuditEventInput {
  userId?: string;
  event: AuthAuditEventType;
  ipAddress: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface CreateRefreshToken {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string;
}

/** Persistence for the identity aggregate (User + its verification tokens + audit log). */
export class UserRepository {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  createRefreshToken(input: CreateRefreshToken): Promise<unknown> {
    return prisma.refreshToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        userAgent: input.userAgent,
      },
    });
  }

  /** Create a guest account and its single-use verification token atomically. */
  createWithVerification(input: CreateUserWithVerification): Promise<User> {
    return prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        emailVerificationTokens: {
          create: {
            tokenHash: input.verificationTokenHash,
            expiresAt: input.verificationExpiresAt,
          },
        },
      },
    });
  }

  recordAuditEvent(input: AuthAuditEventInput): Promise<unknown> {
    return prisma.authAuditEvent.create({
      data: {
        userId: input.userId,
        event: input.event,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        metadata: input.metadata,
      },
    });
  }
}
