"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendHorizontal, Loader2, Mic, Trash2, Check } from "lucide-react";
import { Image as ImageIcon } from "lucide-react";

import { useSocket } from "@/hooks/useSocket";
import { useUploadAttachment } from "@/hooks/useUploadAttachment";

import type { Message } from "@/types/message";

import { generateWaveform } from "@/lib/generateWaveform";

interface MessageInputProps {
    replyingTo: Message | null;
    clearReply: () => void;
}

export default function MessageInput({
    replyingTo,
    clearReply
}: MessageInputProps) {
    const [content, setContent] = useState("");

    const { conversationId } = useParams<{ conversationId: string; }>();

    const { socket } = useSocket();

    const isTypingRef = useRef(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const uploadImageMutation = useUploadAttachment();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isUploading, setIsUploading] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const shouldUploadRef = useRef(true);

    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const [liveWaveform, setLiveWaveform] = useState<number[]>(
        Array(24).fill(4)
    );

    const [recordingTime, setRecordingTime] = useState(0);

    useEffect(() => {
        if (!isRecording) {
            setRecordingTime(0);
            return;
        }

        const interval = setInterval(() => {
            setRecordingTime((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isRecording]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;

        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    //focus input box
    const inputRef = useRef<HTMLInputElement>(null);
    //when a conversation is opened or reply to message is initiated only for desktop
    useEffect(() => {
        const isDesktop = window.matchMedia("(pointer: fine)").matches;

        if (isDesktop) {
            inputRef.current?.focus({
                preventScroll: true,
            });
        }
    }, [conversationId, replyingTo]);

    function getSupportedAudioMimeType() {

        if (!window.MediaRecorder) {
            throw new Error("MediaRecorder is not supported in this browser.");
        }

        const mimeTypes = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/ogg;codecs=opus",
            "audio/ogg",
            "audio/mp4",
        ];

        return (
            mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) ?? ""
        );
    }
    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

            const audioContext = new AudioContext();

            const source =
                audioContext.createMediaStreamSource(stream);

            const analyser =
                audioContext.createAnalyser();

            analyser.fftSize = 256;

            source.connect(analyser);

            analyserRef.current = analyser;

            const mimeType = getSupportedAudioMimeType();

            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);

            streamRef.current = stream;

            mediaRecorderRef.current = recorder;

            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            shouldUploadRef.current = true;

            recorder.start(1000);

            const data = new Uint8Array(
                analyser.frequencyBinCount
            );

            const updateWaveform = () => {
                analyser.getByteFrequencyData(data);

                const bars = 24;
                const chunk = Math.floor(data.length / bars);

                const wave: number[] = [];

                for (let i = 0; i < bars; i++) {
                    let sum = 0;

                    for (
                        let j = i * chunk;
                        j < (i + 1) * chunk;
                        j++
                    ) {
                        sum += data[j];
                    }

                    wave.push(
                        Math.max(
                            4,
                            Math.round((sum / chunk / 255) * 24)
                        )
                    );
                }

                setLiveWaveform(wave);

                animationFrameRef.current =
                    requestAnimationFrame(updateWaveform);
            };

            updateWaveform();

            setIsRecording(true);
        } catch (error) {
            console.error(error);
        }
    }

    function cancelRecording() {

        shouldUploadRef.current = false;

        mediaRecorderRef.current?.stop();

        streamRef.current?.getTracks().forEach((track) => track.stop());

        mediaRecorderRef.current = null;
        streamRef.current = null;
        audioChunksRef.current = [];

        setRecordingTime(0);
        setIsRecording(false);

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        setLiveWaveform(Array(24).fill(4));
    }

    async function stopRecording() {
        const recorder = mediaRecorderRef.current;

        if (!recorder) return;

        recorder.onstop = async () => {

            if (!shouldUploadRef.current) {
                return;
            }

            const audioBlob = new Blob(audioChunksRef.current, {
                type: recorder.mimeType,
            });

            const waveform = await generateWaveform(audioBlob);

            function getExtension(mimeType: string) {
                if (mimeType.includes("webm")) return "webm";
                if (mimeType.includes("ogg")) return "ogg";
                if (mimeType.includes("mp4")) return "m4a";

                return "webm";
            }

            const extension = getExtension(audioBlob.type);

            const audioFile = new File(
                [audioBlob],
                `voice-${Date.now()}.${extension}`,
                {
                    type: audioBlob.type,
                }
            );

            const upload = await uploadImageMutation.mutateAsync(audioFile);

            socket.emit(
                "send_image",
                {
                    conversationId,
                    type: "voice",

                    attachmentUrl: upload.attachmentUrl,
                    attachmentPublicId: upload.attachmentPublicId,
                    attachmentMimeType: upload.attachmentMimeType,
                    attachmentName: audioFile.name,
                    attachmentSize: upload.attachmentSize,

                    duration: recordingTime,
                    waveform,

                    replyToMessageId: replyingTo?.id,
                },
                (response: {
                    success: true,
                    message?: string
                }) => {
                    if (!response.success) {
                        console.error(response.message);
                        return;
                    }

                    clearReply();
                }
            );

            // Stop using the microphone
            streamRef.current?.getTracks().forEach((track) => track.stop());

            mediaRecorderRef.current = null;
            streamRef.current = null;
            audioChunksRef.current = [];

            setIsRecording(false);
        };

        recorder.stop();

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        setLiveWaveform(Array(24).fill(4));
    }

    function handleSend() {
        const message = content.trim();

        if (!message) {
            return;
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }

        socket.emit("send_message",
            {
                conversationId,
                content: message,
                replyToMessageId: replyingTo?.id,
            },
            (response: {
                success: boolean;
                message?: string;
            }) => {
                if (!response.success) {
                    console.error(response.message);
                    return;
                }

                setContent("");
                clearReply();

                socket.emit("stop_typing", {
                    conversationId,
                });
                isTypingRef.current = false;
            }
        );
    }

    async function handleImageSelect(
        e: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = e.target.files?.[0];

        if (!file) return;

        let messageType: "image" | "video" | "file";

        if (file.type.startsWith("image/")) {
            messageType = "image";
        } else if (file.type.startsWith("video/")) {
            messageType = "video";
        } else {
            messageType = "file";
        }

        if (!file) return;

        try {
            setIsUploading(true);

            const upload = await uploadImageMutation.mutateAsync(file);

            socket.emit(
                "send_image",
                {
                    conversationId,
                    type: messageType,
                    attachmentUrl: upload.attachmentUrl,
                    attachmentPublicId: upload.attachmentPublicId,
                    attachmentMimeType: upload.attachmentMimeType,
                    attachmentName: file.name,
                    attachmentSize: upload.attachmentSize,
                    replyToMessageId: replyingTo?.id,
                },
                (response: {
                    success: boolean;
                    message?: string;
                }) => {
                    if (!response.success) {
                        console.error(response.message);
                        return;
                    }

                    clearReply();

                    socket.emit("stop_typing", {
                        conversationId,
                    });

                    isTypingRef.current = false;

                    if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                        typingTimeoutRef.current = null;
                    }
                }
            );
        } catch (error) {
            console.error(error);
        } finally {
            setIsUploading(false);
            e.target.value = "";
        }
    }

    //clean up timeout when user switches
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }

            if (socket.connected && isTypingRef.current) {
                socket.emit("stop_typing", {
                    conversationId,
                });
            }
        };
    }, [conversationId, socket]);

    return (
        <div className="bg-slate-950/90 px-5 py-4 backdrop-blur-md">
            {replyingTo && (
                <div className="mb-3 rounded-xl border border-slate-800 bg-slate-900 p-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 border-l-4 border-blue-500 pl-3">
                            <p className="text-xs font-semibold text-blue-400">
                                Replying to {replyingTo.sender.username}
                            </p>

                            <p className="truncate text-sm text-slate-300">
                                {replyingTo.content}
                            </p>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={clearReply}
                        >
                            ✕
                        </Button>
                    </div>
                </div>
            )}
            <div
                className="
                        flex items-center
                        rounded-full
                        bg-slate-900
                        pl-3
                        pr-1.5
                        shadow-lg
                        ring-1 ring-slate-800/70
                    "
            >
                <input
                    onChange={handleImageSelect}
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                    className="hidden"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                >
                    {isUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <ImageIcon className="h-5 w-5" />
                    )}
                </Button>
                <Input
                    ref={inputRef}
                    value={content}
                    onChange={(e) => {
                        setContent(e.target.value);

                        if (!socket.connected) return;

                        if (!isTypingRef.current) {
                            socket.emit("typing", {
                                conversationId,
                            });

                            isTypingRef.current = true;
                        }

                        if (typingTimeoutRef.current) {
                            clearTimeout(typingTimeoutRef.current);
                        }

                        typingTimeoutRef.current = setTimeout(() => {
                            socket.emit("stop_typing", {
                                conversationId,
                            });

                            isTypingRef.current = false;
                        }, 1000);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSend();
                        }
                        if (e.key === "Escape" && replyingTo) {
                            clearReply();
                            return;
                        }
                    }}
                    placeholder="Type a message..."
                    className="
                        h-12
                        flex-1
                        border-0
                        bg-transparent
                        px-2
                        text-[15px]
                        text-white
                        placeholder:text-slate-500
                        shadow-none
                        focus-visible:ring-0
                        focus-visible:ring-offset-0
                    "
                />

                {!isRecording ? (
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={startRecording}
                        className="mr-2 h-10 w-10 rounded-full"
                    >
                        <Mic className="h-5 w-5" />
                    </Button>
                ) : (
                    <div className="flex flex-1 items-center justify-between px-3">
                        <div className="flex items-center gap-3">
                            <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />

                            <div className="flex h-8 items-end gap-[2px]">
                                {liveWaveform.map((h, i) => (
                                    <div
                                        key={i}
                                        className="w-[3px] rounded-full bg-red-500"
                                        style={{
                                            height: `${h}px`,
                                        }}
                                    />
                                ))}
                            </div>

                            <span className="font-mono text-sm text-muted-foreground">
                                {formatTime(recordingTime)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={cancelRecording}
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>

                            <Button
                                size="icon"
                                onClick={stopRecording}
                                className="rounded-full"
                            >
                                <Check className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                )}
                <Button
                    size="icon"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={handleSend}
                    disabled={!content.trim() || isRecording}
                    className="
                        h-10
                        w-10
                        rounded-full
                        bg-gradient-to-br
                        from-blue-500
                        to-blue-600
                        shadow-md
                        transition-all duration-200
                        hover:scale-105
                        hover:from-blue-400
                        hover:to-blue-500
                        active:scale-95
                        disabled:scale-100
                        disabled:bg-slate-700
                        disabled:from-slate-700
                        disabled:to-slate-700
                    "
                >
                    <SendHorizontal className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}