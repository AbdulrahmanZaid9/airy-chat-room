import { createServerFn } from "@tanstack/react-start";

type ChatMessage = { role: "user" | "assistant"; content: string };

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((data: { messages: ChatMessage[] }) => {
    if (!data || !Array.isArray(data.messages)) {
      throw new Error("messages must be an array");
    }
    if (data.messages.length === 0) {
      throw new Error("messages cannot be empty");
    }
    if (data.messages.length > 100) {
      throw new Error("Too many messages");
    }
    for (const m of data.messages) {
      if (m.role !== "user" && m.role !== "assistant") {
        throw new Error("Invalid role");
      }
      if (typeof m.content !== "string" || m.content.length === 0) {
        throw new Error("Invalid content");
      }
      if (m.content.length > 8000) {
        throw new Error("Message too long");
      }
    }
    return data;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { reply: "", error: "AI service is not configured." };
    }

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "You are a friendly, concise AI assistant. Respond clearly using markdown when helpful.",
            },
            ...data.messages,
          ],
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          return { reply: "", error: "Too many requests. Please try again in a moment." };
        }
        if (res.status === 402) {
          return { reply: "", error: "AI credits exhausted. Please add funds in Settings." };
        }
        const text = await res.text();
        console.error("AI gateway error", res.status, text);
        return { reply: "", error: "The AI service returned an error." };
      }

      const json = await res.json();
      const reply = json?.choices?.[0]?.message?.content;
      if (!reply || typeof reply !== "string") {
        return { reply: "", error: "Received an empty response. Please try again." };
      }
      return { reply, error: null };
    } catch (err) {
      console.error("Chat handler failed", err);
      return { reply: "", error: "Network error. Please check your connection." };
    }
  });
