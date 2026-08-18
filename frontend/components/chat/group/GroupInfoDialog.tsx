"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar";

import {
    Pencil,
    Check,
    X,
    Search,
    UserPlus,
    Loader2,
    Users,
    LogOut,
    Trash2,
} from "lucide-react";

import { useEffect, useState } from "react";

import { useGroupInfo } from "@/hooks/group/useGroupInfo";
import { useCurrentUser } from "@/hooks/user/useCurrentUser";
import { useGroupActions } from "@/hooks/group/useGroupActions";
import { useSearchUsers } from "@/hooks/user/useSearchUsers";

import GroupMemberItem from "./GroupMemberItem";

import { toast } from "sonner";

type GroupInfoDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
};

export default function GroupInfoDialog({
    open,
    onOpenChange,
    groupId,
}: GroupInfoDialogProps) {
    const {
        data,
        isLoading,
    } = useGroupInfo(groupId);

    const {
        data: currentUser,
    } = useCurrentUser();

    const {
        leaveGroup,
        isLeaving,

        deleteGroup,
        isDeletingGroup,

        updateGroup,
        isUpdating,

        addMembers,
        isAddingMembers,
    } = useGroupActions();

    const [editingName, setEditingName] =
        useState(false);

    const [groupName, setGroupName] =
        useState("");

    const [addingMembers, setAddingMembers] =
        useState(false);

    const [search, setSearch] =
        useState("");

    const [selectedMembers, setSelectedMembers] =
        useState<string[]>([]);

    const [confirmLeave, setConfirmLeave] =
        useState(false);

    const [confirmDelete, setConfirmDelete] =
        useState(false);

    const {
        data: users,
        isLoading: isSearchingUsers,
    } = useSearchUsers(search);

    /*
     * Keep local group name synchronized
     * with server data.
     */
    useEffect(() => {
        if (data?.group) {
            setGroupName(data.group.name);
        }
    }, [data]);

    /*
     * Reset temporary UI state whenever
     * the dialog is closed.
     */
    useEffect(() => {
        if (!open) {
            setEditingName(false);
            setAddingMembers(false);
            setSearch("");
            setSelectedMembers([]);
            setConfirmLeave(false);
            setConfirmDelete(false);
        }
    }, [open]);

    /*
     * Loading
     */
    if (isLoading) {
        return (
            <Dialog
                open={open}
                onOpenChange={onOpenChange}
            >
                <DialogContent
                    className="
                        bg-slate-950
                        text-white
                        sm:max-w-md
                    "
                >
                    <div className="flex h-40 items-center justify-center">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading group...
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    /*
     * Data unavailable
     */
    if (!data || !currentUser) {
        return (
            <Dialog
                open={open}
                onOpenChange={onOpenChange}
            >
                <DialogContent
                    className="
                        bg-slate-950
                        text-white
                        sm:max-w-md
                    "
                >
                    <div className="flex h-40 items-center justify-center">
                        <p className="text-sm text-red-400">
                            Failed to load group.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    /*
     * From here onward TypeScript knows
     * that group and currentUser exist.
     */
    const group = data.group;

    /*
     * Put current user first,
     * then admins,
     * then normal members.
     */
    const members = [
        ...group.members,
    ].sort((a, b) => {
        const aYou =
            a.id === currentUser.user.id;

        const bYou =
            b.id === currentUser.user.id;

        if (aYou) return -1;
        if (bYou) return 1;

        if (
            a.role === "admin" &&
            b.role !== "admin"
        ) {
            return -1;
        }

        if (
            a.role !== "admin" &&
            b.role === "admin"
        ) {
            return 1;
        }

        return a.username.localeCompare(
            b.username
        );
    });

    const currentUserMember =
        group.members.find(
            (member) =>
                member.id ===
                currentUser.user.id
        );

    const currentUserRole =
        currentUserMember?.role ?? "member";

    const isOwner =
        group.createdBy ===
        currentUser.user.id;

    const availableUsers =
        users?.users.filter(
            (user) =>
                !members.some(
                    (member) =>
                        member.id === user.id
                )
        ) ?? [];

    /*
     * Save group name
     */
    const saveGroupName = () => {
        const newName =
            groupName.trim();

        if (!newName) {
            toast.error(
                "Group name cannot be empty."
            );
            return;
        }

        if (newName === group.name) {
            setEditingName(false);
            return;
        }

        updateGroup({
            groupId,
            name: newName,
        });

        setEditingName(false);
    };

    /*
     * Cancel editing
     */
    const cancelEditingName = () => {
        setGroupName(group.name);
        setEditingName(false);
    };

    /*
     * Add selected members
     */
    const handleAddMembers = async () => {
        if (
            selectedMembers.length === 0 ||
            isAddingMembers
        ) {
            return;
        }

        try {
            await addMembers({
                groupId,
                memberIds: selectedMembers,
            });

            setAddingMembers(false);
            setSelectedMembers([]);
            setSearch("");

            toast.success(
                "Members added successfully."
            );
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to add members."
            );
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent
                className="
                    flex
                    h-[min(760px,90vh)]
                    max-h-[90vh]
                    w-[calc(100%-2rem)]
                    flex-col
                    overflow-hidden
                    border-0
                    bg-slate-950
                    p-0
                    text-white
                    shadow-2xl
                    outline-none
                    ring-0
                    sm:max-w-md
                "
            >
                {/* =====================================================
                    HEADER
                ====================================================== */}

                <DialogHeader
                    className="
                        relative
                        shrink-0
                        bg-slate-950
                        px-5
                        pb-5
                        pt-5
                    "
                >
                    {/* Close */}
                    <button
                        type="button"
                        onClick={() =>
                            onOpenChange(false)
                        }
                        className="
                            absolute
                            right-4
                            top-4
                            z-10
                            rounded-xl
                            p-2
                            text-slate-500
                            transition
                            hover:bg-slate-800
                            hover:text-white
                        "
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="flex flex-col items-center">
                        {/* Group avatar */}

                        <Avatar
                            className="
                                mb-3
                                h-20
                                w-20
                                ring-4
                                ring-slate-900
                                shadow-xl
                            "
                        >
                            <AvatarFallback
                                className="
                                    bg-gradient-to-br
                                    from-sky-500
                                    via-blue-600
                                    to-indigo-700
                                    text-2xl
                                    font-bold
                                    text-white
                                "
                            >
                                {group.name
                                    .charAt(0)
                                    .toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        {/* Group name */}

                        <div className="flex min-w-0 items-center justify-center gap-1.5">
                            {editingName ? (
                                <>
                                    <input
                                        autoFocus
                                        value={groupName}
                                        maxLength={50}
                                        onChange={(e) =>
                                            setGroupName(
                                                e.target.value
                                            )
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                e.key ===
                                                "Enter"
                                            ) {
                                                saveGroupName();
                                            }

                                            if (
                                                e.key ===
                                                "Escape"
                                            ) {
                                                cancelEditingName();
                                            }
                                        }}
                                        className="
                                            h-9
                                            w-48
                                            rounded-lg
                                            border-0
                                            bg-slate-900
                                            px-3
                                            text-center
                                            text-base
                                            font-semibold
                                            text-white
                                            outline-none
                                            transition
                                            focus:outline-none
                                            focus:ring-1
                                            focus:ring-sky-500/30
                                        "
                                    />

                                    <button
                                        type="button"
                                        disabled={
                                            isUpdating
                                        }
                                        onClick={
                                            saveGroupName
                                        }
                                        className="
                                            rounded-lg
                                            p-2
                                            text-emerald-400
                                            transition
                                            hover:bg-emerald-500/10
                                            disabled:opacity-50
                                        "
                                        aria-label="Save group name"
                                    >
                                        {isUpdating ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Check className="h-4 w-4" />
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            isUpdating
                                        }
                                        onClick={
                                            cancelEditingName
                                        }
                                        className="
                                            rounded-lg
                                            p-2
                                            text-slate-400
                                            transition
                                            hover:bg-slate-800
                                            hover:text-white
                                            disabled:opacity-50
                                        "
                                        aria-label="Cancel editing"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <DialogTitle
                                        className="
                                            max-w-[260px]
                                            truncate
                                            text-center
                                            text-xl
                                            font-bold
                                            text-white
                                        "
                                    >
                                        {group.name}
                                    </DialogTitle>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEditingName(
                                                true
                                            )
                                        }
                                        className="
                                            rounded-lg
                                            p-1.5
                                            text-slate-500
                                            transition
                                            hover:bg-slate-800
                                            hover:text-white
                                        "
                                        aria-label="Edit group name"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
                            <Users className="h-3.5 w-3.5" />
                            <span>
                                {group.members.length}{" "}
                                {group.members.length ===
                                    1
                                    ? "member"
                                    : "members"}
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                {/* =====================================================
                    BODY
                ====================================================== */}

                <div
                    className="
                        min-h-0
                        flex-1
                        overflow-y-auto
                        px-4
                        py-4
                    "
                >
                    {!addingMembers ? (
                        <>
                            {/* Members header */}

                            <div className="mb-3 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-200">
                                        Members
                                    </h3>

                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Manage people in this group
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setAddingMembers(
                                            true
                                        )
                                    }
                                    className="
                                        flex
                                        items-center
                                        gap-1.5
                                        rounded-lg
                                        bg-sky-500/10
                                        px-3
                                        py-2
                                        text-xs
                                        font-semibold
                                        text-sky-400
                                        transition
                                        hover:bg-sky-500/20
                                        hover:text-sky-300
                                    "
                                >
                                    <UserPlus className="h-3.5 w-3.5" />
                                    Add
                                </button>
                            </div>

                            {/* Members */}

                            <div className="space-y-1">
                                {members.map(
                                    (member) => (
                                        <GroupMemberItem
                                            key={
                                                member.id
                                            }
                                            member={
                                                member
                                            }
                                            currentUserId={
                                                currentUser
                                                    .user
                                                    .id
                                            }
                                            currentUserRole={
                                                currentUserRole
                                            }
                                            groupOwnerId={
                                                group.createdBy
                                            }
                                            groupId={
                                                groupId
                                            }
                                        />
                                    )
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Add members header */}

                            <div className="mb-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-200">
                                            Add members
                                        </h3>

                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Select people to add to this group
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAddingMembers(
                                                false
                                            );
                                            setSearch("");
                                            setSelectedMembers(
                                                []
                                            );
                                        }}
                                        className="
                                            rounded-lg
                                            p-2
                                            text-slate-500
                                            transition
                                            hover:bg-slate-800
                                            hover:text-white
                                        "
                                        aria-label="Cancel adding members"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Search */}

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
                                            setSearch(
                                                e.target
                                                    .value
                                            )
                                        }
                                        placeholder="Search users..."
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
                                            outline-none
                                            transition
                                            placeholder:text-slate-600
                                            focus:outline-none
                                            focus:ring-1
                                            focus:ring-sky-500/30
                                        "
                                    />
                                </div>
                            </div>

                            {/* Selected count */}

                            {selectedMembers.length >
                                0 && (
                                    <div
                                        className="
                                            mb-3
                                            flex
                                            items-center
                                            justify-between
                                            rounded-xl
                                            bg-sky-500/5
                                            px-3
                                            py-2.5
                                        "
                                    >
                                        <span className="text-xs text-slate-400">
                                            {selectedMembers.length}{" "}
                                            selected
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedMembers(
                                                    []
                                                )
                                            }
                                            className="text-xs font-medium text-sky-400 hover:text-sky-300"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                )}

                            {/* User list */}

                            <div className="space-y-1">
                                {isSearchingUsers &&
                                    search.trim() ? (
                                    <div className="flex items-center justify-center py-10">
                                        <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                                    </div>
                                ) : availableUsers.length ===
                                    0 ? (
                                    <div className="rounded-xl border-slate-900/50 px-4 py-10 text-center">
                                        <Users className="mx-auto mb-2 h-7 w-7 text-slate-700" />

                                        <p className="text-sm text-slate-400">
                                            No users found
                                        </p>

                                        <p className="mt-1 text-xs text-slate-600">
                                            Try a different search
                                        </p>
                                    </div>
                                ) : (
                                    availableUsers.map(
                                        (user) => {
                                            const selected =
                                                selectedMembers.includes(
                                                    user.id
                                                );

                                            return (
                                                <button
                                                    key={
                                                        user.id
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedMembers(
                                                            (
                                                                prev
                                                            ) =>
                                                                selected
                                                                    ? prev.filter(
                                                                        (
                                                                            id
                                                                        ) =>
                                                                            id !==
                                                                            user.id
                                                                    )
                                                                    : [
                                                                        ...prev,
                                                                        user.id,
                                                                    ]
                                                        )
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
                                                        transition
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
                                                                    text-sm
                                                                    font-semibold
                                                                    text-slate-200
                                                                "
                                                            >
                                                                {user.username
                                                                    .charAt(
                                                                        0
                                                                    )
                                                                    .toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>

                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium text-white">
                                                                {
                                                                    user.username
                                                                }
                                                            </p>

                                                            <p className="truncate text-xs text-slate-500">
                                                                {
                                                                    user.email
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div
                                                        className={`
                                                            flex
                                                            h-5
                                                            w-5
                                                            shrink-0
                                                            items-center
                                                            justify-center
                                                            rounded-md
                                                            transition
                                                            ${selected
                                                                ? "bg-sky-500 text-white"
                                                                : "bg-slate-900"
                                                            }
                                                        `}
                                                    >
                                                        {selected && (
                                                            <Check className="h-3.5 w-3.5" />
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        }
                                    )
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* =====================================================
                    FOOTER
                ====================================================== */}

                <div className="shrink-0 bg-slate-950 p-4">
                    {addingMembers ? (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setAddingMembers(
                                        false
                                    );
                                    setSearch("");
                                    setSelectedMembers(
                                        []
                                    );
                                }}
                                className="
                                    flex-1
                                    rounded-xl
                                    bg-slate-900
                                    py-2.5
                                    text-sm
                                    font-medium
                                    text-slate-300
                                    transition
                                    hover:bg-slate-800
                                "
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={
                                    selectedMembers.length ===
                                    0 ||
                                    isAddingMembers
                                }
                                onClick={
                                    handleAddMembers
                                }
                                className="
                                    flex
                                    flex-1
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-xl
                                    bg-sky-600
                                    py-2.5
                                    text-sm
                                    font-semibold
                                    text-white
                                    transition
                                    hover:bg-sky-500
                                    disabled:cursor-not-allowed
                                    disabled:opacity-40
                                "
                            >
                                {isAddingMembers ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4" />
                                        Add{" "}
                                        {selectedMembers.length >
                                            0
                                            ? `(${selectedMembers.length})`
                                            : ""}
                                    </>
                                )}
                            </button>
                        </div>
                    ) : confirmLeave ? (
                        <div
                            className="
                                rounded-xl
                                bg-red-500/5
                                p-4
                            "
                        >
                            <div className="mb-4 text-center">
                                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                                    <LogOut className="h-5 w-5 text-red-400" />
                                </div>

                                <h3 className="text-sm font-semibold text-white">
                                    Leave this group?
                                </h3>

                                <p className="mt-1.5 text-xs leading-5 text-slate-500">
                                    You will stop receiving
                                    messages from this group.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setConfirmLeave(
                                            false
                                        )
                                    }
                                    className="
                                        flex-1
                                        rounded-lg
                                        bg-slate-900
                                        py-2.5
                                        text-sm
                                        font-medium
                                        text-slate-300
                                        transition
                                        hover:bg-slate-800
                                    "
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        isLeaving
                                    }
                                    onClick={() =>
                                        leaveGroup(
                                            groupId
                                        )
                                    }
                                    className="
                                        flex
                                        flex-1
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-lg
                                        bg-red-600
                                        py-2.5
                                        text-sm
                                        font-semibold
                                        text-white
                                        transition
                                        hover:bg-red-500
                                        disabled:opacity-50
                                    "
                                >
                                    {isLeaving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Leaving...
                                        </>
                                    ) : (
                                        "Leave Group"
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : confirmDelete ? (
                        <div
                            className="
                                rounded-xl
                                border-red-500/20
                                bg-red-500/5
                                p-4
                            "
                        >
                            <div className="mb-4 text-center">
                                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                                    <Trash2 className="h-5 w-5 text-red-400" />
                                </div>

                                <h3 className="text-sm font-semibold text-white">
                                    Delete this group?
                                </h3>

                                <p className="mt-1.5 text-xs leading-5 text-slate-500">
                                    This permanently deletes the
                                    group, messages and history
                                    for everyone.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setConfirmDelete(
                                            false
                                        )
                                    }
                                    className="
                                        flex-1
                                        rounded-lg
                                        bg-slate-900
                                        py-2.5
                                        text-sm
                                        font-medium
                                        text-slate-300
                                        transition
                                        hover:bg-slate-800
                                    "
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        isDeletingGroup
                                    }
                                    onClick={() =>
                                        deleteGroup(
                                            groupId
                                        )
                                    }
                                    className="
                                        flex
                                        flex-1
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-lg
                                        bg-red-600
                                        py-2.5
                                        text-sm
                                        font-semibold
                                        text-white
                                        transition
                                        hover:bg-red-500
                                        disabled:opacity-50
                                    "
                                >
                                    {isDeletingGroup ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        "Delete Group"
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {isOwner && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setConfirmDelete(
                                            true
                                        )
                                    }
                                    className="
                                        flex
                                        w-full
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-xl
                                        py-2.5
                                        text-sm
                                        font-medium
                                        text-red-400
                                        transition
                                        hover:bg-red-500/10
                                    "
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Group
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() =>
                                    setConfirmLeave(
                                        true
                                    )
                                }
                                className="
                                    flex
                                    w-full
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-xl
                                    py-2.5
                                    text-sm
                                    font-medium
                                    text-slate-400
                                    transition
                                    hover:bg-slate-800
                                    hover:text-slate-200
                                "
                            >
                                <LogOut className="h-4 w-4" />
                                Leave Group
                            </button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}