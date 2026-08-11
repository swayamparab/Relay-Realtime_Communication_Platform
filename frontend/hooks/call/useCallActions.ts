"use client";

import { useSocket } from "../useSocket";
import { useCall } from "./useCall";
import {
    CallUser,
    initialCallState,
} from "@/providers/CallProvider";

import { useWebRTC } from "../webrtc/useWebRTC";
import { useCurrentUser } from "../user/useCurrentUser";
import { toast } from "sonner";
import { useRingtone } from "./useRingtone";

interface StartVoiceCallData {
    conversationId: string;
    receiver: CallUser;
}

export function useCallActions() {
    const { socket } = useSocket();

    const {
        callState,
        setCallState,
        timeoutRef,
        setIsVideoMinimized,
    } = useCall();

    const { data: currentUser } =
        useCurrentUser();

    const { closePeerConnection } =
        useWebRTC();

    const {
        playOutgoing,
        stopOutgoing,
        stopIncoming,
    } = useRingtone();

    function startVoiceCall({
        conversationId,
        receiver,
    }: StartVoiceCallData) {
        if (!currentUser) return;

        setCallState({
            status: "calling",
            conversationId,
            type: "voice",
            caller: {
                id: currentUser.user.id,
                username:
                    currentUser.user.username,
            },
            receiver,
            connectedAt: null,
        });

        playOutgoing();

        timeoutRef.current = setTimeout(() => {
            endCall(conversationId);

            toast.info(
                `No answer from ${receiver.username}`
            );
        }, 30000);

        socket.emit(
            "call_user",
            {
                conversationId,
                type: "voice",
                receiver,
            },
            (response: {
                success: boolean;
                message?: string;
            }) => {
                if (!response.success) {
                    stopOutgoing();

                    toast.error(
                        response.message ??
                        "Failed to start call."
                    );

                    setCallState(
                        initialCallState
                    );

                    setIsVideoMinimized(false);
                }
            }
        );
    }

    function startVideoCall({
        conversationId,
        receiver,
    }: StartVoiceCallData) {
        if (!currentUser) return;

        setCallState({
            status: "calling",
            conversationId,
            type: "video",
            caller: {
                id: currentUser.user.id,
                username:
                    currentUser.user.username,
            },
            receiver,
            connectedAt: null,
        });

        playOutgoing();

        timeoutRef.current = setTimeout(() => {
            endCall(conversationId);

            toast.info(
                `No answer from ${receiver.username}`
            );
        }, 30000);

        socket.emit(
            "call_user",
            {
                conversationId,
                type: "video",
                receiver,
            },
            (response: {
                success: boolean;
                message?: string;
            }) => {
                if (!response.success) {
                    stopOutgoing();

                    toast.error(
                        response.message ??
                        "Failed to start call."
                    );

                    setCallState(
                        initialCallState
                    );

                    setIsVideoMinimized(false);
                }
            }
        );
    }

    function endCall(
        conversationId: string
    ) {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        socket.emit("end_call", {
            conversationId,
        });

        stopIncoming();
        stopOutgoing();

        closePeerConnection();

        setCallState(initialCallState);
        setIsVideoMinimized(false);
    }

    /*
     * ============================================================
     * ADD PARTICIPANT
     * ============================================================
     *
     * If this is still a 1-to-1 call:
     *
     *     group_call:promote
     *
     * If it is already a group call:
     *
     *     group_call:add_participant
     *
     * The server handles the actual validation.
     */
    function addParticipantToCall(
        userId: string
    ) {
        if (!socket) {
            return;
        }

        if (!callState.conversationId) {
            toast.error(
                "No active call."
            );

            return;
        }

        if (
            callState.type !== "voice" &&
            callState.type !== "video"
        ) {
            toast.error(
                "Invalid call type."
            );

            return;
        }

        const conversationId =
            callState.conversationId;

        /*
         * At this point this action is being
         * called from the existing 1-to-1
         * call screen.
         *
         * Promote the call to a group call.
         */
        socket.emit(
            "group_call:promote",
            {
                conversationId,
                type: callState.type,
                userId,
            },
            (response: {
                success: boolean;
                message?: string;
            }) => {
                if (!response.success) {
                    toast.error(
                        response.message ??
                        "Failed to add participant."
                    );

                    return;
                }

                toast.success(
                    "Participant invited."
                );
            }
        );
    }

    function addParticipantToGroupCall(
        conversationId: string,
        userId: string
    ) {
        if (!socket) return;

        socket.emit(
            "group_call:add_participant",
            {
                conversationId,
                userId,
            },
            (response: {
                success: boolean;
                message?: string;
            }) => {
                if (!response.success) {
                    toast.error(
                        response.message ??
                        "Failed to invite participant."
                    );

                    return;
                }

                toast.success(
                    "Invitation sent."
                );
            }
        );
    }

    return {
        startVoiceCall,
        startVideoCall,
        endCall,
        addParticipantToCall,
        addParticipantToGroupCall
    };
}