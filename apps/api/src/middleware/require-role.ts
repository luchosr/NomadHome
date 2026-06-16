import type { NextFunction, Request, Response } from "express";
import type { AuthedRequest } from "./require-auth.js";

/**
 * Allow only authenticated users holding one of the given roles. Runs after
 * `requireAuth` (which populates `req.user` from the access-token claims).
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { user } = req as AuthedRequest;
    if (!user) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    if (!roles.some((role) => user.roles.includes(role))) {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    next();
  };
}
