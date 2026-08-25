"use client";

import { useEffect } from "react";

import { useSocket } from "../useSocket";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";

import type { Message, GetMessagesResponse, } from "@/types/message";

import type { GetConversationsResponse, } from "@/types/conversations";

import { useCurrentUser } from "@/hooks/user/useCurrentUser";

import type { InfiniteData } from "@tanstack/react-query";

export function useMessageEvents(activeConversationId?: string) {
    const { socket } = useSocket();

    const queryClient = useQueryClient();

    const { data: currentUser } = useCurrentUser();

    useEffect(() => {

        function updateMessagePages(
            old: InfiniteData<GetMessagesResponse> | undefined,
            updater: (messages: Message[]) => Message[]
        ) {
            if (!old) return old;

            return {
                ...old,
                pages: old.pages.map((page) => ({
                    ...page,
                    messages: updater(page.messages),
                })),
            };
        }

        function handleNewMessage(message: Message) {
            const isOwnMessage =
                message.sender.id === currentUser?.user.id;

            const isActiveConversation =
                message.conversationId === activeConversationId;

            // Update messages cache
            queryClient.setQueryData<InfiniteData<GetMessagesResponse>>(
                queryKeys.messages(message.conversationId),
                (old) => {
                    if (!old) return old;

                    const lastPageIndex = old.pages.length - 1;

                    return {
                        ...old,
                        pages: old.pages.map((page, index) =>
                            index === lastPageIndex
                                ? {
                                    ...page,
                                    lastReadAt: isOwnMessage
                                        ? null
                                        : page.lastReadAt,
                                    messages: [
                                        ...page.messages,
                                        message,
                                    ],
                                }
                                : {
                                    ...page,
                                    lastReadAt: isOwnMessage
                                        ? null
                                        : page.lastReadAt,
                                }
                        ),
                    };
                }
            );

            // Update conversations cache
            queryClient.setQueryData<GetConversationsResponse>(
                queryKeys.conversations,
                (old) => {
                    if (!old) {
                        return old;
                    }

                    const index = old.conversations.findIndex(
                        (conversation) =>
                            conversation.conversationId ===
                            message.conversationId
                    );

                    if (index === -1) {
                        return old;
                    }

                    const conversation = old.conversations[index];

                    const updatedConversation = {
                        ...conversation,
                        updatedAt: message.createdAt,
                        lastMessage: {
                            id: message.id,
                            type: message.type,
                            content: message.content,
                            attachmentUrl: message.attachmentUrl,
                            createdAt: message.createdAt,
                            sender: message.sender,
                        },
                        unreadCount:
                            isOwnMessage || isActiveConversation
                                ? conversation.unreadCount
                                : conversation.unreadCount + 1,
                    };

                    const conversations = [...old.conversations];

                    conversations.splice(index, 1);
                    conversations.unshift(updatedConversation);

                    return {
                        ...old,
                        conversations,
                    };
                }
            );
        }

        function handleMessageDeleted(data: {
            conversationId: string;
            messageId: string;
        }) {
            queryClient.setQueryData<InfiniteData<GetMessagesResponse>>(
                queryKeys.messages(data.conversationId),
                (old) => {
                    if (!old) return old;

                    const updated = updateMessagePages(
                        old,
                        (messages) =>
                            messages.filter(
                                (message) => message.id !== data.messageId
                            )
                    );

                    if (!updated) return updated;

                    updateConversationPreview(
                        data.conversationId,
                        updated.pages.flatMap((page) => page.messages)
                    );

                    return updated;
                }
            );
        }

        function handleMessageEdited(message: Message) {
            queryClient.setQueryData<InfiniteData<GetMessagesResponse>>(
                queryKeys.messages(message.conversationId),
                (old) => {
                    if (!old) return old;

                    const updated = updateMessagePages(
                        old,
                        (messages) =>
                            messages.map((m) =>
                                m.id === message.id ? message : m
                            )
                    );

                    if (!updated) return updated;

                    updateConversationPreview(
                        message.conversationId,
                        updated.pages.flatMap((page) => page.messages)
                    );

                    return updated;
                }
            );
        }

        function handleMessagesSeen(data: {
            conversationId: string;
            userId: string;
            lastReadAt: string;
        }) {
            queryClient.setQueryData<InfiniteData<GetMessagesResponse>>(
                queryKeys.messages(data.conversationId),
                (old) => {
                    if (!old) return old;

                    return {
                        ...old,
                        pages: old.pages.map((page) => ({
                            ...page,
                            lastReadAt: data.lastReadAt,
                        })),
                    };
                }
            );

            queryClient.setQueryData<GetConversationsResponse>(
                queryKeys.conversations,
                (old) => {
                    if (!old) return old;

                    return {
                        ...old,
                        conversations: old.conversations.map(
                            (conversation) =>
                                conversation.conversationId ===
                                    data.conversationId
                                    ? {
                                        ...conversation,
                                        unreadCount: 0,
                                    }
                                    : conversation
                        ),
                    };
                }
            );

            // Refresh AI unread-message count
            queryClient.invalidateQueries({
                queryKey: [
                    "ai",
                    "unread-message-count",
                    data.conversationId,
                ],
            });
        }

        function updateConversationPreview(
            conversationId: string,
            messages: Message[]
        ) {
            const latestMessage =
                messages.length > 0
                    ? messages[messages.length - 1]
                    : null;

            const lastMessage = latestMessage
                ? {
                    id: latestMessage.id,
                    type: latestMessage.type,
                    content: latestMessage.content,
                    attachmentUrl: latestMessage.attachmentUrl,
                    createdAt: latestMessage.createdAt,
                    sender: latestMessage.sender,
                }
                : null;

            queryClient.setQueryData<GetConversationsResponse>(
                queryKeys.conversations,
                (old) => {
                    if (!old) {
                        return old;
                    }

                    const index = old.conversations.findIndex(
                        (conversation) =>
                            conversation.conversationId === conversationId
                    );

                    if (index === -1) {
                        return old;
                    }

                    const updatedConversation = {
                        ...old.conversations[index],
                        lastMessage,
                    };

                    const conversations = [...old.conversations];

                    conversations[index] = updatedConversation;

                    return {
                        ...old,
                        conversations,
                    };
                }
            );
        }

        socket.on("new_message", handleNewMessage);
        socket.on("message_deleted", handleMessageDeleted);
        socket.on("message_edited", handleMessageEdited);
        socket.on("messages_seen", handleMessagesSeen);

        return () => {
            socket.off("new_message", handleNewMessage);
            socket.off("message_deleted", handleMessageDeleted);
            socket.off("message_edited", handleMessageEdited);
            socket.off("messages_seen", handleMessagesSeen);
        };
    }, [socket, queryClient, activeConversationId, currentUser]);
}