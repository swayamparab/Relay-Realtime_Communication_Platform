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

    /*
     * ============================================================
     * AI SUMMARY
     * ============================================================
     */

    const [
        aiSummary,
        setAiSummary,
    ] = useState("");

    /*
     * ============================================================
     * USER
     * ============================================================
     */

    const {
        data: currentUser,
    } = useCurrentUser();

    /*
     * ============================================================
     * MESSAGES
     * ============================================================
     */

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
     * ============================================================
     * READ STATE
     * ============================================================
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

    /*
     * ============================================================
     * AI HOOK
     * ============================================================
     */

    const {
        mutate: summarizeUnread,
        isPending:
        isSummarizingUnread,
        isError:
        isSummaryError,
        error: summaryError,
    } =
        useUnreadMessageSummary();

    /*
     * ============================================================
     * CONTAINER
     * ============================================================
     */

    const containerRef =
        useRef<HTMLDivElement>(
            null
        );

    /*
     * ============================================================
     * INITIAL UNREAD SNAPSHOT
     * ============================================================
     *
     * These values represent the unread state when the
     * conversation was opened.
     *
     * They must NOT change after mark-as-read runs.
     */

    const [
        initialUnreadCount,
        setInitialUnreadCount,
    ] = useState<
        number | null
    >(null);

    const [
        initialLastReadAt,
        setInitialLastReadAt,
    ] = useState<
        string | null
    >(null);

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

        unreadSnapshotCapturedRef.current =
            false;

        firstUnreadMessageIdRef.current =
            null;

        setInitialUnreadCount(null);
        setInitialLastReadAt(null);

        setAiSummary("");
    }, [conversationId]);

    /*
     * ============================================================
     * CAPTURE ORIGINAL UNREAD STATE
     * ============================================================
     *
     * IMPORTANT:
     *
     * We use the messages API as the source of truth.
     *
     * lastReadAt tells us where the user's read boundary was
     * when the messages were fetched.
     *
     * We capture this ONCE before mark-as-read changes anything.
     */

    useEffect(() => {
        if (
            !conversationId ||
            !data
        ) {
            return;
        }

        if (
            unreadSnapshotCapturedRef.current
        ) {
            return;
        }

        /*
         * The first page contains the current read boundary.
         */
        const originalLastReadAt =
            data.pages[0]
                ?.lastReadAt ?? null;

        const readTime =
            originalLastReadAt
                ? new Date(
                    originalLastReadAt
                ).getTime()
                : 0;

        /*
         * Use the messages currently loaded in the initial
         * query to determine how many unread messages exist.
         */
        const unreadMessages =
            messages.filter(
                (message) =>
                    new Date(
                        message.createdAt
                    ).getTime() >
                    readTime
            );

        /*
         * Freeze the snapshot.
         */
        unreadSnapshotCapturedRef.current =
            true;

        setInitialLastReadAt(
            originalLastReadAt
        );

        setInitialUnreadCount(
            unreadMessages.length
        );
    }, [
        conversationId,
        data,
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
                const element of
                messageElements
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
            if (
                initialUnreadCount === null ||
                initialUnreadCount <= 0 ||
                messages.length === 0
            ) {
                return null;
            }

            /*
             * Preferred method:
             *
             * Find the first message after the frozen
             * lastReadAt timestamp.
             */
            if (initialLastReadAt) {
                const readTime =
                    new Date(
                        initialLastReadAt
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
             * Fallback when there is no lastReadAt.
             *
             * Only use this when all unread messages are
             * currently loaded.
             */
            if (
                initialUnreadCount <=
                messages.length
            ) {
                const firstUnreadIndex =
                    messages.length -
                    initialUnreadCount;

                return (
                    messages[
                    firstUnreadIndex
                    ] ?? null
                );
            }

            /*
             * More unread messages exist than we currently
             * have loaded.
             */
            return null;
        }, [
            messages,
            initialUnreadCount,
            initialLastReadAt,
        ]);

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
     * 0 unread:
     *     -> latest message
     *
     * 1-4 unread:
     *     -> first unread
     *
     * 5+ unread:
     *     -> AI summary / first unread
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
            initialUnreadCount === null
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

                /*
                 * ====================================================
                 * UNREAD MESSAGES
                 * ====================================================
                 */

                if (
                    initialUnreadCount > 0
                ) {
                    const firstUnread =
                        getFirstUnreadMessage();

                    /*
                     * First unread isn't loaded yet.
                     *
                     * Never scroll to bottom.
                     */
                    if (!firstUnread) {
                        return;
                    }

                    firstUnreadMessageIdRef.current =
                        firstUnread.id;

                    /*
                     * 5+ unread:
                     *
                     * Position at the AI summary area.
                     */
                    if (
                        initialUnreadCount >= 5
                    ) {
                        const summaryAnchor =
                            document.getElementById(
                                "unread-summary-anchor"
                            );

                        if (
                            summaryAnchor
                        ) {
                            const containerRect =
                                container.getBoundingClientRect();

                            const anchorRect =
                                summaryAnchor.getBoundingClientRect();

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
                                behavior:
                                    "auto",
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

                    /*
                     * 1-4 unread:
                     *
                     * Position at the first unread message.
                     */
                    const firstUnreadElement =
                        document.getElementById(
                            `message-${firstUnread.id}`
                        );

                    if (
                        !firstUnreadElement
                    ) {
                        return;
                    }

                    const containerRect =
                        container.getBoundingClientRect();

                    const messageRect =
                        firstUnreadElement.getBoundingClientRect();

                    const targetScrollTop =
                        container.scrollTop +
                        (
                            messageRect.top -
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

                /*
                 * ====================================================
                 * NO UNREAD
                 * ====================================================
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
            }, 50);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [
        data,
        messages.length,
        initialUnreadCount,
        initialLastReadAt,
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

        if (
            !anchor ||
            !container
        ) {
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
         * Ignore changes caused by loading older messages.
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
         * Only scroll to bottom when:
         *
         * 1. A genuinely new message arrived.
         * 2. User was already near bottom.
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
         * IMPORTANT:
         *
         * Do not mark the conversation as read until the
         * original unread snapshot has been captured.
         */
        if (
            !unreadSnapshotCapturedRef.current
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

    if (firstUnreadMessage) {
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

                    /*
                     * AI summary is shown exactly once:
                     * immediately before the first unread message.
                     */
                    const shouldShowUnreadSummary =
                        isFirstUnread &&
                        (
                            initialUnreadCount ??
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
                                            {initialUnreadCount}{" "}
                                            new messages
                                        </span>

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
                                                 * Send a timestamp just
                                                 * before the first unread
                                                 * message so the backend
                                                 * includes that message.
                                                 */
                                                const unreadSince =
                                                    new Date(
                                                        new Date(
                                                            firstUnreadMessage.createdAt
                                                        ).getTime() -
                                                        1
                                                    ).toISOString();

                                                setAiSummary(
                                                    ""
                                                );

                                                summarizeUnread(
                                                    {
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
                                                    }
                                                );
                                            }}
                                            className="
                                                flex
                                                shrink-0
                                                items-center
                                                gap-1.5
                                                rounded-lg
                                                bg-sky-500
                                                px-3
                                                py-1.5
                                                text-xs
                                                font-medium
                                                text-white
                                                transition
                                                hover:bg-sky-600
                                                disabled:cursor-not-allowed
                                                disabled:opacity-50
                                            "
                                        >
                                            <Sparkles className="h-3.5 w-3.5" />

                                            {isSummarizingUnread
                                                ? "Summarizing..."
                                                : "Summarize with AI"}
                                        </button>

                                        <div className="h-px flex-1 bg-sky-500/20" />
                                    </div>

                                    {/* AI Summary */}
                                    {aiSummary && (
                                        <div
                                            className="
                                                mt-2
                                                w-full
                                                rounded-xl
                                                border
                                                border-sky-500/15
                                                bg-sky-500/[0.04]
                                                px-4
                                                py-3
                                            "
                                        >
                                            <div className="mb-2 flex items-center gap-2">
                                                <div
                                                    className="
                                                        flex
                                                        h-6
                                                        w-6
                                                        items-center
                                                        justify-center
                                                        rounded-md
                                                        bg-sky-500/10
                                                    "
                                                >
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

                                            <div className="whitespace-pre-wrap text-sm leading-6 text-white">
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