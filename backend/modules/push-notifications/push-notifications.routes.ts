import { Router } from "express";

import { requireAuth } from "../../middleware/auth";

import { subscribeToPush } from "./push-notifications.controller";

const router = Router();

router.post("/subscribe",requireAuth,subscribeToPush);

export default router;