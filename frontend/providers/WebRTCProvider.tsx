"use client";

import {
    createContext,
    useMemo,
    useRef,
    useState,
} from "react";

interface WebRTCContextType {
    // Existing 1-to-1 peer
    peerConnection: React.MutableRefObject<
        RTCPeerConnection | null
    >;

    // Group-call peers
    peerConnections: React.MutableRefObject<
        Map<string, RTCPeerConnection>
    >;

    remoteStreams: Map<string, MediaStream>;

    pendingPeerIceCandidates: React.MutableRefObject<
        Map<string, RTCIceCandidateInit[]>
    >;

    // Local media
    localStream: MediaStream | null;

    setLocalStream: React.Dispatch<
        React.SetStateAction<MediaStream | null>
    >;

    // Existing 1-to-1 remote media
    remoteStream: MediaStream | null;

    setRemoteStream: React.Dispatch<
        React.SetStateAction<MediaStream | null>
    >;

    // Peer creation
    createPeerConnection: () => RTCPeerConnection;

    createParticipantPeerConnection: (
        remoteUserId: string
    ) => RTCPeerConnection;

    // Cleanup
    closeParticipantPeerConnections: () => void;

    closePrimaryPeerConnection: () => void;

    closePeerConnection: () => void;

    // Local media
    getLocalStream: (
        options: SetupLocalMediaOptions
    ) => Promise<MediaStream>;

    setupLocalMedia: (
        options: SetupLocalMediaOptions
    ) => Promise<MediaStream>;

    connectionState: RTCPeerConnectionState;

    pendingIceCandidates: React.MutableRefObject<
        RTCIceCandidateInit[]
    >;

    // Local controls
    isMuted: boolean;

    setIsMuted: React.Dispatch<
        React.SetStateAction<boolean>
    >;

    isCameraOff: boolean;

    setIsCameraOff: React.Dispatch<
        React.SetStateAction<boolean>
    >;

    // Remote controls
    remoteCameraOff: boolean;

    setRemoteCameraOff: React.Dispatch<
        React.SetStateAction<boolean>
    >;

    // Camera
    cameraFacingMode:
    | "user"
    | "environment";

    setCameraFacingMode: React.Dispatch<
        React.SetStateAction<
            "user" | "environment"
        >
    >;
}

interface SetupLocalMediaOptions {
    audio: boolean;
    video: boolean;
}

export const WebRTCContext =
    createContext<WebRTCContextType | null>(
        null
    );

export function WebRTCProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    /*
     * ============================================================
     * 1-TO-1 PEER
     * ============================================================
     */

    const peerConnection =
        useRef<RTCPeerConnection | null>(
            null
        );

    /*
     * ============================================================
     * GROUP CALL PEERS
     *
     * remoteUserId -> RTCPeerConnection
     * ============================================================
     */

    const peerConnections =
        useRef<
            Map<string, RTCPeerConnection>
        >(new Map());

    /*
     * Remote streams for group participants.
     */

    const [remoteStreams, setRemoteStreams] =
        useState<Map<string, MediaStream>>(
            new Map()
        );

    /*
     * ICE candidates that arrive before
     * the peer has a remote description.
     */

    const pendingPeerIceCandidates =
        useRef<
            Map<
                string,
                RTCIceCandidateInit[]
            >
        >(new Map());

    /*
     * ============================================================
     * LOCAL MEDIA
     * ============================================================
     */

    const [localStream, setLocalStream] =
        useState<MediaStream | null>(
            null
        );

    /*
     * Remote stream for the existing
     * one-to-one call.
     */

    const [remoteStream, setRemoteStream] =
        useState<MediaStream | null>(
            null
        );

    /*
     * ============================================================
     * CONNECTION STATE
     * ============================================================
     */

    const [connectionState, setConnectionState] =
        useState<RTCPeerConnectionState>(
            "new"
        );

    /*
     * ICE candidates for the existing
     * one-to-one connection.
     */

    const pendingIceCandidates =
        useRef<RTCIceCandidateInit[]>(
            []
        );

    /*
     * ============================================================
     * CALL MEDIA STATE
     * ============================================================
     */

    const [isMuted, setIsMuted] =
        useState(false);

    const [isCameraOff, setIsCameraOff] =
        useState(false);

    const [remoteCameraOff, setRemoteCameraOff] =
        useState(false);

    const [
        cameraFacingMode,
        setCameraFacingMode,
    ] = useState<
        "user" | "environment"
    >("user");

    /*
     * ============================================================
     * CREATE PRIMARY 1-TO-1 PEER
     * ============================================================
     */

    function createPeerConnection() {
        /*
         * Reuse the existing 1-to-1 peer.
         */

        if (peerConnection.current) {
            return peerConnection.current;
        }

        const peer =
            new RTCPeerConnection({
                iceServers: [
                    {
                        urls:
                            "stun:stun.l.google.com:19302",
                    },
                ],
            });

        /*
         * Receive remote 1-to-1 stream.
         */

        peer.ontrack = (event) => {
            const stream =
                event.streams[0];

            if (!stream) {
                return;
            }

            setRemoteStream(stream);
        };

        /*
         * Track 1-to-1 connection state.
         */

        peer.onconnectionstatechange =
            () => {
                setConnectionState(
                    peer.connectionState
                );
            };

        peerConnection.current =
            peer;

        return peer;
    }

    /*
     * ============================================================
     * CREATE GROUP PARTICIPANT PEER
     * ============================================================
     */

    function createParticipantPeerConnection(
        remoteUserId: string
    ) {
        /*
         * Reuse existing connection if
         * we already have one for this user.
         */

        const existing =
            peerConnections.current.get(
                remoteUserId
            );

        if (existing) {
            return existing;
        }

        const peer =
            new RTCPeerConnection({
                iceServers: [
                    {
                        urls:
                            "stun:stun.l.google.com:19302",
                    },
                ],
            });

        /*
         * Receive this participant's
         * remote MediaStream.
         */

        peer.ontrack = (event) => {
            const stream =
                event.streams[0];

            if (!stream) {
                return;
            }

            setRemoteStreams(
                (prev) => {
                    const next =
                        new Map(prev);

                    next.set(
                        remoteUserId,
                        stream
                    );

                    return next;
                }
            );
        };

        peerConnections.current.set(
            remoteUserId,
            peer
        );

        return peer;
    }

    /*
     * ============================================================
     * CLOSE ONLY THE PRIMARY 1-TO-1 PEER
     *
     * IMPORTANT:
     *
     * This does NOT stop localStream.
     *
     * We need this during:
     *
     * 1-to-1 call
     *      ↓
     * promote to group call
     *      ↓
     * reuse microphone/camera
     * ============================================================
     */

    function closePrimaryPeerConnection() {
        /*
         * Clear pending ICE for the
         * old 1-to-1 connection.
         */

        pendingIceCandidates.current =
            [];

        /*
         * Close only the primary
         * 1-to-1 RTCPeerConnection.
         */

        peerConnection.current?.close();

        peerConnection.current =
            null;

        /*
         * We deliberately DO NOT do:
         *
         * localStream.getTracks().forEach(track => track.stop())
         *
         * because the group call will
         * reuse those tracks.
         */

        setRemoteStream(null);

        setConnectionState("closed");

        setRemoteCameraOff(false);
    }

    /*
     * ============================================================
     * CLOSE GROUP PARTICIPANT PEERS
     * ============================================================
     */

    function closeParticipantPeerConnections() {
        peerConnections.current.forEach(
            (peer) => {
                peer.close();
            }
        );

        peerConnections.current.clear();

        pendingPeerIceCandidates.current.clear();

        /*
         * Stop remote group streams.
         */

        setRemoteStreams(
            (prev) => {
                prev.forEach(
                    (stream) => {
                        stream
                            .getTracks()
                            .forEach(
                                (track) => {
                                    track.stop();
                                }
                            );
                    }
                );

                return new Map();
            }
        );
    }

    /*
     * ============================================================
     * CLOSE EVERYTHING
     *
     * Used when the entire call is finished.
     * ============================================================
     */

    function closePeerConnection() {
        /*
         * Close group peers.
         */

        closeParticipantPeerConnections();

        /*
         * Stop local media.
         */

        localStream
            ?.getTracks()
            .forEach((track) => {
                track.stop();
            });

        /*
         * Stop existing 1-to-1 remote media.
         */

        remoteStream
            ?.getTracks()
            .forEach((track) => {
                track.stop();
            });

        /*
         * Reset streams.
         */

        setLocalStream(null);

        setRemoteStream(null);

        /*
         * Clear ICE.
         */

        pendingIceCandidates.current =
            [];

        /*
         * Close primary peer.
         */

        peerConnection.current?.close();

        peerConnection.current =
            null;

        setConnectionState("closed");

        /*
         * Reset call controls.
         */

        setIsMuted(false);

        setIsCameraOff(false);

        setRemoteCameraOff(false);
    }

    /*
     * ============================================================
     * GET LOCAL MEDIA
     * ============================================================
     */

    async function getLocalStream(
        options: SetupLocalMediaOptions
    ) {
        /*
         * Reuse existing stream.
         *
         * This is important for the
         * 1-to-1 → group transition.
         */

        if (localStream) {
            return localStream;
        }

        const stream =
            await navigator.mediaDevices.getUserMedia(
                {
                    audio: options.audio,

                    video: options.video
                        ? {
                            facingMode:
                                cameraFacingMode,
                        }
                        : false,
                }
            );

        setLocalStream(stream);

        return stream;
    }

    /*
     * ============================================================
     * SETUP LOCAL MEDIA FOR 1-TO-1
     * ============================================================
     */

    async function setupLocalMedia(
        options: SetupLocalMediaOptions
    ) {
        const stream =
            await getLocalStream(
                options
            );

        const peer =
            createPeerConnection();

        /*
         * Avoid adding the same
         * MediaStreamTrack twice.
         */

        const senders =
            peer.getSenders();

        stream
            .getTracks()
            .forEach((track) => {
                const alreadyAdded =
                    senders.some(
                        (sender) =>
                            sender.track ===
                            track
                    );

                if (!alreadyAdded) {
                    peer.addTrack(
                        track,
                        stream
                    );
                }
            });

        return stream;
    }

    /*
     * ============================================================
     * CONTEXT VALUE
     * ============================================================
     */

    const value = useMemo(
        () => ({
            peerConnection,

            peerConnections,

            remoteStreams,

            pendingPeerIceCandidates,

            localStream,
            setLocalStream,

            remoteStream,
            setRemoteStream,

            createPeerConnection,

            createParticipantPeerConnection,

            closeParticipantPeerConnections,

            closePrimaryPeerConnection,

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
        ]
    );

    return (
        <WebRTCContext.Provider
            value={value}
        >
            {children}
        </WebRTCContext.Provider>
    );
}