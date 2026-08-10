"use client";

import {
    createContext,
    useCallback,
    useMemo,
    useRef,
    useState,
} from "react";

import { useSocket } from "@/hooks/useSocket";

type GroupWebRTCContextType = {
    localStream: MediaStream | null;

    remoteStreams: Map<string, MediaStream>;

    setConversationId: (
        conversationId: string | null
    ) => void;

    getLocalStream: (
        type: "voice" | "video"
    ) => Promise<MediaStream | null>;

    createPeerConnection: (
        remoteUserId: string
    ) => RTCPeerConnection;

    createOffer: (
        targetUserId: string
    ) => Promise<void>;

    handleOffer: (
        senderId: string,
        offer: RTCSessionDescriptionInit
    ) => Promise<void>;

    handleAnswer: (
        senderId: string,
        answer: RTCSessionDescriptionInit
    ) => Promise<void>;

    handleIceCandidate: (
        senderId: string,
        candidate: RTCIceCandidateInit
    ) => Promise<void>;

    hasPeerConnection: (
        remoteUserId: string
    ) => boolean;

    cleanupWebRTC: () => void;
};

export const GroupWebRTCContext =
    createContext<GroupWebRTCContextType | null>(
        null
    );

export function GroupWebRTCProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { socket } = useSocket();

    const [localStream, setLocalStream] =
        useState<MediaStream | null>(null);

    const [remoteStreams, setRemoteStreams] =
        useState<Map<string, MediaStream>>(
            new Map()
        );

    const localStreamRef =
        useRef<MediaStream | null>(null);

    const conversationIdRef =
        useRef<string | null>(null);

    const peerConnections = useRef(
        new Map<string, RTCPeerConnection>()
    );

    const pendingIceCandidates = useRef(
        new Map<
            string,
            RTCIceCandidateInit[]
        >()
    );

    const makingOffer = useRef(
        new Map<string, boolean>()
    );

    const setConversationId = useCallback(
        (conversationId: string | null) => {
            conversationIdRef.current =
                conversationId;
        },
        []
    );

    const getLocalStream = useCallback(
        async (
            type: "voice" | "video"
        ) => {
            if (localStreamRef.current) {
                return localStreamRef.current;
            }

            try {
                const stream =
                    await navigator.mediaDevices.getUserMedia(
                        {
                            audio: true,
                            video:
                                type === "video",
                        }
                    );

                localStreamRef.current =
                    stream;

                setLocalStream(stream);

                return stream;
            } catch (error) {
                console.error(
                    "Failed to access local media:",
                    error
                );

                return null;
            }
        },
        []
    );

    const createPeerConnection =
        useCallback(
            (
                remoteUserId: string
            ) => {
                const existing =
                    peerConnections.current.get(
                        remoteUserId
                    );

                if (existing) {
                    return existing;
                }

                const peer =
                    new RTCPeerConnection({
                        iceServers: [
                            {
                                urls: "stun:stun.l.google.com:19302",
                            },
                        ],
                    });

                const stream =
                    localStreamRef.current;

                stream
                    ?.getTracks()
                    .forEach((track) => {
                        peer.addTrack(
                            track,
                            stream
                        );
                    });

                peer.onicecandidate = (
                    event
                ) => {
                    if (
                        !event.candidate
                    ) {
                        return;
                    }

                    socket.emit(
                        "group_call:ice_candidate",
                        {
                            conversationId:
                                conversationIdRef.current,

                            targetUserId:
                                remoteUserId,

                            candidate:
                                event.candidate,
                        }
                    );
                };

                peer.ontrack = (event) => {
                    const stream =
                        event.streams[0];

                    if (!stream) {
                        return;
                    }

                    setRemoteStreams(
                        (prev) => {
                            const next =
                                new Map(
                                    prev
                                );

                            next.set(
                                remoteUserId,
                                stream
                            );

                            return next;
                        }
                    );
                };

                peer.onconnectionstatechange =
                    () => {
                        const state =
                            peer.connectionState;

                        console.log(
                            "Group WebRTC connection:",
                            remoteUserId,
                            state
                        );

                        if (
                            state ===
                            "failed" ||
                            state ===
                            "closed"
                        ) {
                            peer.close();

                            peerConnections.current.delete(
                                remoteUserId
                            );

                            pendingIceCandidates.current.delete(
                                remoteUserId
                            );

                            makingOffer.current.delete(
                                remoteUserId
                            );

                            setRemoteStreams(
                                (prev) => {
                                    const next =
                                        new Map(
                                            prev
                                        );

                                    next.delete(
                                        remoteUserId
                                    );

                                    return next;
                                }
                            );
                        }
                    };

                peerConnections.current.set(
                    remoteUserId,
                    peer
                );

                return peer;
            },
            [socket]
        );

    const createOffer = useCallback(
        async (
            targetUserId: string
        ) => {
            let peer =
                peerConnections.current.get(
                    targetUserId
                );

            if (!peer) {
                peer =
                    createPeerConnection(
                        targetUserId
                    );
            }

            if (
                peer.signalingState !==
                "stable"
            ) {
                return;
            }

            try {
                makingOffer.current.set(
                    targetUserId,
                    true
                );

                const offer =
                    await peer.createOffer();

                await peer.setLocalDescription(
                    offer
                );

                socket.emit(
                    "group_call:offer",
                    {
                        conversationId:
                            conversationIdRef.current,

                        targetUserId,

                        offer,
                    }
                );
            } finally {
                makingOffer.current.set(
                    targetUserId,
                    false
                );
            }
        },
        [
            socket,
            createPeerConnection,
        ]
    );

    const handleOffer = useCallback(
        async (
            senderId: string,
            offer: RTCSessionDescriptionInit
        ) => {
            let peer =
                peerConnections.current.get(
                    senderId
                );

            if (!peer) {
                peer =
                    createPeerConnection(
                        senderId
                    );
            }

            if (
                makingOffer.current.get(
                    senderId
                )
            ) {
                return;
            }

            if (
                peer.signalingState !==
                "stable"
            ) {
                return;
            }

            await peer.setRemoteDescription(
                offer
            );

            const pending =
                pendingIceCandidates.current.get(
                    senderId
                ) ?? [];

            for (const candidate of pending) {
                try {
                    await peer.addIceCandidate(
                        candidate
                    );
                } catch (error) {
                    console.error(
                        "Failed to add pending ICE candidate:",
                        error
                    );
                }
            }

            pendingIceCandidates.current.delete(
                senderId
            );

            const answer =
                await peer.createAnswer();

            await peer.setLocalDescription(
                answer
            );

            socket.emit(
                "group_call:answer",
                {
                    conversationId:
                        conversationIdRef.current,

                    targetUserId: senderId,

                    answer,
                }
            );
        },
        [
            socket,
            createPeerConnection,
        ]
    );

    const handleAnswer = useCallback(
        async (
            senderId: string,
            answer: RTCSessionDescriptionInit
        ) => {
            const peer =
                peerConnections.current.get(
                    senderId
                );

            if (!peer) {
                return;
            }

            if (
                peer.signalingState !==
                "have-local-offer"
            ) {
                return;
            }

            await peer.setRemoteDescription(
                answer
            );
        },
        []
    );

    const handleIceCandidate = useCallback(
        async (
            senderId: string,
            candidate: RTCIceCandidateInit
        ) => {
            const peer =
                peerConnections.current.get(
                    senderId
                );

            if (
                !peer ||
                !peer.remoteDescription
            ) {
                const pending =
                    pendingIceCandidates.current.get(
                        senderId
                    ) ?? [];

                pending.push(candidate);

                pendingIceCandidates.current.set(
                    senderId,
                    pending
                );

                return;
            }

            try {
                await peer.addIceCandidate(
                    candidate
                );
            } catch (error) {
                console.error(
                    "Failed to add ICE candidate:",
                    error
                );
            }
        },
        []
    );

    const hasPeerConnection = useCallback(
        (remoteUserId: string) => {
            return peerConnections.current.has(
                remoteUserId
            );
        },
        []
    );

    const cleanupWebRTC = useCallback(
        () => {
            localStreamRef.current
                ?.getTracks()
                .forEach((track) => {
                    track.stop();
                });

            localStreamRef.current = null;

            setLocalStream(null);

            peerConnections.current.forEach(
                (peer) => {
                    peer.close();
                }
            );

            peerConnections.current.clear();

            pendingIceCandidates.current.clear();

            makingOffer.current.clear();

            setRemoteStreams((prev) => {
                prev.forEach((stream) => {
                    stream
                        .getTracks()
                        .forEach(
                            (track) => {
                                track.stop();
                            }
                        );
                });

                return new Map();
            });

            conversationIdRef.current =
                null;
        },
        []
    );

    const value = useMemo(
        () => ({
            localStream,

            remoteStreams,

            setConversationId,

            getLocalStream,

            createPeerConnection,

            createOffer,

            handleOffer,

            handleAnswer,

            handleIceCandidate,

            hasPeerConnection,

            cleanupWebRTC,
        }),
        [
            localStream,
            remoteStreams,
            setConversationId,
            getLocalStream,
            createPeerConnection,
            createOffer,
            handleOffer,
            handleAnswer,
            handleIceCandidate,
            hasPeerConnection,
            cleanupWebRTC,
        ]
    );

    return (
        <GroupWebRTCContext.Provider
            value={value}
        >
            {children}
        </GroupWebRTCContext.Provider>
    );
}