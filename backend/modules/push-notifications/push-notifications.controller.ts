import { Request, Response } from "express";

import { removePushSubscription, savePushSubscription } from "./push-notifications.service";

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

export async function unsubscribeFromPush(
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

        const { endpoint } = req.body;

        if (typeof endpoint !== "string") {
            return res.status(400).json({
                message: "Invalid push subscription endpoint.",
            });
        }

        await removePushSubscription(
            userId,
            endpoint
        );

        return res.json({
            success: true,
            message: "Push subscription removed.",
        });
    } catch (error) {
        console.error(
            "Unsubscribe from push error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to remove push subscription.",
        });
    }
}

// export async function testPushNotification(
//     req: Request,
//     res: Response
// ) {
//     try {
//         const userId = req.userId;

//         if (!userId) {
//             return res.status(401).json({
//                 message: "Unauthorized",
//             });
//         }

//         const sent =
//             await sendPushToUser(
//                 userId,
//                 {
//                     type: "test",
//                     title: "Relay",
//                     body: "Push notifications are working! 🎉",
//                     url: "/chat",
//                 }
//             );

//         return res.json({
//             success: true,
//             sent,
//         });
//     } catch (error) {
//         console.error(
//             "Test push error:",
//             error
//         );

//         return res.status(500).json({
//             message:
//                 "Failed to send test notification.",
//         });
//     }
// }