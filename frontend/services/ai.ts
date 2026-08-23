export async function askAI(
    conversationId: string,
    prompt: string,
    onChunk: (chunk: string) => void
) {
    const response = await fetch("/api/ai/ask",
        {
            method: "POST",
            credentials: "include",

            headers: {
                "Content-Type": "application/json",
            },

            body: JSON.stringify({
                conversationId,
                prompt,
            }),
        }
    );

    if (!response.ok) {
        let message =
            "Failed to generate AI response.";

        try {
            const data =
                await response.json();

            message =
                data.message ?? message;
        } catch {
            // Ignore JSON parsing failure
        }

        throw new Error(message);
    }

    if (!response.body) {
        throw new Error(
            "AI response stream is unavailable."
        );
    }

    const reader =
        response.body.getReader();

    const decoder =
        new TextDecoder();

    while (true) {
        const { value, done } =
            await reader.read();

        if (done) {
            break;
        }

        const chunk =
            decoder.decode(value, {
                stream: true,
            });

        if (chunk) {
            // console.log("AI CHUNK:", chunk);
            onChunk(chunk);
        }
    }

    const remaining =
        decoder.decode();

    if (remaining) {
        onChunk(remaining);
    }
}