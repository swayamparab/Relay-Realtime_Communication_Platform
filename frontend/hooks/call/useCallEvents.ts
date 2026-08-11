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

import { useGroupWebRTC } from "../group-call/useGroupWebRTC";

export function useCallEvents() {
    const { socket } = useSocket();

    const {
        setCallState,
        timeoutRef,
        setIsVideoMinimized,
    } = useCall();

    const { createOffer } =
        useWebRTCActions();

    const {
        localStream,
        closePrimaryPeerConnection,
        closePeerConnection,
    } = useWebRTC();

    const {
        adoptLocalStream,
    } = useGroupWebRTC();

    const {
        playIncoming,
        stopIncoming,
        stopOutgoing,
    } = useRingtone();

    useEffect(() => {
        if (!socket) {
            return;
        }

        /*
         * ============================================================
         * INCOMING 1-TO-1 CALL
         * ============================================================
         */

        function handleIncomingCall(
            data: CallData
        ) {
            playIncoming();

            setCallState({
                ...data,
                status: "incoming",
                connectedAt: null,
            });
        }

        /*
         * ============================================================
         * 1-TO-1 PARTICIPANT INVITATION
         * ============================================================
         */

        function handleCallParticipantInvited(
            data: {
                conversationId: string;
                type: "voice" | "video";
                callerId: string;
                participant: {
                    id: string;
                    username: string;
                };
            }
        ) {
            playIncoming();

            setCallState({
                conversationId:
                    data.conversationId,

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

        /*
         * ============================================================
         * 1-TO-1 CALL ACCEPTED
         * ============================================================
         */

        async function handleCallAccepted(
            data: {
                conversationId: string;
            }
        ) {
            setCallState((prev) => ({
                ...prev,
                status: "connecting",
            }));

            if (timeoutRef.current) {
                clearTimeout(
                    timeoutRef.current
                );

                timeoutRef.current = null;
            }

            stopOutgoing();

            await createOffer(
                data.conversationId
            );
        }

        /*
         * ============================================================
         * 1-TO-1 CALL REJECTED
         * ============================================================
         */

        function handleCallRejected() {
            stopIncoming();
            stopOutgoing();

            /*
             * The call is completely finished,
             * so it is safe to stop local media.
             */
            closePeerConnection();

            setCallState(
                initialCallState
            );

            setIsVideoMinimized(false);

            if (timeoutRef.current) {
                clearTimeout(
                    timeoutRef.current
                );

                timeoutRef.current = null;
            }
        }

        /*
         * ============================================================
         * 1-TO-1 CALL ENDED
         * ============================================================
         */

        function handleCallEnded() {
            stopIncoming();
            stopOutgoing();

            /*
             * Entire call is finished.
             * Stop local media and clean everything.
             */
            closePeerConnection();

            setCallState(
                initialCallState
            );

            setIsVideoMinimized(false);

            if (timeoutRef.current) {
                clearTimeout(
                    timeoutRef.current
                );

                timeoutRef.current = null;
            }
        }

        /*
         * ============================================================
         * 1-TO-1 → GROUP CALL PROMOTION
         * ============================================================
         *
         * IMPORTANT:
         *
         * We must NOT call closePeerConnection() here.
         *
         * closePeerConnection() stops the local
         * microphone/camera tracks.
         *
         * Instead:
         *
         *     adoptLocalStream()
         *          ↓
         *     closePrimaryPeerConnection()
         *
         * The existing MediaStream stays alive and is
         * transferred to GroupWebRTCProvider.
         */

        function handleGroupCallPromoted(
            data: {
                conversationId: string;
                type: "voice" | "video";
                participants: {
                    id: string;
                    username: string;
                }[];
            }
        ) {
            console.log(
                "[CallEvents] 1-to-1 promoted to group call:",
                data
            );

            /*
             * Transfer the existing microphone/camera
             * stream to the group WebRTC provider.
             */
            if (localStream) {
                adoptLocalStream(
                    localStream,
                    data.conversationId
                );
            } else {
                console.warn(
                    "[CallEvents] No local stream available during group promotion."
                );
            }

            /*
             * Stop the outgoing ringtone.
             */
            stopOutgoing();

            /*
             * Cancel the old 1-to-1 call timeout.
             */
            if (timeoutRef.current) {
                clearTimeout(
                    timeoutRef.current
                );

                timeoutRef.current = null;
            }

            /*
             * IMPORTANT:
             *
             * Close ONLY the old 1-to-1 peer.
             *
             * This does NOT stop local microphone/camera.
             */
            closePrimaryPeerConnection();

            /*
             * The group call now owns the active
             * media stream.
             *
             * GroupCallProvider receives the same
             * group_call:promoted event and starts
             * the group WebRTC connections.
             */
            setCallState(
                initialCallState
            );

            setIsVideoMinimized(false);
        }

        /*
         * ============================================================
         * SOCKET LISTENERS
         * ============================================================
         */

        socket.on(
            "incoming_call",
            handleIncomingCall
        );

        socket.on(
            "call_participant_invited",
            handleCallParticipantInvited
        );

        socket.on(
            "call_accepted",
            handleCallAccepted
        );

        socket.on(
            "call_rejected",
            handleCallRejected
        );

        socket.on(
            "end_call",
            handleCallEnded
        );

        socket.on(
            "group_call:promoted",
            handleGroupCallPromoted
        );

        /*
         * ============================================================
         * CLEANUP
         * ============================================================
         */

        return () => {
            socket.off(
                "incoming_call",
                handleIncomingCall
            );

            socket.off(
                "call_participant_invited",
                handleCallParticipantInvited
            );

            socket.off(
                "call_accepted",
                handleCallAccepted
            );

            socket.off(
                "call_rejected",
                handleCallRejected
            );

            socket.off(
                "end_call",
                handleCallEnded
            );

            socket.off(
                "group_call:promoted",
                handleGroupCallPromoted
            );
        };
    }, [
        socket,
        setCallState,
        createOffer,
        closePrimaryPeerConnection,
        closePeerConnection,
        localStream,
        adoptLocalStream,
        playIncoming,
        stopIncoming,
        stopOutgoing,
        timeoutRef,
        setIsVideoMinimized,
    ]);
}