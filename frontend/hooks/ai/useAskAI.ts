"use client"

import { useMutation } from "@tanstack/react-query";
import { askAI } from "@/services/ai";

export function useAskAI() {
    return useMutation({
        mutationFn: ({
            conversationId,
            prompt
        }: {
            conversationId: string,
            prompt: string
        }) =>
            askAI(conversationId, prompt)
    })
}