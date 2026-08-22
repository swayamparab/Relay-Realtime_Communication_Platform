import { Router } from "express";

import { requireAuth } from "../../middleware/auth";
import { askAIController } from "./ai.controller";

const router = Router();

router.post("/ask",requireAuth,askAIController);

export default router;