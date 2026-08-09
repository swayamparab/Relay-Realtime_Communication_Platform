"use client";

import {
    createContext,
    useCallback,
    useRef,
    useState,
} from "react";

import { toast, Toaster } from "sonner";

import { useSocket } from "@/hooks/useSocket";
import { useGroupCallEvents } from "@/hooks/group-call/useGroupCallEvents";
import { GroupCallScreen } from "@/components/group-call/GroupCallScreen";
import { CallEvents } from "@/components/providers/CallEvents";
import { WebRTCEvents } from "@/components/providers/WebRTCEvents";
import { IncomingGroupCall } from "@/components/group-call/IncomingGroupCall";

type CallType = "voice" | "video";

type GroupCallContextType = {
    inCall: boolean;
    conversationId: string | null;
    callType: CallType | null;
    participants: string[];

    startCall: (
        conversationId: string,
        type: CallType
    ) => void;

    joinCall: (
        conversationId: string
    ) => void;

    leaveCall: () => void;

    localStream: MediaStream | null;

    remoteStreams: Map<string, MediaStream>;

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

    incomingCall: {
        conversationId: string;
        callerId: string;
        type: CallType;
    } | null;

    declineCall: () => void;
};

export const GroupCallContext =
    createContext<GroupCallContextType | null>(null);

export function GroupCallProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { socket } = useSocket();

    const [inCall, setInCall] = useState(false);

    const [
        conversationId,
        setConversationId,
    ] = useState<string | null>(null);

    const [callType, setCallType] = useState<CallType | null>(null);

    const [participants, setParticipants] = useState<string[]>([]);

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

    const peerConnections = useRef(
        new Map<string, RTCPeerConnection>()
    );

    const pendingIceCandidates = useRef(
        new Map<string, RTCIceCandidateInit[]>()
    );

    const makingOffer = useRef(
        new Map<string, boolean>()
    );

    const [incomingCall, setIncomingCall] = useState<{
        conversationId: string;
        callerId: string;
        type: CallType;
    } | null>(null);

    const declineCall = useCallback(() => {
        setIncomingCall(null);
    }, []);

    const createPeerConnection = useCallback(
        (
            remoteUserId: string
        ) => {

            const peer = new RTCPeerConnection({
                iceServers: [
                    {
                        urls: [
                            "stun:stun.l.google.com:19302",
                        ],
                    },
                ],
            });

            localStream
                ?.getTracks()
                .forEach((track) => {
                    peer.addTrack(
                        track,
                        localStream
                    );
                });

            peerConnections.current.set(
                remoteUserId,
                peer
            );

            peer.onicecandidate = (
                event
            ) => {
                if (!event.candidate) {
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

            peer.ontrack = (event) => {
                const stream = event.streams[0];

                if (!stream) {
                    return;
                }

                setRemoteStreams((prev) => {
                    const next = new Map(prev);

                    next.set(
                        remoteUserId,
                        stream
                    );

                    return next;
                });
            };

            peer.onconnectionstatechange = () => {

                console.log(
                    "Connection state:",
                    remoteUserId,
                    peer.connectionState
                );

                const state = peer.connectionState;

                if (
                    state === "failed" ||
                    state === "closed"
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

                    setRemoteStreams((prev) => {
                        const next = new Map(prev);

                        next.delete(remoteUserId);

                        return next;
                    });
                }
            };

            return peer;
        },
        [socket, localStream, conversationId]
    );

    const createOffer = useCallback(
        async (targetUserId: string) => {
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
                        conversationId,
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
            conversationId,
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
                    conversationId,
                    targetUserId: senderId,
                    answer,
                }
            );
        },
        [
            socket,
            conversationId,
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

            console.log(
                "Received answer from:",
                senderId
            );

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

            if (!peer.remoteDescription) {
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

            console.log(
                "Received ICE candidate from:",
                senderId
            );

            await peer.addIceCandidate(
                candidate
            );
        },
        []
    );

    const cleanupCall = useCallback(() => {
        localStream?.getTracks().forEach((track) => {
            track.stop();
        });

        setLocalStream(null);

        peerConnections.current.forEach((peer) => {
            peer.close();
        });

        peerConnections.current.clear();

        setRemoteStreams((prev) => {
            prev.forEach((stream) => {
                stream.getTracks().forEach((track) => {
                    track.stop();
                });
            });

            return new Map();
        });

        pendingIceCandidates.current.clear();

        makingOffer.current.clear();

        setConversationId(null);
        setCallType(null);
        setParticipants([]);
        setInCall(false);
    }, [localStream]);

    const leaveCall = useCallback(() => {
        if (conversationId) {
            socket.emit("group_call:leave", {
                conversationId,
            });
        }

        cleanupCall();
    }, [
        conversationId,
        socket,
        cleanupCall,
    ]);

    const onUserJoined = useCallback(
        async ({
            userId,
        }: {
            userId: string;
        }) => {
            setParticipants((prev) => {
                if (prev.includes(userId)) {
                    return prev;
                }

                return [...prev, userId];
            });

            if (!localStream || !conversationId) {
                return;
            }

            // Don't create another connection
            // if one already exists.
            if (
                peerConnections.current.has(
                    userId
                )
            ) {
                return;
            }

            try {
                await createOffer(userId);
            } catch (error) {
                console.error(
                    "Failed to create group call offer:",
                    error
                );
            }
        },
        [
            localStream,
            conversationId,
            createOffer,
        ]
    );

    const onOffer = useCallback(
        async ({
            senderId,
            conversationId: eventConversationId,
            offer,
        }: {
            senderId: string;
            conversationId: string;
            offer: RTCSessionDescriptionInit;
        }) => {
            if (
                eventConversationId !== conversationId
            ) {
                return;
            }

            try {
                await handleOffer(
                    senderId,
                    offer
                );
            } catch (error) {
                console.error(
                    "Failed to handle group call offer:",
                    error
                );
            }
        },
        [conversationId, handleOffer]
    );

    const onAnswer = useCallback(
        async ({
            senderId,
            conversationId: eventConversationId,
            answer,
        }: {
            senderId: string;
            conversationId: string;
            answer: RTCSessionDescriptionInit;
        }) => {
            if (
                eventConversationId !== conversationId
            ) {
                return;
            }

            try {
                await handleAnswer(
                    senderId,
                    answer
                );
            } catch (error) {
                console.error(
                    "Failed to handle group call answer:",
                    error
                );
            }
        },
        [conversationId, handleAnswer]
    );

    const onIceCandidate = useCallback(
        async ({
            senderId,
            conversationId: eventConversationId,
            candidate,
        }: {
            senderId: string;
            conversationId: string;
            candidate: RTCIceCandidateInit;
        }) => {
            if (
                eventConversationId !== conversationId
            ) {
                return;
            }

            try {
                await handleIceCandidate(
                    senderId,
                    candidate
                );
            } catch (error) {
                console.error(
                    "Failed to handle group call ICE candidate:",
                    error
                );
            }
        },
        [conversationId, handleIceCandidate]
    );

    const onUserLeft = useCallback(
        ({
            userId,
        }: {
            userId: string;
        }) => {
            setParticipants((prev) =>
                prev.filter(
                    (id) => id !== userId
                )
            );

            const peer =
                peerConnections.current.get(
                    userId
                );

            if (peer) {
                peer.close();

                peerConnections.current.delete(
                    userId
                );
            }

            setRemoteStreams((prev) => {
                const next = new Map(prev);

                next.delete(userId);

                return next;
            });

            pendingIceCandidates.current.delete(userId);

            makingOffer.current.delete(userId);
        },
        []
    );

    const onIncomingCall = useCallback(
        ({
            conversationId,
            callerId,
            type,
        }: {
            conversationId: string;
            callerId: string;
            type: CallType;
        }) => {

            // Don't show the incoming call to someone
            // who is already inside a call.
            if (inCall) {
                return;
            }

            setIncomingCall({
                conversationId,
                callerId,
                type,
            });
        },
        [inCall]
    );

    const onCallEnded = useCallback(() => {
        cleanupCall();
    }, [cleanupCall]);

    useGroupCallEvents({
        onUserJoined,
        onUserLeft,
        onCallEnded,
        onOffer,
        onAnswer,
        onIceCandidate,
        onIncomingCall
    });

    const getLocalStream = useCallback(
        async (type: CallType) => {
            try {
                const stream =
                    await navigator.mediaDevices.getUserMedia({
                        audio: true,
                        video: type === "video",
                    });

                setLocalStream(stream);

                return stream;
            } catch {
                toast.error(
                    "Unable to access microphone/camera."
                );

                return null;
            }
        },
        []
    );

    const startCall = useCallback(
        async (
            conversationId: string,
            type: CallType
        ) => {

            const stream = await getLocalStream(type);

            if (!stream) {
                return;
            }

            socket.emit(
                "group_call:start",
                {
                    conversationId,
                    type
                },
                (response: {
                    success: boolean;
                    message?: string;
                    participants?: string[];
                    type: CallType
                }) => {
                    if (!response.success) {
                        toast.error(
                            response.message ??
                            "Failed to start group call."
                        );

                        return;
                    }

                    setConversationId(
                        conversationId
                    );

                    setCallType(response.type);

                    setParticipants(
                        response.participants ??
                        []
                    );

                    setInCall(true);
                }
            );
        },
        [socket, getLocalStream]
    );

    const joinCall = useCallback(
        async (conversationId: string) => {

            socket.emit(
                "group_call:join",
                {
                    conversationId,
                },
                async (response: {
                    success: boolean;
                    message?: string;
                    participants?: string[];
                    type: CallType;
                }) => {

                    if (!response.success) {
                        toast.error(
                            response.message ??
                            "Failed to join group call."
                        );

                        return;
                    }

                    const stream =
                        await getLocalStream(
                            response.type
                        );

                    if (!stream) {
                        return;
                    }

                    setConversationId(
                        conversationId
                    );

                    setCallType(response.type);

                    setParticipants(
                        response.participants ?? []
                    );

                    setInCall(true);

                    setIncomingCall(null);
                }
            );
        },
        [socket, getLocalStream]
    );

    return (
        <GroupCallContext.Provider
            value={{
                inCall,
                conversationId,
                callType,
                participants,

                incomingCall,
                declineCall,

                startCall,
                joinCall,
                leaveCall,

                localStream,
                remoteStreams,

                createPeerConnection,
                createOffer,
                handleOffer,
                handleAnswer,
                handleIceCandidate,
            }}
        >
            <IncomingGroupCall />
            <GroupCallScreen />

            {children}
        </GroupCallContext.Provider>
    );
}