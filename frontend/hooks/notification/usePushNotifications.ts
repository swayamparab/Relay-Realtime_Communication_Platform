"use client";

import { useEffect } from "react";

import { subscribeToPush } from "@/services/push-notifications";

export function usePushNotifications() {
    useEffect(() => {

        async function setupPushNotifications() {
            if (
                !("serviceWorker" in navigator) ||
                !("PushManager" in window) ||
                !("Notification" in window)
            ) {
                return;
            }

            try {
                const registration =
                    await navigator.serviceWorker.register(
                        "/sw.js"
                    );

                console.log(
                    "Service worker registered:",
                    registration
                );

                if (
                    Notification.permission ===
                    "denied"
                ) {
                    return;
                }

                const permission =
                    await Notification.requestPermission();

                if (permission !== "granted") {
                    return;
                }

                const existingSubscription =
                    await registration.pushManager.getSubscription();

                if (existingSubscription) {
                    await subscribeToPush(
                        existingSubscription
                    );

                    return;
                }

                const publicKey =
                    process.env
                        .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

                if (!publicKey) {
                    console.error(
                        "VAPID public key is missing."
                    );

                    return;
                }

                const subscription =
                    await registration.pushManager.subscribe(
                        {
                            userVisibleOnly: true,
                            applicationServerKey:
                                urlBase64ToUint8Array(
                                    publicKey
                                ),
                        }
                    );

                await subscribeToPush(
                    subscription
                );

                console.log(
                    "Push subscription saved."
                );
            } catch (error) {
                console.error(
                    "Push notification setup failed:",
                    error
                );
            }
        }

        setupPushNotifications();
    }, []);
}

function urlBase64ToUint8Array(
    base64String: string
) {
    const padding =
        "=".repeat(
            (4 -
                (base64String.length % 4)) %
            4
        );

    const base64 =
        (
            base64String +
            padding
        )
            .replace(/-/g, "+")
            .replace(/_/g, "/");

    const rawData =
        window.atob(base64);

    return Uint8Array.from(
        [...rawData].map(
            (char) => char.charCodeAt(0)
        )
    );
}