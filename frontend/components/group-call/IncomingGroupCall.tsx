"use client";

import { Phone, Video } from "lucide-react";

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
        <div className="fixed right-4 top-4 z-[100] w-80 rounded-xl border bg-background p-4 shadow-xl">
            <div className="flex items-center gap-3">
                <div className="rounded-full bg-muted p-3">
                    {isVideo ? (
                        <Video className="size-5" />
                    ) : (
                        <Phone className="size-5" />
                    )}
                </div>

                <div>
                    <p className="font-semibold">
                        Incoming group call
                    </p>

                    <p className="text-sm text-muted-foreground">
                        {isVideo
                            ? "Video call"
                            : "Voice call"}
                    </p>
                </div>
            </div>

            <div className="mt-4 flex gap-2">
                <button
                    type="button"
                    onClick={() =>
                        joinCall(
                            incomingCall.conversationId,
                            incomingCall.type
                        )
                    }
                    className="flex-1 rounded-md bg-green-600 px-3 py-2 text-sm text-white"
                >
                    Join
                </button>

                <button
                    type="button"
                    onClick={declineCall}
                    className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm text-white"
                >
                    Decline
                </button>
            </div>
        </div>
    );
}