import { getSocketServer } from "../socket-server";
import {
    getSocketIds,
} from "./online-users";

// USER SOCKETS

export function getUserSockets(userId: string) {
    const socketIds =
        getSocketIds(userId);

    if (socketIds.size === 0) {
        return [];
    }

    const io = getSocketServer();

    return Array.from(socketIds)
        .map((socketId) =>
            io.sockets.sockets.get(socketId)
        )
        .filter(
            (socket): socket is NonNullable<typeof socket> =>
                !!socket
        );
}

export function joinUserToConversation(
    userId: string,
    conversationId: string
) {
    for (const socket of getUserSockets(userId)) {
        socket.join(conversationId);
    }
}

export function leaveUserFromConversation(
    userId: string,
    conversationId: string
) {
    for (const socket of getUserSockets(userId)) {
        socket.leave(conversationId);
    }
}

export function emitToUser<T>(
    userId: string,
    event: string,
    payload: T
) {
    for (const socket of getUserSockets(userId)) {
        socket.emit(event, payload);
    }
}

// GROUP EVENTS

type GroupUpdatedPayload = {
    conversationId: string;
    groupName: string;
    groupAvatar: string | null;
};

type MemberAddedPayload = {
    conversationId: string;
    memberIds: string[];
};

type MemberRemovedPayload = {
    conversationId: string;
    memberId: string;
};

type AdminPromotedPayload = {
    conversationId: string;
    memberId: string;
};

type AdminDemotedPayload = {
    conversationId: string;
    memberId: string;
};

type GroupDeletedPayload = {
    conversationId: string;
};

export function emitGroupUpdated(
    conversationId: string,
    payload: GroupUpdatedPayload
) {
    getSocketServer()
        .to(conversationId)
        .emit("group_updated", payload);
}

export function emitMemberAdded(
    conversationId: string,
    payload: MemberAddedPayload
) {
    getSocketServer()
        .to(conversationId)
        .emit("member_added", payload);
}

export function emitMemberRemoved(
    conversationId: string,
    payload: MemberRemovedPayload
) {
    getSocketServer()
        .to(conversationId)
        .emit("member_removed", payload);
}

export function emitAdminPromoted(
    conversationId: string,
    payload: AdminPromotedPayload
) {
    getSocketServer()
        .to(conversationId)
        .emit("admin_promoted", payload);
}

export function emitAdminDemoted(
    conversationId: string,
    payload: AdminDemotedPayload
) {
    getSocketServer()
        .to(conversationId)
        .emit("admin_demoted", payload);
}

type GroupAddedPayload = {
    conversationId: string;
};

export function emitGroupAdded(
    userId: string,
    payload: GroupAddedPayload
) {
    emitToUser(
        userId,
        "group_added",
        payload
    );
}

export function emitGroupDeleted(
    conversationId: string,
    payload: GroupDeletedPayload
) {
    getSocketServer()
        .to(conversationId)
        .emit(
            "group_deleted",
            payload
        );
}