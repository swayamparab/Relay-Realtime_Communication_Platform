import { Server, Socket } from "socket.io";

import {
    getConversationParticipantIds,
    isParticipant,
} from "../../modules/conversation/conversation.service";

import {
    getGroupCallParticipants,
    isGroupCallFull,
    joinGroupCall,
    leaveGroupCall,
} from "../helpers/group-call-state";

import {
    createGroupCall,
    endGroupCall,
    getActiveGroupCall,
} from "../../services/group-call.service";

export function registerGroupCallEvents(
    io: Server,
    socket: Socket
) {

    socket.on(
        "group_call:start",
        async (
            {
                conversationId,
                type,
            }: {
                conversationId: string;
                type: "voice" | "video";
            },
            callback
        ) => {
            try {
                const allowed =
                    await isParticipant(
                        socket.userId,
                        conversationId
                    );

                if (!allowed) {
                    return callback?.({
                        success: false,
                        message: "Unauthorized",
                    });
                }

                const existingCall =
                    await getActiveGroupCall(
                        conversationId
                    );

                if (existingCall) {
                    return callback?.({
                        success: false,
                        message:
                            "A group call is already active.",
                    });
                }

                if (
                    isGroupCallFull(
                        conversationId
                    )
                ) {
                    return callback?.({
                        success: false,
                        message:
                            "Group call is full.",
                    });
                }

                const groupCall =
                    await createGroupCall(
                        conversationId,
                        socket.userId,
                        type
                    );

                joinGroupCall(
                    conversationId,
                    socket.userId
                );

                socket.join(
                    `group-call:${conversationId}`
                );

                socket.to(conversationId).emit(
                    "group_call:incoming",
                    {
                        conversationId,
                        callerId: socket.userId,
                        type,
                    });

                callback?.({
                    success: true,
                    type: groupCall.type,
                    participants:
                        getGroupCallParticipants(
                            conversationId
                        ),
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
        "group_call:join",
        async (
            {
                conversationId,
            }: {
                conversationId: string;
            },
            callback
        ) => {
            try {
                const allowed =
                    await isParticipant(
                        socket.userId,
                        conversationId
                    );

                if (!allowed) {
                    return callback?.({
                        success: false,
                        message: "Unauthorized",
                    });
                }

                const activeCall =
                    await getActiveGroupCall(
                        conversationId
                    );

                if (!activeCall) {
                    return callback?.({
                        success: false,
                        message:
                            "No active group call.",
                    });
                }

                if (
                    isGroupCallFull(
                        conversationId
                    )
                ) {
                    return callback?.({
                        success: false,
                        message:
                            "Group call is full.",
                    });
                }

                joinGroupCall(
                    conversationId,
                    socket.userId
                );

                socket.join(
                    `group-call:${conversationId}`
                );

                socket.to(
                    `group-call:${conversationId}`
                ).emit(
                    "group_call:user_joined",
                    {
                        userId: socket.userId,
                    }
                );

                callback?.({
                    success: true,
                    participants:
                        getGroupCallParticipants(
                            conversationId
                        ),
                    type: activeCall.type,
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
        "group_call:end",
        async (
            {
                conversationId,
            }: {
                conversationId: string;
            },
            callback
        ) => {
            try {
                const allowed =
                    await isParticipant(
                        socket.userId,
                        conversationId
                    );

                if (!allowed) {
                    return callback?.({
                        success: false,
                        message: "Unauthorized",
                    });
                }

                const activeCall =
                    await getActiveGroupCall(
                        conversationId
                    );

                if (!activeCall) {
                    return callback?.({
                        success: false,
                        message:
                            "No active group call.",
                    });
                }

                await endGroupCall(
                    conversationId
                );

                const participants =
                    getGroupCallParticipants(
                        conversationId
                    );

                // Remove everyone from in-memory
                // group-call state.
                participants.forEach((userId) => {
                    leaveGroupCall(
                        conversationId,
                        userId
                    );
                });

                // Notify everyone currently in the call.
                io.to(
                    `group-call:${conversationId}`
                ).emit(
                    "group_call:ended",
                    {
                        conversationId,
                    }
                );

                // Remove this socket from the room.
                socket.leave(
                    `group-call:${conversationId}`
                );

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
        "group_call:leave",
        async (
            {
                conversationId,
            }: {
                conversationId: string;
            },
            callback
        ) => {
            try {
                const allowed =
                    await isParticipant(
                        socket.userId,
                        conversationId
                    );

                if (!allowed) {
                    return callback?.({
                        success: false,
                        message: "Unauthorized",
                    });
                }

                const activeCall =
                    await getActiveGroupCall(
                        conversationId
                    );

                if (!activeCall) {
                    return callback?.({
                        success: false,
                        message:
                            "No active group call.",
                    });
                }

                // Remove user from in-memory call state
                leaveGroupCall(
                    conversationId,
                    socket.userId
                );

                // Remove socket from the call room
                socket.leave(
                    `group-call:${conversationId}`
                );

                // Tell remaining participants
                io.to(
                    `group-call:${conversationId}`
                ).emit(
                    "group_call:user_left",
                    {
                        userId: socket.userId,
                    }
                );

                const remainingParticipants =
                    getGroupCallParticipants(
                        conversationId
                    );

                // Last participant left
                if (
                    remainingParticipants.length === 0
                ) {
                    await endGroupCall(
                        conversationId
                    );

                    io.to(
                        `group-call:${conversationId}`
                    ).emit(
                        "group_call:ended",
                        {
                            conversationId,
                        }
                    );
                }

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
}