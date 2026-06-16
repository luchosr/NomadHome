import type { Request, Response } from "express";
import { LoginSchema, RefreshTokenSchema, RegisterSchema, t } from "@nomadhome/shared";
import {
  AuthService,
  DuplicateEmailError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from "../services/auth.service.js";
import type { AuthedRequest } from "../middleware/require-auth.js";

/** HTTP edge for auth: validate input, extract request context, map errors. */
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation", issues: parsed.error.flatten() });
      return;
    }

    try {
      await this.auth.register({
        ...parsed.data,
        ipAddress: req.ip ?? "unknown",
        userAgent: req.get("user-agent") ?? undefined,
      });
      res.status(201).json({ status: "registered" });
    } catch (err) {
      if (err instanceof DuplicateEmailError) {
        // Generic error — does not reveal whether the email already exists.
        res.status(409).json({ error: t("identity.register.failed") });
        return;
      }
      throw err;
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation", issues: parsed.error.flatten() });
      return;
    }

    try {
      const tokens = await this.auth.login({
        ...parsed.data,
        ipAddress: req.ip ?? "unknown",
        userAgent: req.get("user-agent") ?? undefined,
      });
      res.status(200).json(tokens);
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        res.status(401).json({ error: t("identity.login.invalid_credentials") });
        return;
      }
      throw err;
    }
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const { user: authed } = req as AuthedRequest;
    if (!authed) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    const user = await this.auth.getProfile(authed.id);
    if (!user) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({
      id: user.id,
      email: user.email,
      roles: user.roles,
      emailVerifiedAt: user.emailVerifiedAt,
    });
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const parsed = RefreshTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation", issues: parsed.error.flatten() });
      return;
    }

    try {
      const tokens = await this.auth.refresh({
        refreshToken: parsed.data.refreshToken,
        ipAddress: req.ip ?? "unknown",
        userAgent: req.get("user-agent") ?? undefined,
      });
      res.status(200).json(tokens);
    } catch (err) {
      if (err instanceof InvalidRefreshTokenError) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      throw err;
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const parsed = RefreshTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation", issues: parsed.error.flatten() });
      return;
    }
    await this.auth.logout(parsed.data.refreshToken);
    res.status(204).send();
  };
}
