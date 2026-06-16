import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { AuthService } from "../services/auth.service.js";
import { LoggingEmailService } from "../services/email.service.js";
import { UserRepository } from "../repositories/user.repository.js";
import { requireAuth } from "../middleware/require-auth.js";

/** Wire the auth router with the default production dependencies. */
export function createAuthRouter(): Router {
  const controller = new AuthController(
    new AuthService(new UserRepository(), new LoggingEmailService()),
  );

  const router = Router();
  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.post("/refresh", controller.refresh);
  router.post("/logout", controller.logout);
  router.get("/me", requireAuth, controller.me);
  return router;
}

export const authRouter = createAuthRouter();
