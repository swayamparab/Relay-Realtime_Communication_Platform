"use client";

import { useEffect } from "react";

import { useSocket } from "@/hooks/useSocket";

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
        type: "voice" | "video";
    }) => void;
};

export function useGroupCallEvents({
    onUserJoined,
    onUserLeft,
    onCallEnded,
    onOffer,
    onAnswer,
    onIceCandidate,
    onIncomingCall
}: Props) {
    const { socket } = useSocket();

    useEffect(() => {
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
        };
    }, [
        socket,
        onUserJoined,
        onUserLeft,
        onCallEnded,
        onOffer,
        onAnswer,
        onIceCandidate,
        onIncomingCall
    ]);
}