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
import { useMarkConversationAsRead } from "@/hooks/conversation/useMarkConversationAsRead";
import { useSocket } from "@/hooks/useSocket";
import { useUnreadMessageSummary } from "@/hooks/ai/useUnreadMessageSummary";

import MessageBubble from "./MessageBubble";

import type { Message } from "@/types/message";

import {
    Sparkles,
    FileText,
} from "lucide-react";

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

    const [aiSummary, setAiSummary] =
        useState("");

    const [
        initialUnreadCount,
        setInitialUnreadCount,
    ] = useState<number | null>(null);

    const [
        unreadSnapshotReady,
        setUnreadSnapshotReady,
    ] = useState(false);

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

    const lastReadAt =
        data?.pages[0]
            ?.lastReadAt ?? null;

    const { isConnected } =
        useSocket();

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

    const initialUnreadCountRef =
        useRef<number | null>(
            null
        );

    const initialLastReadAtRef =
        useRef<string | null>(
            null
        );

    const firstUnreadMessageRef =
        useRef<string | null>(
            null
        );

    const unreadSnapshotCapturedRef =
        useRef(false);

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

        unreadSnapshotCapturedRef.current =
            false;

        setInitialUnreadCount(null);
        setUnreadSnapshotReady(false);
        setAiSummary("");
    }, [conversationId]);

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

        if (!conversation || !data) {
            return;
        }

        initialUnreadCountRef.current =
            conversation.unreadCount;

        initialLastReadAtRef.current =
            lastReadAt;

        setInitialUnreadCount(
            conversation.unreadCount
        );

        setUnreadSnapshotReady(true);

        unreadSnapshotCapturedRef.current =
            true;
    }, [
        conversationId,
        conversationsData,
        data,
        lastReadAt,
    ]);

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
                    firstUnreadMessageRef.current =
                        firstUnread.id;

                    return firstUnread;
                }
            }

            const firstUnreadIndex =
                Math.max(
                    0,
                    messages.length -
                    unreadCount
                );

            const firstUnread =
                messages[
                firstUnreadIndex
                ] ?? null;

            if (firstUnread) {
                firstUnreadMessageRef.current =
                    firstUnread.id;
            }

            return firstUnread;
        }, [messages]);

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

        const unreadCount =
            initialUnreadCountRef.current;

        if (unreadCount === null) {
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

                if (unreadCount > 0) {
                    const firstUnread =
                        getFirstUnreadMessage();

                    if (!firstUnread) {
                        return;
                    }

                    firstUnreadMessageRef.current =
                        firstUnread.id;

                    if (unreadCount >= 5) {
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

        return () =>
            clearTimeout(timeoutId);
    }, [
        data,
        conversationId,
        messages.length,
        getFirstUnreadMessage,
    ]);

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

        if (
            !unreadSnapshotCapturedRef.current
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

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <p className="text-slate-400">
                    Loading messages...
                </p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <p className="text-red-400">
                    Failed to load messages.
                </p>
            </div>
        );
    }

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

    const lastOwnMessage =
        messages.findLast(
            (message) =>
                message.sender.id ===
                currentUser?.user.id
        );

    const firstUnreadMessage =
        getFirstUnreadMessage();

    const unreadCount =
        initialUnreadCount ?? 0;

    const showUnreadSummary =
        unreadSnapshotReady &&
        unreadCount >= 5 &&
        !!firstUnreadMessage;

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="
                relative
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
            {showUnreadSummary && (
                <div
                    className="
                        pointer-events-none
                        absolute
                        left-0
                        right-0
                        top-3
                        z-30
                        flex
                        justify-center
                    "
                >
                    <button
                        type="button"
                        disabled={
                            isSummarizingUnread ||
                            !firstUnreadMessage
                        }
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
                                onChunk: (
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
                            pointer-events-auto
                            flex
                            items-center
                            gap-2.5
                            rounded-full
                            border
                            border-slate-300/80
                            bg-white
                            px-5
                            py-2.5
                            text-sm
                            font-semibold
                            text-slate-950
                            shadow-[0_4px_18px_rgba(0,0,0,0.35)]
                            backdrop-blur-sm
                            transition
                            hover:bg-slate-100
                            disabled:cursor-not-allowed
                            disabled:opacity-70
                        "
                    >
                        <FileText className="h-5 w-5 shrink-0" />

                        <span>
                            {isSummarizingUnread
                                ? "Summarizing..."
                                : `Summarize ${unreadCount} unread messages`}
                        </span>
                    </button>
                </div>
            )}

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

                    const shouldShowUnreadAnchor =
                        isFirstUnread &&
                        unreadCount >= 5;

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

                            {shouldShowUnreadAnchor && (
                                <div
                                    id="unread-summary-anchor"
                                    className="
                                        h-px
                                        w-full
                                        scroll-mt-3
                                    "
                                />
                            )}

                            <div
                                id={`message-${message.id}`}
                            >
                                <MessageBubble
                                    message={
                                        message
                                    }
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

            {aiSummary && (
                <div
                    className="
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
    );
}