import { Router } from "express";

import { requireAuth } from "../../middleware/auth";
import { askAIController, unreadMessageSummaryController } from "./ai.controller";
import { aiLimiter } from "../../middleware/rateLimiter";

const router = Router();

router.post("/ask", requireAuth, aiLimiter, askAIController);
router.post("/unread-summary", requireAuth, aiLimiter, unreadMessageSummaryController);

export default router;