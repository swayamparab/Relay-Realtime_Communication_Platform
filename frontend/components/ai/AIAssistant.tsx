"use client";

import { useState } from "react";
import {
    Sparkles,
    Loader2,
} from "lucide-react";

import { useAskAI } from "@/hooks/ai/useAskAI";

type AIAssistantProps = {
    conversationId: string;
};

const quickActions = [
    {
        label: "Summarize chat",
        prompt:
            "Summarize the conversation in a concise and easy-to-read format. Include the main topics discussed, important decisions, and any action items. Use short headings and bullet points. Do not invent information that is not present in the conversation.",
    },
    {
        label: "What did we decide?",
        prompt:
            "Identify the important decisions made in this conversation. List each decision as a separate bullet point. If no clear decisions were made, say so. Do not invent information.",
    },
    {
        label: "Find action items",
        prompt:
            "Identify all tasks or action items mentioned in this conversation. List each task as a separate bullet point and mention the responsible person if the conversation clearly identifies them. If there are no action items, say so. Do not invent information.",
    },
];

export default function AIAssistant({
    conversationId,
}: AIAssistantProps) {
    const [prompt, setPrompt] = useState("");
    const [response, setResponse] = useState("");

    const {
        mutate,
        isPending,
        isError,
        error,
        reset,
    } = useAskAI();

    const askPrompt = (value: string) => {
        const trimmedPrompt =
            value.trim();

        if (
            !trimmedPrompt ||
            isPending
        ) {
            return;
        }

        reset();

        setResponse("");
        setPrompt(trimmedPrompt);

        mutate({
            conversationId,
            prompt: trimmedPrompt,

            onChunk: (chunk) => {
                setResponse(
                    (prev) => prev + chunk
                );
            },
        });
    };

    const handleAsk = () => {
        askPrompt(prompt);
    };

    const errorMessage =
        (
            error as {
                response?: {
                    data?: {
                        message?: string;
                    };
                };
            }
        )?.response?.data?.message ??
        error?.message ??
        "Failed to get an AI response.";

    return (
        <div
            className="
                w-full
                max-w-md
                rounded-2xl
                border
                border-slate-800
                bg-slate-950
                p-4
                shadow-2xl
            "
        >
            {/* Header */}

            <div
                className="
                    mb-4
                    flex
                    items-center
                    gap-2
                "
            >
                <div
                    className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-xl
                        bg-sky-500/10
                    "
                >
                    <Sparkles
                        className="
                            h-5
                            w-5
                            text-sky-400
                        "
                    />
                </div>

                <div>
                    <h3
                        className="
                            text-sm
                            font-semibold
                            text-white
                        "
                    >
                        Relay AI
                    </h3>

                    <p
                        className="
                            text-xs
                            text-slate-500
                        "
                    >
                        Ask about this conversation
                    </p>
                </div>
            </div>

            {/* Privacy Disclaimer */}

            <div
                className="
                    mb-3
                    rounded-xl
                    border
                    border-slate-800
                    bg-slate-900/70
                    p-3
                "
            >
                <p
                    className="
                        text-[11px]
                        leading-4
                        text-slate-500
                    "
                >
                    AI Privacy: Recent messages from
                    this conversation may be shared with
                    Google Gemini to generate a response.
                </p>
            </div>

            {/* Quick Actions */}

            <div
                className="
                    mb-3
                    flex
                    flex-wrap
                    gap-2
                "
            >
                {quickActions.map(
                    (action) => (
                        <button
                            key={action.label}
                            type="button"
                            onClick={() =>
                                askPrompt(
                                    action.prompt
                                )
                            }
                            disabled={isPending}
                            className="
                                rounded-lg
                                border
                                border-slate-800
                                bg-slate-900
                                px-3
                                py-1.5
                                text-xs
                                text-slate-300
                                transition
                                hover:border-sky-500/40
                                hover:bg-sky-500/10
                                hover:text-sky-400
                                disabled:cursor-not-allowed
                                disabled:opacity-40
                            "
                        >
                            {action.label}
                        </button>
                    )
                )}
            </div>

            {/* Prompt */}

            <textarea
                value={prompt}
                onChange={(e) =>
                    setPrompt(e.target.value)
                }
                placeholder="Ask something about this chat..."
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

            {/* Ask Button */}

            <button
                type="button"
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
                        <Loader2
                            className="
                                h-4
                                w-4
                                animate-spin
                            "
                        />
                        Thinking...
                    </>
                ) : (
                    <>
                        <Sparkles
                            className="h-4 w-4"
                        />
                        Ask AI
                    </>
                )}
            </button>

            {/* Error */}

            {isError && (
                <div
                    className="
                        mt-3
                        rounded-lg
                        border
                        border-red-500/20
                        bg-red-500/5
                        p-3
                    "
                >
                    <p
                        className="
                            text-xs
                            leading-5
                            text-red-400
                        "
                    >
                        {errorMessage}
                    </p>
                </div>
            )}

            {/* Streaming Response */}

            {response && (
                <div
                    className="
                        mt-4
                        rounded-xl
                        border
                        border-slate-800
                        bg-slate-900/70
                        p-3
                    "
                >
                    <div
                        className="
                            mb-2
                            flex
                            items-center
                            gap-2
                        "
                    >
                        <Sparkles
                            className="
                                h-3.5
                                w-3.5
                                text-sky-400
                            "
                        />

                        <span
                            className="
                                text-xs
                                font-semibold
                                text-sky-400
                            "
                        >
                            Relay AI
                        </span>

                        {isPending && (
                            <span
                                className="
                                    text-xs
                                    text-slate-500
                                "
                            >
                                generating...
                            </span>
                        )}
                    </div>

                    <div
                        className="
                            whitespace-pre-wrap
                            text-sm
                            leading-6
                            text-slate-300
                        "
                    >
                        {response}

                        {isPending && (
                            <span
                                className="
                                    ml-1
                                    inline-block
                                    animate-pulse
                                "
                            >
                                ▌
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}