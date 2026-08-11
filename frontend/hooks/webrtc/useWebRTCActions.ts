"use client";

import { useSocket } from "@/hooks/useSocket";
import { useWebRTC } from "@/hooks/webrtc/useWebRTC";
import { useCall } from "../call/useCall";

export function useWebRTCActions() {
    const { socket } = useSocket();

    const {
        localStream,
        setLocalStream,
        peerConnection,
        createPeerConnection,
        setupLocalMedia,
        pendingIceCandidates,

        peerConnections,
        createParticipantPeerConnection,
        pendingPeerIceCandidates,

        setIsMuted,
        setIsCameraOff,
        cameraFacingMode,
        setCameraFacingMode,
    } = useWebRTC();

    const { callState } = useCall();

    async function createOffer(conversationId: string) {
        if (!socket) return;

        await setupLocalMedia({
            audio: true,
            video: callState.type === "video",
        });

        const peer = createPeerConnection();

        peer.onicecandidate = (event) => {
            if (!event.candidate) return;

            socket.emit("ice_candidate", {
                conversationId,
                candidate: event.candidate,
            });
        };

        const offer = await peer.createOffer();

        await peer.setLocalDescription(offer);

        socket.emit("webrtc_offer", {
            conversationId,
            offer,
        });
    }

    async function createAnswer(
        conversationId: string,
        offer: RTCSessionDescriptionInit
    ) {
        if (!socket) return;

        await setupLocalMedia({
            audio: true,
            video: callState.type === "video",
        });

        const peer = createPeerConnection();

        peer.onicecandidate = (event) => {
            if (!event.candidate) return;

            socket.emit("ice_candidate", {
                conversationId,
                candidate: event.candidate,
            });
        };

        await peer.setRemoteDescription(
            new RTCSessionDescription(offer)
        );

        for (const candidate of pendingIceCandidates.current) {
            await peer.addIceCandidate(
                new RTCIceCandidate(candidate)
            );
        }

        pendingIceCandidates.current = [];

        const answer = await peer.createAnswer();

        await peer.setLocalDescription(answer);

        socket.emit("webrtc_answer", {
            conversationId,
            answer,
        });
    }

    async function createParticipantOffer(
        conversationId: string,
        targetUserId: string
    ) {
        if (!socket || !localStream) {
            return;
        }

        const peer =
            createParticipantPeerConnection(
                targetUserId
            );

        const senders = peer.getSenders();

        localStream.getTracks().forEach(
            (track) => {
                const alreadyAdded =
                    senders.some(
                        (sender) =>
                            sender.track === track
                    );

                if (!alreadyAdded) {
                    peer.addTrack(
                        track,
                        localStream
                    );
                }
            }
        );

        peer.onicecandidate = (event) => {
            if (!event.candidate) {
                return;
            }

            socket.emit(
                "group_call:ice_candidate",
                {
                    targetUserId,
                    conversationId,
                    candidate:
                        event.candidate,
                }
            );
        };

        const offer =
            await peer.createOffer();

        await peer.setLocalDescription(
            offer
        );

        socket.emit(
            "group_call:offer",
            {
                targetUserId,
                conversationId,
                offer,
            }
        );
    }

    function toggleMute() {
        const audioTrack = localStream?.getAudioTracks()[0];

        if (!audioTrack) return;

        audioTrack.enabled = !audioTrack.enabled;

        setIsMuted(!audioTrack.enabled);
    }

    function toggleCamera() {
        const videoTrack = localStream?.getVideoTracks()[0];

        if (!videoTrack) return;

        videoTrack.enabled = !videoTrack.enabled;

        const enabled = videoTrack.enabled;

        setIsCameraOff(!enabled);

        socket.emit("camera_toggle", {
            conversationId: callState.conversationId,
            enabled,
        });
    }

    async function switchCamera() {
        if (!peerConnection.current) return;

        const newFacingMode =
            cameraFacingMode === "user"
                ? "environment"
                : "user";

        const stream =
            await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: newFacingMode,
                },
                audio: false,
            });

        const newTrack = stream.getVideoTracks()[0];

        if (!newTrack) return;

        const sender = peerConnection.current
            .getSenders()
            .find((sender) => sender.track?.kind === "video");

        if (!sender) return;

        await sender.replaceTrack(newTrack);

        // Stop old camera
        localStream?.getVideoTracks().forEach((track) => track.stop());

        // Keep existing audio
        const audioTrack =
            localStream?.getAudioTracks()[0];

        const updatedStream = new MediaStream();

        if (audioTrack) {
            updatedStream.addTrack(audioTrack);
        }

        updatedStream.addTrack(newTrack);

        setLocalStream(updatedStream);

        setCameraFacingMode(newFacingMode);
    }

    return {
        createOffer,
        createAnswer,
        createParticipantOffer,
        toggleMute,
        toggleCamera,
        switchCamera
    };
}