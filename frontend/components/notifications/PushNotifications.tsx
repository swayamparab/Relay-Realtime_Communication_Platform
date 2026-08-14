"use client";

import { usePushNotifications } from "@/hooks/notification/usePushNotifications";

export function PushNotifications() {
    usePushNotifications();

    return null;
}