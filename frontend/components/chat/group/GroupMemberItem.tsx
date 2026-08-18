"use client";

import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar";

import { Badge } from "@/components/ui/badge";

import { GroupMember } from "@/types/group";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    MoreVertical,
    ShieldCheck,
    UserMinus,
    UserRoundCog,
    Loader2,
} from "lucide-react";

import { useGroupActions } from "@/hooks/group/useGroupActions";

type Props = {
    member: GroupMember;
    currentUserId: string;
    currentUserRole: "admin" | "member";
    groupOwnerId: string;
    groupId: string;
};

export default function GroupMemberItem({
    member,
    currentUserId,
    currentUserRole,
    groupOwnerId,
    groupId,
}: Props) {
    const {
        removeMember,
        promoteMember,
        demoteAdmin,
        isRemovingMember,
        isPromotingMember,
        isDemotingAdmin,
    } = useGroupActions();

    const isYou =
        member.id === currentUserId;

    const isOwner =
        member.id === groupOwnerId;

    const canManage =
        currentUserRole === "admin" &&
        !isYou &&
        !isOwner;

    const isActionLoading =
        isRemovingMember ||
        isPromotingMember ||
        isDemotingAdmin;

    return (
        <div
            className="
                group
                flex
                items-center
                justify-between
                rounded-xl
                px-3
                py-2.5
                transition
                hover:bg-slate-800/60
            "
        >
            {/* USER */}

            <div className="flex min-w-0 items-center gap-3">
                <Avatar
                    className="
                        h-11
                        w-11
                        shrink-0
                        bg-slate-800
                    "
                >
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
                        {member.username
                            .charAt(0)
                            .toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                        <p
                            className="
                                max-w-[180px]
                                truncate
                                text-sm
                                font-medium
                                text-white
                            "
                        >
                            {member.username}
                        </p>

                        {isYou && (
                            <Badge
                                variant="secondary"
                                className="
                                    shrink-0
                                    rounded-full
                                    bg-slate-800
                                    px-2
                                    py-0.5
                                    text-[10px]
                                    font-medium
                                    text-slate-300
                                "
                            >
                                You
                            </Badge>
                        )}
                    </div>

                    <p
                        className="
                            mt-0.5
                            max-w-[220px]
                            truncate
                            text-xs
                            text-slate-500
                        "
                    >
                        {member.email}
                    </p>
                </div>
            </div>

            {/* ROLE + ACTIONS */}

            <div className="ml-3 flex shrink-0 items-center gap-1.5">
                {isOwner ? (
                    <Badge
                        className="
                            flex
                            items-center
                            gap-1
                            rounded-full
                            bg-amber-500/10
                            px-2.5
                            py-1
                            text-[10px]
                            font-semibold
                            text-amber-400
                        "
                    >
                        <ShieldCheck className="h-3 w-3" />
                        Owner
                    </Badge>
                ) : member.role === "admin" ? (
                    <Badge
                        className="
                            flex
                            items-center
                            gap-1
                            rounded-full
                            bg-sky-500/10
                            px-2.5
                            py-1
                            text-[10px]
                            font-semibold
                            text-sky-400
                        "
                    >
                        <ShieldCheck className="h-3 w-3" />
                        Admin
                    </Badge>
                ) : null}

                {/* Manage member */}

                {canManage && (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            disabled={isActionLoading}
                            className="
                                rounded-lg
                                p-2
                                text-slate-500
                                outline-none
                                transition
                                hover:bg-slate-700/70
                                hover:text-white
                                focus:outline-none
                                disabled:pointer-events-none
                                disabled:opacity-40
                            "
                            aria-label={`Manage ${member.username}`}
                        >
                            {isActionLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <MoreVertical className="h-4 w-4" />
                            )}
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            sideOffset={6}
                            className="
                                w-48
                                bg-slate-950
                                p-1
                                text-white
                                shadow-xl
                                outline-none
                                ring-0
                                border-0
                            "
                        >
                            {member.role === "member" ? (
                                <DropdownMenuItem
                                    disabled={isPromotingMember}
                                    onClick={() =>
                                        promoteMember({
                                            groupId,
                                            memberId: member.id,
                                        })
                                    }
                                    className="
                                        cursor-pointer
                                        gap-2
                                        rounded-lg
                                        text-slate-300
                                        focus:bg-slate-800
                                        focus:text-white
                                    "
                                >
                                    <UserRoundCog className="h-4 w-4 text-sky-400" />

                                    <span>
                                        Promote to Admin
                                    </span>
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                    disabled={isDemotingAdmin}
                                    onClick={() =>
                                        demoteAdmin({
                                            groupId,
                                            memberId: member.id,
                                        })
                                    }
                                    className="
                                        cursor-pointer
                                        gap-2
                                        rounded-lg
                                        text-slate-300
                                        focus:bg-slate-800
                                        focus:text-white
                                    "
                                >
                                    <ShieldCheck className="h-4 w-4 text-sky-400" />

                                    <span>
                                        Demote Admin
                                    </span>
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                                disabled={isRemovingMember}
                                onClick={() =>
                                    removeMember({
                                        groupId,
                                        memberId: member.id,
                                    })
                                }
                                className="
                                    cursor-pointer
                                    gap-2
                                    rounded-lg
                                    text-red-400
                                    focus:bg-red-500/10
                                    focus:text-red-300
                                "
                            >
                                <UserMinus className="h-4 w-4" />

                                <span>
                                    Remove Member
                                </span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
}