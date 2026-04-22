import { createServerFn } from "@tanstack/react-start";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are YouthBridge Connect, a warm and empathetic AI companion for youth in Malaysia.
Your job is to gently chat with the user, ask thoughtful follow-up questions, and continuously assess their emotional state.
Look for signs of: stress, loneliness, low motivation, or anxiety.

Guidelines:
- Be warm, non-judgmental, and supportive.
- Ask one short question at a time to learn about how they feel, their daily life, social connections, studies/work, and health.
- Validate emotions, then gently probe deeper.
- Keep replies concise (2-4 sentences). Use simple language. You may use light markdown.
- Never diagnose. Encourage professional support when needed.
- After ~4-6 exchanges, you may suggest the user tap "Finish & Analyze" to see their personalized dashboard.`;

const ANALYSIS_PROMPT = `You are an expert wellbeing analyst for Malaysian youth. Based on the conversation, produce a STRICT JSON analysis.
Return ONLY valid JSON (no markdown, no commentary). Schema:

{
  "state": "stressed" | "lonely" | "unmotivated" | "normal",
  "severity": "low" | "medium" | "high",
  "summary": "1-2 sentence empathetic summary of what you noticed",
  "recommendations": {
    "wellbeing": [{"title": string, "description": string}],
    "social": [{"title": string, "description": string}],
    "learning": [{"title": string, "description": string}],
    "health": [{"title": string, "description": string}]
  }
}

Rules:
- Pick the SINGLE most prominent state. If nothing concerning, use "normal".
- Severity = "high" only if there are clear distress signals (hopelessness, isolation, panic, burnout).
- Provide 2-3 items per category. ALL recommendations MUST be realistic for Malaysia (Kuala Lumpur, Penang, Johor Bahru, etc.).
- Use real-style suggestions: e.g., "Visit your university counseling unit (most Malaysian unis offer free sessions)", "Join a Meetup KL student event", "Try Befrienders KL (03-7627 2929) for a free listening ear", "Take a free Coursera course via Yayasan Peneraju", "Walk in Taman Tugu or KLCC Park for 20 min", "Volunteer with MyKasih or Kechara Soup Kitchen".
- Tailor by state: lonely→emphasize social; unmotivated→emphasize learning; stressed/anxious→emphasize health & wellbeing.
- Tone in descriptions: warm, actionable, 1 sentence each.`;

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((data: { messages: ChatMessage[]; mode?: "chat" | "analyze" }) => {
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
    return { messages: data.messages, mode: data.mode ?? "chat" };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { reply: "", analysis: null, error: "AI service is not configured." };
    }

    const isAnalyze = data.mode === "analyze";

    try {
      const body: Record<string, unknown> = {
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: isAnalyze ? ANALYSIS_PROMPT : SYSTEM_PROMPT },
          ...data.messages,
          ...(isAnalyze
            ? [
                {
                  role: "user" as const,
                  content:
                    "Now produce the final JSON analysis based on our conversation. Output ONLY the JSON object.",
                },
              ]
            : []),
        ],
      };

      if (isAnalyze) {
        body.response_format = { type: "json_object" };
      }

      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        if (res.status === 429) {
          return {
            reply: "",
            analysis: null,
            error: "Too many requests. Please try again in a moment.",
          };
        }
        if (res.status === 402) {
          return {
            reply: "",
            analysis: null,
            error: "AI credits exhausted. Please add funds in Settings.",
          };
        }
        const text = await res.text();
        console.error("AI gateway error", res.status, text);
        return { reply: "", analysis: null, error: "The AI service returned an error." };
      }

      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content;
      if (!content || typeof content !== "string") {
        return {
          reply: "",
          analysis: null,
          error: "Received an empty response. Please try again.",
        };
      }

      if (isAnalyze) {
        try {
          // Strip potential code fences just in case.
          const cleaned = content
            .trim()
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/i, "");
          const analysis = JSON.parse(cleaned);
          return { reply: "", analysis, error: null };
        } catch (e) {
          console.error("Failed to parse analysis JSON", e, content);
          return { reply: "", analysis: null, error: "Could not parse analysis." };
        }
      }

      return { reply: content, analysis: null, error: null };
    } catch (err) {
      console.error("Chat handler failed", err);
      return { reply: "", analysis: null, error: "Network error. Please check your connection." };
    }
  });
