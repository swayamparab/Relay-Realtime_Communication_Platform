"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

import { useAskAI } from "@/hooks/ai/useAskAI";

type AIAssistantProps = {
    conversationId: string;
};

export default function AIAssistant({
    conversationId,
}: AIAssistantProps) {
    const [prompt, setPrompt] = useState("");

    const {
        mutate,
        data,
        isPending,
        isError,
        error,
        reset
    } = useAskAI();

    const handleAsk = () => {
        if (!prompt.trim() || isPending) {
            return;
        }

        reset();

        mutate({
            conversationId,
            prompt: prompt.trim(),
        });
    };

    return (
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-2xl">
            {/* Header */}

            <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10">
                    <Sparkles className="h-5 w-5 text-sky-400" />
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-white">
                        Relay AI
                    </h3>

                    <p className="text-xs text-slate-500">
                        Ask AI about this conversation
                    </p>
                </div>
            </div>

            {/* Privacy disclaimer */}
            <div className="mb-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                <p className="text-[11px] leading-4 text-slate-500">
                    AI Privacy: Recent messages from this
                    conversation may be shared with Google
                    Gemini to generate a response.
                </p>
            </div>

            {/* Prompt */}
            <textarea
                value={prompt}
                onChange={(e) =>
                    setPrompt(e.target.value)
                }
                placeholder="Ask about this chat..."
                rows={3}
                disabled={isPending}
                className="
                    w-full
                    resize-none
                    rounded-xl
                    border
                    border-slate-800
                    bg-slate-900
                    px-3
                    py-2.5
                    text-sm
                    text-white
                    outline-none
                    placeholder:text-slate-600
                    focus:border-sky-500/50
                    disabled:opacity-50
                "
            />

            {/* Ask button */}
            <button
                onClick={handleAsk}
                disabled={
                    !prompt.trim() ||
                    isPending
                }
                className="
                    mt-3
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-sky-500
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-sky-400
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                "
            >
                {isPending ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Thinking...
                    </>
                ) : (
                    <>
                        <Sparkles className="h-4 w-4" />
                        Ask AI
                    </>
                )}
            </button>

            {/* Error */}
            {isError && (
                <p className="mt-3 text-xs text-red-400">
                    {(
                        error as {
                            response?: {
                                data?: {
                                    message?: string;
                                };
                            };
                        }
                    )?.response?.data?.message ??
                        "Failed to get an AI response."}
                </p>
            )}

            {/* Response */}
            {data?.response && (
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                    <div className="mb-2 flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-sky-400" />

                        <span className="text-xs font-semibold text-sky-400">
                            Relay AI
                        </span>
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
                        {data.response}
                    </p>
                </div>
            )}
        </div>
    );
}