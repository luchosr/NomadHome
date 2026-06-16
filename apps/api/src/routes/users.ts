import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { AuthService } from "../services/auth.service.js";
import { LoggingEmailService } from "../services/email.service.js";
import { UserRepository } from "../repositories/user.repository.js";
import { requireAuth } from "../middleware/require-auth.js";

/** Routes under `/users` — the current user's own account actions. */
export function createUsersRouter(): Router {
  const controller = new AuthController(
    new AuthService(new UserRepository(), new LoggingEmailService()),
  );

  const router = Router();
  router.post("/me/become-host", requireAuth, controller.becomeHost);
  return router;
}

export const usersRouter = createUsersRouter();
