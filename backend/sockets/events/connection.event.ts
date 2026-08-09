import { Socket, Server } from "socket.io";
import { registerConversationEvents } from "./conversation.event";
import { registerMessageEvents } from "./message.event";
import { registerCallEvents } from "./call.event";
import { registerWebRTCEvents } from "./webrtc.event";
import { getOnlineUserIds, onlineUsers } from "../helpers/online-users";

import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { activeCalls } from "../helpers/active-calls";
import { registerGroupCallEvents } from "./group-call.event";
import { getGroupCallParticipants, getGroupCallsForUser, leaveGroupCall } from "../helpers/group-call-state";
import { endGroupCall, getActiveGroupCallsForUser } from "../../services/group-call.service";

export function handleConnection(io: Server, socket: Socket) {
  // console.log(`User ${socket.userId} connected`);

  //online status as user connects
  onlineUsers.set(socket.userId, socket.id);

  socket.join(socket.userId);

  io.emit("user_online", {
    userId: socket.userId
  })

  //get online users
  socket.emit("online_users", {
    userIds: getOnlineUserIds()
  })

  //join a conversation
  registerConversationEvents(io, socket);

  //send a message
  registerMessageEvents(io, socket);

  //call events
  registerCallEvents(io, socket);

  //webrtc events
  registerWebRTCEvents(io, socket);

  //group call events
  registerGroupCallEvents(io, socket);

  //offline status as user disconnects
  socket.on("disconnect", async () => {
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
          userId: socket.userId,
        }
      );

      if (
        remainingParticipants.length === 0
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

    // Existing one-to-one call cleanup
    onlineUsers.delete(socket.userId);
    activeCalls.delete(socket.userId);

    await db
      .update(users)
      .set({
        lastSeen: new Date(),
      })
      .where(
        eq(users.id, socket.userId)
      );

    io.emit("user_offline", {
      userId: socket.userId,
    });
  });
}