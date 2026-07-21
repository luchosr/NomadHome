import type { NextFunction, Request, Response } from "express";
import { tokenService } from "../services/token.service.js";

export interface AuthedRequest extends Request {
  user?: { id: string; roles: string[] };
}

/**
 * Extract the authenticated user from a request that has already passed
 * through requireAuth. Throws if called on an unauthenticated request so
 * misconfigured routes produce a clear error instead of a silent crash.
 */
export function getUser(req: Request): { id: string; roles: string[] } {
  const user = (req as AuthedRequest).user;
  if (!user) throw new Error("requireAuth middleware was not applied to this route");
  return user;
}

/** Reject requests without a valid, unexpired Bearer access token. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  try {
    const claims = tokenService.verifyAccessToken(header.slice("Bearer ".length));
    (req as AuthedRequest).user = { id: claims.sub, roles: claims.roles };
    next();
  } catch {
    res.status(401).json({ error: "unauthorized" });
  }
}
