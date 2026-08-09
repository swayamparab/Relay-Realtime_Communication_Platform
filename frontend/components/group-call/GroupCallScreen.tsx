"use client";

import { VideoTile } from "./VideoTile";
import { useGroupCall } from "@/hooks/group-call/useGroupCall";

export function GroupCallScreen() {
    const {
        inCall,
        callType,
        participants,
        localStream,
        remoteStreams,
        leaveCall,
    } = useGroupCall();

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
                        ${remoteEntries.length === 0
                            ? "grid-cols-1"
                            : remoteEntries.length === 1
                                ? "grid-cols-2"
                                : "grid-cols-2"
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
                        ([userId, stream]) => (
                            <div
                                key={userId}
                                className="relative min-h-0 overflow-hidden rounded-xl bg-zinc-900"
                            >
                                <VideoTile
                                    stream={stream}
                                />

                                <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
                                    {userId}
                                </span>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3 px-6 py-5">
                <button
                    type="button"
                    onClick={leaveCall}
                    className="rounded-full bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-700"
                >
                    Leave call
                </button>
            </div>
        </div>
    );
}