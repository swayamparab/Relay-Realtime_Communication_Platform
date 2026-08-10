"use client";

import {
    createContext,
    useCallback,
    useState,
} from "react";

import { toast } from "sonner";

import { useSocket } from "@/hooks/useSocket";
import { useGroupCallEvents } from "@/hooks/group-call/useGroupCallEvents";
import { useGroupWebRTC } from "@/hooks/group-call/useGroupWebRTC";

import { GroupCallScreen } from "@/components/group-call/GroupCallScreen";
import { IncomingGroupCall } from "@/components/group-call/IncomingGroupCall";

type CallType = "voice" | "video";

type Participant = {
    id: string;
    username: string;
};

type GroupCallContextType = {
    inCall: boolean;

    conversationId: string | null;

    callType: CallType | null;

    participants: Participant[];

    startCall: (
        conversationId: string,
        type: CallType
    ) => void;

    joinCall: (
        conversationId: string,
        type: CallType
    ) => void;

    leaveCall: () => void;

    incomingCall: {
        conversationId: string;
        callerId: string;
        type: CallType;
    } | null;

    declineCall: () => void;
};

export const GroupCallContext =
    createContext<GroupCallContextType | null>(
        null
    );

export function GroupCallProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { socket } = useSocket();

    const {
        setConversationId: setWebRTCConversationId,
        getLocalStream,
        createOffer,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
        hasPeerConnection,
        cleanupWebRTC,
    } = useGroupWebRTC();

    const [inCall, setInCall] =
        useState(false);

    const [conversationId, setConversationId] =
        useState<string | null>(null);

    const [callType, setCallType] =
        useState<CallType | null>(null);

    const [participants, setParticipants] =
        useState<Participant[]>([]);

    const [incomingCall, setIncomingCall] =
        useState<{
            conversationId: string;
            callerId: string;
            type: CallType;
        } | null>(null);

    const declineCall = useCallback(() => {
        setIncomingCall(null);
    }, []);

    const cleanupCall = useCallback(() => {
        cleanupWebRTC();

        setConversationId(null);
        setCallType(null);
        setParticipants([]);
        setInCall(false);
        setIncomingCall(null);

        setWebRTCConversationId(null);
    }, [
        cleanupWebRTC,
        setWebRTCConversationId,
    ]);

    const leaveCall = useCallback(() => {
        if (conversationId) {
            socket.emit(
                "group_call:leave",
                {
                    conversationId,
                }
            );
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
            username,
        }: {
            userId: string;
            username: string;
        }) => {
            setParticipants((prev) => {
                if (
                    prev.some(
                        (participant) =>
                            participant.id ===
                            userId
                    )
                ) {
                    return prev;
                }

                return [
                    ...prev,
                    {
                        id: userId,
                        username,
                    },
                ];
            });
            
            if (hasPeerConnection(userId)) {
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
            createOffer,
            hasPeerConnection
        ]
    );

    const onUserLeft = useCallback(
        ({
            userId,
        }: {
            userId: string;
        }) => {
            setParticipants((prev) =>
                prev.filter(
                    (participant) =>
                        participant.id !==
                        userId
                )
            );
        },
        []
    );

    const onOffer = useCallback(
        async ({
            senderId,
            conversationId:
            eventConversationId,
            offer,
        }: {
            senderId: string;
            conversationId: string;
            offer: RTCSessionDescriptionInit;
        }) => {
            if (
                eventConversationId !==
                conversationId
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
        [
            conversationId,
            handleOffer,
        ]
    );

    const onAnswer = useCallback(
        async ({
            senderId,
            conversationId:
            eventConversationId,
            answer,
        }: {
            senderId: string;
            conversationId: string;
            answer: RTCSessionDescriptionInit;
        }) => {
            if (
                eventConversationId !==
                conversationId
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
        [
            conversationId,
            handleAnswer,
        ]
    );

    const onIceCandidate = useCallback(
        async ({
            senderId,
            conversationId:
            eventConversationId,
            candidate,
        }: {
            senderId: string;
            conversationId: string;
            candidate: RTCIceCandidateInit;
        }) => {
            if (
                eventConversationId !==
                conversationId
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
                    "Failed to handle group call ICE:",
                    error
                );
            }
        },
        [
            conversationId,
            handleIceCandidate,
        ]
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
        onIncomingCall,
    });

    const startCall = useCallback(
        async (
            conversationId: string,
            type: CallType
        ) => {
            const stream =
                await getLocalStream(type);

            if (!stream) {
                toast.error(
                    "Unable to access microphone/camera."
                );

                return;
            }

            setConversationId(
                conversationId
            );

            setCallType(type);

            setWebRTCConversationId(
                conversationId
            );

            socket.emit(
                "group_call:start",
                {
                    conversationId,
                    type,
                },
                (response: {
                    success: boolean;
                    message?: string;
                    participants?: Participant[];
                    type: CallType;
                }) => {
                    if (
                        !response.success
                    ) {
                        toast.error(
                            response.message ??
                            "Failed to start group call."
                        );

                        cleanupCall();

                        return;
                    }

                    setParticipants(
                        response.participants ??
                        []
                    );

                    setInCall(true);
                }
            );
        },
        [
            socket,
            getLocalStream,
            setWebRTCConversationId,
            cleanupCall,
        ]
    );

    const joinCall = useCallback(
        async (
            conversationId: string,
            type: CallType
        ) => {
            const stream =
                await getLocalStream(type);

            if (!stream) {
                toast.error(
                    "Unable to access microphone/camera."
                );

                return;
            }

            setConversationId(
                conversationId
            );

            setCallType(type);

            setWebRTCConversationId(
                conversationId
            );

            socket.emit(
                "group_call:join",
                {
                    conversationId,
                },
                (response: {
                    success: boolean;
                    message?: string;
                    participants?: Participant[];
                    type: CallType;
                }) => {
                    if (
                        !response.success
                    ) {
                        toast.error(
                            response.message ??
                            "Failed to join group call."
                        );

                        cleanupCall();

                        return;
                    }

                    setParticipants(
                        response.participants ??
                        []
                    );

                    setCallType(
                        response.type
                    );

                    setInCall(true);

                    setIncomingCall(null);
                }
            );
        },
        [
            socket,
            getLocalStream,
            setWebRTCConversationId,
            cleanupCall,
        ]
    );

    return (
        <GroupCallContext.Provider
            value={{
                inCall,
                conversationId,
                callType,
                participants,

                startCall,
                joinCall,
                leaveCall,

                incomingCall,
                declineCall,
            }}
        >
            <IncomingGroupCall />

            <GroupCallScreen />

            {children}
        </GroupCallContext.Provider>
    );
}