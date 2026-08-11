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
    addGroupCallInvite,
    hasGroupCallInvite,
    removeGroupCallInvite,
    clearGroupCallInvites,
} from "../helpers/group-call-invites";

import {
    createGroupCall,
    endGroupCall,
    getActiveGroupCall,
} from "../../services/group-call.service";

import { db } from "../../db";
import { eq } from "drizzle-orm";
import { users } from "../../db/schema";

import { activeCalls } from "../helpers/active-calls";
import { getSocketId } from "../helpers/online-users";

type CallType = "voice" | "video";

const GROUP_CALL_ROOM = (conversationId: string) =>
    `group-call:${conversationId}`;

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
        getGroupCallParticipants(conversationId);

    return Promise.all(
        participantIds.map(async (userId) => ({
            id: userId,
            username: await getUsername(userId),
        }))
    );
}

export function registerGroupCallEvents(
    io: Server,
    socket: Socket
) {
    /*
     * ============================================================
     * PROMOTE ONE-TO-ONE CALL → GROUP CALL
     * ============================================================
     */
    socket.on(
        "group_call:promote",
        async (
            {
                conversationId,
                type,
                userId,
            }: {
                conversationId: string;
                type: CallType;
                userId: string;
            },
            callback
        ) => {
            try {
                /*
                 * Promoter must belong to conversation.
                 */
                const allowed = await isParticipant(
                    socket.userId,
                    conversationId
                );

                if (!allowed) {
                    return callback?.({
                        success: false,
                        message: "Unauthorized.",
                    });
                }

                /*
                 * Cannot invite yourself.
                 */
                if (userId === socket.userId) {
                    return callback?.({
                        success: false,
                        message:
                            "You cannot add yourself to the call.",
                    });
                }

                /*
                 * Target must belong to conversation.
                 */
                const targetAllowed =
                    await isParticipant(
                        userId,
                        conversationId
                    );

                if (!targetAllowed) {
                    return callback?.({
                        success: false,
                        message:
                            "User is not a conversation participant.",
                    });
                }

                /*
                 * Target cannot already be in another
                 * one-to-one call.
                 */
                if (activeCalls.has(userId)) {
                    return callback?.({
                        success: false,
                        message:
                            "User is already on another call.",
                    });
                }

                /*
                 * There must not already be a group call.
                 */
                const existingGroupCall =
                    await getActiveGroupCall(
                        conversationId
                    );

                if (existingGroupCall) {
                    return callback?.({
                        success: false,
                        message:
                            "A group call is already active.",
                    });
                }

                /*
                 * Find the two users currently involved
                 * in the one-to-one call.
                 */
                const conversationParticipantIds =
                    await getConversationParticipantIds(
                        conversationId
                    );

                const activeParticipants =
                    conversationParticipantIds.filter(
                        (id) =>
                            activeCalls.has(id)
                    );

                if (
                    activeParticipants.length !== 2
                ) {
                    return callback?.({
                        success: false,
                        message:
                            "No active one-to-one call found.",
                    });
                }

                /*
                 * Promoter must be one of the active
                 * one-to-one participants.
                 */
                if (
                    !activeParticipants.includes(
                        socket.userId
                    )
                ) {
                    return callback?.({
                        success: false,
                        message:
                            "You are not part of the active call.",
                    });
                }

                /*
                 * Create group call.
                 */
                const groupCall =
                    await createGroupCall(
                        conversationId,
                        socket.userId,
                        type
                    );

                /*
                 * Move existing one-to-one participants
                 * into group-call state.
                 */
                for (
                    const participantId of
                    activeParticipants
                ) {
                    activeCalls.delete(
                        participantId
                    );

                    joinGroupCall(
                        conversationId,
                        participantId
                    );

                    const socketId =
                        getSocketId(
                            participantId
                        );

                    if (socketId) {
                        const participantSocket =
                            io.sockets.sockets.get(
                                socketId
                            );

                        participantSocket?.join(
                            GROUP_CALL_ROOM(
                                conversationId
                            )
                        );
                    }
                }

                /*
                 * Create invitation for new participant.
                 */
                addGroupCallInvite(
                    conversationId,
                    userId
                );

                const participants =
                    await getParticipantsWithUsernames(
                        conversationId
                    );

                /*
                 * Tell existing call participants
                 * that the call has become a group call.
                 */
                io.to(
                    GROUP_CALL_ROOM(
                        conversationId
                    )
                ).emit(
                    "group_call:promoted",
                    {
                        conversationId,
                        type: groupCall.type,
                        participants,
                    }
                );

                /*
                 * Invite selected user.
                 */
                const callerUsername =
                    await getUsername(
                        socket.userId
                    );

                io.to(userId).emit(
                    "group_call:participant_invited",
                    {
                        conversationId,
                        callerId:
                            socket.userId,
                        callerUsername,
                        type: groupCall.type,
                    }
                );

                callback?.({
                    success: true,
                    type: groupCall.type,
                    participants,
                });
            } catch (error) {
                console.error(
                    "group_call:promote error:",
                    error
                );

                callback?.({
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Internal Server Error.",
                });
            }
        }
    );

    /*
     * ============================================================
     * ADD PARTICIPANT TO EXISTING GROUP CALL
     * ============================================================
     */
    socket.on(
        "group_call:add_participant",
        async (
            {
                conversationId,
                userId,
            }: {
                conversationId: string;
                userId: string;
            },
            callback
        ) => {
            try {
                /*
                 * Group call must exist.
                 */
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

                /*
                 * Inviter must actually be inside
                 * the group call.
                 */
                const currentParticipants =
                    getGroupCallParticipants(
                        conversationId
                    );

                if (
                    !currentParticipants.includes(
                        socket.userId
                    )
                ) {
                    return callback?.({
                        success: false,
                        message:
                            "You are not part of the active group call.",
                    });
                }

                /*
                 * Cannot invite yourself.
                 */
                if (userId === socket.userId) {
                    return callback?.({
                        success: false,
                        message:
                            "You cannot add yourself to the call.",
                    });
                }

                /*
                 * Target must be a conversation member.
                 */
                const invitedUserAllowed =
                    await isParticipant(
                        userId,
                        conversationId
                    );

                if (!invitedUserAllowed) {
                    return callback?.({
                        success: false,
                        message:
                            "User is not a conversation participant.",
                    });
                }

                /*
                 * Target cannot already be in call.
                 */
                if (
                    currentParticipants.includes(
                        userId
                    )
                ) {
                    return callback?.({
                        success: false,
                        message:
                            "User is already in the call.",
                    });
                }

                /*
                 * Target cannot be in another
                 * one-to-one call.
                 */
                if (activeCalls.has(userId)) {
                    return callback?.({
                        success: false,
                        message:
                            "User is already on another call.",
                    });
                }

                /*
                 * Check capacity.
                 */
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

                /*
                 * Don't create duplicate invitation.
                 */
                if (
                    hasGroupCallInvite(
                        conversationId,
                        userId
                    )
                ) {
                    return callback?.({
                        success: false,
                        message:
                            "User has already been invited.",
                    });
                }

                /*
                 * Store invitation.
                 */
                addGroupCallInvite(
                    conversationId,
                    userId
                );

                const callerUsername =
                    await getUsername(
                        socket.userId
                    );

                /*
                 * Send invitation directly to
                 * selected user.
                 */
                io.to(userId).emit(
                    "group_call:participant_invited",
                    {
                        conversationId,
                        callerId:
                            socket.userId,
                        callerUsername,
                        type: activeCall.type,
                    }
                );

                callback?.({
                    success: true,
                });
            } catch (error) {
                console.error(
                    "group_call:add_participant error:",
                    error
                );

                callback?.({
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Internal Server Error.",
                });
            }
        }
    );

    /*
     * ============================================================
     * START GROUP CALL
     * ============================================================
     */
    socket.on(
        "group_call:start",
        async (
            {
                conversationId,
                type,
            }: {
                conversationId: string;
                type: CallType;
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
                        message: "Unauthorized.",
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
                    GROUP_CALL_ROOM(
                        conversationId
                    )
                );

                /*
                 * Notify other conversation members.
                 */
                socket
                    .to(conversationId)
                    .emit(
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
                console.error(
                    "group_call:start error:",
                    error
                );

                callback?.({
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Internal Server Error.",
                });
            }
        }
    );

    /*
     * ============================================================
     * JOIN GROUP CALL
     * ============================================================
     */
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

                /*
                 * Check whether already in call
                 * before checking capacity.
                 */
                const currentParticipants =
                    getGroupCallParticipants(
                        conversationId
                    );

                if (
                    currentParticipants.includes(
                        socket.userId
                    )
                ) {
                    return callback?.({
                        success: false,
                        message:
                            "You are already in the call.",
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

                /*
                 * Normal participant OR explicitly
                 * invited user can join.
                 */
                const participant =
                    await isParticipant(
                        socket.userId,
                        conversationId
                    );

                const invited =
                    hasGroupCallInvite(
                        conversationId,
                        socket.userId
                    );

                if (!participant && !invited) {
                    return callback?.({
                        success: false,
                        message:
                            "You are not allowed to join this call.",
                    });
                }

                /*
                 * If joining through invitation,
                 * consume it.
                 */
                if (invited) {
                    removeGroupCallInvite(
                        conversationId,
                        socket.userId
                    );
                }

                joinGroupCall(
                    conversationId,
                    socket.userId
                );

                socket.join(
                    GROUP_CALL_ROOM(
                        conversationId
                    )
                );

                const username =
                    await getUsername(
                        socket.userId
                    );

                /*
                 * Tell existing participants.
                 */
                socket
                    .to(
                        GROUP_CALL_ROOM(
                            conversationId
                        )
                    )
                    .emit(
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
                console.error(
                    "group_call:join error:",
                    error
                );

                callback?.({
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Internal Server Error.",
                });
            }
        }
    );

    /*
     * ============================================================
     * DECLINE GROUP CALL INVITATION
     * ============================================================
     */
    socket.on(
        "group_call:decline",
        async (
            {
                conversationId,
            }: {
                conversationId: string;
            },
            callback
        ) => {
            try {
                removeGroupCallInvite(
                    conversationId,
                    socket.userId
                );

                callback?.({
                    success: true,
                });
            } catch (error) {
                console.error(
                    "group_call:decline error:",
                    error
                );

                callback?.({
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Internal Server Error.",
                });
            }
        }
    );

    /*
     * ============================================================
     * END GROUP CALL
     * ============================================================
     */
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

                const participants =
                    getGroupCallParticipants(
                        conversationId
                    );

                /*
                 * Only an actual call participant
                 * can end the call.
                 */
                if (
                    !participants.includes(
                        socket.userId
                    )
                ) {
                    return callback?.({
                        success: false,
                        message:
                            "You are not part of the group call.",
                    });
                }

                await endGroupCall(
                    conversationId
                );

                /*
                 * Remove all users from state.
                 */
                participants.forEach(
                    (userId) => {
                        leaveGroupCall(
                            conversationId,
                            userId
                        );
                    }
                );

                /*
                 * Remove pending invitations.
                 */
                clearGroupCallInvites(
                    conversationId
                );

                /*
                 * Notify participants BEFORE
                 * removing them from the room.
                 */
                io.to(
                    GROUP_CALL_ROOM(
                        conversationId
                    )
                ).emit(
                    "group_call:ended",
                    {
                        conversationId,
                    }
                );

                /*
                 * Remove sockets from room.
                 */
                io.in(
                    GROUP_CALL_ROOM(
                        conversationId
                    )
                ).socketsLeave(
                    GROUP_CALL_ROOM(
                        conversationId
                    )
                );

                callback?.({
                    success: true,
                });
            } catch (error) {
                console.error(
                    "group_call:end error:",
                    error
                );

                callback?.({
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Internal Server Error.",
                });
            }
        }
    );

    /*
     * ============================================================
     * LEAVE GROUP CALL
     * ============================================================
     */
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

                const participants =
                    getGroupCallParticipants(
                        conversationId
                    );

                if (
                    !participants.includes(
                        socket.userId
                    )
                ) {
                    return callback?.({
                        success: false,
                        message:
                            "You are not part of the group call.",
                    });
                }

                leaveGroupCall(
                    conversationId,
                    socket.userId
                );

                removeGroupCallInvite(
                    conversationId,
                    socket.userId
                );

                socket.leave(
                    GROUP_CALL_ROOM(
                        conversationId
                    )
                );

                /*
                 * Notify remaining participants.
                 */
                socket
                    .to(
                        GROUP_CALL_ROOM(
                            conversationId
                        )
                    )
                    .emit(
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

                /*
                 * Nobody remains.
                 */
                if (
                    remainingParticipants.length ===
                    0
                ) {
                    await endGroupCall(
                        conversationId
                    );

                    clearGroupCallInvites(
                        conversationId
                    );

                    io.to(
                        GROUP_CALL_ROOM(
                            conversationId
                        )
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
                console.error(
                    "group_call:leave error:",
                    error
                );

                callback?.({
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Internal Server Error.",
                });
            }
        }
    );

    /*
     * ============================================================
     * CAMERA STATE
     * ============================================================
     */
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
                const activeCall =
                    await getActiveGroupCall(
                        conversationId
                    );

                if (!activeCall) {
                    return;
                }

                const participants =
                    getGroupCallParticipants(
                        conversationId
                    );

                if (
                    !participants.includes(
                        socket.userId
                    )
                ) {
                    return;
                }

                socket
                    .to(
                        GROUP_CALL_ROOM(
                            conversationId
                        )
                    )
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

    /*
     * ============================================================
     * MUTE STATE
     * ============================================================
     */
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
                const activeCall =
                    await getActiveGroupCall(
                        conversationId
                    );

                if (!activeCall) {
                    return;
                }

                const participants =
                    getGroupCallParticipants(
                        conversationId
                    );

                if (
                    !participants.includes(
                        socket.userId
                    )
                ) {
                    return;
                }

                socket
                    .to(
                        GROUP_CALL_ROOM(
                            conversationId
                        )
                    )
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