"use client";

import { useState } from "react";

import { Search, UserPlus, X } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { useSearchUsers } from "@/hooks/user/useSearchUsers";
import { useCurrentUser } from "@/hooks/user/useCurrentUser";
import { useCallActions } from "@/hooks/call/useCallActions";

type AddParticipantDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function AddParticipantDialog({
    open,
    onOpenChange,
}: AddParticipantDialogProps) {
    const [query, setQuery] = useState("");

    const { data: currentUser } =
        useCurrentUser();

    const { addParticipantToCall } =
        useCallActions();

    const { data, isLoading } =
        useSearchUsers(query);

    const users =
        data?.users?.filter(
            (user) =>
                user.id !== currentUser?.user.id
        ) ?? [];

    async function handleAdd(userId: string) {
        // console.log("Adding participant:", userId);

        const success = await addParticipantToCall(userId);

        if (success) {
            setQuery("");
            onOpenChange(false);
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent className="z-[200] border-slate-700 bg-slate-900 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="size-5" />
                        Add participant
                    </DialogTitle>
                </DialogHeader>

                <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                    <Input
                        value={query}
                        onChange={(e) =>
                            setQuery(e.target.value)
                        }
                        placeholder="Search users..."
                        className="border-slate-700 bg-slate-800 pl-9 text-white placeholder:text-slate-500"
                    />
                </div>

                <div className="mt-3 max-h-72 overflow-y-auto">
                    {query.trim().length < 2 ? (
                        <p className="py-8 text-center text-sm text-slate-500">
                            Type at least 2 characters
                        </p>
                    ) : isLoading ? (
                        <p className="py-8 text-center text-sm text-slate-400">
                            Searching...
                        </p>
                    ) : users.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-500">
                            No users found
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className="relative z-40 flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-slate-800"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <Avatar className="size-10">
                                            <AvatarFallback className="bg-blue-600 text-white">
                                                {user.username
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {user.username}
                                            </p>

                                            <p className="truncate text-xs text-slate-400">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();

                                            console.log("ADD CLICKED", user.id);

                                            handleAdd(user.id);
                                        }}
                                        className="relative z-[210] rounded-full bg-blue-600 px-4 text-white hover:bg-blue-500"
                                    >
                                        Add
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}