import { Router } from "express";

import { requireAuth } from "../../middleware/auth";
import { askAIController, getUnreadMessageCountController, unreadMessageSummaryController } from "./ai.controller";
import { aiLimiter } from "../../middleware/rateLimiter";

const router = Router();

router.post("/ask", requireAuth, aiLimiter, askAIController);
router.post("/unread/:conversationId", requireAuth, getUnreadMessageCountController);
router.post("/unread-summary", requireAuth, aiLimiter, unreadMessageSummaryController);

export default router;