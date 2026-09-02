"use client";

import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    useCallback,
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

function isSameDay(
    first: Date,
    second: Date
) {
    return (
        first.getFullYear() ===
        second.getFullYear() &&
        first.getMonth() ===
        second.getMonth() &&
        first.getDate() ===
        second.getDate()
    );
}

function startOfWeek(date: Date) {
    const result = new Date(date);

    const day = result.getDay();

    const daysFromMonday =
        day === 0 ? 6 : day - 1;

    result.setDate(
        result.getDate() -
        daysFromMonday
    );

    result.setHours(0, 0, 0, 0);

    return result;
}

function formatMessageDate(
    dateString: string
) {
    const date = new Date(dateString);
    const now = new Date();

    if (isSameDay(date, now)) {
        return "Today";
    }

    const yesterday = new Date(now);

    yesterday.setDate(
        yesterday.getDate() - 1
    );

    if (
        isSameDay(
            date,
            yesterday
        )
    ) {
        return "Yesterday";
    }

    const weekStart =
        startOfWeek(now);

    if (date >= weekStart) {
        return date.toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
            }
        );
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "long",
            year: "numeric",
        }
    );
}

export default function MessageList({
    onReply,
    jumpToMessageId,
    highlightedMessageId,
    setHighlightedMessageId,
}: MessageListProps) {
    const {
        conversationId,
    } = useParams<{
        conversationId: string;
    }>();

    const [
        aiSummary,
        setAiSummary,
    ] = useState("");

    const {
        data: currentUser,
    } = useCurrentUser();

    const {
        data: conversationsData,
    } = useConversations();

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useMessages(
        conversationId
    );

    const messages =
        data?.pages
            .slice()
            .reverse()
            .flatMap(
                (page) =>
                    page.messages
            ) ?? [];

    /*
     * Live lastReadAt.
     *
     * This is intentionally used only for
     * MessageBubble/read receipts.
     *
     * The unread-summary feature uses the
     * frozen initialLastReadAtRef instead.
     */
    const lastReadAt =
        data?.pages[0]
            ?.lastReadAt ?? null;

    const {
        isConnected,
    } = useSocket();

    const {
        markConversationAsRead,
    } =
        useMarkConversationAsRead();

    const {
        mutate: summarizeUnread,
        isPending:
        isSummarizingUnread,
        isError:
        isSummaryError,
        error: summaryError,
    } =
        useUnreadMessageSummary();

    const containerRef =
        useRef<HTMLDivElement>(
            null
        );

    /*
     * ============================================================
     * UNREAD SNAPSHOT
     * ============================================================
     *
     * These values represent the state when the conversation
     * was opened.
     *
     * They MUST NOT change after markConversationAsRead().
     */

    const initialUnreadCountRef =
        useRef<number | null>(
            null
        );

    const initialLastReadAtRef =
        useRef<string | null>(
            null
        );

    const unreadSnapshotCapturedRef =
        useRef(false);

    const firstUnreadMessageIdRef =
        useRef<string | null>(
            null
        );

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
     * RESET WHEN SWITCHING CONVERSATION
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

        unreadSnapshotCapturedRef.current =
            false;

        firstUnreadMessageIdRef.current =
            null;

        setAiSummary("");
    }, [conversationId]);

    /*
     * ============================================================
     * CAPTURE ORIGINAL UNREAD STATE
     * ============================================================
     *
     * This effect appears BEFORE the mark-as-read effect below.
     *
     * React runs effects in declaration order, so when both
     * pieces of data are available, the original unread state
     * is frozen before markConversationAsRead() can update it.
     */

    useEffect(() => {
        if (!conversationId) {
            return;
        }

        if (
            unreadSnapshotCapturedRef.current
        ) {
            return;
        }

        const conversation =
            conversationsData?.conversations.find(
                (conversation) =>
                    conversation.conversationId ===
                    conversationId
            );

        /*
         * Wait until both the conversation and
         * message response are available.
         */
        if (
            !conversation ||
            !data
        ) {
            return;
        }

        initialUnreadCountRef.current =
            conversation.unreadCount;

        /*
         * This is the original lastReadAt from
         * the initial message response.
         *
         * It is allowed to be null.
         */
        initialLastReadAtRef.current =
            lastReadAt;

        unreadSnapshotCapturedRef.current =
            true;
    }, [
        conversationId,
        conversationsData,
        data,
        lastReadAt,
    ]);

    /*
     * ============================================================
     * HELPERS
     * ============================================================
     */

    const isNearBottom =
        useCallback(() => {
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
        }, []);

    const getFirstVisibleMessage =
        useCallback(() => {
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
                container
                    .getBoundingClientRect()
                    .top;

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
        }, []);

    /*
     * ============================================================
     * FIND FIRST UNREAD MESSAGE
     * ============================================================
     */

    const getFirstUnreadMessage =
        useCallback((): Message | null => {
            const unreadCount =
                initialUnreadCountRef.current;

            if (
                unreadCount === null ||
                unreadCount < 5 ||
                messages.length === 0
            ) {
                return null;
            }

            /*
             * Best case:
             *
             * Use the ORIGINAL lastReadAt.
             *
             * Do not use the live lastReadAt because
             * it may already have been changed to now.
             */
            const originalLastReadAt =
                initialLastReadAtRef.current;

            if (originalLastReadAt) {
                const readTime =
                    new Date(
                        originalLastReadAt
                    ).getTime();

                const firstUnread =
                    messages.find(
                        (message) =>
                            new Date(
                                message.createdAt
                            ).getTime() >
                            readTime
                    );

                if (firstUnread) {
                    return firstUnread;
                }
            }

            /*
             * If there was no previous lastReadAt,
             * use the initial unread count.
             */
            const firstUnreadIndex =
                Math.max(
                    0,
                    messages.length -
                    unreadCount
                );

            return (
                messages[
                firstUnreadIndex
                ] ?? null
            );
        }, [messages]);

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
                paginationAnchorRef.current =
                    anchor;
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
     *
     * If 5+ messages were unread:
     *
     *      [Unread divider]
     *      [AI summary button]
     *      [First unread message]
     *
     * The summary block is used as the actual scroll anchor.
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
            !unreadSnapshotCapturedRef.current
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

                if (
                    unreadCount >= 5
                ) {
                    const firstUnread =
                        getFirstUnreadMessage();

                    if (firstUnread) {
                        firstUnreadMessageIdRef.current =
                            firstUnread.id;

                        const anchor =
                            document.getElementById(
                                "unread-summary-anchor"
                            );

                        if (anchor) {
                            /*
                             * Calculate position relative to
                             * the message container.
                             *
                             * This avoids scrollIntoView()
                             * moving the wrong ancestor.
                             */
                            const containerRect =
                                container.getBoundingClientRect();

                            const anchorRect =
                                anchor.getBoundingClientRect();

                            const targetScrollTop =
                                container.scrollTop +
                                (
                                    anchorRect.top -
                                    containerRect.top
                                ) -
                                12;

                            container.scrollTo({
                                top: Math.max(
                                    0,
                                    targetScrollTop
                                ),
                                behavior: "auto",
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

                /*
                 * Normal conversation:
                 * open at the latest message.
                 */
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
        messages.length,
        getFirstUnreadMessage,
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
    }, [messages.length]);

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

        /*
         * Ignore the count increase caused by
         * loading older messages.
         */
        if (
            skipNextMessageScrollRef.current
        ) {
            skipNextMessageScrollRef.current =
                false;

            previousMessageCountRef.current =
                currentCount;

            return;
        }

        /*
         * Only scroll to bottom for a genuinely new
         * message when the user was already near bottom.
         */
        if (
            currentCount >
            previousCount &&
            previousCount !== 0 &&
            wasNearBottomRef.current
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
        if (
            !isConnected ||
            !conversationId ||
            !currentUser ||
            !lastMessage
        ) {
            return;
        }

        /*
         * Don't mark your own messages as read.
         */
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
    }, [isNearBottom]);

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
                paginationAnchorRef.current =
                    anchor;
            }

            paginationPendingRef.current =
                true;

            skipNextMessageScrollRef.current =
                true;

            fetchNextPage();
        }
    }, [
        jumpToMessageId,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
        setHighlightedMessageId,
        getFirstVisibleMessage,
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
     * Keep the ref synchronized with the
     * currently resolved first unread message.
     */
    if (
        firstUnreadMessage &&
        (
            initialUnreadCountRef.current ??
            0
        ) >= 5
    ) {
        firstUnreadMessageIdRef.current =
            firstUnreadMessage.id;
    }

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
                        messages[
                        index - 1
                        ];

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

                    const shouldShowUnreadSummary =
                        isFirstUnread &&
                        (
                            initialUnreadCountRef.current ??
                            0
                        ) >= 5;

                    return (
                        <div
                            key={message.id}
                            className="
                                flex
                                flex-col
                                gap-3
                            "
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

                            {shouldShowUnreadSummary && (
                                <div
                                    id="unread-summary-anchor"
                                    className="
                                        my-1
                                        w-full
                                        scroll-mt-3
                                    "
                                >
                                    {/* Unread divider + AI action */}
                                    {!aiSummary && (
                                        <div className="flex items-center gap-3">
                                            <div className="h-px flex-1 bg-sky-500/20" />

                                            <span
                                                className="
                                                    shrink-0
                                                    text-xs
                                                    font-medium
                                                    text-sky-400
                                                "
                                            >
                                                {initialUnreadCountRef.current} new messages
                                            </span>

                                            <button
                                                type="button"
                                                disabled={isSummarizingUnread}
                                                onClick={() => {
                                                    if (
                                                        isSummarizingUnread ||
                                                        !firstUnreadMessage
                                                    ) {
                                                        return;
                                                    }

                                                    const unreadSince =
                                                        new Date(
                                                            new Date(
                                                                firstUnreadMessage.createdAt
                                                            ).getTime() - 1
                                                        ).toISOString();

                                                    setAiSummary("");

                                                    summarizeUnread({
                                                        conversationId,
                                                        unreadSince,
                                                        onChunk: (chunk) => {
                                                            setAiSummary(
                                                                (previous) =>
                                                                    previous + chunk
                                                            );
                                                        },
                                                    });
                                                }}
                                                className="
                                                    flex
                                                    shrink-0
                                                    items-center
                                                    gap-1.5
                                                    rounded-lg
                                                    border
                                                    border-sky-500/20
                                                    bg-sky-500/5
                                                    px-2.5
                                                    py-1.5
                                                    text-xs
                                                    font-medium
                                                    text-sky-400
                                                    transition
                                                    hover:border-sky-500/40
                                                    hover:bg-sky-500/10
                                                    disabled:cursor-not-allowed
                                                    disabled:opacity-40
                                                "
                                            >
                                                <Sparkles className="h-3.5 w-3.5" />

                                                {isSummarizingUnread
                                                    ? "Summarizing..."
                                                    : "Summarize with AI"}
                                            </button>

                                            <div className="h-px flex-1 bg-sky-500/20" />
                                        </div>
                                    )}

                                    {/* AI Summary */}
                                    {aiSummary && (
                                        <div className="mt-2 w-full rounded-xl border border-sky-500/15 bg-sky-500/[0.04] px-4 py-3">
                                            <div className="mb-2 flex items-center gap-2">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/10">
                                                    <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                                                </div>

                                                <span className="text-xs font-semibold text-sky-400">
                                                    AI Summary
                                                </span>

                                                {isSummarizingUnread && (
                                                    <span className="text-[11px] text-muted-foreground">
                                                        Summarizing...
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-sm leading-6 text-foreground/85 whitespace-pre-wrap">
                                                {aiSummary}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div
                                id={`message-${message.id}`}
                            >
                                <MessageBubble
                                    message={message}
                                    onReply={
                                        onReply
                                    }
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