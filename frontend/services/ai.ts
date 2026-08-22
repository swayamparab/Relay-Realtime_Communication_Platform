import { api } from "@/lib/api";

export async function askAI(conversationId:string, prompt: string) {
    
    const response = await api.post("/ai/ask", {
        conversationId,
        prompt
    });

    return response.data;
}