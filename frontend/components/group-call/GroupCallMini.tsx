"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Maximize2,
    PhoneOff,
    Video,
} from "lucide-react";

import { useGroupCall } from "@/hooks/group-call/useGroupCall";
import { useGroupWebRTC } from "@/hooks/group-call/useGroupWebRTC";
import { VideoTile } from "./VideoTile";

export function GroupCallMini() {
    const {
        callType,
        participants,
        leaveCall,
        setIsMinimized,
    } = useGroupCall();

    const {
        remoteStreams,
    } = useGroupWebRTC();

    const [position, setPosition] = useState({
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

    const firstRemoteStream =
        Array.from(remoteStreams.entries())[0];

    const remoteUserId =
        firstRemoteStream?.[0];

    const remoteStream =
        firstRemoteStream?.[1];

    const remoteParticipant =
        participants.find(
            (participant) =>
                participant.id === remoteUserId
        );

    useEffect(() => {
        setPosition({
            x: window.innerWidth - 300,
            y: window.innerHeight - 230,
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

    function handleClick() {
        if (hasMoved.current) {
            hasMoved.current = false;
            return;
        }

        setIsMinimized(false);
    }

    return (
        <div
            onPointerDown={handlePointerDown}
            onClick={handleClick}
            style={{
                left: position.x,
                top: position.y,
            }}
            className={`
                fixed
                z-[60]
                h-64
                w-44
                overflow-hidden
                rounded-2xl
                border
                border-white/10
                bg-zinc-950
                shadow-2xl
                select-none
                touch-none
                ${isDragging
                    ? "cursor-grabbing"
                    : "cursor-grab"
                }
            `}
        >
            {/* Video / Avatar */}
            <div className="relative h-full w-full bg-zinc-900">
                {callType === "video" &&
                    remoteStream ? (
                    <VideoTile
                        stream={remoteStream}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <div className="flex size-16 items-center justify-center rounded-full bg-zinc-700 text-xl font-semibold text-white">
                            {(
                                remoteParticipant?.username ??
                                "You"
                            )
                                .charAt(0)
                                .toUpperCase()}
                        </div>
                    </div>
                )}

                {/* Call info */}
                <div className="absolute left-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-[11px] text-white backdrop-blur-md">
                    {participants.length}{" "}
                    {participants.length === 1
                        ? "participant"
                        : "participants"}
                </div>

                {/* Call type */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                    <Video className="size-3" />

                    <span>
                        Group {callType}
                    </span>
                </div>

                {/* Restore */}
                <button
                    type="button"
                    onPointerDown={(e) => {
                        e.stopPropagation();
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMinimized(false);
                    }}
                    className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80"
                    aria-label="Restore call"
                    title="Restore call"
                >
                    <Maximize2 className="size-4" />
                </button>

                {/* Leave */}
                <button
                    type="button"
                    onPointerDown={(e) => {
                        e.stopPropagation();
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        leaveCall();
                    }}
                    className="absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700"
                    aria-label="Leave call"
                    title="Leave call"
                >
                    <PhoneOff className="size-4" />
                </button>
            </div>
        </div>
    );
}