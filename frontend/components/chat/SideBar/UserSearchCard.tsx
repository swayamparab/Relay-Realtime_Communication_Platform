"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { acceptChatRequest, sendChatRequest } from "@/services/chat-requests";

import { useRouter } from "next/navigation";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

type UserSearchCardProps = {
    id: string;
    username: string;
    email: string;
    relationship:
    | "none"
    | "pending_sent"
    | "pending_received"
    | "friends";
    conversationId: string | null;
    requestId: string | null;
};

export default function UserSearchCard({
    id,
    username,
    email,
    relationship,
    conversationId,
    requestId
}: UserSearchCardProps) {

    const router = useRouter();

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: sendChatRequest,

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["search-users"],
            });

            toast.success("Chat request sent!");
        },
    });

    const acceptMutation = useMutation({
        mutationFn: acceptChatRequest,

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["search-users"],
            });

            queryClient.invalidateQueries({
                queryKey: queryKeys.conversations,
            });

            toast.success("Chat request accepted!");
        },
    });

    let actionButton;

    switch (relationship) {
        case "none":
            actionButton = (
                <Button
                    size="sm"
                    className="rounded-full bg-blue-600 px-4 hover:bg-blue-500"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate(id)}
                >
                    {mutation.isPending ? "Sending..." : "Send"}
                </Button>
            );
            break;

        case "pending_sent":
            actionButton = (
                <Button
                    size="sm"
                    disabled
                    variant="secondary"
                    className="
                        rounded-full
                        border-0
                        bg-slate-800
                        text-slate-300
                    "
                >
                    Pending
                </Button>
            );
            break;

        case "pending_received":
            actionButton = (
                <Button
                    size="sm"
                    disabled={acceptMutation.isPending}
                    className="
                        rounded-full
                        bg-emerald-600
                        px-4
                        hover:bg-emerald-500
                    "
                    onClick={() => {
                        if (requestId) {
                            acceptMutation.mutate(requestId);
                        }
                    }}
                >
                    {acceptMutation.isPending
                        ? "Accepting..."
                        : "Accept"}
                </Button>
            );
            break;
        case "friends":
            actionButton = (
                <Button
                    size="sm"
                    className="
                        rounded-full
                        bg-blue-600
                        px-4
                        hover:bg-blue-500
                    "
                    onClick={() => {
                        if (conversationId) {
                            router.replace(`/chat/${conversationId}`);
                        }
                    }}
                >
                    Chat
                </Button>
            );
            break;
    }

    return (
        <div
            className="
            mx-2 my-1
            flex items-center justify-between
            rounded-2xl
            px-4 py-3
            transition-all duration-200
            hover:bg-slate-800/70
            hover:shadow-sm
        "
        >
            <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-11 w-11 ring-1 ring-slate-700/60">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 font-semibold text-white">
                        {username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold tracking-tight text-white">
                        {username}
                    </p>

                    <p className="truncate text-sm text-slate-400">
                        {email}
                    </p>
                </div>
            </div>

            {actionButton}
        </div>
    );
}