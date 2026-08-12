"use client";

import { useEffect, useRef } from "react";

import { useCall } from "@/hooks/call/useCall";
import { useWebRTC } from "@/hooks/webrtc/useWebRTC";
import { useCurrentUser } from "@/hooks/user/useCurrentUser";

export function RemoteVideo() {
    const videoRef = useRef<HTMLVideoElement>(null);

    const { remoteStream, remoteCameraOff } = useWebRTC();
    const { callState } = useCall();
    const { data: currentUser } = useCurrentUser();

    useEffect(() => {
        if (!videoRef.current || !remoteStream) return;

        videoRef.current.srcObject = remoteStream;

        videoRef.current.play().catch(() => { });
    }, [remoteStream]);

    if (!currentUser) {
        return null;
    }

    if (callState.type !== "video") {
        return null;
    }

    if (
        callState.status !== "connecting" &&
        callState.status !== "connected"
    ) {
        return null;
    }

    const remoteUser =
        currentUser.user.id === callState.caller.id
            ? callState.receiver
            : callState.caller;

    return (
        <div className="relative h-full w-full">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
            />

            {remoteCameraOff && (
                <div
                    className="
                        absolute
                        inset-0
                        flex
                        items-center
                        justify-center
                        bg-slate-950
                    "
                >
                    <div className="text-center">
                        <div
                            className="
                                mx-auto
                                flex
                                h-28
                                w-28
                                items-center
                                justify-center
                                rounded-full
                                bg-slate-800
                                text-5xl
                                font-semibold
                                text-white
                            "
                        >
                            {remoteUser.username
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <p className="mt-6 text-xl font-semibold text-white">
                            {remoteUser.username}
                        </p>

                        <p className="mt-2 text-slate-400">
                            Camera is turned off
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}