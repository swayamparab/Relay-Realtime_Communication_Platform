"use client";

import {
    Mic,
    MicOff,
    Minimize2,
    PhoneOff,
    Phone,
    UserPlus
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { useCall } from "@/hooks/call/useCall";
import { useCallActions } from "@/hooks/call/useCallActions";
import { useCurrentUser } from "@/hooks/user/useCurrentUser";
import { useCallDuration } from "@/hooks/call/useCallDuration";
import { useWebRTCActions } from "@/hooks/webrtc/useWebRTCActions";
import { useWebRTC } from "@/hooks/webrtc/useWebRTC";
import { FloatingVoiceCall } from "./FloatingVoiceCall";
import { useState } from "react";
import { AddParticipantDialog } from "./AddParticipantDialog";

export function VoiceCallScreen() {

    const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);

    const {
        callState,
        isVideoMinimized,
        setIsVideoMinimized,
    } = useCall();

    const { data: currentUser } =
        useCurrentUser();

    const { endCall } =
        useCallActions();

    const duration =
        useCallDuration(
            callState.connectedAt
        );

    const { toggleMute } =
        useWebRTCActions();

    const { isMuted } =
        useWebRTC();

    if (!currentUser) {
        return null;
    }

    if (callState.type !== "voice") {
        return null;
    }

    if (
        callState.status !== "connecting" &&
        callState.status !== "connected"
    ) {
        return null;
    }

    if (isVideoMinimized) {
        return <FloatingVoiceCall />;
    }

    const remoteUser =
        currentUser.user.id ===
            callState.caller.id
            ? callState.receiver
            : callState.caller;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950 text-white">

            {/* Header */}
            <div className="flex shrink-0 items-center justify-between px-5 py-4 sm:px-8 sm:py-6">

                <div>
                    <p className="text-sm text-slate-400">
                        Voice call
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                        {callState.status ===
                            "connecting"
                            ? "Connecting..."
                            : duration}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setIsVideoMinimized(true)
                    }
                    className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    aria-label="Minimize call"
                    title="Minimize call"
                >
                    <Minimize2 className="size-5" />
                </button>
            </div>

            {/* Caller */}
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">

                <div className="relative">

                    <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />

                    <div className="relative flex size-32 items-center justify-center rounded-full bg-emerald-500/15 text-4xl font-semibold text-emerald-400 ring-1 ring-emerald-500/20 sm:size-40 sm:text-5xl">
                        {remoteUser.username
                            .charAt(0)
                            .toUpperCase()}
                    </div>
                </div>

                <h1 className="mt-8 text-2xl font-semibold sm:text-3xl">
                    {remoteUser.username}
                </h1>

                <p className="mt-2 text-sm text-slate-400">
                    {callState.status ===
                        "connecting"
                        ? "Connecting..."
                        : duration}
                </p>
            </div>

            {/* Controls */}
            <div className="flex shrink-0 items-center justify-center gap-4 border-t border-white/10 bg-black/30 px-6 py-6 backdrop-blur-xl sm:gap-5 sm:py-8">

                {/* Mute */}
                <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className={`size-14 rounded-full ${isMuted
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-slate-800 text-white hover:bg-slate-700"
                        }`}
                    onClick={toggleMute}
                    aria-label={
                        isMuted
                            ? "Unmute microphone"
                            : "Mute microphone"
                    }
                >
                    {isMuted ? (
                        <MicOff className="size-6" />
                    ) : (
                        <Mic className="size-6" />
                    )}
                </Button>

                {/* Add participant */}
                <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="size-14 rounded-full bg-slate-800 text-white hover:bg-slate-700"
                    onClick={() =>
                        setIsAddParticipantOpen(true)
                    }
                    aria-label="Add participant"
                    title="Add participant"
                >
                    <UserPlus className="size-6" />
                </Button>

                {/* End */}
                <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="size-14 rounded-full bg-red-600 hover:bg-red-700"
                    onClick={() =>
                        endCall(
                            callState.conversationId
                        )
                    }
                    aria-label="End call"
                >
                    <PhoneOff className="size-6" />
                </Button>

            </div>

            {isAddParticipantOpen && (
                <AddParticipantDialog
                    open={isAddParticipantOpen}
                    onOpenChange={setIsAddParticipantOpen}
                />
            )}
        </div>
    );
}