import { Request, Response } from "express";
import { askAI } from "./ai.service";
import { getConversationContext } from "./ai-context.service";

export async function askAIController(
    req: Request,
    res: Response
) {
    try {

        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized"
            })
        }

        const { conversationId, prompt } = req.body;

        if (
            typeof conversationId !== "string" || typeof prompt !== "string" || !prompt.trim()) {
            return res.status(400).json({
                message: "conversationId and prompt are required.",
            });
        }

        const context = await getConversationContext(userId, conversationId);

        const response = await askAI(context, prompt.trim());

        return res.json({
            response
        });

    }
    catch (error) {
        console.error(
            "AI controller error:",
            error
        );

        if (
            error instanceof Error &&
            error.message === "Unauthorized"
        ) {
            return res.status(403).json({
                message: "You are not a participant of this conversation.",
            });
        }

        return res.status(500).json({
            message:
                "Failed to generate AI response.",
        });
    }

}