import { Router } from "express";

import { requireAuth } from "../../middleware/auth";

import { subscribeToPush, unsubscribeFromPush } from "./push-notifications.controller";

const router = Router();

// router.post("/test",requireAuth,testPushNotification);
router.post("/subscribe",requireAuth,subscribeToPush);
router.delete("/subscribe",requireAuth,unsubscribeFromPush);


export default router;