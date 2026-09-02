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
                flex
                h-full
                min-h-0
                w-full
                max-w-md
                flex-col
                overflow-hidden
                rounded-2xl
                border
                border-slate-800
                bg-slate-950
                shadow-2xl
            "
        >
            {/* ================================================== */}
            {/* HEADER */}
            {/* ================================================== */}

            <div
                className="
                    shrink-0
                    border-b
                    border-slate-800
                    px-4
                    py-3.5
                "
            >
                <div
                    className="
                        flex
                        items-center
                        gap-2.5
                    "
                >
                    <div
                        className="
                            flex
                            h-9
                            w-9
                            shrink-0
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

                    <div className="min-w-0">
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
            </div>

            {/* ================================================== */}
            {/* SCROLLABLE CONTENT */}
            {/* ================================================== */}

            <div
                className="
                    min-h-0
                    flex-1
                    overflow-y-auto
                    px-4
                    py-4
                    scrollbar-thin
                    scrollbar-track-transparent
                    scrollbar-thumb-slate-700
                "
            >
                {/* Privacy */}

                <div
                    className="
                        mb-4
                        rounded-xl
                        border
                        border-slate-800
                        bg-slate-900/70
                        px-3
                        py-2.5
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
                        this conversation may be shared
                        with Google Gemini to generate a
                        response.
                    </p>
                </div>

                {/* Quick Actions */}

                <div className="mb-4">
                    <p
                        className="
                            mb-2
                            text-[11px]
                            font-medium
                            uppercase
                            tracking-wide
                            text-slate-600
                        "
                    >
                        Quick actions
                    </p>

                    <div
                        className="
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
                                    disabled={
                                        isPending
                                    }
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
                </div>

                {/* Response */}

                {response && (
                    <div
                        className="
                            mb-4
                            rounded-xl
                            border
                            border-sky-500/15
                            bg-sky-500/[0.04]
                            p-3.5
                        "
                    >
                        <div
                            className="
                                mb-2.5
                                flex
                                items-center
                                gap-2
                            "
                        >
                            <div
                                className="
                                    flex
                                    h-6
                                    w-6
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-md
                                    bg-sky-500/10
                                "
                            >
                                <Sparkles
                                    className="
                                        h-3.5
                                        w-3.5
                                        text-sky-400
                                    "
                                />
                            </div>

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
                                        text-[11px]
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
                                break-words
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
                                        text-sky-400
                                    "
                                >
                                    ▌
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Error */}

                {isError && (
                    <div
                        className="
                            mb-4
                            rounded-xl
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
            </div>

            {/* ================================================== */}
            {/* PROMPT AREA */}
            {/* ================================================== */}

            <div
                className="
                    shrink-0
                    border-t
                    border-slate-800
                    bg-slate-950
                    p-3
                "
            >
                <textarea
                    value={prompt}
                    onChange={(e) =>
                        setPrompt(
                            e.target.value
                        )
                    }
                    onKeyDown={(e) => {
                        if (
                            e.key === "Enter" &&
                            !e.shiftKey
                        ) {
                            e.preventDefault();
                            handleAsk();
                        }
                    }}
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
                        focus:ring-1
                        focus:ring-sky-500/20
                        disabled:opacity-50
                    "
                />

                <button
                    type="button"
                    onClick={handleAsk}
                    disabled={
                        !prompt.trim() ||
                        isPending
                    }
                    className="
                        mt-2.5
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

                <p
                    className="
                        mt-2
                        text-center
                        text-[10px]
                        text-slate-600
                    "
                >
                    Enter to send · Shift + Enter for new line
                </p>
            </div>
        </div>
    );
}