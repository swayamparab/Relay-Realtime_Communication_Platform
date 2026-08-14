"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useCurrentUser } from "@/hooks/user/useCurrentUser";
import { useSocket } from "@/hooks/useSocket";

import { PushNotifications } from "@/components/notifications/PushNotifications";

export default function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    const {
        data,
        isLoading,
        isError,
    } = useCurrentUser();

    const { socket } = useSocket();

    useEffect(() => {
        if (!isLoading && isError) {
            router.replace("/login");
        }
    }, [
        isLoading,
        isError,
        router,
    ]);

    useEffect(() => {
        if (data && !socket.connected) {
            socket.connect();
        }

        return () => {
            socket.disconnect();
        };
    }, [data, socket]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                Loading...
            </div>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <div className="flex h-[100dvh] flex-col overflow-hidden">
            <PushNotifications />

            {children}
        </div>
    );
}