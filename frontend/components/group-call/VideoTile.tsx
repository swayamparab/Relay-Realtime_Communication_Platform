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

        const handleLoadedMetadata = () => {
            video.play().catch(() => {
                // Browser may block autoplay for
                // unmuted remote media.
            });
        };

        video.addEventListener(
            "loadedmetadata",
            handleLoadedMetadata
        );

        // In case metadata is already available.
        if (video.readyState >= 1) {
            video.play().catch(() => { });
        }

        return () => {
            video.removeEventListener(
                "loadedmetadata",
                handleLoadedMetadata
            );

            video.pause();
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