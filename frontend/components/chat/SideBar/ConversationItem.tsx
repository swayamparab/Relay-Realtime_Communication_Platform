"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSocket } from "@/hooks/useSocket";
import { Conversation } from "@/types/conversations";
import { useRouter, useParams } from "next/navigation";
import { useCurrentUser } from "@/hooks/user/useCurrentUser";

type ConversationItemProps = {
    conversation: Conversation;
};

export default function ConversationItem({
    conversation,
}: ConversationItemProps) {
    const router = useRouter();

    const { conversationId: currentConversationId } = useParams<{
        conversationId?: string;
    }>();

    const isActive =
        currentConversationId === conversation.conversationId;

    const { onlineUsers } = useSocket();

    const isGroup = conversation.type === "group";

    const title = isGroup
        ? conversation.group!.name
        : conversation.otherUser!.username;

    const isOnline = !isGroup
        ? onlineUsers.includes(conversation.otherUser!.id)
        : false;

    const { data: currentUser } = useCurrentUser();

    const lastMessagePreview = !conversation.lastMessage
        ? "No messages yet"
        : conversation.lastMessage.type === "text"
            ? conversation.lastMessage.content
            : conversation.lastMessage.type === "image"
                ? "📷 Image"
                : conversation.lastMessage.type === "video"
                    ? "🎥 Video"
                    : conversation.lastMessage.type === "file"
                        ? "📄 File"
                        : "🎤 Voice message";

    const senderName =
        conversation.lastMessage?.sender.id === currentUser?.user.id
            ? "You"
            : conversation.lastMessage?.sender.username;

    const preview =
        !conversation.lastMessage
            ? "No messages yet"
            : isGroup
                ? `${senderName}: ${lastMessagePreview}`
                : lastMessagePreview;

    return (
        <button
            onClick={() =>
                router.push(`/chat/${conversation.conversationId}`)
            }
            className={`
                mx-2 my-1 flex w-[calc(100%-1rem)] items-center gap-3 rounded-2xl px-4 py-3
                text-left transition-all duration-200
                ${isActive
                    ? `
                        bg-gradient-to-r
                        from-sky-500/15
                        to-blue-500/10
                        shadow-lg
                        ring-1
                        ring-sky-400/30
                        scale-[1.01]
                    `
                    : `
                        hover:bg-slate-800/70
                        hover:scale-[1.01]
                        hover:shadow-md
                    `
                }
            `}
        >
            <div className="relative">
                <Avatar
                    className="
                        h-12
                        w-12
                        ring-2
                        ring-slate-700/40
                        shadow-lg
                    "
                >
                    <AvatarFallback
                        className="
                            bg-gradient-to-br
                            from-slate-600
                            to-slate-800
                            text-base
                            font-bold
                            text-white
                        "
                    >
                        {title.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                {!isGroup && isOnline && (
                    <div className="absolute bottom-0 right-0">
                        <span
                            className="
                                absolute
                                inset-0
                                rounded-full
                                bg-emerald-500
                                opacity-70
                            "
                        />

                        <span
                            className="
                                relative
                                block
                                h-3
                                w-3
                                rounded-full
                                border-2
                                border-slate-900
                                bg-emerald-500
                            "
                        />
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold tracking-[0.01em] text-white">
                    {title}
                </p>

                <p className="mt-0.5 truncate text-[13px] leading-5 text-slate-400">
                    {preview}
                </p>
            </div>

            {conversation.unreadCount > 0 && (
                <div
                    className="
                        flex
                        h-6
                        min-w-6
                        items-center
                        justify-center
                        rounded-full
                        bg-sky-500
                        px-2
                        text-[11px]
                        font-bold
                        text-white
                        shadow-lg
                        shadow-sky-500/30
                    "
                >
                    {conversation.unreadCount}
                </div>
            )}
        </button>
    );
}