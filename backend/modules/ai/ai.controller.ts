import { Request, Response } from "express";
import { askAI } from "./ai.service";
import { getConversationContext, getUnreadConversationContext } from "./ai-context.service";

export async function askAIController(
    req: Request,
    res: Response
) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const {
            conversationId,
            prompt,
        } = req.body;

        if (
            typeof conversationId !== "string" ||
            typeof prompt !== "string" ||
            !prompt.trim()
        ) {
            return res.status(400).json({
                message:
                    "conversationId and prompt are required.",
            });
        }

        const context =
            await getConversationContext(
                userId,
                conversationId
            );

        const stream = await askAI(
            context,
            prompt.trim()
        );

        // Tell the browser we're sending a stream
        res.setHeader(
            "Content-Type",
            "text/plain; charset=utf-8"
        );

        res.setHeader(
            "Transfer-Encoding",
            "chunked"
        );

        // Send Gemini chunks as they arrive
        for await (const chunk of stream) {
            const text = chunk.text;

            if (text) {
                // console.log("GEMINI CHUNK:", text);
                res.write(text);
            }
        }

        res.end();
    } catch (error) {
        console.error(
            "AI controller error:",
            error
        );

        if (
            error instanceof Error &&
            error.message === "Unauthorized"
        ) {
            return res.status(403).json({
                message:
                    "You are not a participant of this conversation.",
            });
        }

        if (!res.headersSent) {
            return res.status(500).json({
                message:
                    "Failed to generate AI response.",
            });
        }

        res.end();
    }
}

export async function unreadMessageSummaryController(
    req: Request,
    res: Response
) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const {
            conversationId,
            unreadSince,
        } = req.body;

        if (
            typeof conversationId !== "string" ||
            typeof unreadSince !== "string"
        ) {
            return res.status(400).json({
                message:
                    "conversationId and unreadSince are required.",
            });
        }

        const unreadContext =
            await getUnreadConversationContext(
                userId,
                conversationId,
                unreadSince
            );

        if (!unreadContext.trim()) {
            return res.status(400).json({
                message:
                    "There are no unread messages to summarize.",
            });
        }

        const prompt = `
                        Summarize the unread messages from this conversation.

                        Include:
                        - Main topics discussed
                        - Important decisions
                        - Action items, if any

                        Keep the summary concise and easy to read.
                        Use short headings and bullet points.

                        Only use information present in the messages.
                        Do not invent or assume information.
                        `;

        const stream = await askAI(
            unreadContext,
            prompt
        );

        res.setHeader(
            "Content-Type",
            "text/plain; charset=utf-8"
        );

        res.setHeader(
            "Transfer-Encoding",
            "chunked"
        );

        for await (const chunk of stream) {
            const text = chunk.text;

            if (text) {
                res.write(text);
            }
        }

        res.end();
    } catch (error) {
        console.error(
            "Unread message summary error:",
            error
        );

        if (
            error instanceof Error &&
            error.message === "Unauthorized"
        ) {
            return res.status(403).json({
                message:
                    "You are not a participant of this conversation.",
            });
        }

        if (!res.headersSent) {
            return res.status(500).json({
                message:
                    "Failed to generate unread message summary.",
            });
        }

        res.end();
    }
}