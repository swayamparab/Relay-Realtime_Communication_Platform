const groupCallInvites = new Map<
    string,
    Set<string>
>();

export function addGroupCallInvite(
    conversationId: string,
    userId: string
) {
    let invitedUsers =
        groupCallInvites.get(conversationId);

    if (!invitedUsers) {
        invitedUsers = new Set<string>();

        groupCallInvites.set(
            conversationId,
            invitedUsers
        );
    }

    invitedUsers.add(userId);
}

export function hasGroupCallInvite(
    conversationId: string,
    userId: string
) {
    return (
        groupCallInvites
            .get(conversationId)
            ?.has(userId) ?? false
    );
}

export function removeGroupCallInvite(
    conversationId: string,
    userId: string
) {
    const invitedUsers =
        groupCallInvites.get(conversationId);

    if (!invitedUsers) {
        return;
    }

    invitedUsers.delete(userId);

    if (invitedUsers.size === 0) {
        groupCallInvites.delete(
            conversationId
        );
    }
}

export function clearGroupCallInvites(
    conversationId: string
) {
    groupCallInvites.delete(
        conversationId
    );
}

export function getGroupCallInvitedUsers(
    conversationId: string
) {
    return Array.from(
        groupCallInvites.get(
            conversationId
        ) ?? []
    );
}