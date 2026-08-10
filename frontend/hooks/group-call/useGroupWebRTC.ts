"use client";

import { useContext } from "react";

import {
    GroupWebRTCContext,
} from "@/providers/GroupWebRTCProvider";

export function useGroupWebRTC() {
    const context =
        useContext(GroupWebRTCContext);

    if (!context) {
        throw new Error(
            "useGroupWebRTC must be used inside GroupWebRTCProvider"
        );
    }

    return context;
}