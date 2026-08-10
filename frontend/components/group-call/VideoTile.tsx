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
    const videoRef =
        useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        video.srcObject = stream;

        // Explicitly attempt playback because
        // some browsers may delay autoplay.
        video.play().catch(() => {
            // Autoplay may be blocked by the browser.
            // The muted local video should normally
            // still autoplay.
        });

        return () => {
            video.srcObject = null;
        };
    }, [stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            disablePictureInPicture
            controls={false}
            className="h-full w-full object-cover object-center"
        />
    );
}