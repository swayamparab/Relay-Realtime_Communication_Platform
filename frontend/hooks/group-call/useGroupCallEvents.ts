"use client";

import { useEffect } from "react";

import { useSocket } from "@/hooks/useSocket";

type CallType = "voice" | "video";

type Participant = {
    id: string;
    username: string;
};

type Props = {
    onUserJoined: (data: {
        userId: string;
        username: string;
    }) => void;

    onUserLeft: (data: {
        userId: string;
    }) => void;

    onCallEnded: () => void;

    onOffer: (data: {
        senderId: string;
        conversationId: string;
        offer: RTCSessionDescriptionInit;
    }) => void;

    onAnswer: (data: {
        senderId: string;
        conversationId: string;
        answer: RTCSessionDescriptionInit;
    }) => void;

    onIceCandidate: (data: {
        senderId: string;
        conversationId: string;
        candidate: RTCIceCandidateInit;
    }) => void;

    onIncomingCall: (data: {
        conversationId: string;
        callerId: string;
        callerUsername: string;
        type: CallType;
    }) => void;

    onCallPromoted: (data: {
        conversationId: string;
        type: CallType;
        participants: Participant[];
    }) => void;

    onParticipantInvited: (data: {
        conversationId: string;
        callerId: string;
        callerUsername: string;
        type: CallType;
    }) => void;

    onRemoteCameraState: (data: {
        userId: string;
        enabled: boolean;
    }) => void;

    onRemoteMuteState: (data: {
        userId: string;
        muted: boolean;
    }) => void;
};

export function useGroupCallEvents({
    onUserJoined,
    onUserLeft,
    onCallEnded,
    onOffer,
    onAnswer,
    onIceCandidate,
    onIncomingCall,
    onCallPromoted,
    onParticipantInvited,
    onRemoteCameraState,
    onRemoteMuteState,
}: Props) {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) {
            return;
        }

        socket.on(
            "group_call:user_joined",
            onUserJoined
        );

        socket.on(
            "group_call:user_left",
            onUserLeft
        );

        socket.on(
            "group_call:ended",
            onCallEnded
        );

        socket.on(
            "group_call:offer",
            onOffer
        );

        socket.on(
            "group_call:answer",
            onAnswer
        );

        socket.on(
            "group_call:ice_candidate",
            onIceCandidate
        );

        socket.on(
            "group_call:incoming",
            onIncomingCall
        );

        socket.on(
            "group_call:promoted",
            onCallPromoted
        );

        socket.on(
            "group_call:participant_invited",
            onParticipantInvited
        );

        socket.on(
            "group_call:remote_camera_state",
            onRemoteCameraState
        );

        socket.on(
            "group_call:remote_mute_state",
            onRemoteMuteState
        );

        return () => {
            socket.off(
                "group_call:user_joined",
                onUserJoined
            );

            socket.off(
                "group_call:user_left",
                onUserLeft
            );

            socket.off(
                "group_call:ended",
                onCallEnded
            );

            socket.off(
                "group_call:offer",
                onOffer
            );

            socket.off(
                "group_call:answer",
                onAnswer
            );

            socket.off(
                "group_call:ice_candidate",
                onIceCandidate
            );

            socket.off(
                "group_call:incoming",
                onIncomingCall
            );

            socket.off(
                "group_call:promoted",
                onCallPromoted
            );

            socket.off(
                "group_call:participant_invited",
                onParticipantInvited
            );

            socket.off(
                "group_call:remote_camera_state",
                onRemoteCameraState
            );

            socket.off(
                "group_call:remote_mute_state",
                onRemoteMuteState
            );
        };
    }, [
        socket,
        onUserJoined,
        onUserLeft,
        onCallEnded,
        onOffer,
        onAnswer,
        onIceCandidate,
        onIncomingCall,
        onCallPromoted,
        onParticipantInvited,
        onRemoteCameraState,
        onRemoteMuteState,
    ]);
}