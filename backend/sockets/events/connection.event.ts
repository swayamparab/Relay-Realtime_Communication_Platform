import { Socket, Server } from "socket.io";

import { registerConversationEvents } from "./conversation.event";
import { registerMessageEvents } from "./message.event";
import { registerCallEvents } from "./call.event";
import { registerWebRTCEvents } from "./webrtc.event";

import {
    addOnlineUser,
    removeOnlineUser,
    getOnlineUserIds,
} from "../helpers/online-users";

import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

import { activeCalls } from "../helpers/active-calls";

import { registerGroupCallEvents } from "./group-call.event";

import {
    leaveGroupCall,
    getGroupCallParticipants,
} from "../helpers/group-call-state";

import { getActiveGroupCallsForUser } from "../../services/group-call.service";
import { endGroupCall } from "../../services/group-call.service";

import { clearActiveConversation } from "../helpers/active-conversations";

export function handleConnection(
    io: Server,
    socket: Socket
) {
  
    // ONLINE STATUS

    addOnlineUser(
        socket.userId,
        socket.id
    );

    socket.join(socket.userId);

    io.emit("user_online", {
        userId: socket.userId,
    });

    // Send current online users
    socket.emit("online_users", {
        userIds: getOnlineUserIds(),
    });

  
    // CONVERSATION EVENTS

    registerConversationEvents(
        io,
        socket
    );

  
    // MESSAGE EVENTS
  
    registerMessageEvents(
        io,
        socket
    );

  
    // CALL EVENTS

    registerCallEvents(
        io,
        socket
    );

  
    // WEBRTC EVENTS

    registerWebRTCEvents(
        io,
        socket
    );


    // GROUP CALL EVENTS

    registerGroupCallEvents(
        io,
        socket
    );

  
    // DISCONNECT

    socket.on(
        "disconnect",
        async () => {
            clearActiveConversation(
                socket.userId
            );

  
            // GROUP CALL CLEANUP

            const userActiveCalls =
                await getActiveGroupCallsForUser(
                    socket.userId
                );

            for (const call of userActiveCalls) {
                leaveGroupCall(
                    call.conversationId,
                    socket.userId
                );

                const remainingParticipants =
                    getGroupCallParticipants(
                        call.conversationId
                    );

                io.to(
                    `group-call:${call.conversationId}`
                ).emit(
                    "group_call:user_left",
                    {
                        userId:
                            socket.userId,
                    }
                );

                if (
                    remainingParticipants.length ===
                    0
                ) {
                    await endGroupCall(
                        call.conversationId
                    );

                    io.to(
                        `group-call:${call.conversationId}`
                    ).emit(
                        "group_call:ended",
                        {
                            conversationId:
                                call.conversationId,
                        }
                    );
                }
            }

  
            // ONLINE STATUS

            const wentOffline =
                removeOnlineUser(
                    socket.userId,
                    socket.id
                );

            /*
             * Only mark the user offline if
             * this was their LAST active socket.
             */
            if (!wentOffline) {
                return;
            }

  
            // ONE-TO-ONE CALL CLEANUP

            activeCalls.delete(
                socket.userId
            );

            // LAST SEEN

            await db
                .update(users)
                .set({
                    lastSeen: new Date(),
                })
                .where(
                    eq(
                        users.id,
                        socket.userId
                    )
                );

  
            // NOTIFY CLIENTS

            io.emit("user_offline", {
                userId:
                    socket.userId,
            });
        }
    );
}