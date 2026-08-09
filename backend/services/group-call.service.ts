import { and, eq, isNull } from "drizzle-orm";

import { db } from "../db";
import {
    groupCalls,
    conversationParticipants,
} from "../db/schema";

export async function getActiveGroupCall(
    conversationId: string
) {
    return db.query.groupCalls.findFirst({
        where: and(
            eq(
                groupCalls.conversationId,
                conversationId
            ),
            isNull(groupCalls.endedAt)
        ),
    });
}

export async function getActiveGroupCallsForUser(
    userId: string
) {
    const activeCalls = await db
        .selectDistinct({
            conversationId:
                groupCalls.conversationId,
        })
        .from(groupCalls)
        .innerJoin(
            conversationParticipants,
            eq(
                conversationParticipants.conversationId,
                groupCalls.conversationId
            )
        )
        .where(
            and(
                eq(
                    conversationParticipants.userId,
                    userId
                ),
                isNull(groupCalls.endedAt)
            )
        );

    return activeCalls;
}

export async function createGroupCall(
    conversationId: string,
    startedBy: string,
    type: "voice" | "video"
) {
    // Safety check: don't allow multiple
    // active calls for the same conversation.
    const existingCall =
        await getActiveGroupCall(
            conversationId
        );

    if (existingCall) {
        throw new Error(
            "A group call is already active."
        );
    }

    const [groupCall] = await db
        .insert(groupCalls)
        .values({
            conversationId,
            startedBy,
            type,
        })
        .returning();

    return groupCall;
}

export async function endGroupCall(
    conversationId: string
) {
    const activeCall =
        await getActiveGroupCall(
            conversationId
        );

    if (!activeCall) {
        return null;
    }

    const [groupCall] = await db
        .update(groupCalls)
        .set({
            endedAt: new Date(),
        })
        .where(
            eq(
                groupCalls.id,
                activeCall.id
            )
        )
        .returning();

    return groupCall;
}