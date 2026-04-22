import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { sendChatMessage } from "@/utils/chat.functions";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I'm here for you 🌱 I'm YouthBridge — a calm space to talk through what's on your mind. How are you feeling today?",
};

export function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendChat = useServerFn(sendChatMessage);
  const navigate = useNavigate();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  const trimmed = input.trim();
  const canSend = trimmed.length > 0 && !isLoading && !isAnalyzing;
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const canAnalyze = userMessageCount >= 2 && !isLoading && !isAnalyzing;

  async function handleSend(e?: FormEvent) {
    e?.preventDefault();
    if (!canSend) return;

    const userMsg: Message = { id: uid(), role: "user", content: trimmed };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setIsLoading(true);

    try {
      const result = await sendChat({
        data: {
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          mode: "chat",
        },
      });

      if (result.error || !result.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: result.error || "Sorry, I couldn't respond. Please try again.",
            error: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: "assistant", content: result.reply },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: "Something went wrong while reaching me. Please try again.",
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!canAnalyze) return;
    setIsAnalyzing(true);
    try {
      const result = await sendChat({
        data: {
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          mode: "analyze",
        },
      });

      if (result.error || !result.analysis) {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: result.error || "I couldn't generate your analysis. Please try again.",
            error: true,
          },
        ]);
        setIsAnalyzing(false);
        return;
      }

      try {
        localStorage.setItem("yb_analysis", JSON.stringify(result.analysis));
        localStorage.setItem(
          "yb_transcript",
          JSON.stringify(messages.map((m) => ({ role: m.role, content: m.content }))),
        );
      } catch {
        // ignore storage errors
      }

      navigate({ to: "/results" });
    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl gradient-calm text-primary-foreground bubble-shadow">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <h1 className="font-display text-2xl tracking-tight text-foreground">
              YouthBridge
            </h1>
            <p className="text-xs text-muted-foreground">
              Your calm AI companion · Malaysia
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-all",
            canAnalyze
              ? "gradient-calm text-primary-foreground hover:scale-[1.02] active:scale-95 bubble-shadow"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Finish & Analyze
            </>
          )}
        </button>
      </header>

      <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto px-4">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-6">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {(isLoading || isAnalyzing) && <TypingBubble key="typing" />}
          </AnimatePresence>

          {userMessageCount < 2 && (
            <p className="mx-auto mt-2 max-w-md text-center text-xs text-muted-foreground">
              Share a bit about how you're feeling. After a short chat, tap{" "}
              <span className="font-medium text-foreground">Finish & Analyze</span> for your
              personalized dashboard.
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0 px-4 pb-5 pt-2">
        <form
          onSubmit={handleSend}
          className="mx-auto flex w-full max-w-2xl items-end gap-2 rounded-3xl bg-card p-2 input-shadow border border-border/60"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me how you're feeling…"
            aria-label="Message"
            className="max-h-[200px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            className={cn(
              "group flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all",
              canSend
                ? "gradient-calm text-primary-foreground hover:scale-105 active:scale-95"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-2xl text-center text-[11px] text-muted-foreground">
          Press Enter to send · Shift + Enter for a new line
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap break-words rounded-3xl px-4 py-2.5 text-[15px] leading-relaxed bubble-shadow",
          isUser
            ? "gradient-calm text-user-bubble-foreground rounded-br-md"
            : message.error
              ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-md"
              : "bg-bot-bubble text-bot-bubble-foreground rounded-bl-md border border-border/50",
        )}
      >
        {message.content}
      </div>
    </motion.div>
  );
}

function TypingBubble() {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex justify-start"
    >
      <div className="flex items-center gap-1.5 rounded-3xl rounded-bl-md border border-border/50 bg-bot-bubble px-4 py-3 bubble-shadow">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </motion.div>
  );
}
