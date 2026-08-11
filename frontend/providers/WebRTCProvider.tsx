"use client";

import { createContext, useMemo, useRef, useState } from "react";

interface WebRTCContextType {
    peerConnection: React.MutableRefObject<RTCPeerConnection | null>

    peerConnections: React.MutableRefObject<Map<string, RTCPeerConnection>>;

    remoteStreams: Map<string, MediaStream>;

    pendingPeerIceCandidates: React.MutableRefObject<Map<string, RTCIceCandidateInit[]>>;

    localStream: MediaStream | null;
    setLocalStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;

    remoteStream: MediaStream | null;
    setRemoteStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;

    createPeerConnection: () => RTCPeerConnection;

    createParticipantPeerConnection: (
        remoteUserId: string
    ) => RTCPeerConnection;

    closeParticipantPeerConnections: () => void;

    closePeerConnection: () => void;

    getLocalStream: (options: SetupLocalMediaOptions) => Promise<MediaStream>;
    setupLocalMedia: (options: SetupLocalMediaOptions) => Promise<MediaStream>;

    connectionState: RTCPeerConnectionState;

    pendingIceCandidates: React.MutableRefObject<RTCIceCandidateInit[]>;

    isMuted: boolean;
    setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;

    isCameraOff: boolean;
    setIsCameraOff: React.Dispatch<React.SetStateAction<boolean>>;

    remoteCameraOff: boolean;
    setRemoteCameraOff: React.Dispatch<React.SetStateAction<boolean>>;

    cameraFacingMode: "user" | "environment";
    setCameraFacingMode: React.Dispatch<React.SetStateAction<"user" | "environment">>;
}

interface SetupLocalMediaOptions {
    audio: boolean;
    video: boolean;
}

export const WebRTCContext = createContext<WebRTCContextType | null>(null);

export function WebRTCProvider({ children }: { children: React.ReactNode }) {

    const peerConnection = useRef<RTCPeerConnection | null>(null);

    const peerConnections = useRef(new Map<string, RTCPeerConnection>());

    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

    const pendingPeerIceCandidates = useRef(new Map<string, RTCIceCandidateInit[]>());

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");

    const pendingIceCandidates = useRef<RTCIceCandidateInit[]>([]);

    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);

    const [remoteCameraOff, setRemoteCameraOff] = useState(false);

    const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("user");

    function createPeerConnection() {
        if (peerConnection.current) {
            return peerConnection.current;
        }

        const peer = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302",
                },
            ],
        });

        peer.ontrack = (event) => {
            // console.log("Remote stream received");

            setRemoteStream(event.streams[0]);
        };

        peer.onconnectionstatechange = () => {
            // console.log("Connection State:", peer.connectionState);

            setConnectionState(peer.connectionState);
        };

        peerConnection.current = peer;

        return peer;
    }

    function createParticipantPeerConnection(
        remoteUserId: string
    ) {
        const existing =
            peerConnections.current.get(
                remoteUserId
            );

        if (existing) {
            return existing;
        }

        const peer = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302",
                },
            ],
        });

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

        peerConnections.current.set(
            remoteUserId,
            peer
        );

        return peer;
    }

    function closePeerConnection() {

        closeParticipantPeerConnections();

        localStream?.getTracks().forEach((track) => {
            track.stop();
        });

        remoteStream?.getTracks().forEach((track) => {
            track.stop();
        });

        setLocalStream(null);
        setRemoteStream(null);

        pendingIceCandidates.current = [];

        peerConnection.current?.close();
        peerConnection.current = null;

        setConnectionState("closed");

        setIsMuted(false);
        setIsCameraOff(false);

        setRemoteCameraOff(false);
    }

    function closeParticipantPeerConnections() {
        peerConnections.current.forEach(
            (peer) => {
                peer.close();
            }
        );

        peerConnections.current.clear();

        pendingPeerIceCandidates.current.clear();

        setRemoteStreams(new Map());
    }

    async function getLocalStream(options: SetupLocalMediaOptions) {
        if (localStream) {
            return localStream;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: options.audio,
            video: options.video
                ? {
                    facingMode: cameraFacingMode,
                }
                : false,
        });

        setLocalStream(stream);

        return stream;
    }

    async function setupLocalMedia(options: SetupLocalMediaOptions) {
        const stream = await getLocalStream(options);

        const peer = createPeerConnection();

        const senders = peer.getSenders();

        stream.getTracks().forEach(track => {
            const alreadyAdded = senders.some(
                sender => sender.track === track
            );

            if (!alreadyAdded) {
                peer.addTrack(track, stream);
            }
        });

        return stream;
    }

    const value = useMemo(
        () => ({
            peerConnection,

            peerConnections,
            remoteStreams,

            pendingPeerIceCandidates,

            createParticipantPeerConnection,
            closeParticipantPeerConnections,

            localStream,
            setLocalStream,

            remoteStream,
            setRemoteStream,

            createPeerConnection,
            closePeerConnection,

            getLocalStream,
            setupLocalMedia,

            connectionState,

            pendingIceCandidates,

            isMuted,
            setIsMuted,

            isCameraOff,
            setIsCameraOff,

            remoteCameraOff,
            setRemoteCameraOff,

            cameraFacingMode,
            setCameraFacingMode,
        }),
        [
            localStream,
            remoteStream,
            remoteStreams,
            connectionState,
            isMuted,
            isCameraOff,
            remoteCameraOff,
            cameraFacingMode,
            createParticipantPeerConnection,
            closeParticipantPeerConnections,
        ]
    );

    return (
        <WebRTCContext.Provider value={value}>
            {children}
        </WebRTCContext.Provider>
    );
}