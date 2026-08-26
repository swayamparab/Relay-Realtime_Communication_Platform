"use client";

import { useMutation } from "@tanstack/react-query";

export function useUnreadMessageSummary() {
    return useMutation({
        mutationFn: async ({
            conversationId,
            unreadSince,
            onChunk,
            onSuccess,
        }: {
            conversationId: string;
            unreadSince: string;
            onChunk: (chunk: string) => void;
            onSuccess?: () => void;
        }) => {
            const response = await fetch("/api/ai/unread-summary",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Accept: "text/plain",
                    },
                    body: JSON.stringify({
                        conversationId,
                        unreadSince
                    }),
                }
            );

            if (!response.ok) {
                let message =
                    "Failed to generate unread summary.";

                try {
                    const data =
                        await response.json();

                    message =
                        data.message ?? message;
                } catch {
                    // Response was not JSON
                }

                throw new Error(message);
            }

            if (!response.body) {
                throw new Error(
                    "No response stream received."
                );
            }

            const reader =
                response.body.getReader();

            const decoder =
                new TextDecoder();

            while (true) {
                const {
                    value,
                    done,
                } = await reader.read();

                if (done) {
                    break;
                }

                const chunk =
                    decoder.decode(value, {
                        stream: true,
                    });

                if (chunk) {
                    onChunk(chunk);
                }
            }

            const remaining =
                decoder.decode();

            if (remaining) {
                onChunk(remaining);
            }

            onSuccess?.();
        },
    });
}