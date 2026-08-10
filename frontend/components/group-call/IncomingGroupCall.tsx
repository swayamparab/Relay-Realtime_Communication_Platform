"use client";

import { Phone, Video, X } from "lucide-react";

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

    return (
        <div className="fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur-xl sm:right-6 sm:top-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    {isVideo ? (
                        <Video className="size-5 text-primary" />
                    ) : (
                        <Phone className="size-5 text-primary" />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                        Incoming group call
                    </p>

                    <p className="text-sm text-muted-foreground">
                        {isVideo
                            ? "Group video call"
                            : "Group voice call"}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={declineCall}
                    className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label="Dismiss call"
                >
                    <X className="size-4" />
                </button>
            </div>

            {/* Actions */}
            <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={declineCall}
                    className="rounded-xl bg-muted px-4 py-2.5 text-sm font-medium transition hover:bg-muted/80"
                >
                    Decline
                </button>

                <button
                    type="button"
                    onClick={() =>
                        joinCall(
                            incomingCall.conversationId,
                            incomingCall.type
                        )
                    }
                    className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
                >
                    Join
                </button>
            </div>
        </div>
    );
}