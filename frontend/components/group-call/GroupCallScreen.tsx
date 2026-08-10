"use client";

import { useState } from "react";
import { VideoTile } from "./VideoTile";

import { useGroupCall } from "@/hooks/group-call/useGroupCall";
import { useGroupWebRTC } from "@/hooks/group-call/useGroupWebRTC";

import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    PhoneOff,
    VolumeX,
    Minimize2
} from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { GroupCallMini } from "./GroupCallMini";

export function GroupCallScreen() {
    const {
        inCall,
        callType,
        conversationId,
        participants,
        leaveCall,
        isMinimized,
        setIsMinimized
    } = useGroupCall();

    const { socket } = useSocket();

    const {
        localStream,
        remoteStreams,
        remoteVideoStates,
        remoteMuteStates
    } = useGroupWebRTC();

    const [isMuted, setIsMuted] =
        useState(false);

    const [isCameraOff, setIsCameraOff] =
        useState(false);

    if (!inCall) {
        return null;
    }

    if (isMinimized) {
        return <GroupCallMini />;
    }

    const remoteEntries =
        Array.from(remoteStreams.entries());

    const isAlone =
        participants.length === 1;

    return (
        <div className="fixed inset-0 z-50 flex min-h-0 flex-col bg-black">

            {/* Header */}
            <div className="flex shrink-0 items-center justify-between px-4 py-3 text-white sm:px-6 sm:py-4">
                <div>
                    <h2 className="text-base font-semibold capitalize sm:text-lg">
                        Group {callType} call
                    </h2>

                    <p className="mt-0.5 text-xs text-white/60 sm:text-sm">
                        {participants.length}{" "}
                        {participants.length === 1
                            ? "participant"
                            : "participants"}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    aria-label="Minimize call"
                    title="Minimize call"
                >
                    <Minimize2 className="size-4" />
                </button>
            </div>

            {/* Video grid */}
            <div className="min-h-0 flex-1 px-3 pb-3 sm:px-5 sm:pb-4">
                <div
                    className={`
                        grid
                        h-full
                        min-h-0
                        gap-2
                        sm:gap-3
                        ${participants.length <= 1
                            ? "grid-cols-1 grid-rows-1"
                            : participants.length === 2
                                ? "grid-cols-2 grid-rows-1"
                                : participants.length === 3
                                    ? "grid-cols-2 grid-rows-2"
                                    : participants.length === 4
                                        ? "grid-cols-2 grid-rows-2"
                                        : "grid-cols-2 grid-rows-3 lg:grid-cols-3 lg:grid-rows-2"
                        }
                    `}
                >
                    {/* Local user */}
                    {localStream && (
                        <div
                            className={`group relative min-h-0 overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/10 transition duration-200 hover:ring-white/20 sm:rounded-2xl ${isAlone
                                ? "mx-auto w-full max-w-4xl"
                                : ""
                                }`}
                        >

                            {isCameraOff ? (
                                <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                                    <div className="flex size-20 items-center justify-center rounded-full bg-zinc-700 text-2xl font-semibold text-white sm:size-24 sm:text-3xl">
                                        You
                                    </div>
                                </div>
                            ) : (
                                <VideoTile
                                    stream={localStream}
                                    muted
                                />
                            )}

                            <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-md sm:bottom-3 sm:left-3 sm:px-3 sm:py-1.5 sm:text-sm">
                                <span
                                    className={`size-1.5 rounded-full ${isMuted
                                        ? "bg-red-400"
                                        : "bg-green-400"
                                        }`}
                                />

                                <span>
                                    You
                                </span>

                                {isMuted && (
                                    <MicOff className="size-3.5 text-red-400 sm:size-4" />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Remote users */}
                    {remoteEntries.map(
                        ([userId, stream], index) => {
                            const participant =
                                participants.find(
                                    (participant) =>
                                        participant.id ===
                                        userId
                                );

                            const isCameraOff =
                                remoteVideoStates.get(userId) === false;

                            const isMuted =
                                remoteMuteStates.get(userId) === true;

                            const isThirdParticipant =
                                participants.length === 3 &&
                                index === 1;

                            return (
                                <div
                                    key={userId}
                                    className={`group relative min-h-0 overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/10 transition duration-200 hover:ring-white/20 sm:rounded-2xl ${isThirdParticipant
                                        ? "col-span-2"
                                        : ""
                                        }`}
                                >
                                    {isCameraOff ? (
                                        <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                                            <div className="flex size-20 items-center justify-center rounded-full bg-zinc-700 text-2xl font-semibold text-white sm:size-24 sm:text-3xl">
                                                {(
                                                    participant?.username ??
                                                    "Unknown"
                                                )
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                        </div>
                                    ) : (
                                        <VideoTile
                                            stream={stream}
                                        />
                                    )}

                                    <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-md sm:bottom-3 sm:left-3 sm:px-3 sm:py-1.5 sm:text-sm">
                                        <span className="size-1.5 rounded-full bg-green-400" />

                                        <span>
                                            {participant?.username ?? "Unknown"}
                                        </span>

                                        {isMuted && (
                                            <VolumeX className="size-3.5 text-red-400 sm:size-4" />
                                        )}
                                    </div>
                                </div>
                            );
                        }
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="flex shrink-0 items-center justify-center gap-3 border-t border-white/10 bg-black/80 px-4 py-4 backdrop-blur-md sm:gap-4 sm:py-5">

                {/* Microphone */}
                <button
                    type="button"
                    onClick={() => {
                        const nextMuted = !isMuted;

                        localStream
                            ?.getAudioTracks()
                            .forEach((track) => {
                                track.enabled = !nextMuted;
                            });

                        setIsMuted(nextMuted);

                        if (conversationId) {
                            socket.emit(
                                "group_call:mute_state",
                                {
                                    conversationId,
                                    muted: nextMuted,
                                }
                            );
                        }
                    }}
                    className={`flex size-12 items-center justify-center rounded-full text-white transition sm:size-14 ${isMuted
                        ? "bg-white text-black hover:bg-zinc-200"
                        : "bg-zinc-800 hover:bg-zinc-700"
                        }`}
                    aria-label={
                        isMuted
                            ? "Unmute microphone"
                            : "Mute microphone"
                    }
                >
                    {isMuted ? (
                        <MicOff className="size-5 sm:size-6" />
                    ) : (
                        <Mic className="size-5 sm:size-6" />
                    )}
                </button>

                {/* Camera */}
                {callType === "video" && (
                    <button
                        type="button"
                        onClick={() => {
                            const nextCameraOff =
                                !isCameraOff;

                            localStream
                                ?.getVideoTracks()
                                .forEach((track) => {
                                    track.enabled =
                                        !nextCameraOff;
                                });

                            setIsCameraOff(
                                nextCameraOff
                            );

                            if (conversationId) {
                                socket.emit(
                                    "group_call:camera_state",
                                    {
                                        conversationId,
                                        enabled: !nextCameraOff,
                                    }
                                );
                            }
                        }}
                        className={`flex size-12 items-center justify-center rounded-full text-white transition sm:size-14 ${isCameraOff
                            ? "bg-white text-black hover:bg-zinc-200"
                            : "bg-zinc-800 hover:bg-zinc-700"
                            }`}
                        aria-label={
                            isCameraOff
                                ? "Turn camera on"
                                : "Turn camera off"
                        }
                    >
                        {isCameraOff ? (
                            <VideoOff className="size-5 sm:size-6" />
                        ) : (
                            <Video className="size-5 sm:size-6" />
                        )}
                    </button>
                )}

                {/* Leave */}
                <button
                    type="button"
                    onClick={leaveCall}
                    className="flex size-12 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700 sm:size-14"
                    aria-label="Leave call"
                >
                    <PhoneOff className="size-5 sm:size-6" />
                </button>
            </div>
        </div>
    );
}