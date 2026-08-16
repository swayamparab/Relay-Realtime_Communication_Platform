import { db } from "../../db";
import { CreateMessageInput, deleteMessageInput, EditMessageInput, GetMessagesInput, SendMessageInput } from "./message.validation";
import { conversationParticipants, conversations, messages } from "../../db/schema";
import { and, eq, lt, ne } from "drizzle-orm";
import cloudinary from "../../lib/cloudinary";
import { notifyNewMessage } from "../push-notifications/push-notifications.service";
import { isUserViewingConversation } from "../../sockets/helpers/active-conversations";

export async function getMessages(
    userId: string,
    data: GetMessagesInput
) {
    const participant =
        await db.query.conversationParticipants.findFirst({
            where: and(
                eq(
                    conversationParticipants.conversationId,
                    data.conversationId
                ),
                eq(
                    conversationParticipants.userId,
                    userId
                )
            )
        });

    if (!participant) {
        throw new Error("Unauthorized");
    }

    const otherParticipant =
        await db.query.conversationParticipants.findFirst({
            where: and(
                eq(
                    conversationParticipants.conversationId,
                    data.conversationId
                ),
                ne(
                    conversationParticipants.userId,
                    userId
                )
            ),
            columns: {
                lastReadAt: true,
            },
        });

    const beforeMessage = data.before
        ? await db.query.messages.findFirst({
            where: and(
                eq(messages.id, data.before),
                eq(messages.conversationId, data.conversationId)
            ),
            columns: {
                createdAt: true,
            },
        })
        : null;

    const conversationMessages =
        await db.query.messages.findMany({
            where: and(
                eq(messages.conversationId, data.conversationId),
                beforeMessage
                    ? lt(messages.createdAt, beforeMessage.createdAt)
                    : undefined
            ),

            with: {
                conversation: {
                    columns: {
                        type: true
                    }
                },

                sender: {
                    columns: {
                        id: true,
                        username: true,
                    },
                },
                replyTo: {
                    columns: {
                        id: true,
                        type: true,
                        content: true,
                        attachmentUrl: true,
                    },
                    with: {
                        sender: {
                            columns: {
                                id: true,
                                username: true,
                            },
                        },
                    },
                },
            },

            orderBy: (messages, { desc }) => [
                desc(messages.createdAt),
            ],

            limit: data.limit + 1,
        });

    const hasMore = conversationMessages.length > data.limit;

    if (hasMore) {
        conversationMessages.pop();
    }

    const nextCursor =
        conversationMessages.length > 0
            ? conversationMessages[conversationMessages.length - 1].id
            : null;

    conversationMessages.reverse();

    return {
        messages: conversationMessages,
        lastReadAt: otherParticipant?.lastReadAt ?? null,
        nextCursor,
        hasMore,
    };
}

export async function sendMessage(userId: string, data: CreateMessageInput) {
    const participant = await db.query.conversationParticipants.findFirst({
        where: and(
            eq(conversationParticipants.userId, userId),
            eq(conversationParticipants.conversationId, data.conversationId)
        ),
    });

    if (!participant) {
        throw new Error("You are not a participant of this conversation");
    }

    const repliedMessage = data.replyToMessageId
        ? await db.query.messages.findFirst({
            where: eq(messages.id, data.replyToMessageId),
            columns: {
                id: true,
                conversationId: true,
            },
        })
        : undefined;

    if (data.replyToMessageId) {
        if (!repliedMessage) {
            throw new Error("Reply message not found");
        }

        if (repliedMessage.conversationId !== data.conversationId) {
            throw new Error("Cannot reply to a message from another conversation");
        }
    }

    const message = await db.transaction(async (tx) => {
        const [insertedMessage] = await tx
            .insert(messages)
            .values({
                conversationId: data.conversationId,

                senderId: userId,

                type: data.type,

                content: data.content ?? null,

                attachmentUrl: data.attachmentUrl,

                attachmentPublicId: data.attachmentPublicId,

                attachmentMimeType: data.attachmentMimeType,

                attachmentName: data.attachmentName,

                attachmentSize: data.attachmentSize,

                duration: data.duration,

                waveform: data.waveform,

                replyToMessageId: data.replyToMessageId,
            })
            .returning();

        await tx
            .update(conversations)
            .set({
                updatedAt: new Date(),
            })
            .where(eq(conversations.id, data.conversationId));

        const message = await tx.query.messages.findFirst({
            where: eq(messages.id, insertedMessage.id),
            with: {
                conversation: {
                    columns: {
                        type: true,
                        groupName: true
                    },
                },

                sender: {
                    columns: {
                        id: true,
                        username: true,
                    },
                },

                replyTo: {
                    columns: {
                        id: true,
                        type: true,
                        content: true,
                        attachmentUrl: true,
                    },
                    with: {
                        sender: {
                            columns: {
                                id: true,
                                username: true,
                            },
                        },
                    },
                },
            }
        });

        if (!message) {
            throw new Error("Failed to fetch message");
        }

        return message;
    });

    const otherParticipants =
        await db.query.conversationParticipants.findMany({
            where: and(
                eq(
                    conversationParticipants.conversationId,
                    data.conversationId
                ),
                ne(
                    conversationParticipants.userId,
                    userId
                )
            ),
            columns: {
                userId: true,
            },
        });

    for (const participant of otherParticipants) {
        const isViewing =
            isUserViewingConversation(
                participant.userId,
                data.conversationId
            );

        if (!isViewing) {
            await notifyNewMessage(
                participant.userId,
                {
                    senderUsername:
                        message.sender.username,

                    message:
                        message.content ??
                        getNotificationMessage(
                            message.type
                        ),

                    conversationId:
                        data.conversationId,

                    conversationType:
                        message.conversation.type,

                    groupName:
                        message.conversation.groupName,
                }
            );
        }
    }

    return message;
}

export async function deleteMessage(
    userId: string,
    data: deleteMessageInput
) {
    const message = await db.query.messages.findFirst({
        where: eq(messages.id, data.messageId),
    });

    if (!message) {
        throw new Error("Message not found");
    }

    if (message.senderId !== userId) {
        throw new Error("Unauthorized");
    }

    if (
        (message.type === "image" || message.type === "video" || message.type === "file" || message.type === "voice") &&
        message.attachmentPublicId
    ) {
        try {

            let resourceType: "image" | "video" | "raw";

            if (
                message.type === "video" ||
                message.type === "voice"
            ) {
                resourceType = "video";
            } else {
                resourceType = "image";
            }

            const result = await cloudinary.uploader.destroy(
                message.attachmentPublicId,
                {
                    resource_type: resourceType,
                }
            );

            if (result.result !== "ok") {
                throw new Error(
                    `Cloudinary delete failed: ${result.result}`
                );
            }

        } catch (error) {
            console.error(
                "Failed to delete image from Cloudinary:",
                error
            );
        }
    }

    await db.delete(messages).where(eq(messages.id, data.messageId));

    return {
        messageId: message.id,
        conversationId: message.conversationId,
    };
}

export async function editMessage(userId: string, data: EditMessageInput) {

    const message = await db.query.messages.findFirst({
        where: eq(messages.id, data.messageId)
    })

    if (!message) {
        throw new Error("Message not found");
    }

    if (message.senderId !== userId) {
        throw new Error("Unauthorized");
    }

    const [updatedMessage] = await db.update(messages).set({
        content: data.content,
        editedAt: new Date()
    })
        .where(eq(messages.id, data.messageId))
        .returning()

    const fullMessage = await db.query.messages.findFirst({
        where: eq(messages.id, updatedMessage.id),
        with: {
            sender: {
                columns: {
                    id: true,
                    username: true,
                },
            },
            replyTo: {
                columns: {
                    id: true,
                    type: true,
                    content: true,
                    attachmentUrl: true,
                },
                with: {
                    sender: {
                        columns: {
                            id: true,
                            username: true,
                        },
                    },
                },
            },
        },
    })

    if (!fullMessage) {
        throw new Error("Failed to fetch updated message");
    }

    return fullMessage;

}

function getNotificationMessage(type: string) {
    switch (type) {
        case "image":
            return "📷 Image";

        case "video":
            return "🎥 Video";

        case "file":
            return "📎 File";

        case "voice":
            return "🎤 Voice message";

        default:
            return "New message";
    }
}