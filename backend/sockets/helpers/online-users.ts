export const onlineUsers = new Map<string, Set<string>>();

export function addOnlineUser(
    userId: string,
    socketId: string
) {
    const sockets = onlineUsers.get(userId);

    if (sockets) {
        sockets.add(socketId);
    } else {
        onlineUsers.set(
            userId,
            new Set([socketId])
        );
    }
}

export function removeOnlineUser(
    userId: string,
    socketId: string
) {
    const sockets = onlineUsers.get(userId);

    if (!sockets) {
        return false;
    }

    sockets.delete(socketId);

    if (sockets.size === 0) {
        onlineUsers.delete(userId);
        return true;
    }

    return false;
}

export function getOnlineUserIds() {
    return Array.from(onlineUsers.keys());
}

export function getSocketIds(userId: string) {
    return onlineUsers.get(userId) ?? new Set<string>();
}

export function getSocketId(userId: string) {
    return onlineUsers.get(userId)?.values().next().value;
}

export function isUserOnline(userId: string) {
    return onlineUsers.has(userId);
}