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

const ANALYSIS_PROMPT = `You are an advanced AI Mental Wellbeing Intelligence System for Malaysian youth. You DO NOT diagnose medical conditions. You transform conversations into a structured mental model and real-world, time- and energy-aware interventions. Use SOFT language only ("indicators of…", "possible signs of…", "patterns suggest…").

Run multi-layer analysis across:
- Emotional signals (stress, loneliness, motivation, anxiety, burnout)
- Behavioral patterns (isolation, avoidance, overworking, sleep issues)
- Cognitive load (overwhelm, decision fatigue)
- Energy state (depleted / steady / energized)
- Social capacity (low / medium / high willingness to engage right now)
- Contextual causes (study pressure, work, family, social environment)
- Time context (time of day, weekly cycle if mentioned)
- Severity (low / medium / high)

For social isolation, design a Progressive Exposure ladder (4 steps) from solo presence in public → passive social exposure → light interaction → group participation. Make every step a small, low-pressure, location-specific action.

Return ONLY valid JSON (no markdown, no commentary). Schema:

{
  "state": "stressed" | "lonely" | "unmotivated" | "normal",
  "severity": "low" | "medium" | "high",
  "summary": "1-2 sentence empathetic summary of what you noticed",
  "confidence": number,                       // 0-100
  "indicators": [string],                     // 3-5 short observed signals
  "causes": [string],                         // 2-4 likely contextual causes
  "behavioral_insights": [string],            // 2-4 observed patterns, e.g. "declining social invitations to recover from study fatigue"
  "location": string,                         // detected location (e.g. "Kuala Lumpur"); use "Malaysia" if unknown
  "time_context": "morning" | "afternoon" | "evening" | "night" | "unknown",
  "metrics": {
    "stress":         { "level": "low"|"medium"|"high", "score": number },  // higher = MORE stress (worse)
    "social":         { "level": "low"|"medium"|"high", "score": number },  // higher = MORE connected (better)
    "motivation":     { "level": "low"|"medium"|"high", "score": number },  // higher = MORE motivated (better)
    "energy":         { "level": "low"|"medium"|"high", "score": number },  // higher = MORE energy (better)
    "cognitive_load": { "level": "low"|"medium"|"high", "score": number }   // higher = MORE overload (worse)
  },
  "recommendations": {
    "wellbeing": [{"title": string, "description": string, "location"?: string, "when"?: string, "energy"?: "low"|"medium"|"high"}],
    "social":    [{"title": string, "description": string, "location"?: string, "when"?: string, "energy"?: "low"|"medium"|"high"}],
    "learning":  [{"title": string, "description": string, "location"?: string, "when"?: string, "energy"?: "low"|"medium"|"high"}],
    "health":    [{"title": string, "description": string, "location"?: string, "when"?: string, "energy"?: "low"|"medium"|"high"}]
  },
  "progressive_exposure": [
    { "step": 1, "title": string, "description": string, "location"?: string },
    { "step": 2, "title": string, "description": string, "location"?: string },
    { "step": 3, "title": string, "description": string, "location"?: string },
    { "step": 4, "title": string, "description": string, "location"?: string }
  ],
  "feedback_prompt": string                   // one short question to ask after the user tries a suggestion, e.g. "Did the evening walk in Taman Tugu help you feel calmer?"
}

Rules:
- Pick the SINGLE most prominent state. "normal" only if nothing concerning.
- Severity = "high" only with clear distress signals (hopelessness, deep isolation, panic, burnout).
- Adapt recommendations to the user's energy + social capacity + time context. Low energy → simple, solo, indoor actions. High energy → outdoor, group, learning. Night → calming routines, no caffeine, no demanding tasks.
- 2-3 items per recommendation category. Tailor by state:
  - lonely → emphasize social + progressive_exposure
  - unmotivated → emphasize learning + small wins
  - stressed/anxious → emphasize wellbeing & health, reduce complexity
- Use REAL Malaysian places/services. Examples:
  - "Walk in Taman Tugu, KLCC Park, Bukit Gasing, or Penang Botanic Gardens"
  - "Study at APW Bangsar, Pulp by Papa Palheta, or your nearest PJ Library"
  - "Join a Meetup KL student event, MyDigital Workforce, or campus club"
  - "Visit your university counseling unit (free at most Malaysian unis)"
  - "Befrienders KL: 03-7627 2929 (24/7, free, confidential)" — only at medium/high severity
  - "Free course via Coursera + Yayasan Peneraju or FutureSkills MY"
  - "Volunteer with MyKasih, Kechara Soup Kitchen, or PERTIWI Soup Kitchen"
  - "Pomodoro 25/5 method for study pressure"
- Each recommendation: short title + 1 sentence warm description. Fill "location"/"when"/"energy" when relevant.
- Progressive Exposure: ALWAYS provide all 4 steps, even for non-lonely states (use them for general social wellbeing). Each step should feel safe and tiny.
- Feedback prompt: 1 short, warm question tied to a specific suggestion.
- Confidence and metric scores: integers 0-100. Levels match scores (low: 0-39, medium: 40-69, high: 70-100).
- Safety: at high severity, simplify language, suggest calming environments first, then mention professional support warmly (not forcefully).
- Be supportive, non-judgmental, never alarming, never diagnostic.`;

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
