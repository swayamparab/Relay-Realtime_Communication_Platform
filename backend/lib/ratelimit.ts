import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

export const loginRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
    prefix: "relay:login",
});

export const signupRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 m"),
    analytics: true,
    prefix: "relay:signup",
});

export const aiRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 h"),
    analytics: true,
    prefix: "relay:ai",
});