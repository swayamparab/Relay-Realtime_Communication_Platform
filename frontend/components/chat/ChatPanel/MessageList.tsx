"use client";

import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { useParams } from "next/navigation";

import { useMessages } from "@/hooks/message/useMessages";
import { useCurrentUser } from "@/hooks/user/useCurrentUser";
import { useConversations } from "@/hooks/conversation/useConversations";

import MessageBubble from "./MessageBubble";

import { useMarkConversationAsRead } from "@/hooks/conversation/useMarkConversationAsRead";
import { useSocket } from "@/hooks/useSocket";

import type { Message } from "@/types/message";

import { Sparkles } from "lucide-react";

import { useUnreadMessageSummary } from "@/hooks/ai/useUnreadMessageSummary";

interface MessageListProps {
    onReply: (message: Message) => void;
    jumpToMessageId: string | null;
    highlightedMessageId: string | null;
    setHighlightedMessageId: (
        id: string | null
    ) => void;
}

function isSameDay(first: Date, second: Date) {
    return (
        first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate()
    );
}

function startOfWeek(date: Date) {
    const result = new Date(date);

    const day = result.getDay();

    const daysFromMonday =
        day === 0 ? 6 : day - 1;

    result.setDate(
        result.getDate() - daysFromMonday
    );

    result.setHours(0, 0, 0, 0);

    return result;
}

function formatMessageDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();

    if (isSameDay(date, now)) {
        return "Today";
    }

    const yesterday = new Date(now);

    yesterday.setDate(
        yesterday.getDate() - 1
    );

    if (isSameDay(date, yesterday)) {
        return "Yesterday";
    }

    const weekStart = startOfWeek(now);

    if (date >= weekStart) {
        return date.toLocaleDateString("en-IN", {
            weekday: "long",
        });
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export default function MessageList({
    onReply,
    jumpToMessageId,
    highlightedMessageId,
    setHighlightedMessageId,
}: MessageListProps) {
    const { conversationId } = useParams<{
        conversationId: string;
    }>();

    const [aiSummary, setAiSummary] =
        useState("");

    const { data: currentUser } =
        useCurrentUser();

    const { data: conversationsData } =
        useConversations();

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useMessages(conversationId);

    const messages =
        data?.pages
            .slice()
            .reverse()
            .flatMap(
                (page) => page.messages
            ) ?? [];

    /*
     * This is the live value used by MessageBubble.
     */
    const lastReadAt =
        data?.pages[0]?.lastReadAt ?? null;

    const {
        isConnected,
    } = useSocket();

    const {
        markConversationAsRead,
    } = useMarkConversationAsRead();

    const {
        mutate: summarizeUnread,
        isPending: isSummarizingUnread,
        isError: isSummaryError,
        error: summaryError,
    } = useUnreadMessageSummary();

    const containerRef =
        useRef<HTMLDivElement>(null);

    /*
     * ============================================================
     * ORIGINAL UNREAD SNAPSHOT
     * ============================================================
     *
     * These MUST NOT change after markConversationAsRead().
     */

    const initialUnreadCountRef =
        useRef<number | null>(null);

    const initialLastReadAtRef =
        useRef<string | null>(null);

    const firstUnreadMessageRef =
        useRef<string | null>(null);

    /*
     * ============================================================
     * SCROLL STATE
     * ============================================================
     */

    const initialScrollDoneRef =
        useRef(false);

    const paginationPendingRef =
        useRef(false);

    const skipNextMessageScrollRef =
        useRef(false);

    const paginationAnchorRef =
        useRef<{
            messageId: string;
            top: number;
        } | null>(null);

    const previousMessageCountRef =
        useRef(0);

    const wasNearBottomRef =
        useRef(false);

    /*
     * ============================================================
     * RESET
     * ============================================================
     */

    useEffect(() => {
        initialScrollDoneRef.current =
            false;

        paginationPendingRef.current =
            false;

        skipNextMessageScrollRef.current =
            false;

        paginationAnchorRef.current =
            null;

        previousMessageCountRef.current =
            0;

        wasNearBottomRef.current =
            false;

        initialUnreadCountRef.current =
            null;

        initialLastReadAtRef.current =
            null;

        firstUnreadMessageRef.current =
            null;

        setAiSummary("");
    }, [conversationId]);

    /*
     * ============================================================
     * CAPTURE ORIGINAL UNREAD STATE
     * ============================================================
     */

    useEffect(() => {
        if (!conversationId) {
            return;
        }

        const conversation =
            conversationsData?.conversations.find(
                (conversation) =>
                    conversation.conversationId ===
                    conversationId
            );

        /*
         * Capture unread count BEFORE it becomes 0.
         */
        if (
            conversation &&
            initialUnreadCountRef.current === null
        ) {
            initialUnreadCountRef.current =
                conversation.unreadCount;
        }

        /*
         * Capture lastReadAt from the first
         * message response BEFORE mark-as-read
         * changes it.
         */
        if (
            initialLastReadAtRef.current === null &&
            lastReadAt !== null
        ) {
            initialLastReadAtRef.current =
                lastReadAt;
        }
    }, [
        conversationId,
        conversationsData,
        lastReadAt,
    ]);

    /*
     * ============================================================
     * HELPERS
     * ============================================================
     */

    function isNearBottom() {
        const container =
            containerRef.current;

        if (!container) {
            return false;
        }

        const distance =
            container.scrollHeight -
            container.scrollTop -
            container.clientHeight;

        return distance <= 120;
    }

    function getFirstVisibleMessage() {
        const container =
            containerRef.current;

        if (!container) {
            return null;
        }

        const messageElements =
            container.querySelectorAll<HTMLElement>(
                '[id^="message-"]'
            );

        const containerTop =
            container.getBoundingClientRect().top;

        for (
            const element of messageElements
        ) {
            const rect =
                element.getBoundingClientRect();

            if (
                rect.bottom >
                containerTop
            ) {
                return {
                    messageId:
                        element.id.replace(
                            "message-",
                            ""
                        ),
                    top: rect.top,
                };
            }
        }

        return null;
    }

    /*
     * ============================================================
     * FIRST UNREAD MESSAGE
     * ============================================================
     */

    function getFirstUnreadMessage() {
        const unreadCount =
            initialUnreadCountRef.current;

        if (
            unreadCount === null ||
            unreadCount < 5
        ) {
            return null;
        }

        const originalLastReadAt =
            initialLastReadAtRef.current;

        /*
         * Best case:
         * use the original lastReadAt.
         */
        if (originalLastReadAt) {
            const readTime =
                new Date(
                    originalLastReadAt
                ).getTime();

            return (
                messages.find(
                    (message) =>
                        new Date(
                            message.createdAt
                        ).getTime() >
                        readTime
                ) ?? null
            );
        }

        /*
         * If there was no previous read timestamp,
         * calculate from the unread count.
         */
        const firstUnreadIndex =
            Math.max(
                0,
                messages.length -
                    unreadCount
            );

        return (
            messages[firstUnreadIndex] ??
            null
        );
    }

    /*
     * ============================================================
     * PAGINATION
     * ============================================================
     */

    function handleScroll() {
        const container =
            containerRef.current;

        if (!container) {
            return;
        }

        wasNearBottomRef.current =
            isNearBottom();

        if (
            container.scrollTop <= 50 &&
            hasNextPage &&
            !isFetchingNextPage &&
            !paginationPendingRef.current
        ) {
            const anchor =
                getFirstVisibleMessage();

            if (anchor) {
                paginationAnchorRef.current = {
                    messageId:
                        anchor.messageId,
                    top: anchor.top,
                };
            }

            paginationPendingRef.current =
                true;

            skipNextMessageScrollRef.current =
                true;

            fetchNextPage();
        }
    }

    /*
     * ============================================================
     * INITIAL SCROLL
     * ============================================================
     */

    useEffect(() => {
        if (!data) {
            return;
        }

        if (
            initialScrollDoneRef.current
        ) {
            return;
        }

        if (
            initialUnreadCountRef.current ===
            null
        ) {
            return;
        }

        if (
            paginationPendingRef.current
        ) {
            return;
        }

        const timeoutId =
            setTimeout(() => {
                const container =
                    containerRef.current;

                if (!container) {
                    return;
                }

                const unreadCount =
                    initialUnreadCountRef.current ??
                    0;

                if (unreadCount >= 5) {
                    const firstUnread =
                        getFirstUnreadMessage();

                    if (firstUnread) {
                        firstUnreadMessageRef.current =
                            firstUnread.id;

                        const element =
                            document.getElementById(
                                `message-${firstUnread.id}`
                            );

                        if (element) {
                            element.scrollIntoView({
                                behavior:
                                    "auto",
                                block: "start",
                            });

                            initialScrollDoneRef.current =
                                true;

                            previousMessageCountRef.current =
                                messages.length;

                            wasNearBottomRef.current =
                                false;

                            return;
                        }
                    }
                }

                container.scrollTo({
                    top:
                        container.scrollHeight,
                    behavior: "auto",
                });

                initialScrollDoneRef.current =
                    true;

                previousMessageCountRef.current =
                    messages.length;

                wasNearBottomRef.current =
                    true;
            }, 0);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [
        data,
        conversationId,
        messages.length,
        initialUnreadCountRef.current,
        initialLastReadAtRef.current,
    ]);

    /*
     * ============================================================
     * RESTORE PAGINATION POSITION
     * ============================================================
     */

    useLayoutEffect(() => {
        if (
            !paginationPendingRef.current
        ) {
            return;
        }

        const anchor =
            paginationAnchorRef.current;

        const container =
            containerRef.current;

        if (!anchor || !container) {
            paginationPendingRef.current =
                false;

            return;
        }

        const anchorElement =
            document.getElementById(
                `message-${anchor.messageId}`
            );

        if (!anchorElement) {
            return;
        }

        const newTop =
            anchorElement
                .getBoundingClientRect()
                .top;

        const difference =
            newTop - anchor.top;

        container.scrollTop +=
            difference;

        paginationPendingRef.current =
            false;

        paginationAnchorRef.current =
            null;

        previousMessageCountRef.current =
            messages.length;
    }, [
        messages.length,
    ]);

    /*
     * ============================================================
     * NEW MESSAGE SCROLL
     * ============================================================
     */

    useEffect(() => {
        if (!data) {
            return;
        }

        const previousCount =
            previousMessageCountRef.current;

        const currentCount =
            messages.length;

        if (
            skipNextMessageScrollRef.current
        ) {
            skipNextMessageScrollRef.current =
                false;

            previousMessageCountRef.current =
                currentCount;

            return;
        }

        if (
            currentCount >
                previousCount &&
            previousCount !== 0
        ) {
            const container =
                containerRef.current;

            if (container) {
                container.scrollTo({
                    top:
                        container.scrollHeight,
                    behavior: "smooth",
                });
            }

            wasNearBottomRef.current =
                true;
        }

        previousMessageCountRef.current =
            currentCount;
    }, [
        messages.length,
        data,
    ]);

    /*
     * ============================================================
     * MARK AS READ
     * ============================================================
     */

    const lastMessage =
        messages.at(-1);

    useEffect(() => {
        if (!isConnected) {
            return;
        }

        if (
            !conversationId ||
            !currentUser ||
            !lastMessage
        ) {
            return;
        }

        if (
            lastMessage.sender.id ===
            currentUser.user.id
        ) {
            return;
        }

        markConversationAsRead(
            conversationId
        );
    }, [
        isConnected,
        conversationId,
        currentUser,
        lastMessage?.id,
        markConversationAsRead,
    ]);

    /*
     * ============================================================
     * IMAGE LOAD
     * ============================================================
     */

    useEffect(() => {
        function handleImageLoaded() {
            const container =
                containerRef.current;

            if (!container) {
                return;
            }

            if (
                paginationPendingRef.current
            ) {
                return;
            }

            if (
                !wasNearBottomRef.current &&
                !isNearBottom()
            ) {
                return;
            }

            container.scrollTo({
                top:
                    container.scrollHeight,
                behavior: "auto",
            });
        }

        window.addEventListener(
            "message-image-loaded",
            handleImageLoaded
        );

        return () => {
            window.removeEventListener(
                "message-image-loaded",
                handleImageLoaded
            );
        };
    }, []);

    /*
     * ============================================================
     * JUMP TO MESSAGE
     * ============================================================
     */

    useEffect(() => {
        if (!jumpToMessageId) {
            return;
        }

        const element =
            document.getElementById(
                `message-${jumpToMessageId}`
            );

        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });

            setHighlightedMessageId(
                jumpToMessageId
            );

            const timeoutId =
                setTimeout(() => {
                    setHighlightedMessageId(
                        null
                    );
                }, 2000);

            return () =>
                clearTimeout(timeoutId);
        }

        if (
            hasNextPage &&
            !isFetchingNextPage &&
            !paginationPendingRef.current
        ) {
            const anchor =
                getFirstVisibleMessage();

            if (anchor) {
                paginationAnchorRef.current = {
                    messageId:
                        anchor.messageId,
                    top: anchor.top,
                };
            }

            paginationPendingRef.current =
                true;

            skipNextMessageScrollRef.current =
                true;

            fetchNextPage();
        }
    }, [
        jumpToMessageId,
        messages.length,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
        setHighlightedMessageId,
    ]);

    /*
     * ============================================================
     * LOADING
     * ============================================================
     */

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <p className="text-slate-400">
                    Loading messages...
                </p>
            </div>
        );
    }

    /*
     * ============================================================
     * ERROR
     * ============================================================
     */

    if (isError) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <p className="text-red-400">
                    Failed to load messages.
                </p>
            </div>
        );
    }

    /*
     * ============================================================
     * EMPTY
     * ============================================================
     */

    if (
        !data ||
        messages.length === 0
    ) {
        return (
            <div
                className="
                    flex
                    min-h-0
                    flex-1
                    flex-col
                    overflow-y-auto
                    bg-gradient-to-b
                    from-slate-950
                    to-[#030712]
                    px-5
                    py-4
                "
            >
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-slate-400">
                        No messages yet.
                    </p>
                </div>
            </div>
        );
    }

    /*
     * ============================================================
     * LAST OWN MESSAGE
     * ============================================================
     */

    const lastOwnMessage =
        messages.findLast(
            (message) =>
                message.sender.id ===
                currentUser?.user.id
        );

    /*
     * ============================================================
     * FIRST UNREAD
     * ============================================================
     */

    const firstUnreadMessage =
        getFirstUnreadMessage();

    /*
     * ============================================================
     * RENDER
     * ============================================================
     */

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="
                min-h-0
                flex
                flex-1
                flex-col
                gap-3
                overflow-x-hidden
                overflow-y-auto
                bg-gradient-to-b
                from-slate-950
                to-[#030712]
                px-5
                py-4
            "
        >
            {isFetchingNextPage && (
                <div className="py-2 text-center text-sm text-slate-400">
                    Loading older messages...
                </div>
            )}

            {messages.map(
                (message, index) => {
                    const previousMessage =
                        messages[index - 1];

                    const messageDate =
                        new Date(
                            message.createdAt
                        );

                    const showDateSeparator =
                        !previousMessage ||
                        !isSameDay(
                            messageDate,
                            new Date(
                                previousMessage.createdAt
                            )
                        );

                    const isFirstUnread =
                        firstUnreadMessage?.id ===
                        message.id;

                    return (
                        <div
                            key={message.id}
                            className="flex flex-col gap-3"
                        >
                            {showDateSeparator && (
                                <div className="flex justify-center py-2">
                                    <div className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-400 shadow-sm">
                                        {formatMessageDate(
                                            message.createdAt
                                        )}
                                    </div>
                                </div>
                            )}

                            {isFirstUnread &&
                                initialUnreadCountRef.current !==
                                    null &&
                                initialUnreadCountRef.current >=
                                    5 && (
                                    <div className="w-full">
                                        {!aiSummary && (
                                            <button
                                                type="button"
                                                disabled={
                                                    isSummarizingUnread
                                                }
                                                onClick={() => {
                                                    if (
                                                        isSummarizingUnread ||
                                                        !firstUnreadMessage
                                                    ) {
                                                        return;
                                                    }

                                                    /*
                                                     * Important:
                                                     * send a timestamp immediately
                                                     * BEFORE the first unread message.
                                                     *
                                                     * Backend will use this instead
                                                     * of the now-updated lastReadAt.
                                                     */
                                                    const unreadSince =
                                                        new Date(
                                                            new Date(
                                                                firstUnreadMessage.createdAt
                                                            ).getTime() -
                                                                1
                                                        ).toISOString();

                                                    setAiSummary("");

                                                    summarizeUnread({
                                                        conversationId,
                                                        unreadSince,
                                                        onChunk:
                                                            (
                                                                chunk
                                                            ) => {
                                                                setAiSummary(
                                                                    (
                                                                        previous
                                                                    ) =>
                                                                        previous +
                                                                        chunk
                                                                );
                                                            },
                                                    });
                                                }}
                                                className="
                                                    flex
                                                    w-full
                                                    items-center
                                                    justify-center
                                                    gap-2
                                                    rounded-xl
                                                    border
                                                    border-sky-500/20
                                                    bg-sky-500/5
                                                    px-4
                                                    py-2.5
                                                    text-sm
                                                    font-medium
                                                    text-sky-400
                                                    transition
                                                    hover:border-sky-500/40
                                                    hover:bg-sky-500/10
                                                    disabled:cursor-not-allowed
                                                    disabled:opacity-40
                                                "
                                            >
                                                <Sparkles className="h-4 w-4" />

                                                {isSummarizingUnread
                                                    ? "Summarizing..."
                                                    : `Summarize ${initialUnreadCountRef.current} messages with AI`}
                                            </button>
                                        )}

                                        {aiSummary && (
                                            <div className="mt-2 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
                                                <div className="mb-2 flex items-center gap-2">
                                                    <Sparkles className="h-4 w-4 text-sky-400" />

                                                    <span className="text-sm font-semibold text-sky-400">
                                                        AI Summary
                                                    </span>

                                                    {isSummarizingUnread && (
                                                        <span className="text-xs text-slate-500">
                                                            generating...
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
                                                    {aiSummary}

                                                    {isSummarizingUnread && (
                                                        <span className="ml-1 animate-pulse">
                                                            ▌
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                            <MessageBubble
                                message={message}
                                onReply={onReply}
                                isOwnMessage={
                                    message.sender.id ===
                                    currentUser?.user.id
                                }
                                isLastOwnMessage={
                                    message.id ===
                                    lastOwnMessage?.id
                                }
                                lastReadAt={
                                    lastReadAt
                                }
                                isHighlighted={
                                    highlightedMessageId ===
                                    message.id
                                }
                            />
                        </div>
                    );
                }
            )}

            {isSummaryError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center text-xs text-red-400">
                    {summaryError instanceof Error
                        ? summaryError.message
                        : "Failed to generate unread summary."}
                </div>
            )}
        </div>
    );
}