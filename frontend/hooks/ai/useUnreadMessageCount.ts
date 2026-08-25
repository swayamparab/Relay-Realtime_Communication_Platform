"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export function useUnreadMessageCount(
    conversationId: string
) {
    return useQuery({
        queryKey: [
            "ai",
            "unread-message-count",
            conversationId,
        ],

        queryFn: async () => {
            const response =
                await api.get(
                    `/ai/unread/${conversationId}`
                );

            return response.data as {
                count: number;
                hasEnoughUnreadMessages: boolean;
            };
        },

        enabled: !!conversationId,
    });
}