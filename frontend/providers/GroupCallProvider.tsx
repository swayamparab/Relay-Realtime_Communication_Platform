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

import { useWebRTC } from "@/hooks/webrtc/useWebRTC";

import { GroupCallScreen } from "@/components/group-call/GroupCallScreen";
import { IncomingGroupCall } from "@/components/group-call/IncomingGroupCall";

import { useCurrentUser } from "@/hooks/user/useCurrentUser";

type CallType = "voice" | "video";

type Participant = {
    id: string;
    username: string;
};

type IncomingCall = {
    conversationId: string;
    callerId: string;
    callerUsername: string;
    type: CallType;
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

    incomingCall: IncomingCall | null;

    declineCall: () => void;

    isMinimized: boolean;

    setIsMinimized: React.Dispatch<
        React.SetStateAction<boolean>
    >;
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
        closePeerConnection,
        cleanupWebRTC,
        setRemoteVideoStates,
        setRemoteMuteStates,
        adoptLocalStream,
    } = useGroupWebRTC();

    /*
     * Existing 1-to-1 WebRTC provider.
     *
     * We use this only during:
     *
     * 1-to-1 call
     *      ↓
     * promote
     *      ↓
     * group call
     *
     * The existing local stream is transferred
     * into GroupWebRTCProvider.
     */
    const {
        localStream: oneToOneLocalStream,
        closePrimaryPeerConnection,
    } = useWebRTC();

    const { data: currentUser } =
        useCurrentUser();

    /*
     * ============================================================
     * STATE
     * ============================================================
     */

    const [inCall, setInCall] =
        useState(false);

    const [conversationId, setConversationId] =
        useState<string | null>(null);

    const [callType, setCallType] =
        useState<CallType | null>(null);

    const [participants, setParticipants] =
        useState<Participant[]>([]);

    const [incomingCall, setIncomingCall] =
        useState<IncomingCall | null>(null);

    const [isMinimized, setIsMinimized] =
        useState(false);

    /*
     * ============================================================
     * CLEANUP
     * ============================================================
     */

    const cleanupCall = useCallback(() => {
        cleanupWebRTC();

        setConversationId(null);
        setCallType(null);
        setParticipants([]);
        setInCall(false);
        setIncomingCall(null);

        setWebRTCConversationId(null);

        setIsMinimized(false);
    }, [
        cleanupWebRTC,
        setWebRTCConversationId,
    ]);

    /*
     * ============================================================
     * DECLINE INCOMING CALL
     * ============================================================
     */

    const declineCall = useCallback(() => {
        setIncomingCall(null);
    }, []);

    /*
     * ============================================================
     * LEAVE GROUP CALL
     * ============================================================
     */

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

    /*
     * ============================================================
     * PROMOTE 1-TO-1 → GROUP CALL
     * ============================================================
     *
     * This is the most important part.
     *
     * Existing flow:
     *
     *     WebRTCProvider
     *          |
     *          | localStream
     *          ↓
     *     1-to-1 call
     *
     * After promotion:
     *
     *     WebRTCProvider
     *          |
     *          | close primary peer
     *          | KEEP localStream
     *          ↓
     *     GroupWebRTCProvider
     *          |
     *          ↓
     *     group peers
     *
     * We MUST NOT call closePeerConnection()
     * here because that would stop the microphone
     * and camera.
     */

    const onCallPromoted = useCallback(
        async ({
            conversationId:
            eventConversationId,
            type,
            participants:
            promotedParticipants,
        }: {
            conversationId: string;
            type: CallType;
            participants: Participant[];
        }) => {
            /*
             * If we are already inside another
             * group call, ignore this event.
             */
            if (
                inCall &&
                conversationId !==
                eventConversationId
            ) {
                return;
            }

            /*
             * ========================================================
             * 1. Preserve the existing local stream
             * ========================================================
             */

            const existingLocalStream =
                oneToOneLocalStream;

            if (!existingLocalStream) {
                console.error(
                    "Cannot promote call: existing 1-to-1 local stream is unavailable."
                );

                toast.error(
                    "Unable to continue call."
                );

                return;
            }

            /*
             * ========================================================
             * 2. Close ONLY the old 1-to-1 peer
             * ========================================================
             *
             * IMPORTANT:
             *
             * closePrimaryPeerConnection()
             * does NOT stop localStream.
             *
             * This allows us to reuse the same
             * microphone/camera tracks.
             */

            closePrimaryPeerConnection();

            /*
             * ========================================================
             * 3. Give the existing stream to group WebRTC
             * ========================================================
             */

            adoptLocalStream(
                existingLocalStream,
                eventConversationId
            );

            /*
             * ========================================================
             * 4. Update group call state
             * ========================================================
             */

            setConversationId(
                eventConversationId
            );

            setWebRTCConversationId(
                eventConversationId
            );

            setCallType(type);

            setParticipants(
                promotedParticipants
            );

            setInCall(true);

            setIncomingCall(null);

            /*
             * ========================================================
             * 5. Establish group peer connections
             * ========================================================
             *
             * The group WebRTC provider uses deterministic
             * user-ID ordering to decide who creates the offer.
             *
             * Therefore we can safely ask it to create offers
             * for all other participants.
             *
             * Only the designated offerer will actually create
             * an offer.
             */

            const localUserId =
                currentUser?.user.id;

            if (!localUserId) {
                console.warn(
                    "Cannot establish promoted group peers: current user unavailable."
                );

                return;
            }

            const otherParticipants =
                promotedParticipants.filter(
                    (participant) =>
                        participant.id !==
                        localUserId
                );

            for (const participant of
                otherParticipants) {
                if (
                    hasPeerConnection(
                        participant.id
                    )
                ) {
                    continue;
                }

                try {
                    await createOffer(
                        participant.id
                    );
                } catch (error) {
                    console.error(
                        "Failed to create promoted group peer:",
                        participant.id,
                        error
                    );
                }
            }
        },
        [
            inCall,
            oneToOneLocalStream,
            closePrimaryPeerConnection,
            adoptLocalStream,
            currentUser?.user.id,
            setWebRTCConversationId,
            hasPeerConnection,
            createOffer,
        ]
    );

    /*
     * ============================================================
     * USER JOINED
     * ============================================================
     */

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

            /*
             * Existing participants create the
             * WebRTC connection to the newly joined user.
             *
             * createOffer() itself determines whether
             * this user is the designated offerer.
             */

            if (
                hasPeerConnection(userId)
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
            createOffer,
            hasPeerConnection,
        ]
    );

    /*
     * ============================================================
     * USER LEFT
     * ============================================================
     */

    const onUserLeft = useCallback(
        ({
            userId,
        }: {
            userId: string;
        }) => {
            /*
             * Remove participant from UI.
             */

            setParticipants((prev) =>
                prev.filter(
                    (participant) =>
                        participant.id !==
                        userId
                )
            );

            /*
             * Close the WebRTC peer for this user.
             */

            closePeerConnection(userId);
        },
        [closePeerConnection]
    );

    /*
     * ============================================================
     * GROUP OFFER
     * ============================================================
     */

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

    /*
     * ============================================================
     * GROUP ANSWER
     * ============================================================
     */

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

    /*
     * ============================================================
     * GROUP ICE CANDIDATE
     * ============================================================
     */

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

    /*
     * ============================================================
     * NORMAL GROUP CALL INCOMING
     * ============================================================
     */

    const onIncomingCall = useCallback(
        ({
            conversationId:
            eventConversationId,
            callerId,
            callerUsername,
            type,
        }: IncomingCall) => {
            if (inCall) {
                return;
            }

            setIncomingCall({
                conversationId:
                    eventConversationId,
                callerId,
                callerUsername,
                type,
            });
        },
        [inCall]
    );

    /*
     * ============================================================
     * PARTICIPANT INVITATION
     * ============================================================
     */

    const onParticipantInvited =
        useCallback(
            ({
                conversationId:
                eventConversationId,
                callerId,
                callerUsername,
                type,
            }: IncomingCall) => {
                if (inCall) {
                    return;
                }

                setIncomingCall({
                    conversationId:
                        eventConversationId,
                    callerId,
                    callerUsername,
                    type,
                });

                toast.info(
                    `${callerUsername} invited you to a group call`
                );
            },
            [inCall]
        );

    /*
     * ============================================================
     * GROUP CALL ENDED
     * ============================================================
     */

    const onCallEnded = useCallback(() => {
        cleanupCall();
    }, [cleanupCall]);

    /*
     * ============================================================
     * REMOTE CAMERA STATE
     * ============================================================
     */

    const onRemoteCameraState =
        useCallback(
            ({
                userId,
                enabled,
            }: {
                userId: string;
                enabled: boolean;
            }) => {
                setRemoteVideoStates(
                    (prev) => {
                        const next =
                            new Map(prev);

                        next.set(
                            userId,
                            enabled
                        );

                        return next;
                    }
                );
            },
            [setRemoteVideoStates]
        );

    /*
     * ============================================================
     * REMOTE MUTE STATE
     * ============================================================
     */

    const onRemoteMuteState =
        useCallback(
            ({
                userId,
                muted,
            }: {
                userId: string;
                muted: boolean;
            }) => {
                setRemoteMuteStates(
                    (prev) => {
                        const next =
                            new Map(prev);

                        next.set(
                            userId,
                            muted
                        );

                        return next;
                    }
                );
            },
            [setRemoteMuteStates]
        );

    /*
     * ============================================================
     * GROUP SOCKET EVENTS
     * ============================================================
     */

    useGroupCallEvents({
        onUserJoined,
        onUserLeft,
        onCallEnded,
        onOffer,
        onAnswer,
        onIceCandidate,
        onIncomingCall,
        onRemoteCameraState,
        onRemoteMuteState,
        onCallPromoted,
        onParticipantInvited,
    });

    /*
     * ============================================================
     * START GROUP CALL
     * ============================================================
     */

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

                    setCallType(
                        response.type
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

    /*
     * ============================================================
     * JOIN GROUP CALL
     * ============================================================
     */

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
                async (response: {
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

                    const localUserId = currentUser?.user.id;

                    if (localUserId) {
                        const otherParticipants =
                            (response.participants ?? []).filter(
                                (participant) =>
                                    participant.id !== localUserId
                            );

                        for (const participant of otherParticipants) {
                            if (hasPeerConnection(participant.id)) {
                                continue;
                            }

                            try {
                                await createOffer(participant.id);
                            } catch (error) {
                                console.error(
                                    "Failed to create group call offer:",
                                    participant.id,
                                    error
                                );
                            }
                        }
                    }
                }
            );
        },
        [
            socket,
            getLocalStream,
            setWebRTCConversationId,
            cleanupCall,
            currentUser?.user.id,
            hasPeerConnection,
            createOffer,
        ]
    );

    /*
     * ============================================================
     * PROVIDER
     * ============================================================
     */

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

                isMinimized,
                setIsMinimized,
            }}
        >
            {/* <IncomingGroupCall /> */}

            <GroupCallScreen />

            {children}
        </GroupCallContext.Provider>
    );
}