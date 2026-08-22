import webpush from "web-push";

import { and, eq } from "drizzle-orm";
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
    const [subscription] =
        await db
            .insert(pushSubscriptions)
            .values({
                userId,
                endpoint: data.endpoint,
                p256dh: data.keys.p256dh,
                auth: data.keys.auth,
            })
            .onConflictDoUpdate({
                target: pushSubscriptions.endpoint,
                set: {
                    userId,
                    p256dh: data.keys.p256dh,
                    auth: data.keys.auth,
                    updatedAt: new Date(),
                },
            })
            .returning();

    return subscription;
}

export async function removePushSubscription(
    userId: string,
    endpoint: string
) {
    const [deleted] =
        await db
            .delete(pushSubscriptions)
            .where(
                and(
                    eq(
                        pushSubscriptions.userId,
                        userId
                    ),
                    eq(
                        pushSubscriptions.endpoint,
                        endpoint
                    )
                )
            )
            .returning();

    return deleted;
}

export async function removeExpiredPushSubscription(
    endpoint: string
) {
    await db
        .delete(pushSubscriptions)
        .where(
            eq(
                pushSubscriptions.endpoint,
                endpoint
            )
        );
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
        try {
            await webpush.sendNotification(
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
                JSON.stringify(payload)
            );

            sent++;
        } catch (error: any) {
            console.error(
                "Failed to send push notification:",
                error
            );

            /*
             * 404 / 410 means the push subscription
             * is no longer valid.
             *
             * Remove it from the database so we
             * don't keep trying to send to it.
             */
            if (
                error?.statusCode === 404 ||
                error?.statusCode === 410
            ) {
                await removeExpiredPushSubscription(
                    subscription.endpoint
                );

                console.log(
                    "Removed expired push subscription:",
                    subscription.endpoint
                );
            }
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
        conversationType: "direct" | "group";
        groupName?: string | null;
    }
) {
    const isGroup =
        data.conversationType === "group";

    return sendPushToUser(userId, {
        type: "new_message",

        title: isGroup
            ? data.groupName || "Group"
            : data.senderUsername,

        body: isGroup
            ? `${data.senderUsername}: ${data.message}`
            : data.message,

        url:
            `/chat/${data.conversationId}`,

        conversationId:
            data.conversationId,
    });
}

export async function notifyIncomingCall(
    userId: string,
    data: {
        callerUsername: string;
        conversationId: string;
        callType: "voice" | "video";
        isGroupCall?: boolean;
        groupName?: string | null;
    }
) {
    const callLabel =
        data.callType === "video"
            ? "video call"
            : "voice call";

    if (data.isGroupCall) {
        return sendPushToUser(userId, {
            type: "incoming_group_call",

            title:
                data.groupName ||
                "Group call",

            body:
                `${data.callerUsername} invited you to a ${callLabel}`,

            url:
                `/chat/${data.conversationId}`,

            conversationId:
                data.conversationId,
        });
    }

    return sendPushToUser(userId, {
        type: "incoming_call",

        title:
            data.callType === "video"
                ? "Incoming video call"
                : "Incoming voice call",

        body:
            `${data.callerUsername} is calling you`,

        url:
            `/chat/${data.conversationId}`,

        conversationId:
            data.conversationId,
    });
}