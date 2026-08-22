import { and, desc, eq } from "drizzle-orm";

import { db } from "../../db";
import { conversationParticipants, messages, } from "../../db/schema";

export async function getConversationContext(
    userId: string,
    conversationId: string
) {
    //Verify user belongs to conversation
    const participant =
        await db.query.conversationParticipants.findFirst({
            where: and(
                eq(
                    conversationParticipants.conversationId,
                    conversationId
                ),
                eq(
                    conversationParticipants.userId,
                    userId
                )
            ),
        });

    if (!participant) {
        throw new Error("Unauthorized");
    }

    //Fetch recent messages
    const conversationMessages =
        await db.query.messages.findMany({
            where: eq(
                messages.conversationId,
                conversationId
            ),

            with: {
                sender: {
                    columns: {
                        username: true,
                    },
                },
            },

            orderBy: (messages, { desc }) => [
                desc(messages.createdAt),
            ],

            limit: 50,
        });

    //Reverse so oldest → newest
    conversationMessages.reverse(); 

    //Convert messages into AI-readable context
    return conversationMessages
        .map((message) => {
            const content = message.content ?? `[${message.type} message]`;

            return `${message.sender.username}: ${content}`;
        })
        .join("\n");
}