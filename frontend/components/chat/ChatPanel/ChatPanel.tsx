"use client";

import { useEffect, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

import { useSocket } from "@/hooks/useSocket";
import { useMarkConversationAsRead } from "@/hooks/conversation/useMarkConversationAsRead";

import { useParams } from "next/navigation";

import type { Message } from "@/types/message";

export default function ChatPanel() {
    const { socket } = useSocket();

    const { markConversationAsRead } = useMarkConversationAsRead();

    const { conversationId } = useParams<{ conversationId: string; }>();

    const [isTyping, setIsTyping] = useState(false);

    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    const [jumpToMessageId, setJumpToMessageId] = useState<string | null>(null);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

    useEffect(() => {
        markConversationAsRead(conversationId);
    }, [conversationId, markConversationAsRead]);

    useEffect(() => {
        if (!conversationId) return;

        socket.emit("conversation:view", {
            conversationId,
        });

        return () => {
            socket.emit("conversation:leave");
        };
    }, [socket, conversationId]);

    useEffect(() => {
        function handleTyping(data: {
            conversationId: string;
            userId: string;
        }) {
            if (data.conversationId !== conversationId) return;

            setIsTyping(true);
        }

        function handleStopTyping(data: {
            conversationId: string;
            userId: string;
        }) {
            if (data.conversationId !== conversationId) return;

            setIsTyping(false);
        }

        socket.on("user_typing", handleTyping);
        socket.on("user_stop_typing", handleStopTyping);

        return () => {
            socket.off("user_typing", handleTyping);
            socket.off("user_stop_typing", handleStopTyping);
        };
    }, [socket]);

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            <ChatHeader
                isTyping={isTyping}
                onJumpToMessage={setJumpToMessageId}
            />

            <MessageList
                onReply={setReplyingTo}
                jumpToMessageId={jumpToMessageId}
                highlightedMessageId={highlightedMessageId}
                setHighlightedMessageId={setHighlightedMessageId}
            />

            <div className="shrink-0">
                <MessageInput
                    replyingTo={replyingTo}
                    clearReply={() => setReplyingTo(null)}
                />
            </div>
        </div>
    );
}