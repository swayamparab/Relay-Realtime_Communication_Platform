"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function TestPushButton() {
    const [isSending, setIsSending] =
        useState(false);

    async function handleTest() {
        try {
            setIsSending(true);

            const response =
                await api.post(
                    "/push-notifications/test"
                );

            console.log(
                "Push test response:",
                response.data
            );
        } catch (error) {
            console.error(
                "Push test failed:",
                error
            );
        } finally {
            setIsSending(false);
        }
    }

    return (
        <Button
            type="button"
            onClick={handleTest}
            disabled={isSending}
            className="bg-blue-600 text-white hover:bg-blue-700"
        >
            {isSending
                ? "Sending..."
                : "Test Notification"}
        </Button>
    );
}