import type { Request, Response } from "express";
import { RegisterSchema, t } from "@nomadhome/shared";
import { AuthService, DuplicateEmailError } from "../services/auth.service.js";

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
}
