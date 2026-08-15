const activeConversations = new Map<
    string,
    string
>();

export function setActiveConversation(
    userId: string,
    conversationId: string
) {
    activeConversations.set(
        userId,
        conversationId
    );
}

export function clearActiveConversation(
    userId: string
) {
    activeConversations.delete(userId);
}

export function isUserViewingConversation(
    userId: string,
    conversationId: string
) {
    return (
        activeConversations.get(userId) ===
        conversationId
    );
}