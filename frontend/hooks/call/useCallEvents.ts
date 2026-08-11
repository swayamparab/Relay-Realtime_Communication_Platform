"use client";

import { useEffect } from "react";

import {
    CallData,
    initialCallState,
} from "@/providers/CallProvider";

import { useCall } from "./useCall";
import { useSocket } from "../useSocket";
import { useWebRTCActions } from "../webrtc/useWebRTCActions";
import { useWebRTC } from "../webrtc/useWebRTC";
import { useRingtone } from "./useRingtone";

export function useCallEvents() {
    const { socket } = useSocket();
    const { setCallState, timeoutRef, setIsVideoMinimized } = useCall();

    const { createOffer } = useWebRTCActions();

    const { closePeerConnection } = useWebRTC();

    const { playIncoming, stopIncoming, stopOutgoing, } = useRingtone();

    useEffect(() => {
        function handleIncomingCall(data: CallData) {

            playIncoming();

            setCallState({
                ...data,
                status: "incoming",
                connectedAt: null,
            });
        }

        function handleCallParticipantInvited(data: {
            conversationId: string;
            type: "voice" | "video";
            callerId: string;
            participant: {
                id: string;
                username: string;
            };
        }) {
            playIncoming();

            setCallState({
                conversationId: data.conversationId,
                type: data.type,
                caller: {
                    id: data.callerId,
                    username: "",
                },
                receiver: data.participant,
                status: "incoming",
                connectedAt: null,
            });
        }

        async function handleCallAccepted(data: {
            conversationId: string;
        }) {
            setCallState((prev) => ({
                ...prev,
                status: "connecting",
            }));

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            stopOutgoing();

            await createOffer(data.conversationId);
        }

        function handleCallRejected() {

            stopIncoming();
            stopOutgoing();

            setCallState(initialCallState);
            setIsVideoMinimized(false);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        }

        function handleCallEnded() {

            stopIncoming();
            stopOutgoing();

            closePeerConnection();

            setCallState(initialCallState);
            setIsVideoMinimized(false);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        }

        socket.off("incoming_call", handleIncomingCall);
        socket.off("call_participant_invited",handleCallParticipantInvited);
        socket.off("call_accepted", handleCallAccepted);
        socket.off("call_rejected", handleCallRejected);
        socket.off("end_call", handleCallEnded);

        socket.on("incoming_call", handleIncomingCall);
        socket.on("call_participant_invited",handleCallParticipantInvited);
        socket.on("call_accepted", handleCallAccepted);
        socket.on("call_rejected", handleCallRejected);
        socket.on("end_call", handleCallEnded);

        return () => {
            socket.off("incoming_call", handleIncomingCall);
            socket.off("call_participant_invited",handleCallParticipantInvited);
            socket.off("call_accepted", handleCallAccepted);
            socket.off("call_rejected", handleCallRejected);
            socket.off("end_call", handleCallEnded);
        };
    }, [socket, setCallState, createOffer]);
}