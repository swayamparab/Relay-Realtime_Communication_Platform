"use client"

import { useMutation } from "@tanstack/react-query";
import { askAI } from "@/services/ai";

export function useAskAI() {
    return useMutation({
        mutationFn: ({
            conversationId,
            prompt,
            onChunk
        }: {
            conversationId: string,
            prompt: string,
            onChunk: (chunk: string) => void;
        }) =>
            askAI(conversationId, prompt, onChunk)
    })
}