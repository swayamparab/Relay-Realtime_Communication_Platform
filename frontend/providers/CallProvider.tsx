"use client";

import {
    createContext,
    useMemo,
    useRef,
    useState,
} from "react";

import { IncomingCallDialog } from "@/components/call/IncomingCallDialog";
import { CallingDialog } from "@/components/call/CallingDialog";
import { VideoCallScreen } from "@/components/call/VideoCallScreen";
import { RemoteAudio } from "@/components/call/RemoteAudio";
import { VoiceCallScreen } from "@/components/call/VoiceCallScreen";

export type CallType = "voice" | "video";

export type CallStatus =
    | "idle"
    | "calling"
    | "incoming"
    | "connecting"
    | "connected";

export interface CallUser {
    id: string;
    username: string;
}

export interface CallData {
    conversationId: string;
    type: CallType;
    caller: CallUser;
    receiver: CallUser;
}

export interface CallState extends CallData {
    status: CallStatus;
    connectedAt: number | null;
}

interface CallContextType {
    callState: CallState;
    setCallState: React.Dispatch<React.SetStateAction<CallState>>;

    isVideoMinimized: boolean;
    setIsVideoMinimized: React.Dispatch<React.SetStateAction<boolean>>;

    timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

export const CallContext =
    createContext<CallContextType | null>(null);

export const initialCallState: CallState = {
    status: "idle",
    conversationId: "",
    type: "voice",
    caller: {
        id: "",
        username: "",
    },
    receiver: {
        id: "",
        username: ""
    },
    connectedAt: null,
};

export function CallProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [callState, setCallState] = useState(initialCallState);

    const [isVideoMinimized, setIsVideoMinimized] = useState(false);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const value = useMemo(
        () => ({
            callState,
            setCallState,
            timeoutRef,
            isVideoMinimized,
            setIsVideoMinimized,
        }),
        [callState, isVideoMinimized]
    );

    return (
        <CallContext.Provider value={value}>
            {children}
            <RemoteAudio />

            <IncomingCallDialog />
            <CallingDialog />
            <VideoCallScreen />
            <VoiceCallScreen/>
        </CallContext.Provider>
    );
}