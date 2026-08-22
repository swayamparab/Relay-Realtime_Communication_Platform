import { Request, Response, NextFunction } from "express";
import { aiRateLimit, loginRateLimit, signupRateLimit } from "../lib/ratelimit";

export async function loginLimiter(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const ip =
        req.ip ??
        req.headers["x-forwarded-for"]?.toString() ??
        "unknown";

    const { success } = await loginRateLimit.limit(ip);

    if (!success) {
        return res.status(429).json({
            success: false,
            message:
                "Too many login attempts. Please try again later.",
        });
    }

    next();
}

export async function signupLimiter(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const ip =
        req.ip ??
        req.headers["x-forwarded-for"]?.toString() ??
        "unknown";

    const { success } = await signupRateLimit.limit(ip);

    if (!success) {
        return res.status(429).json({
            success: false,
            message:
                "Too many signup attempts. Please try again later.",
        });
    }

    next();
}

export async function aiLimiter(
    req: Request,
    res: Response,
    next: NextFunction
) {

    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }

    const { success } = await aiRateLimit.limit(userId);

    if (!success) {
        return res.status(429).json({
            success: false,
            message:
                "AI request limit reached. Please try again later.",
        });
    }

    next()
}