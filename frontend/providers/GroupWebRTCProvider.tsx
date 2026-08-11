"use client";

import {
    createContext,
    useCallback,
    useMemo,
    useRef,
    useState,
} from "react";

import { useSocket } from "@/hooks/useSocket";
import { useCurrentUser } from "@/hooks/user/useCurrentUser";

type CallType = "voice" | "video";

type Participant = {
    id: string;
    username: string;
};

type GroupWebRTCContextType = {
    localStream: MediaStream | null;

    remoteStreams: Map<string, MediaStream>;

    remoteVideoStates: Map<string, boolean>;

    setRemoteVideoStates: React.Dispatch<
        React.SetStateAction<Map<string, boolean>>
    >;

    remoteMuteStates: Map<string, boolean>;

    setRemoteMuteStates: React.Dispatch<
        React.SetStateAction<Map<string, boolean>>
    >;

    setConversationId: (
        conversationId: string | null
    ) => void;

    getLocalStream: (
        type: CallType
    ) => Promise<MediaStream | null>;

    adoptLocalStream: (
        stream: MediaStream,
        conversationId: string
    ) => void;

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

    closePeerConnection: (
        remoteUserId: string
    ) => void;

    cleanupWebRTC: () => void;
};

type RemoteVideoState = Map<string, boolean>;

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

    const { data: currentUser } =
        useCurrentUser();

    /*
     * ============================================================
     * STATE
     * ============================================================
     */

    const [localStream, setLocalStream] =
        useState<MediaStream | null>(null);

    const [remoteStreams, setRemoteStreams] =
        useState<Map<string, MediaStream>>(
            new Map()
        );

    const [
        remoteVideoStates,
        setRemoteVideoStates,
    ] = useState<RemoteVideoState>(
        new Map()
    );

    const [
        remoteMuteStates,
        setRemoteMuteStates,
    ] = useState<Map<string, boolean>>(
        new Map()
    );

    /*
     * ============================================================
     * REFS
     * ============================================================
     */

    const localStreamRef =
        useRef<MediaStream | null>(null);

    const conversationIdRef =
        useRef<string | null>(null);

    const peerConnections =
        useRef<
            Map<string, RTCPeerConnection>
        >(new Map());

    const pendingIceCandidates =
        useRef<
            Map<
                string,
                RTCIceCandidateInit[]
            >
        >(new Map());

    const makingOffer =
        useRef<Map<string, boolean>>(
            new Map()
        );

    /*
     * ============================================================
     * CONVERSATION
     * ============================================================
     */

    const setConversationId =
        useCallback(
            (
                conversationId: string | null
            ) => {
                conversationIdRef.current =
                    conversationId;
            },
            []
        );

    /*
     * ============================================================
     * GET LOCAL STREAM
     *
     * Used for a brand-new group call.
     *
     * If a 1-to-1 call already has a local stream,
     * that same stream is reused.
     * ============================================================
     */

    const getLocalStream =
        useCallback(
            async (
                type: CallType
            ): Promise<MediaStream | null> => {
                if (
                    localStreamRef.current
                ) {
                    return localStreamRef.current;
                }

                try {
                    const stream =
                        await navigator.mediaDevices.getUserMedia(
                            {
                                audio: true,
                                video:
                                    type ===
                                    "video",
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

    /*
     * ============================================================
     * ADOPT EXISTING 1-TO-1 STREAM
     *
     * This is the important 1-to-1 → group transition.
     *
     * The old WebRTC provider keeps the microphone/camera stream
     * alive, and this provider takes ownership of that stream.
     * ============================================================
     */

    const adoptLocalStream =
        useCallback(
            (
                stream: MediaStream,
                conversationId: string
            ) => {
                localStreamRef.current =
                    stream;

                setLocalStream(stream);

                conversationIdRef.current =
                    conversationId;
            },
            []
        );

    /*
     * ============================================================
     * CREATE PARTICIPANT PEER CONNECTION
     * ============================================================
     */

    const createPeerConnection =
        useCallback(
            (
                remoteUserId: string
            ): RTCPeerConnection => {
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
                                urls:
                                    "stun:stun.l.google.com:19302",
                            },
                        ],
                    });

                /*
                 * Add local microphone/camera tracks.
                 */

                const stream =
                    localStreamRef.current;

                if (stream) {
                    stream
                        .getTracks()
                        .forEach(
                            (track) => {
                                const alreadyAdded =
                                    peer
                                        .getSenders()
                                        .some(
                                            (
                                                sender
                                            ) =>
                                                sender.track?.id ===
                                                track.id
                                        );

                                if (
                                    !alreadyAdded
                                ) {
                                    peer.addTrack(
                                        track,
                                        stream
                                    );
                                }
                            }
                        );
                }

                /*
                 * ========================================================
                 * ICE
                 * ========================================================
                 */

                peer.onicecandidate =
                    (event) => {
                        if (
                            !event.candidate
                        ) {
                            return;
                        }

                        const conversationId =
                            conversationIdRef.current;

                        if (
                            !conversationId ||
                            !socket
                        ) {
                            return;
                        }

                        socket.emit(
                            "group_call:ice_candidate",
                            {
                                conversationId,
                                targetUserId:
                                    remoteUserId,
                                candidate:
                                    event.candidate,
                            }
                        );
                    };

                /*
                 * ========================================================
                 * REMOTE TRACK
                 * ========================================================
                 */

                peer.ontrack = (
                    event
                ) => {
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

                /*
                 * ========================================================
                 * CONNECTION STATE
                 * ========================================================
                 */

                peer.onconnectionstatechange =
                    () => {
                        const state =
                            peer.connectionState;

                        console.log(
                            "[Group WebRTC]",
                            remoteUserId,
                            "connection:",
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

                            setRemoteVideoStates(
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

                            setRemoteMuteStates(
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

                /*
                 * ========================================================
                 * ICE CONNECTION STATE
                 * ========================================================
                 */

                peer.oniceconnectionstatechange =
                    () => {
                        console.log(
                            "[Group WebRTC ICE]",
                            remoteUserId,
                            peer.iceConnectionState
                        );
                    };

                peerConnections.current.set(
                    remoteUserId,
                    peer
                );

                return peer;
            },
            [socket]
        );

    /*
     * ============================================================
     * DETERMINE OFFERER
     *
     * Smaller user ID creates the offer.
     *
     * This prevents both participants from creating an offer
     * at exactly the same time.
     * ============================================================
     */

    const shouldCreateOffer =
        useCallback(
            (remoteUserId: string) => {
                const localUserId =
                    currentUser?.user.id;

                if (!localUserId) {
                    return false;
                }

                return (
                    localUserId <
                    remoteUserId
                );
            },
            [currentUser?.user.id]
        );

    /*
     * ============================================================
     * CREATE OFFER
     * ============================================================
     */

    const createOffer =
        useCallback(
            async (
                targetUserId: string
            ) => {
                if (!socket) {
                    return;
                }

                const localUserId =
                    currentUser?.user.id;

                if (!localUserId) {
                    console.warn(
                        "Cannot create group offer: current user unavailable."
                    );

                    return;
                }

                /*
                 * Never connect to ourselves.
                 */

                if (
                    localUserId ===
                    targetUserId
                ) {
                    return;
                }

                /*
                 * Only the deterministic offerer
                 * creates the offer.
                 */

                if (
                    !shouldCreateOffer(
                        targetUserId
                    )
                ) {
                    return;
                }

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

                /*
                 * Prevent duplicate offers.
                 */

                if (
                    makingOffer.current.get(
                        targetUserId
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

                const conversationId =
                    conversationIdRef.current;

                if (!conversationId) {
                    console.warn(
                        "Cannot create group offer without conversation ID."
                    );

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
                            conversationId,
                            targetUserId,
                            offer:
                                peer.localDescription,
                        }
                    );
                } catch (error) {
                    console.error(
                        "Failed to create group WebRTC offer:",
                        error
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
                currentUser?.user.id,
                shouldCreateOffer,
                createPeerConnection,
            ]
        );

    /*
     * ============================================================
     * HANDLE OFFER
     * ============================================================
     */

    const handleOffer =
        useCallback(
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

                /*
                 * Only accept an offer when the peer
                 * is stable.
                 */

                if (
                    peer.signalingState !==
                    "stable"
                ) {
                    console.warn(
                        "Ignoring group offer. Signaling state:",
                        peer.signalingState
                    );

                    return;
                }

                try {
                    await peer.setRemoteDescription(
                        new RTCSessionDescription(
                            offer
                        )
                    );

                    /*
                     * Flush ICE candidates that arrived
                     * before the remote description.
                     */

                    const pending =
                        pendingIceCandidates.current.get(
                            senderId
                        ) ?? [];

                    for (
                        const candidate of
                        pending
                    ) {
                        try {
                            await peer.addIceCandidate(
                                new RTCIceCandidate(
                                    candidate
                                )
                            );
                        } catch (error) {
                            console.error(
                                "Failed to add pending group ICE:",
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

                    const conversationId =
                        conversationIdRef.current;

                    if (
                        !conversationId
                    ) {
                        return;
                    }

                    socket.emit(
                        "group_call:answer",
                        {
                            conversationId,
                            targetUserId:
                                senderId,
                            answer:
                                peer.localDescription,
                        }
                    );
                } catch (error) {
                    console.error(
                        "Failed to handle group WebRTC offer:",
                        error
                    );
                }
            },
            [
                socket,
                createPeerConnection,
            ]
        );

    /*
     * ============================================================
     * HANDLE ANSWER
     * ============================================================
     */

    const handleAnswer =
        useCallback(
            async (
                senderId: string,
                answer: RTCSessionDescriptionInit
            ) => {
                const peer =
                    peerConnections.current.get(
                        senderId
                    );

                if (!peer) {
                    console.warn(
                        "Received group answer for unknown peer:",
                        senderId
                    );

                    return;
                }

                if (
                    peer.signalingState !==
                    "have-local-offer"
                ) {
                    console.warn(
                        "Ignoring group answer. Signaling state:",
                        peer.signalingState
                    );

                    return;
                }

                try {
                    await peer.setRemoteDescription(
                        new RTCSessionDescription(
                            answer
                        )
                    );

                    /*
                     * Flush queued ICE.
                     */

                    const pending =
                        pendingIceCandidates.current.get(
                            senderId
                        ) ?? [];

                    for (
                        const candidate of
                        pending
                    ) {
                        try {
                            await peer.addIceCandidate(
                                new RTCIceCandidate(
                                    candidate
                                )
                            );
                        } catch (error) {
                            console.error(
                                "Failed to add pending ICE after answer:",
                                error
                            );
                        }
                    }

                    pendingIceCandidates.current.delete(
                        senderId
                    );
                } catch (error) {
                    console.error(
                        "Failed to handle group WebRTC answer:",
                        error
                    );
                }
            },
            []
        );

    /*
     * ============================================================
     * HANDLE ICE
     * ============================================================
     */

    const handleIceCandidate =
        useCallback(
            async (
                senderId: string,
                candidate: RTCIceCandidateInit
            ) => {
                const peer =
                    peerConnections.current.get(
                        senderId
                    );

                /*
                 * Peer doesn't exist yet.
                 */

                if (!peer) {
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

                /*
                 * Peer exists but remote description
                 * isn't ready yet.
                 */

                if (
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
                        new RTCIceCandidate(
                            candidate
                        )
                    );
                } catch (error) {
                    console.error(
                        "Failed to add group ICE candidate:",
                        error
                    );
                }
            },
            []
        );

    /*
     * ============================================================
     * CHECK PEER
     * ============================================================
     */

    const hasPeerConnection =
        useCallback(
            (remoteUserId: string) => {
                const peer =
                    peerConnections.current.get(
                        remoteUserId
                    );

                if (!peer) {
                    return false;
                }

                if (
                    peer.connectionState ===
                    "closed" ||
                    peer.connectionState ===
                    "failed"
                ) {
                    return false;
                }

                return true;
            },
            []
        );

    /*
     * ============================================================
     * CLOSE ONE PARTICIPANT
     * ============================================================
     */

    const closePeerConnection =
        useCallback(
            (remoteUserId: string) => {
                const peer =
                    peerConnections.current.get(
                        remoteUserId
                    );

                if (peer) {
                    peer.ontrack = null;
                    peer.onicecandidate =
                        null;
                    peer.onconnectionstatechange =
                        null;

                    peer.close();
                }

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
                            new Map(prev);

                        next.delete(
                            remoteUserId
                        );

                        return next;
                    }
                );

                setRemoteVideoStates(
                    (prev) => {
                        const next =
                            new Map(prev);

                        next.delete(
                            remoteUserId
                        );

                        return next;
                    }
                );

                setRemoteMuteStates(
                    (prev) => {
                        const next =
                            new Map(prev);

                        next.delete(
                            remoteUserId
                        );

                        return next;
                    }
                );
            },
            []
        );

    /*
     * ============================================================
     * CLEANUP EVERYTHING
     * ============================================================
     */

    const cleanupWebRTC =
        useCallback(() => {
            /*
             * Stop local microphone/camera.
             */

            localStreamRef.current
                ?.getTracks()
                .forEach((track) => {
                    track.stop();
                });

            localStreamRef.current =
                null;

            setLocalStream(null);

            /*
             * Close all participant peers.
             */

            peerConnections.current.forEach(
                (peer) => {
                    peer.ontrack = null;
                    peer.onicecandidate =
                        null;
                    peer.onconnectionstatechange =
                        null;

                    peer.close();
                }
            );

            peerConnections.current.clear();

            /*
             * Clear negotiation state.
             */

            pendingIceCandidates.current.clear();

            makingOffer.current.clear();

            /*
             * Stop remote streams.
             */

            setRemoteStreams((prev) => {
                prev.forEach(
                    (stream) => {
                        stream
                            .getTracks()
                            .forEach(
                                (track) => {
                                    track.stop();
                                }
                            );
                    }
                );

                return new Map();
            });

            /*
             * Clear remote states.
             */

            setRemoteVideoStates(
                new Map()
            );

            setRemoteMuteStates(
                new Map()
            );

            /*
             * Clear conversation.
             */

            conversationIdRef.current =
                null;
        }, []);

    /*
     * ============================================================
     * CONTEXT VALUE
     * ============================================================
     */

    const value = useMemo(
        () => ({
            localStream,

            remoteStreams,

            remoteVideoStates,
            setRemoteVideoStates,

            remoteMuteStates,
            setRemoteMuteStates,

            setConversationId,

            getLocalStream,

            adoptLocalStream,

            createPeerConnection,

            createOffer,

            handleOffer,

            handleAnswer,

            handleIceCandidate,

            hasPeerConnection,

            closePeerConnection,

            cleanupWebRTC,
        }),
        [
            localStream,
            remoteStreams,

            remoteVideoStates,
            remoteMuteStates,

            setConversationId,

            getLocalStream,

            adoptLocalStream,

            createPeerConnection,

            createOffer,

            handleOffer,

            handleAnswer,

            handleIceCandidate,

            hasPeerConnection,

            closePeerConnection,

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