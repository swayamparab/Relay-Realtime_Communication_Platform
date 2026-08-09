"use client";

import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreVertical, ArrowLeft, Phone, Video } from "lucide-react";

import { useConversations } from "@/hooks/conversation/useConversations";
import { useSocket } from "@/hooks/useSocket";

import { formatLastSeen } from "@/lib/formatLastSeen";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchMessages } from "@/hooks/message/useSearchMessages";
import { useCallActions } from "@/hooks/call/useCallActions";
import GroupInfoDialog from "../group/GroupInfoDialog";
import { useGroupInfo } from "@/hooks/group/useGroupInfo";
import { GroupCallControls } from "@/components/group-call/GroupCallControls";

type ChatHeaderProps = {
    isTyping: boolean;
    onJumpToMessage: (messageId: string) => void;
};

export default function ChatHeader({ isTyping, onJumpToMessage }: ChatHeaderProps) {

    const router = useRouter();

    const { conversationId } = useParams<{ conversationId: string; }>();

    const { data, isLoading } = useConversations();

    const { onlineUsers } = useSocket();

    const [isSearching, setIsSearching] = useState(false);
    const [search, setSearch] = useState("");

    const [currentMatch, setCurrentMatch] = useState(0);

    const [groupInfoOpen, setGroupInfoOpen] = useState(false);

    const { startVoiceCall, startVideoCall } = useCallActions();

    const debouncedSearch = useDebounce(search, 300);

    useEffect(() => {
        setCurrentMatch(0);
    }, [debouncedSearch]);

    const {
        data: searchResults,
        isFetching,
    } = useSearchMessages(conversationId, debouncedSearch);

    const totalMatches = searchResults?.messages.length ?? 0;

    const goNext = () => {
        if (!searchResults?.messages.length) return;

        setCurrentMatch((prev) =>
            Math.min(prev + 1, searchResults.messages.length - 1)
        );
    };

    const goPrevious = () => {
        if (!searchResults?.messages.length) return;

        setCurrentMatch((prev) =>
            Math.max(prev - 1, 0)
        );
    };

    useEffect(() => {
        if (!searchResults?.messages.length) {
            return;
        }

        onJumpToMessage(
            searchResults.messages[currentMatch].id
        );
    }, [
        currentMatch,
        searchResults,
        onJumpToMessage,
    ]);

    const conversation = data?.conversations.find(
        (conversation) =>
            conversation.conversationId === conversationId
    );

    const isGroup = conversation?.type === "group";

    const { data: groupInfo } = useGroupInfo(
        isGroup ? conversationId : ""
    );

    if (isLoading) {
        return (
            <header
                className="
                flex
                h-16
                items-center
                justify-between
                border-slate-800/70
                bg-slate-900/80
                px-5
                backdrop-blur-xl
            "
            >
                <p className="text-slate-400">
                    Loading...
                </p>
            </header>
        );
    }

    if (!conversation) {
        return (
            <header
                className="
                flex
                h-16
                items-center
                justify-between
                border-slate-800/70
                bg-slate-900/80
                px-5
                backdrop-blur-xl
            "
            >
                <p className="text-red-400">
                    Conversation not found
                </p>
            </header>
        );
    }

    const isOnline =
        !isGroup &&
        onlineUsers.includes(conversation.otherUser!.id);

    const lastSeenText =
        !isGroup
            ? formatLastSeen(conversation.otherUser!.lastSeen)
            : "";

    const title = isGroup
        ? groupInfo?.group.name ?? conversation.group!.name
        : conversation.otherUser!.username;

    const avatarLetter = title.charAt(0).toUpperCase();

    const subtitle = isGroup
        ? `${groupInfo?.group.members.length ?? conversation.group!.memberCount} members`
        : isTyping
            ? "Typing..."
            : isOnline
                ? "Online"
                : lastSeenText;

    const highlightText = (text: string, query: string) => {
        if (!query.trim()) return text;

        const regex = new RegExp(`(${query})`, "gi");

        return text.split(regex).map((part, index) =>
            regex.test(part) ? (
                <mark
                    key={index}
                    className="rounded bg-yellow-400 px-0.5 text-black"
                >
                    {part}
                </mark>
            ) : (
                part
            )
        );
    }

    if (isSearching) {
        return (
            <>
                <header
                    className="
                        flex
                        h-16
                        items-center
                        justify-between
                        border-slate-800/70
                        bg-slate-900/80
                        px-5
                        backdrop-blur-xl
                    "
                >
                    <button
                        onClick={() => {
                            setIsSearching(false);
                            setSearch("");
                        }}
                        className="rounded-xl p-2 hover:bg-slate-800"
                    >
                        <ArrowLeft className="h-5 w-5 text-white" />
                    </button>

                    <div className="flex-1">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="search in chat..."
                            className="
                                h-10
                                w-full
                                rounded-xl
                                border
                                border-slate-700
                                bg-slate-800/80
                                backdrop-blur
                                px-4
                                text-sm
                                text-white
                                outline-none
                                placeholder:text-slate-400
                                focus:border-blue-500
                            "
                            autoFocus
                        />
                    </div>

                    <div className="flex items-center gap-1">

                        <span className="w-12 text-center text-sm text-slate-400">
                            {totalMatches === 0
                                ? "0/0"
                                : `${currentMatch + 1}/${totalMatches}`}
                        </span>

                        <button
                            onClick={goNext}
                            disabled={
                                currentMatch === totalMatches - 1 ||
                                totalMatches === 0
                            }
                            className="rounded-lg p-1 hover:bg-slate-800 disabled:opacity-40"
                        >
                            <ChevronUp className="h-4 w-4 text-slate-300" />
                        </button>
                        <button
                            onClick={goPrevious}
                            disabled={currentMatch === 0}
                            className="rounded-lg p-1 hover:bg-slate-800 disabled:opacity-40"
                        >
                            <ChevronDown className="h-4 w-4 text-slate-300" />
                        </button>

                        <button
                            onClick={() => setSearch("")}
                            className="rounded-lg p-1 hover:bg-slate-800"
                        >
                            <X className="h-4 w-4 text-slate-300" />
                        </button>

                    </div>
                </header>

            </>
        );
    }

    return (
        <header
            className="
                flex
                h-16
                items-center
                justify-between
                border-slate-800/70
                bg-slate-900/80
                px-5
                backdrop-blur-xl
            "
        >
            <div className="flex min-w-0 items-center gap-2">
                <button
                    onClick={() => router.push("/chat")}
                    className="rounded-xl p-2 transition-all duration-200 hover:bg-slate-800 lg:hidden"
                    aria-label="Back"
                >
                    <ArrowLeft className="h-5 w-5 text-slate-300" />
                </button>

                <button
                    onClick={() => {
                        if (isGroup) {
                            setGroupInfoOpen(true);
                        }
                    }}
                    className="
            flex
            min-w-0
            items-center
            gap-3
            rounded-xl
            px-2
            py-1
            transition
            hover:bg-slate-800/60
        "
                >
                    <Avatar
                        className="
                h-12
                w-12
                ring-2
                ring-slate-700/40
                shadow-lg
            "
                    >
                        <AvatarFallback className="bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700">
                            {avatarLetter}
                        </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                        <h2 className="truncate text-[15px] font-semibold tracking-[0.01em] text-white">
                            {title}
                        </h2>

                        <div className="mt-0.5 flex items-center gap-2">
                            {!isGroup && (
                                <div className="relative">
                                    {isOnline && (
                                        <span
                                            className="
                                    absolute
                                    inset-0
                                    animate-ping
                                    rounded-full
                                    bg-emerald-500
                                    opacity-60
                                "
                                        />
                                    )}

                                    <span
                                        className={`
                                relative
                                block
                                h-2.5
                                w-2.5
                                rounded-full
                                ${isTyping
                                                ? "bg-emerald-400"
                                                : isOnline
                                                    ? "bg-emerald-500"
                                                    : "bg-slate-500"
                                            }
                            `}
                                    />
                                </div>
                            )}

                            <p
                                className={`truncate text-sm ${isTyping
                                    ? "text-green-400"
                                    : isOnline
                                        ? "text-emerald-400"
                                        : "text-slate-400"
                                    }`}
                            >
                                {subtitle}
                            </p>
                        </div>
                    </div>
                </button>
            </div>
            <div className="flex items-center gap-1">
                <div className="flex items-center gap-1">
                    {!isGroup && (
                        <>
                            {/* 1-to-1 calls */}
                            <button
                                onClick={() =>
                                    startVoiceCall({
                                        conversationId,
                                        receiver: {
                                            id: conversation.otherUser!.id,
                                            username:
                                                conversation.otherUser!.username,
                                        },
                                    })
                                }
                                className="
                                    rounded-xl
                                    p-2
                                    text-slate-400
                                    transition-all
                                    duration-200
                                    hover:bg-sky-500/15
                                    hover:text-sky-400
                                    hover:scale-105
                                    active:scale-95
                                    hover:text-white
                                "
                                aria-label="Voice Call"
                            >
                                <Phone className="h-5 w-5" />
                            </button>

                            <button
                                onClick={() =>
                                    startVideoCall({
                                        conversationId,
                                        receiver: {
                                            id:
                                                conversation.otherUser!.id,
                                            username:
                                                conversation.otherUser!.username,
                                        },
                                    })
                                }
                                className="
                                    rounded-xl
                                    p-2
                                    text-slate-400
                                    transition-all
                                    duration-200
                                    hover:bg-sky-500/15
                                    hover:text-sky-400
                                    hover:scale-105
                                    active:scale-95
                                    hover:text-white
                                "
                                aria-label="Video Call"
                            >
                                <Video className="h-5 w-5" />
                            </button>
                        </>
                    )}

                    {isGroup && (
                        <GroupCallControls
                            conversationId={conversation.conversationId}
                        />
                    )}
                </div>


                <DropdownMenu>
                    <DropdownMenuTrigger
                        className="
                            rounded-xl
                            p-2
                            text-slate-400
                            transition-all
                            duration-200
                            hover:bg-slate-800
                            hover:text-white
                        "
                        aria-label="Conversation options"
                    >
                        <MoreVertical className="h-5 w-5" />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        className="w-44 border-slate-700 bg-slate-900 text-white"
                    >
                        <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setIsSearching(true)}
                        >
                            <Search className="mr-2 h-4 w-4" />
                            Search
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {isGroup && (
                <GroupInfoDialog
                    open={groupInfoOpen}
                    onOpenChange={setGroupInfoOpen}
                    groupId={conversation.conversationId}
                />
            )}
        </header >
    );
}