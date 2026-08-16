"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useCurrentUser } from "@/hooks/user/useCurrentUser";
import { api } from "@/lib/api";

import CreateGroupDialog from "../group/CreateGroupDialog";
import ProfileDialog from "@/components/user/ProfileDialog";

import {
    LogOut,
    MoreVertical,
    Settings,
    UsersRound,
} from "lucide-react";

export default function SidebarHeader() {
    const { data } = useCurrentUser();

    const router = useRouter();
    const queryClient = useQueryClient();

    const [createGroupOpen, setCreateGroupOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    if (!data) return null;

    async function handleLogout() {
        try {
            await api.post("/auth/logout");

            queryClient.clear();

            toast.success("Logged out!");

            router.replace("/login");
        } catch (error) {
            console.error(error);

            toast.error("Failed to logout");
        }
    }

    return (
        <>
            <header className="flex h-16 shrink-0 items-center justify-between bg-slate-950 px-5">
                <div className="text-3xl font-bold tracking-tight text-white">
                    Relay
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                            setCreateGroupOpen(true)
                        }
                        className="h-10 w-10 text-slate-400 hover:bg-slate-800 hover:text-white"
                        aria-label="Create Group"
                    >
                        <UsersRound className="h-5 w-5" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger
                            className="
                                inline-flex
                                h-10
                                w-10
                                items-center
                                justify-center
                                rounded-md
                                text-slate-400
                                transition
                                hover:bg-slate-800
                                hover:text-white
                            "
                            aria-label="More options"
                        >
                            <MoreVertical className="h-5 w-5" />
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            className="w-44 border-slate-800 bg-slate-900"
                        >
                            <DropdownMenuItem
                                onClick={() =>
                                    setSettingsOpen(true)
                                }
                                className="cursor-pointer text-white focus:bg-slate-800 focus:text-white"
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                Profile
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            <CreateGroupDialog
                open={createGroupOpen}
                onOpenChange={setCreateGroupOpen}
            />

            <ProfileDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
            />
        </>
    );
}