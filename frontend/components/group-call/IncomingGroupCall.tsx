"use client";

import {
    Phone,
    PhoneOff,
    Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { useGroupCall } from "@/hooks/group-call/useGroupCall";

export function IncomingGroupCall() {
    const {
        incomingCall,
        joinCall,
        declineCall,
    } = useGroupCall();

    if (!incomingCall) {
        return null;
    }

    const isVideo =
        incomingCall.type === "video";

    const handleAccept = () => {
        joinCall(
            incomingCall.conversationId,
            incomingCall.type
        );
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 text-white shadow-2xl">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="relative flex size-24 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/20">
                        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/10" />

                        {isVideo ? (
                            <Video className="relative size-10 text-emerald-400" />
                        ) : (
                            <Phone className="relative size-10 text-emerald-400" />
                        )}
                    </div>
                </div>

                {/* Caller */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-400">
                        Incoming group call
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold">
                        {incomingCall.callerUsername}
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                        {isVideo
                            ? "Video call"
                            : "Voice call"}
                    </p>
                </div>

                {/* Actions */}
                <div className="mt-8 flex items-center justify-center gap-5">
                    {/* Decline */}
                    <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="size-14 rounded-full bg-red-600 hover:bg-red-700"
                        onClick={declineCall}
                        aria-label="Decline group call"
                    >
                        <PhoneOff className="size-6" />
                    </Button>

                    {/* Accept */}
                    <Button
                        type="button"
                        size="icon"
                        className="size-14 rounded-full bg-emerald-600 hover:bg-emerald-500"
                        onClick={handleAccept}
                        aria-label="Accept group call"
                    >
                        {isVideo ? (
                            <Video className="size-6" />
                        ) : (
                            <Phone className="size-6" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}