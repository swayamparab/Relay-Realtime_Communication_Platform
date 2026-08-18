"use client";

import { useEffect, useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
    Check,
    Search,
    UsersRound,
    X,
} from "lucide-react";

import { useSearchUsers } from "@/hooks/user/useSearchUsers";
import { useGroupActions } from "@/hooks/group/useGroupActions";

type CreateGroupDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function CreateGroupDialog({
    open,
    onOpenChange,
}: CreateGroupDialogProps) {
    const [groupName, setGroupName] = useState("");
    const [search, setSearch] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    const { data: users } = useSearchUsers(search);

    const {
        createGroup,
        isCreatingGroup,
    } = useGroupActions();

    useEffect(() => {
        if (!open) {
            setGroupName("");
            setSearch("");
            setSelectedUsers([]);
        }
    }, [open]);

    const selectedUserObjects =
        users?.users.filter((user) =>
            selectedUsers.includes(user.id)
        ) ?? [];

    function toggleUser(userId: string) {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    }

    function removeUser(userId: string) {
        setSelectedUsers((prev) =>
            prev.filter((id) => id !== userId)
        );
    }

    const canCreate =
        groupName.trim().length > 0 &&
        selectedUsers.length > 0 &&
        !isCreatingGroup;

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent
                className="
                    flex
                    h-[85vh]
                    max-h-[720px]
                    w-[calc(100%-24px)]
                    max-w-md
                    flex-col
                    overflow-hidden
                    border-0
                    bg-slate-950
                    p-0
                    text-white
                    shadow-2xl
                    outline-none
                    ring-0
                "
            >
                {/* Header */}

                <DialogHeader
                    className="
                        shrink-0
                        bg-slate-900/70
                        px-5
                        py-5
                        backdrop-blur-xl
                    "
                >
                    <div className="flex items-center gap-4">
                        <Avatar
                            className="
                                h-14
                                w-14
                                shrink-0
                                ring-2
                                ring-slate-700/60
                            "
                        >
                            <AvatarFallback
                                className="
                                    bg-gradient-to-br
                                    from-sky-500
                                    via-blue-600
                                    to-indigo-700
                                    text-lg
                                    font-bold
                                    text-white
                                "
                            >
                                {groupName.trim()
                                    ? groupName
                                        .trim()
                                        .charAt(0)
                                        .toUpperCase()
                                    : (
                                        <UsersRound className="h-6 w-6" />
                                    )}
                            </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                            <DialogTitle className="text-lg font-semibold">
                                Create Group
                            </DialogTitle>

                            <p className="mt-0.5 text-sm text-slate-400">
                                Add people to start a group chat
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                onOpenChange(false)
                            }
                            className="
                                rounded-full
                                border-0
                                p-2
                                text-slate-400
                                outline-none
                                ring-0
                                transition
                                hover:bg-slate-800
                                hover:text-white
                                focus:outline-none
                                focus:ring-0
                            "
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Group Name */}

                    <div className="mt-4">
                        <input
                            value={groupName}
                            onChange={(e) =>
                                setGroupName(e.target.value)
                            }
                            placeholder="Group name"
                            maxLength={50}
                            className="
                                h-11
                                w-full
                                rounded-xl
                                border-0
                                bg-slate-800/70
                                px-4
                                text-sm
                                text-white
                                shadow-none
                                outline-none
                                ring-0
                                transition
                                placeholder:text-slate-500
                                focus:bg-slate-800
                                focus:outline-none
                                focus:ring-1
                                focus:ring-sky-500/40
                            "
                        />
                    </div>
                </DialogHeader>

                {/* Content */}

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    {/* Selected Members */}

                    {selectedUsers.length > 0 && (
                        <div className="mb-5">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Selected
                                </p>

                                <span className="text-xs text-slate-500">
                                    {selectedUsers.length}{" "}
                                    {selectedUsers.length === 1
                                        ? "member"
                                        : "members"}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {selectedUserObjects.map(
                                    (user) => (
                                        <div
                                            key={user.id}
                                            className="
                                                flex
                                                items-center
                                                gap-2
                                                rounded-full
                                                bg-slate-800
                                                py-1
                                                pl-1
                                                pr-2
                                                text-sm
                                                text-slate-200
                                            "
                                        >
                                            <Avatar className="h-7 w-7">
                                                <AvatarFallback
                                                    className="
                                                        bg-gradient-to-br
                                                        from-sky-500
                                                        to-indigo-600
                                                        text-xs
                                                        font-semibold
                                                        text-white
                                                    "
                                                >
                                                    {user.username
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>

                                            <span className="max-w-[120px] truncate">
                                                {user.username}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeUser(
                                                        user.id
                                                    )
                                                }
                                                className="
                                                    rounded-full
                                                    border-0
                                                    p-0.5
                                                    text-slate-500
                                                    outline-none
                                                    ring-0
                                                    transition
                                                    hover:bg-slate-700
                                                    hover:text-white
                                                    focus:outline-none
                                                    focus:ring-0
                                                "
                                                aria-label={`Remove ${user.username}`}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {/* Search */}

                    <div className="mb-4">
                        <div className="relative">
                            <Search
                                className="
                                    absolute
                                    left-3
                                    top-1/2
                                    h-4
                                    w-4
                                    -translate-y-1/2
                                    text-slate-500
                                "
                            />

                            <input
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                placeholder="Search people..."
                                className="
                                    h-11
                                    w-full
                                    rounded-xl
                                    border-0
                                    bg-slate-900
                                    pl-10
                                    pr-4
                                    text-sm
                                    text-white
                                    shadow-none
                                    outline-none
                                    ring-0
                                    transition
                                    placeholder:text-slate-500
                                    focus:outline-none
                                    focus:ring-1
                                    focus:ring-sky-500/40
                                "
                            />
                        </div>
                    </div>

                    {/* Section Title */}

                    <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {search.trim()
                            ? "Search results"
                            : "People"}
                    </p>

                    {/* Users */}

                    <div className="space-y-1">
                        {users?.users.map((user) => {
                            const selected =
                                selectedUsers.includes(
                                    user.id
                                );

                            return (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() =>
                                        toggleUser(user.id)
                                    }
                                    className={`
                                        flex
                                        w-full
                                        items-center
                                        justify-between
                                        rounded-xl
                                        px-3
                                        py-2.5
                                        text-left
                                        outline-none
                                        transition
                                        focus:outline-none
                                        ${selected
                                            ? "bg-sky-500/10"
                                            : "hover:bg-slate-900"
                                        }
                                    `}
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <Avatar className="h-10 w-10 shrink-0">
                                            <AvatarFallback
                                                className="
                                                    bg-gradient-to-br
                                                    from-slate-700
                                                    to-slate-800
                                                    font-semibold
                                                    text-slate-200
                                                "
                                            >
                                                {user.username
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-white">
                                                {user.username}
                                            </p>

                                            <p className="truncate text-xs text-slate-500">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Selection Indicator */}

                                    <div
                                        className={`
                                            flex
                                            h-5
                                            w-5
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-full
                                            transition
                                            ${selected
                                                ? "bg-sky-500 text-white"
                                                : "bg-slate-800"
                                            }
                                        `}
                                    >
                                        {selected && (
                                            <Check className="h-3.5 w-3.5" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}

                        {users?.users.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900">
                                    <Search className="h-5 w-5 text-slate-500" />
                                </div>

                                <p className="text-sm font-medium text-slate-300">
                                    No users found
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    Try searching for someone else.
                                </p>
                            </div>
                        )}

                        {!users && !search.trim() && (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <UsersRound className="mb-3 h-7 w-7 text-slate-600" />

                                <p className="text-sm text-slate-500">
                                    Search for people to add
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}

                <div
                    className="
                        shrink-0
                        bg-slate-900/70
                        p-4
                        backdrop-blur-xl
                    "
                >
                    <button
                        type="button"
                        disabled={!canCreate}
                        onClick={() =>
                            createGroup(
                                {
                                    name: groupName.trim(),
                                    memberIds: selectedUsers,
                                },
                                {
                                    onSuccess: () => {
                                        onOpenChange(false);
                                    },
                                }
                            )
                        }
                        className="
                            h-11
                            w-full
                            rounded-xl
                            border-0
                            bg-gradient-to-r
                            from-sky-500
                            to-blue-600
                            text-sm
                            font-semibold
                            text-white
                            shadow-lg
                            shadow-blue-950/20
                            outline-none
                            ring-0
                            transition
                            hover:from-sky-400
                            hover:to-blue-500
                            active:scale-[0.99]
                            focus:outline-none
                            focus:ring-0
                            disabled:cursor-not-allowed
                            disabled:bg-slate-800
                            disabled:bg-none
                            disabled:text-slate-500
                            disabled:shadow-none
                        "
                    >
                        {isCreatingGroup
                            ? "Creating group..."
                            : selectedUsers.length > 0
                                ? `Create Group · ${selectedUsers.length} ${selectedUsers.length === 1
                                    ? "member"
                                    : "members"
                                }`
                                : "Select members"}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}