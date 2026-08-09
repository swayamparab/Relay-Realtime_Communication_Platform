"use client";

import { useEffect, useRef } from "react";

type VideoTileProps = {
    stream: MediaStream;
    muted?: boolean;
};

export function VideoTile({
    stream,
    muted = false,
}: VideoTileProps) {

    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!videoRef.current) {
            return;
        }

        videoRef.current.srcObject =
            stream;

        return () => {
            if (videoRef.current) {
                videoRef.current.srcObject =
                    null;
            }
        };
    }, [stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className="h-full w-full object-cover"
        />
    );
}