import webpush from "web-push";

import { eq } from "drizzle-orm";
import { db } from "../../db";

import { pushSubscriptions } from "../../db/schema/push_subscriptions";

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export type PushPayload = {
    type: string;
    title: string;
    body: string;
    url?: string;
    conversationId?: string;
    [key: string]: unknown;
};

export async function sendPushNotification(
    subscription: webpush.PushSubscription,
    payload: PushPayload
) {
    try {
        await webpush.sendNotification(
            subscription,
            JSON.stringify(payload)
        );

        return true;
    } catch (error) {
        console.error(
            "Failed to send push notification:",
            error
        );

        return false;
    }
}

export interface SavePushSubscriptionInput {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export async function savePushSubscription(
    userId: string,
    data: SavePushSubscriptionInput
) {
    const existing =
        await db.query.pushSubscriptions.findFirst({
            where: eq(
                pushSubscriptions.endpoint,
                data.endpoint
            ),
        });

    if (existing) {
        const [updated] =
            await db
                .update(pushSubscriptions)
                .set({
                    userId,
                    p256dh: data.keys.p256dh,
                    auth: data.keys.auth,
                    updatedAt: new Date(),
                })
                .where(
                    eq(
                        pushSubscriptions.endpoint,
                        data.endpoint
                    )
                )
                .returning();

        return updated;
    }

    const [created] =
        await db
            .insert(pushSubscriptions)
            .values({
                userId,
                endpoint: data.endpoint,
                p256dh: data.keys.p256dh,
                auth: data.keys.auth,
            })
            .returning();

    return created;
}

export async function sendPushToUser(
    userId: string,
    payload: PushPayload
) {
    const subscriptions =
        await db
            .select()
            .from(pushSubscriptions)
            .where(
                eq(
                    pushSubscriptions.userId,
                    userId
                )
            );

    if (subscriptions.length === 0) {
        return 0;
    }

    let sent = 0;

    for (const subscription of subscriptions) {
        const success =
            await sendPushNotification(
                {
                    endpoint:
                        subscription.endpoint,

                    keys: {
                        p256dh:
                            subscription.p256dh,
                        auth:
                            subscription.auth,
                    },
                },
                payload
            );

        if (success) {
            sent++;
        }
    }

    return sent;
}

export async function notifyNewMessage(
    userId: string,
    data: {
        senderUsername: string;
        message: string;
        conversationId: string;
    }
) {
    return sendPushToUser(userId, {
        type: "new_message",
        title: data.senderUsername,
        body: data.message,
        url: `/chat/${data.conversationId}`,
        conversationId: data.conversationId,
    });
}

export async function notifyIncomingCall(
    userId: string,
    data: {
        callerUsername: string;
        conversationId: string;
        callType: "voice" | "video";
    }
) {
    return sendPushToUser(userId, {
        type: "incoming_call",

        title:
            data.callType === "video"
                ? "Incoming video call"
                : "Incoming voice call",

        body: `${data.callerUsername} is calling you`,

        url: `/chat/${data.conversationId}`,

        conversationId: data.conversationId,
    });
}