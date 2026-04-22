import { createServerFn } from "@tanstack/react-start";

type ChatMessage = { role: "user" | "assistant"; content: string };

type UserContext = {
  mood: string;
  energy: string;
  time: string;
  sessionCount: number;
};

const SYSTEM_PROMPT = `You are YouthBridge, a warm and emotionally intelligent AI companion for students and young people in Malaysia.

Your role is to have a natural, caring conversation while quietly building a complete picture of the user's wellbeing. You are NOT a therapist — you are a thoughtful friend who listens deeply.

CONTEXT ABOUT THIS USER:

{{CONTEXT_BLOCK}}

YOUR CONVERSATION GOAL:

By the end of the chat, you must have gathered enough signal across these 5 dimensions:

1. EMOTIONAL STATE — How are they feeling right now? Stress, sadness, numbness, anxiety?

2. SOCIAL LIFE — Do they feel connected or isolated? When did they last have a meaningful interaction?

3. MOTIVATION & PURPOSE — Are they engaged with studies or work? Does life feel meaningful?

4. ENERGY & SLEEP — How is their physical state? Exhausted, restless, okay?

5. ENVIRONMENT & PRESSURE — What external stressors exist? Family, exams, finances, deadlines?

CONVERSATION RULES:

- Ask only ONE question per message. Never stack two questions.

- Always acknowledge what they said before asking the next thing. Validation first, then curiosity.

- Move naturally between dimensions — never make it feel like a survey.

- Use simple, warm, conversational language.

- Keep each reply to 2–4 sentences maximum.

- Never use the words: diagnose, disorder, condition, symptoms, mental illness.

- If significant distress is present, mention once warmly that a counselor or trusted adult can help.

- After 5–7 exchanges, suggest the user tap "Finish & Analyze" to see their personalized dashboard.

TONE: Calm. Unhurried. Genuinely curious. Like a close friend who actually listens.`;

const ANALYSIS_PROMPT = `You are the YouthBridge Wellbeing Intelligence Engine. Transform the following conversation into a structured, honest, and actionable wellbeing report.

CONTEXT ABOUT THIS USER:

{{CONTEXT_BLOCK}}

PREVIOUS SESSION FEEDBACK:

{{FEEDBACK_BLOCK}}

NON-NEGOTIABLE RULES:

- You do NOT diagnose medical or psychiatric conditions.

- Use soft, observation-based language only: "patterns suggest...", "indicators of...", "the conversation reflects..."

- Never use: depression, anxiety disorder, ADHD, bipolar, or any DSM label.

- Severity "high" is reserved for clear crisis signals: hopelessness, complete withdrawal, inability to function.

YOUR ANALYSIS PROCESS (reason step by step before writing JSON):

1. Identify the 2–3 most emotionally significant things the user said.

2. Assess each of the 5 wellbeing dimensions independently.

3. Identify the PRIMARY state and any meaningful SECONDARY state if present.

4. Write a reasoning sentence that references specific things said.

5. Infer contextual causes from what was mentioned.

6. Design recommendations that match the user's current energy and time of day.

7. Build a 4-step progressive social exposure ladder appropriate to their state.

Return ONLY valid JSON. No markdown. No explanation outside the JSON.

{

  "primary_state": "stressed" | "lonely" | "unmotivated" | "overwhelmed" | "normal",

  "secondary_state": "stressed" | "lonely" | "unmotivated" | "overwhelmed" | "normal" | null,

  "severity": "low" | "medium" | "high",

  "summary": "2–3 sentence empathetic summary written directly to the user using 'you'.",

  "reasoning": "1–2 sentences explaining WHY you assigned this state and severity, referencing specific things said.",

  "confidence": number,

  "indicators": ["string — a brief specific signal observed in the conversation"],

  "causes": ["string — a likely contextual cause inferred from what was shared"],

  "behavioral_insights": ["string — an observed pattern, e.g. 'avoiding social plans to manage energy after long study sessions'"],

  "location": "string — city or Malaysia if unknown",

  "time_context": "morning" | "afternoon" | "evening" | "night" | "unknown",

  "metrics": {

    "stress":         { "level": "low"|"medium"|"high", "score": 0-100 },

    "social":         { "level": "low"|"medium"|"high", "score": 0-100 },

    "motivation":     { "level": "low"|"medium"|"high", "score": 0-100 },

    "energy":         { "level": "low"|"medium"|"high", "score": 0-100 },

    "cognitive_load": { "level": "low"|"medium"|"high", "score": 0-100 }

  },

  "recommendations": {

    "wellbeing": [{"title":"string","description":"string","location":"string|omit","when":"string|omit","energy":"low"|"medium"|"high"|omit}],

    "social":    [{"title":"string","description":"string","location":"string|omit","when":"string|omit","energy":"low"|"medium"|"high"|omit}],

    "learning":  [{"title":"string","description":"string","location":"string|omit","when":"string|omit","energy":"low"|"medium"|"high"|omit}],

    "health":    [{"title":"string","description":"string","location":"string|omit","when":"string|omit","energy":"low"|"medium"|"high"|omit}]

  },

  "progressive_exposure": [

    {"step":1,"title":"string","description":"string","location":"string|omit"},

    {"step":2,"title":"string","description":"string","location":"string|omit"},

    {"step":3,"title":"string","description":"string","location":"string|omit"},

    {"step":4,"title":"string","description":"string","location":"string|omit"}

  ],

  "feedback_prompt": "string — one warm specific question to ask after they try a suggestion"

}

SCORING RULES:

- stress/cognitive_load: 0=none, 100=extreme. Higher = worse.

- social/motivation/energy: 0=depleted, 100=thriving. Higher = better.

- Levels: low=0–39, medium=40–69, high=70–100.

- confidence: 40–55 if conversation was brief. 65–80 if moderate depth. 80–90 if rich detail. Never exceed 92.

RECOMMENDATION RULES:

- 2–3 items per category maximum.

- Low energy user → solo, quiet, low-effort actions only.

- Night time → calming routines only, no stimulating activities.

- Use REAL Malaysian locations:

  Parks: Taman Tugu, KLCC Park, Bukit Gasing, Perdana Botanical Garden, Penang Botanic Gardens

  Study spots: APW Bangsar, Pulp by Papa Palheta, The Owls Cafe, nearest public library

  Community: Meetup KL, campus clubs, MyDigital Workforce, Kechara Soup Kitchen, MyKasih

  Learning: Coursera + Yayasan Peneraju, FutureSkills MY, OpenLearning

  Support: University counseling unit. At medium/high severity: Befrienders KL 03-7627 2929

STATE-SPECIFIC EMPHASIS:

- stressed/overwhelmed → wellbeing and health first; simplify everything

- lonely → heavy social recommendations and progressive exposure

- unmotivated → learning with small wins and purpose-building

- normal → balanced across all four; sustain what's working

PROGRESSIVE EXPOSURE: Always provide all 4 steps. Scale from completely solo → passive public presence → brief interaction → group involvement. Every step must feel safe and achievable today.`;

function buildContextBlock(ctx: UserContext | undefined): string {
  if (!ctx) return "No prior context — treat as a first-time user from Malaysia.";
  return `Mood: ${ctx.mood}, Energy: ${ctx.energy}, Time of day: ${ctx.time}, Session number: ${ctx.sessionCount}`;
}

function buildFeedbackBlock(feedback: string | undefined): string {
  if (!feedback) return "No previous feedback.";
  return `User rated previous recommendations as: ${feedback}. Adjust suggestions accordingly.`;
}

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      messages: ChatMessage[];
      mode?: "chat" | "analyze";
      context?: UserContext;
      previousFeedback?: string;
    }) => {
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

      let context: UserContext | undefined;
      if (data.context && typeof data.context === "object") {
        const c = data.context;
        if (
          typeof c.mood === "string" &&
          typeof c.energy === "string" &&
          typeof c.time === "string" &&
          typeof c.sessionCount === "number"
        ) {
          context = {
            mood: c.mood.slice(0, 100),
            energy: c.energy.slice(0, 20),
            time: c.time.slice(0, 20),
            sessionCount: Math.max(0, Math.min(9999, Math.round(c.sessionCount))),
          };
        }
      }

      let previousFeedback: string | undefined;
      if (typeof data.previousFeedback === "string" && data.previousFeedback.length > 0) {
        previousFeedback = data.previousFeedback.slice(0, 200);
      }

      return {
        messages: data.messages,
        mode: data.mode ?? "chat",
        context,
        previousFeedback,
      };
    },
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { reply: "", analysis: null, error: "AI service is not configured." };
    }

    const isAnalyze = data.mode === "analyze";
    const contextBlock = buildContextBlock(data.context);
    const feedbackBlock = buildFeedbackBlock(data.previousFeedback);

    const systemPrompt = (isAnalyze ? ANALYSIS_PROMPT : SYSTEM_PROMPT)
      .replace("{{CONTEXT_BLOCK}}", contextBlock)
      .replace("{{FEEDBACK_BLOCK}}", feedbackBlock);

    try {
      const body: Record<string, unknown> = {
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
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
