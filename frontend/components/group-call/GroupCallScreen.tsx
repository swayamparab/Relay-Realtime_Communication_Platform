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
} from "lucide-react";

export function GroupCallScreen() {
    const {
        inCall,
        callType,
        participants,
        leaveCall,
    } = useGroupCall();

    const {
        localStream,
        remoteStreams,
    } = useGroupWebRTC();

    const [isMuted, setIsMuted] =
        useState(false);

    const [isCameraOff, setIsCameraOff] =
        useState(false);

    if (!inCall) {
        return null;
    }

    const remoteEntries =
        Array.from(remoteStreams.entries());

    return (
        <div className="fixed inset-0 z-50 flex min-h-0 flex-col bg-black">

            {/* Header */}
            <div className="shrink-0 px-4 py-3 text-white sm:px-6 sm:py-4">
                <h2 className="text-base font-semibold capitalize sm:text-lg">
                    Group {callType} call
                </h2>

                <p className="text-xs text-white/60 sm:text-sm">
                    {participants.length}{" "}
                    {participants.length === 1
                        ? "participant"
                        : "participants"}
                </p>
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
                        <div className="relative min-h-0 overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/10 sm:rounded-2xl">
                            <VideoTile
                                stream={localStream}
                                muted
                            />

                            <span className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-md sm:bottom-3 sm:left-3 sm:px-3 sm:py-1.5 sm:text-sm">
                                You
                            </span>
                        </div>
                    )}

                    {/* Remote users */}
                    {remoteEntries.map(
                        ([userId, stream], index) => {
                            const participant =
                                participants.find(
                                    (participant) =>
                                        participant.id === userId
                                );

                            const isThirdParticipant =
                                participants.length === 3 &&
                                index === 1;

                            return (
                                <div
                                    key={userId}
                                    className={`relative min-h-0 overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/10 sm:rounded-2xl ${isThirdParticipant
                                            ? "col-span-2"
                                            : ""
                                        }`}
                                >
                                    <VideoTile
                                        stream={stream}
                                    />

                                    <span className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-md sm:bottom-3 sm:left-3 sm:px-3 sm:py-1.5 sm:text-sm">
                                        {participant?.username ??
                                            "Unknown"}
                                    </span>
                                </div>
                            );
                        }
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="shrink-0 flex items-center justify-center gap-3 px-4 py-4 sm:gap-4 sm:py-5">

                {/* Microphone */}
                <button
                    type="button"
                    onClick={() => {
                        localStream
                            ?.getAudioTracks()
                            .forEach((track) => {
                                track.enabled =
                                    !track.enabled;
                            });

                        setIsMuted(
                            (prev) => !prev
                        );
                    }}
                    className="flex size-12 items-center justify-center rounded-full bg-zinc-800 text-white transition hover:bg-zinc-700 sm:size-14"
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
                            localStream
                                ?.getVideoTracks()
                                .forEach(
                                    (track) => {
                                        track.enabled =
                                            !track.enabled;
                                    }
                                );

                            setIsCameraOff(
                                (prev) =>
                                    !prev
                            );
                        }}
                        className="flex size-12 items-center justify-center rounded-full bg-zinc-800 text-white transition hover:bg-zinc-700 sm:size-14"
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
                >
                    <PhoneOff className="size-5 sm:size-6" />
                </button>
            </div>
        </div>
    );
}