export const onlineUsers = new Map<string, string>();

export function getOnlineUserIds() {
    return Array.from(onlineUsers.keys());
}

export function getSocketId(userId: string) {
    return onlineUsers.get(userId);
}

export function isUserOnline(userId: string) {
    return onlineUsers.has(userId);
}