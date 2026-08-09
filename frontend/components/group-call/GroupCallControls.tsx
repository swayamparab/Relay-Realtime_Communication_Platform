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
                className="rounded-full bg-red-600 p-2 text-white"
                title="Leave group call"
            >
                <Phone className="size-5" />
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
                className="rounded-full p-2 hover:bg-muted"
                title="Group voice call"
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
                className="rounded-full p-2 hover:bg-muted"
                title="Group video call"
            >
                <Video className="size-5" />
            </button>
        </div>
    );
}