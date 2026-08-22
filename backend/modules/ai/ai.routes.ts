import { Router } from "express";

import { requireAuth } from "../../middleware/auth";
import { askAIController } from "./ai.controller";
import { aiLimiter } from "../../middleware/rateLimiter";

const router = Router();

router.post("/ask", requireAuth, aiLimiter, askAIController);

export default router;