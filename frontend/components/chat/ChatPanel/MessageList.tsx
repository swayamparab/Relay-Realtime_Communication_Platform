"use client";

import {
    useEffect,
    useLayoutEffect,
    useRef,
} from "react";
import { useParams } from "next/navigation";

import { useMessages } from "@/hooks/message/useMessages";
import { useCurrentUser } from "@/hooks/user/useCurrentUser";

import MessageBubble from "./MessageBubble";

import { useMarkConversationAsRead } from "@/hooks/conversation/useMarkConversationAsRead";
import { useSocket } from "@/hooks/useSocket";

import type { Message } from "@/types/message";

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

    // Monday = start of week
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

    const { data: currentUser } =
        useCurrentUser();

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

    const lastReadAt =
        data?.pages[0]?.lastReadAt ?? null;

    const {
        socket,
        isConnected,
    } = useSocket();

    const {
        markConversationAsRead,
    } = useMarkConversationAsRead();

    const containerRef =
        useRef<HTMLDivElement>(null);

    /*
     * ============================================================
     * SCROLL STATE
     * ============================================================
     */

    const initialScrollDoneRef =
        useRef(false);

    /*
     * When true, the next message-list change
     * is caused by pagination.
     */
    const paginationPendingRef =
        useRef(false);

    /*
     * Used to prevent the new-message effect
     * from running after pagination.
     */
    const skipNextMessageScrollRef =
        useRef(false);

    /*
     * Message used as an anchor during pagination.
     */
    const paginationAnchorRef =
        useRef<{
            messageId: string;
            top: number;
        } | null>(null);

    /*
     * Number of messages from previous render.
     */
    const previousMessageCountRef =
        useRef(0);

    /*
     * Whether the user was near the bottom.
     */
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
    }, [conversationId]);

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
            container.getBoundingClientRect()
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
                    element,
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

        /*
         * User reached the top.
         */
        if (
            container.scrollTop <= 50 &&
            hasNextPage &&
            !isFetchingNextPage &&
            !paginationPendingRef.current
        ) {
            /*
             * Capture the first visible message
             * BEFORE loading older messages.
             */
            const anchor =
                getFirstVisibleMessage();

            if (anchor) {
                paginationAnchorRef.current = {
                    messageId:
                        anchor.messageId,
                    top: anchor.top,
                };
            }

            /*
             * Tell the rest of the component:
             *
             * "The next message-list update is
             * pagination, NOT a new message."
             */
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

        /*
         * Don't perform initial bottom scroll
         * while pagination is happening.
         */
        if (
            paginationPendingRef.current
        ) {
            return;
        }

        const id = setTimeout(() => {
            const container =
                containerRef.current;

            if (!container) {
                return;
            }

            container.scrollTo({
                top: container.scrollHeight,
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
            clearTimeout(id);
        };
    }, [
        data,
        conversationId,
        messages.length,
    ]);

    /*
     * ============================================================
     * RESTORE PAGINATION POSITION
     * ============================================================
     *
     * Instead of:
     *
     * oldScrollHeight -> newScrollHeight
     *
     * we use an actual message as an anchor.
     *
     * Example:
     *
     * Before:
     *
     *   Message #100  ← anchor
     *   Message #101
     *   Message #102
     *
     * Load older:
     *
     *   Message #50
     *   ...
     *   Message #100  ← same anchor
     *
     * We move scrollTop so #100 stays
     * at exactly the same screen position.
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

        /*
         * Move the scroll position by exactly
         * how much the anchor moved.
         */
        container.scrollTop +=
            difference;

        /*
         * Pagination is now completely handled.
         */
        paginationPendingRef.current =
            false;

        paginationAnchorRef.current =
            null;

        /*
         * The next message-count update should
         * NOT be treated as a new message.
         */
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

        /*
         * Pagination happened.
         *
         * NEVER scroll to bottom.
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
         * New real-time message.
         */
        if (
            currentCount >
            previousCount &&
            previousCount !== 0
        ) {
            const container =
                containerRef.current;

            if (container) {
                container.scrollTo({
                    top: container.scrollHeight,
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

            /*
             * Never interfere with pagination.
             */
            if (
                paginationPendingRef.current
            ) {
                return;
            }

            /*
             * If user is reading older messages,
             * don't throw them to the bottom.
             */
            if (
                !wasNearBottomRef.current &&
                !isNearBottom()
            ) {
                return;
            }

            container.scrollTo({
                top: container.scrollHeight,
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

            const timeout =
                setTimeout(() => {
                    setHighlightedMessageId(
                        null
                    );
                }, 2000);

            return () =>
                clearTimeout(timeout);
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

                    return (
                        <div
                            key={message.id}
                            className="contents"
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
        </div>
    );
}