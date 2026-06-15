import { Router } from "express";
import { en } from "@nomadhome/shared/strings/en";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.status(200).json({ status: "ok", service: en.common.app.name });
});
