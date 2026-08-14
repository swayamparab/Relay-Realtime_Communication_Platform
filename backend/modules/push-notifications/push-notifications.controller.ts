import { Request, Response } from "express";

import { savePushSubscription } from "./push-notifications.service";

export async function subscribeToPush(
    req: Request,
    res: Response
) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const {
            endpoint,
            keys,
        } = req.body;

        if (
            typeof endpoint !== "string" ||
            typeof keys?.p256dh !== "string" ||
            typeof keys?.auth !== "string"
        ) {
            return res.status(400).json({
                message: "Invalid push subscription.",
            });
        }

        await savePushSubscription(
            userId,
            {
                endpoint,
                keys: {
                    p256dh: keys.p256dh,
                    auth: keys.auth,
                },
            }
        );

        return res.status(201).json({
            success: true,
            message: "Push subscription saved.",
        });
    } catch (error) {
        console.error(
            "Subscribe to push error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to save push subscription.",
        });
    }
}