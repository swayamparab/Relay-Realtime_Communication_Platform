"use client";

import { Phone, Video } from "lucide-react";

import { useGroupCall } from "@/hooks/group-call/useGroupCall";

type Props = {
    conversationId: string;
};

export function GroupCallControls({
    conversationId,
}: Props) {
    const {
        inCall,
        startCall,
        leaveCall,
    } = useGroupCall();

    if (inCall) {
        return (
            <button
                type="button"
                onClick={leaveCall}
                className="flex size-9 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700"
                title="Leave group call"
                aria-label="Leave group call"
            >
                <Phone className="size-4" />
            </button>
        );
    }

    return (
        <div className="flex items-center gap-1">
            <button
                type="button"
                onClick={() =>
                    startCall(
                        conversationId,
                        "voice"
                    )
                }
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                title="Group voice call"
                aria-label="Start group voice call"
            >
                <Phone className="size-5" />
            </button>

            <button
                type="button"
                onClick={() =>
                    startCall(
                        conversationId,
                        "video"
                    )
                }
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                title="Group video call"
                aria-label="Start group video call"
            >
                <Video className="size-5" />
            </button>
        </div>
    );
}