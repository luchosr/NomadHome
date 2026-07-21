import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { AuthService } from "../services/auth.service.js";
import { LoggingEmailService } from "../services/email.service.js";
import { ResendEmailService } from "../services/resend.service.js";
import { UserRepository } from "../repositories/user.repository.js";
import { requireAuth } from "../middleware/require-auth.js";

/** Routes under `/users` — the current user's own account actions. */
export function createUsersRouter(): Router {
  const apiKey = process.env["RESEND_API_KEY"];
  const emailService = apiKey ? new ResendEmailService(apiKey) : new LoggingEmailService();
  const controller = new AuthController(new AuthService(new UserRepository(), emailService));

  const router = Router();
  router.post("/me/become-host", requireAuth, controller.becomeHost);
  return router;
}

export const usersRouter = createUsersRouter();
