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

    const {
        setCallState,
        timeoutRef,
        setIsVideoMinimized,
    } = useCall();

    const { createOffer } =
        useWebRTCActions();

    const {
        closePeerConnection,
    } = useWebRTC();

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
         * GroupCallProvider owns the actual transition:
         *
         *     existing 1-to-1 stream
         *              ↓
         *     adoptLocalStream()
         *              ↓
         *     closePrimaryPeerConnection()
         *              ↓
         *     group WebRTC peers
         *
         * This handler only cleans up the old
         * 1-to-1 call UI/state.
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
            /*
             * GroupCallProvider handles the actual
             * 1-to-1 → group WebRTC transition.
             *
             * This handler only cleans up the
             * old 1-to-1 call UI/state.
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
             * GroupCallProvider now owns the call.
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
        closePeerConnection,
        playIncoming,
        stopIncoming,
        stopOutgoing,
        timeoutRef,
        setIsVideoMinimized,
    ]);
}