import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function askAI(
    context: string,
    question: string
) {
    const prompt = `
                        You are Relay AI, an assistant inside a chat application.

                        Answer the user's question using the conversation below.

                        Conversation:
                        ${context}

                        User's question:
                        ${question}

                        Rules:
                        - Use the conversation as your primary source.
                        - If the answer cannot be found in the conversation, say that you don't have enough information.
                        - Do not invent facts.
                        - Keep the answer concise and natural.
                    `;

    const response =
        await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: prompt,
        });

    return response.text;
}