"use client";

import { useState } from "react";
import { VideoTile } from "./VideoTile";
import { useGroupCall } from "@/hooks/group-call/useGroupCall";

import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

export function GroupCallScreen() {
    const {
        inCall,
        callType,
        participants,
        localStream,
        remoteStreams,
        leaveCall,
    } = useGroupCall();

    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);

    if (!inCall) {
        return null;
    }

    const remoteEntries =
        Array.from(remoteStreams.entries());

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 text-white">
                <div>
                    <h2 className="text-lg font-semibold">
                        Group {callType} call
                    </h2>

                    <p className="text-sm text-white/60">
                        {participants.length} participant
                        {participants.length !== 1
                            ? "s"
                            : ""}
                    </p>
                </div>
            </div>

            {/* Video grid */}
            <div className="flex-1 p-4">
                <div
                    className={`
                        grid
                        h-full
                        gap-3
                        ${participants.length <= 1
                            ? "grid-cols-1"
                            : participants.length === 2
                                ? "grid-cols-2"
                                : participants.length === 3
                                    ? "grid-cols-2 grid-rows-2"
                                    : participants.length === 4
                                        ? "grid-cols-2 grid-rows-2"
                                        : "grid-cols-2 grid-rows-3"
                        }
                    `}
                >

                    {/* Local user */}
                    {localStream && (
                        <div className="relative min-h-0 overflow-hidden rounded-xl bg-zinc-900">
                            <VideoTile
                                stream={localStream}
                                muted
                            />

                            <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
                                You
                            </span>
                        </div>
                    )}

                    {/* Remote users */}
                    {remoteEntries.map(
                        ([userId, stream]) => {
                            const participant =
                                participants.find(
                                    (participant) =>
                                        participant.id === userId
                                );

                            return (
                                <div
                                    key={userId}
                                    className="relative min-h-0 overflow-hidden rounded-xl bg-zinc-900"
                                >
                                    <VideoTile stream={stream} />

                                    <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur">
                                        {participant?.username ?? "Unknown"}
                                    </span>
                                </div>
                            );
                        }
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3 px-6 py-5">
                <button
                    type="button"
                    onClick={() => {
                        localStream?.getAudioTracks().forEach(
                            (track) => {
                                track.enabled = !track.enabled;
                            }
                        );

                        setIsMuted((prev) => !prev);
                    }}
                    className="rounded-full bg-zinc-800 p-4 text-white hover:bg-zinc-700"
                >
                    {isMuted ? (
                        <MicOff className="size-5" />
                    ) : (
                        <Mic className="size-5" />
                    )}
                </button>

                {callType === "video" && (
                    <button
                        type="button"
                        onClick={() => {
                            localStream?.getVideoTracks().forEach(
                                (track) => {
                                    track.enabled = !track.enabled;
                                }
                            );

                            setIsCameraOff((prev) => !prev);
                        }}
                        className="rounded-full bg-zinc-800 p-4 text-white hover:bg-zinc-700"
                    >
                        {isCameraOff ? (
                            <VideoOff className="size-5" />
                        ) : (
                            <Video className="size-5" />
                        )}
                    </button>
                )}

                <button
                    type="button"
                    onClick={leaveCall}
                    className="rounded-full bg-red-600 p-4 text-white hover:bg-red-700"
                >
                    <PhoneOff className="size-5" />
                </button>
            </div>
        </div>
    );
}