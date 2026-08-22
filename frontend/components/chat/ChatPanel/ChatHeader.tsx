"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    MoreVertical,
    ArrowLeft,
    Phone,
    Video,
    Search,
    X,
    ChevronUp,
    ChevronDown,
    Sparkles
} from "lucide-react";

import { useConversations } from "@/hooks/conversation/useConversations";
import { useSocket } from "@/hooks/useSocket";
import { formatLastSeen } from "@/lib/formatLastSeen";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";

import { useDebounce } from "@/hooks/useDebounce";
import { useSearchMessages } from "@/hooks/message/useSearchMessages";
import { useCallActions } from "@/hooks/call/useCallActions";
import GroupInfoDialog from "../group/GroupInfoDialog";
import { useGroupInfo } from "@/hooks/group/useGroupInfo";
import { GroupCallControls } from "@/components/group-call/GroupCallControls";
import AIAssistant from "@/components/ai/AIAssistant";

type ChatHeaderProps = {
    isTyping: boolean;
    onJumpToMessage: (messageId: string) => void;
};

export default function ChatHeader({
    isTyping,
    onJumpToMessage,
}: ChatHeaderProps) {
    const router = useRouter();

    const {
        conversationId,
    } = useParams<{
        conversationId: string;
    }>();

    const {
        data,
        isLoading,
    } = useConversations();

    const {
        onlineUsers,
    } = useSocket();

    const [isSearching, setIsSearching] =
        useState(false);

    const [search, setSearch] = useState("");

    const [currentMatch, setCurrentMatch] = useState(0);

    const [groupInfoOpen, setGroupInfoOpen] = useState(false);

    const [aiOpen, setAiOpen] = useState(false);

    const {
        startVoiceCall,
        startVideoCall,
    } = useCallActions();

    const debouncedSearch = useDebounce(search, 300);

    useEffect(() => {
        setCurrentMatch(0);
    }, [debouncedSearch]);

    const {
        data: searchResults,
    } = useSearchMessages(
        conversationId,
        debouncedSearch
    );

    const totalMatches =
        searchResults?.messages.length ?? 0;

    const goNext = () => {
        if (!searchResults?.messages.length) {
            return;
        }

        setCurrentMatch((prev) =>
            Math.min(
                prev + 1,
                searchResults.messages.length - 1
            )
        );
    };

    const goPrevious = () => {
        if (!searchResults?.messages.length) {
            return;
        }

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

    const conversation =
        data?.conversations.find(
            (conversation) =>
                conversation.conversationId ===
                conversationId
        );

    const isGroup =
        conversation?.type === "group";

    const {
        data: groupInfo,
    } = useGroupInfo(
        isGroup ? conversationId : ""
    );

    if (isLoading) {
        return (
            <header
                className="
                    flex
                    h-16
                    items-center
                    border-slate-800/70
                    bg-slate-900/80
                    px-3
                    backdrop-blur-xl
                    sm:px-5
                "
            >
                <p className="text-sm text-slate-400">
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
                    border-slate-800/70
                    bg-slate-900/80
                    px-3
                    backdrop-blur-xl
                    sm:px-5
                "
            >
                <p className="text-sm text-red-400">
                    Conversation not found
                </p>
            </header>
        );
    }

    const isOnline =
        !isGroup &&
        onlineUsers.includes(
            conversation.otherUser!.id
        );

    const lastSeenText =
        !isGroup
            ? formatLastSeen(
                conversation.otherUser!.lastSeen
            )
            : "";

    const title = isGroup
        ? groupInfo?.group.name ??
        conversation.group!.name
        : conversation.otherUser!.username;

    const avatarLetter =
        title.charAt(0).toUpperCase();

    const subtitle = isGroup
        ? `${groupInfo?.group.members.length ??
        conversation.group!.memberCount
        } members`
        : isTyping
            ? "Typing..."
            : isOnline
                ? "Online"
                : lastSeenText;

    if (isSearching) {
        return (
            <header
                className="
                    flex
                    h-16
                    min-w-0
                    items-center
                    gap-2
                    border-slate-800/70
                    bg-slate-900/80
                    px-2
                    backdrop-blur-xl
                    sm:px-4
                "
            >
                <button
                    onClick={() => {
                        setIsSearching(false);
                        setSearch("");
                    }}
                    className="
                        shrink-0
                        rounded-xl
                        p-2
                        transition
                        hover:bg-slate-800
                    "
                    aria-label="Close search"
                >
                    <ArrowLeft className="h-5 w-5 text-white" />
                </button>

                <div className="min-w-0 flex-1">
                    <input
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        placeholder="Search in chat..."
                        className="
                            h-10
                            w-full
                            rounded-xl
                            border-slate-700
                            bg-slate-800/80
                            px-3
                            text-sm
                            text-white
                            outline-none
                            placeholder:text-slate-500
                            focus:border-sky-500
                            sm:px-4
                        "
                        autoFocus
                    />
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                    <span
                        className="
                            w-10
                            text-center
                            text-xs
                            text-slate-400
                            sm:w-12
                            sm:text-sm
                        "
                    >
                        {totalMatches === 0
                            ? "0/0"
                            : `${currentMatch + 1}/${totalMatches}`}
                    </span>

                    <button
                        onClick={goNext}
                        disabled={
                            currentMatch ===
                            totalMatches - 1 ||
                            totalMatches === 0
                        }
                        className="
                            rounded-lg
                            p-1.5
                            transition
                            hover:bg-slate-800
                            disabled:opacity-40
                        "
                        aria-label="Next result"
                    >
                        <ChevronUp className="h-4 w-4 text-slate-300" />
                    </button>

                    <button
                        onClick={goPrevious}
                        disabled={
                            currentMatch === 0 ||
                            totalMatches === 0
                        }
                        className="
                            rounded-lg
                            p-1.5
                            transition
                            hover:bg-slate-800
                            disabled:opacity-40
                        "
                        aria-label="Previous result"
                    >
                        <ChevronDown className="h-4 w-4 text-slate-300" />
                    </button>

                    <button
                        onClick={() => setSearch("")}
                        className="
                            rounded-lg
                            p-1.5
                            transition
                            hover:bg-slate-800
                        "
                        aria-label="Clear search"
                    >
                        <X className="h-4 w-4 text-slate-300" />
                    </button>
                </div>
            </header>
        );
    }

    return (
        <>
            <header
                className="
                    flex
                    h-16
                    min-w-0
                    items-center
                    justify-between
                    gap-1
                    bg-slate-900/80
                    px-1.5
                    backdrop-blur-xl
                    sm:gap-2
                    sm:px-3
                    lg:px-5
                "
            >
                <div
                    className="
                        flex
                        min-w-0
                        flex-1
                        items-center
                        gap-1
                        sm:gap-2
                    "
                >
                    {/* Mobile back */}
                    <button
                        onClick={() =>
                            router.replace("/chat")
                        }
                        className="
                            shrink-0
                            rounded-xl
                            p-2
                            transition
                            hover:bg-slate-800
                            lg:hidden
                        "
                        aria-label="Back"
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-300" />
                    </button>

                    {/* Chat information */}
                    <button
                        onClick={() => {
                            if (isGroup) {
                                setGroupInfoOpen(true);
                            }
                        }}
                        className="
                            flex
                            min-w-0
                            flex-1
                            items-center
                            gap-2
                            overflow-hidden
                            rounded-xl
                            px-1
                            py-1
                            text-left
                            transition
                            hover:bg-slate-800/60
                            sm:gap-3
                            sm:px-2
                        "
                    >
                        <Avatar
                            className="
                                h-10
                                w-10
                                shrink-0
                                ring-2
                                ring-slate-700/40
                                shadow-lg
                                sm:h-12
                                sm:w-12
                            "
                        >
                            <AvatarFallback
                                className="
                                    bg-gradient-to-br
                                    from-sky-500
                                    via-blue-600
                                    to-indigo-700
                                    text-sm
                                    font-semibold
                                    sm:text-base
                                "
                            >
                                {avatarLetter}
                            </AvatarFallback>
                        </Avatar>

                        <div
                            className="
                                min-w-0
                                flex-1
                            "
                        >
                            <h2
                                className="
                                    truncate
                                    text-sm
                                    font-semibold
                                    tracking-[0.01em]
                                    text-white
                                    sm:text-[15px]
                                "
                            >
                                {title}
                            </h2>

                            <div
                                className="
                                    mt-0.5
                                    flex
                                    min-w-0
                                    items-center
                                    gap-1.5
                                    sm:gap-2
                                "
                            >
                                {!isGroup && (
                                    <div className="relative shrink-0">
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
                                                h-2
                                                w-2
                                                rounded-full
                                                sm:h-2.5
                                                sm:w-2.5
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
                                    className={`
                                        min-w-0
                                        truncate
                                        text-xs
                                        sm:text-sm
                                        ${isTyping
                                            ? "text-green-400"
                                            : isOnline
                                                ? "text-emerald-400"
                                                : "text-slate-400"
                                        }
                                    `}
                                >
                                    {subtitle}
                                </p>
                            </div>
                        </div>
                    </button>
                </div>

                <div
                    className="
                        flex
                        shrink-0
                        items-center
                        gap-0
                        sm:gap-1
                    "
                >
                    {/* 1-to-1 Calls */}
                    {!isGroup && (
                        <>
                            <button
                                onClick={() =>
                                    startVoiceCall({
                                        conversationId,
                                        receiver: {
                                            id: conversation.otherUser!.id,
                                            username:
                                                conversation.otherUser!
                                                    .username,
                                        },
                                    })
                                }
                                className="
                                    shrink-0
                                    rounded-xl
                                    p-2
                                    text-slate-400
                                    transition
                                    hover:bg-sky-500/15
                                    hover:text-white
                                    active:scale-95
                                    sm:p-2.5
                                "
                                aria-label="Voice Call"
                            >
                                <Phone
                                    className="
                                        h-[18px]
                                        w-[18px]
                                        sm:h-5
                                        sm:w-5
                                    "
                                />
                            </button>

                            <button
                                onClick={() =>
                                    startVideoCall({
                                        conversationId,
                                        receiver: {
                                            id: conversation.otherUser!.id,
                                            username:
                                                conversation.otherUser!
                                                    .username,
                                        },
                                    })
                                }
                                className="
                                    shrink-0
                                    rounded-xl
                                    p-2
                                    text-slate-400
                                    transition
                                    hover:bg-sky-500/15
                                    hover:text-white
                                    active:scale-95
                                    sm:p-2.5
                                "
                                aria-label="Video Call"
                            >
                                <Video
                                    className="
                                        h-[18px]
                                        w-[18px]
                                        sm:h-5
                                        sm:w-5
                                    "
                                />
                            </button>
                        </>
                    )}

                    {/* Group Calls */}
                    {isGroup && (
                        <div className="shrink-0">
                            <GroupCallControls
                                conversationId={
                                    conversation.conversationId
                                }
                            />
                        </div>
                    )}

                    {/* AI Assistant */}
                    <button
                        onClick={() => setAiOpen(true)}
                        className="
                            shrink-0
                            rounded-xl
                            p-2
                            text-slate-400
                            transition
                            hover:bg-sky-500/15
                            hover:text-sky-400
                            active:scale-95
                            sm:p-2.5
                        "
                        aria-label="Ask Relay AI"
                    >
                        <Sparkles
                            className="
                                h-[19px]
                                w-[19px]
                                sm:h-5
                                sm:w-5
                            "
                        />
                    </button>

                    {/* More menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            className="
                                shrink-0
                                rounded-xl
                                p-2
                                text-slate-400
                                transition
                                hover:bg-slate-800
                                hover:text-white
                                sm:p-2.5
                            "
                            aria-label="Conversation options"
                        >
                            <MoreVertical
                                className="
                                    h-[19px]
                                    w-[19px]
                                    sm:h-5
                                    sm:w-5
                                "
                            />
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            className="
                                w-44
                                border-slate-700
                                bg-slate-900
                                text-white
                            "
                        >
                            <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() =>
                                    setIsSearching(true)
                                }
                            >
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* AI Assistance Dialog */}
            <Dialog
                open={aiOpen}
                onOpenChange={setAiOpen}
            >
                <DialogContent
                    className="
                        w-[calc(100%-2rem)]
                        max-w-md
                        border-slate-800
                        bg-slate-950
                        p-0
                        text-white
                    "
                >
                    <AIAssistant
                        conversationId={conversationId}
                    />
                </DialogContent>
            </Dialog>

            {/* Group Info */}
            {isGroup && (
                <GroupInfoDialog
                    open={groupInfoOpen}
                    onOpenChange={setGroupInfoOpen}
                    groupId={
                        conversation.conversationId
                    }
                />
            )}
        </>
    );
}