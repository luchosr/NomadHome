import { Router } from "express";
import { SearchController } from "../controllers/search.controller.js";
import { SearchService } from "../services/search.service.js";
import { SearchRepository } from "../repositories/search.repository.js";

const controller = new SearchController(new SearchService(new SearchRepository()));

const router = Router();
router.get("/", controller.search);

export const searchRouter = router;
