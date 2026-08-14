import { eq } from "drizzle-orm";

import { db } from "../../db";
import { pushSubscriptions } from "../../db/schema/push_subscriptions";

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