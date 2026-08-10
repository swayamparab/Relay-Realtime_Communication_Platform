"use client";

import {
    Maximize2,
    PhoneOff,
    Video,
} from "lucide-react";

import { useGroupCall } from "@/hooks/group-call/useGroupCall";
import { useGroupWebRTC } from "@/hooks/group-call/useGroupWebRTC";
import { VideoTile } from "./VideoTile";

export function GroupCallMini() {
    const {
        callType,
        participants,
        leaveCall,
        setIsMinimized,
    } = useGroupCall();

    const {
        remoteStreams,
    } = useGroupWebRTC();

    const firstRemoteStream =
        Array.from(remoteStreams.entries())[0];

    const remoteUserId =
        firstRemoteStream?.[0];

    const remoteStream =
        firstRemoteStream?.[1];

    const remoteParticipant =
        participants.find(
            (participant) =>
                participant.id === remoteUserId
        );

    return (
        <div className="fixed bottom-4 right-4 z-[60] w-[280px] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl sm:bottom-6 sm:right-6 sm:w-[320px]">

            {/* Video / Avatar */}
            <div className="relative aspect-video overflow-hidden bg-zinc-900">

                {callType === "video" &&
                    remoteStream ? (
                    <VideoTile
                        stream={remoteStream}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <div className="flex size-16 items-center justify-center rounded-full bg-zinc-700 text-xl font-semibold text-white">
                            {(
                                remoteParticipant?.username ??
                                "You"
                            )
                                .charAt(0)
                                .toUpperCase()}
                        </div>
                    </div>
                )}

                {/* Call info */}
                <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs text-white backdrop-blur-md">
                    {participants.length}{" "}
                    {participants.length === 1
                        ? "participant"
                        : "participants"}
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between px-3 py-3">

                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-green-500/20">
                        <Video className="size-4 text-green-400" />
                    </div>

                    <span className="text-sm font-medium text-white">
                        Group {callType} call
                    </span>
                </div>

                <div className="flex items-center gap-1">

                    {/* Restore */}
                    <button
                        type="button"
                        onClick={() =>
                            setIsMinimized(false)
                        }
                        className="flex size-9 items-center justify-center rounded-full text-white transition hover:bg-white/10"
                        aria-label="Restore call"
                        title="Restore call"
                    >
                        <Maximize2 className="size-4" />
                    </button>

                    {/* Leave */}
                    <button
                        type="button"
                        onClick={leaveCall}
                        className="flex size-9 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700"
                        aria-label="Leave call"
                        title="Leave call"
                    >
                        <PhoneOff className="size-4" />
                    </button>

                </div>
            </div>
        </div>
    );
}