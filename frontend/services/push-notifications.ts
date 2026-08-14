import { api } from "@/lib/api";

export async function subscribeToPush(
    subscription: PushSubscription
) {
    const json = subscription.toJSON();

    if (
        !json.endpoint ||
        !json.keys?.p256dh ||
        !json.keys?.auth
    ) {
        throw new Error(
            "Invalid push subscription"
        );
    }

    const response =
        await api.post(
            "/push-notifications/subscribe",
            {
                endpoint: json.endpoint,
                keys: {
                    p256dh: json.keys.p256dh,
                    auth: json.keys.auth,
                },
            }
        );

    return response.data;
}