import { Server, Socket } from "socket.io";

import {
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

import { db } from "../../db";
import { eq } from "drizzle-orm";
import { users } from "../../db/schema";

async function getUsername(userId: string) {
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
            username: true,
        },
    });

    return user?.username ?? "Unknown";
}

async function getParticipantsWithUsernames(
    conversationId: string
) {
    const participantIds =
        getGroupCallParticipants(
            conversationId
        );

    return Promise.all(
        participantIds.map(
            async (userId) => ({
                id: userId,
                username:
                    await getUsername(userId),
            })
        )
    );
}

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

                // Ring all other conversation members.
                socket.to(conversationId).emit(
                    "group_call:incoming",
                    {
                        conversationId,
                        callerId:
                            socket.userId,
                        type,
                    }
                );

                const participants =
                    await getParticipantsWithUsernames(
                        conversationId
                    );

                callback?.({
                    success: true,
                    type: groupCall.type,
                    participants,
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

                const username =
                    await getUsername(
                        socket.userId
                    );

                // Tell existing participants
                // who joined.
                socket.to(
                    `group-call:${conversationId}`
                ).emit(
                    "group_call:user_joined",
                    {
                        userId:
                            socket.userId,
                        username,
                    }
                );

                const participants =
                    await getParticipantsWithUsernames(
                        conversationId
                    );

                callback?.({
                    success: true,
                    participants,
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

                participants.forEach(
                    (userId) => {
                        leaveGroupCall(
                            conversationId,
                            userId
                        );
                    }
                );

                io.to(
                    `group-call:${conversationId}`
                ).emit(
                    "group_call:ended",
                    {
                        conversationId,
                    }
                );

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

                leaveGroupCall(
                    conversationId,
                    socket.userId
                );

                socket.leave(
                    `group-call:${conversationId}`
                );

                io.to(
                    `group-call:${conversationId}`
                ).emit(
                    "group_call:user_left",
                    {
                        userId:
                            socket.userId,
                    }
                );

                const remainingParticipants =
                    getGroupCallParticipants(
                        conversationId
                    );

                if (
                    remainingParticipants.length ===
                    0
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

    socket.on(
        "group_call:camera_state",
        async (
            {
                conversationId,
                enabled,
            }: {
                conversationId: string;
                enabled: boolean;
            }
        ) => {
            try {
                const allowed =
                    await isParticipant(
                        socket.userId,
                        conversationId
                    );

                if (!allowed) {
                    return;
                }

                const activeCall =
                    await getActiveGroupCall(
                        conversationId
                    );

                if (!activeCall) {
                    return;
                }

                socket
                    .to(`group-call:${conversationId}`)
                    .emit(
                        "group_call:remote_camera_state",
                        {
                            userId:
                                socket.userId,
                            enabled,
                        }
                    );
            } catch (error) {
                console.error(
                    "Failed to broadcast group camera state:",
                    error
                );
            }
        }
    );

    socket.on(
        "group_call:mute_state",
        async (
            {
                conversationId,
                muted,
            }: {
                conversationId: string;
                muted: boolean;
            }
        ) => {
            try {
                const allowed =
                    await isParticipant(
                        socket.userId,
                        conversationId
                    );

                if (!allowed) {
                    return;
                }

                const activeCall =
                    await getActiveGroupCall(
                        conversationId
                    );

                if (!activeCall) {
                    return;
                }

                socket
                    .to(`group-call:${conversationId}`)
                    .emit(
                        "group_call:remote_mute_state",
                        {
                            userId:
                                socket.userId,
                            muted,
                        }
                    );
            } catch (error) {
                console.error(
                    "Failed to broadcast group mute state:",
                    error
                );
            }
        }
    );
}