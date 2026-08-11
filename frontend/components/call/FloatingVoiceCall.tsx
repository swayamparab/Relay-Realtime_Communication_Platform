"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Maximize2,
    Mic,
    MicOff,
    PhoneOff,
    Phone,
} from "lucide-react";

import { useCall } from "@/hooks/call/useCall";
import { useCallActions } from "@/hooks/call/useCallActions";
import { useCurrentUser } from "@/hooks/user/useCurrentUser";
import { useCallDuration } from "@/hooks/call/useCallDuration";
import { useWebRTCActions } from "@/hooks/webrtc/useWebRTCActions";
import { useWebRTC } from "@/hooks/webrtc/useWebRTC";

export function FloatingVoiceCall() {
    const {
        callState,
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

    const [position, setPosition] =
        useState({
            x: 0,
            y: 0,
        });

    const [isDragging, setIsDragging] =
        useState(false);

    const dragOffset = useRef({
        x: 0,
        y: 0,
    });

    const hasMoved = useRef(false);

    useEffect(() => {
        setPosition({
            x: window.innerWidth - 340,
            y: window.innerHeight - 180,
        });
    }, []);

    useEffect(() => {
        if (!isDragging) {
            return;
        }

        function handlePointerMove(
            e: PointerEvent
        ) {
            const newX =
                e.clientX -
                dragOffset.current.x;

            const newY =
                e.clientY -
                dragOffset.current.y;

            if (
                Math.abs(newX - position.x) > 5 ||
                Math.abs(newY - position.y) > 5
            ) {
                hasMoved.current = true;
            }

            setPosition({
                x: newX,
                y: newY,
            });
        }

        function handlePointerUp() {
            setIsDragging(false);
        }

        window.addEventListener(
            "pointermove",
            handlePointerMove
        );

        window.addEventListener(
            "pointerup",
            handlePointerUp
        );

        return () => {
            window.removeEventListener(
                "pointermove",
                handlePointerMove
            );

            window.removeEventListener(
                "pointerup",
                handlePointerUp
            );
        };
    }, [isDragging, position]);

    function handlePointerDown(
        e: React.PointerEvent<HTMLDivElement>
    ) {
        e.currentTarget.setPointerCapture(
            e.pointerId
        );

        setIsDragging(true);

        hasMoved.current = false;

        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
    }

    if (!currentUser) {
        return null;
    }

    const remoteUser =
        currentUser.user.id ===
            callState.caller.id
            ? callState.receiver
            : callState.caller;

    return (
        <div
            onPointerDown={handlePointerDown}
            style={{
                left: position.x,
                top: position.y,
            }}
            className={`
                fixed
                z-[110]
                w-[280px]
                overflow-hidden
                rounded-2xl
                border
                border-white/10
                bg-slate-950
                shadow-2xl
                select-none
                touch-none
                ${isDragging
                    ? "cursor-grabbing"
                    : "cursor-grab"
                }
                sm:w-[320px]
            `}
        >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">

                <div className="relative">
                    <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-400">
                        {remoteUser.username
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                        {remoteUser.username}
                    </p>

                    <p className="text-xs text-slate-400">
                        {callState.status ===
                            "connecting"
                            ? "Connecting..."
                            : duration}
                    </p>
                </div>

                <Phone className="size-4 text-emerald-400" />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 px-4 py-3">

                {/* Mute */}
                <button
                    type="button"
                    onPointerDown={(e) =>
                        e.stopPropagation()
                    }
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleMute();
                    }}
                    className={`flex size-10 items-center justify-center rounded-full transition ${isMuted
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-slate-800 text-white hover:bg-slate-700"
                        }`}
                    aria-label={
                        isMuted
                            ? "Unmute microphone"
                            : "Mute microphone"
                    }
                >
                    {isMuted ? (
                        <MicOff className="size-4" />
                    ) : (
                        <Mic className="size-4" />
                    )}
                </button>

                {/* Restore */}
                <button
                    type="button"
                    onPointerDown={(e) =>
                        e.stopPropagation()
                    }
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsVideoMinimized(false);
                    }}
                    className="flex size-10 items-center justify-center rounded-full bg-slate-800 text-white transition hover:bg-slate-700"
                    aria-label="Restore call"
                    title="Restore call"
                >
                    <Maximize2 className="size-4" />
                </button>

                {/* End */}
                <button
                    type="button"
                    onPointerDown={(e) =>
                        e.stopPropagation()
                    }
                    onClick={(e) => {
                        e.stopPropagation();

                        endCall(
                            callState.conversationId
                        );
                    }}
                    className="flex size-10 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700"
                    aria-label="End call"
                    title="End call"
                >
                    <PhoneOff className="size-4" />
                </button>
            </div>
        </div>
    );
}