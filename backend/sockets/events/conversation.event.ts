import { isParticipant, markConversationAsRead } from "../../modules/conversation/conversation.service";
import { Server, Socket } from "socket.io";
import { clearActiveConversation, setActiveConversation } from "../helpers/active-conversations";

export function registerConversationEvents(io: Server, socket: Socket) {
    socket.on("join_conversation", async ({ conversationId }, callback) => {
        const allowed = await isParticipant(
            socket.userId,
            conversationId
        );

        if (!allowed) {
            return callback?.({
                success: false,
                message: "Unauthorized",
            });
        }

        socket.join(conversationId);

        callback?.({
            success: true,
        });
    });

    socket.on(
        "mark_conversation_read",
        async ({ conversationId }, callback) => {
            try {
                const allowed = await isParticipant(
                    socket.userId,
                    conversationId
                );

                if (!allowed) {
                    return callback?.({
                        success: false,
                        message: "Unauthorized",
                    });
                }

                const lastReadAt =
                    await markConversationAsRead(
                        conversationId,
                        socket.userId
                    );

                socket
                    .to(conversationId)
                    .emit("messages_seen", {
                        conversationId,
                        userId: socket.userId,
                        lastReadAt,
                    });

                callback?.({
                    success: true,
                });
            } catch (error) {
                callback?.({
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Internal Server Error",
                });
            }
        }
    );

    socket.on(
        "conversation:view",
        ({
            conversationId,
        }: {
            conversationId: string;
        }) => {
            setActiveConversation(
                socket.userId,
                conversationId
            );
        }
    );

    socket.on(
        "conversation:leave",
        () => {
            clearActiveConversation(
                socket.userId
            );
        }
    );
}