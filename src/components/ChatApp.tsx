import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { sendChatMessage } from "@/utils/chat.functions";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendChat = useServerFn(sendChatMessage);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  const trimmed = input.trim();
  const canSend = trimmed.length > 0 && !isLoading;

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
        },
      });

      if (result.error || !result.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: result.error || "Sorry, I couldn't generate a response. Please try again.",
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
          content: "Something went wrong while reaching the assistant. Please try again.",
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const showEmpty = messages.length === 0 && !isLoading;

  return (
    <div className="flex h-[100dvh] flex-col">
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-center px-4 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-user text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <h1 className="font-display text-2xl tracking-tight text-foreground">
            Lumi<span className="text-primary"> · </span>
            <span className="text-base font-sans text-muted-foreground">your AI companion</span>
          </h1>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="chat-scroll flex-1 overflow-y-auto px-4"
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-6">
          {showEmpty && <EmptyState onPick={(t) => setInput(t)} />}

          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {isLoading && <TypingBubble key="typing" />}
          </AnimatePresence>
        </div>
      </div>

      {/* Composer */}
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
            placeholder="Message Lumi…"
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
                ? "gradient-user text-primary-foreground hover:scale-105 active:scale-95"
                : "bg-muted text-muted-foreground cursor-not-allowed"
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
            ? "gradient-user text-user-bubble-foreground rounded-br-md"
            : message.error
              ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-md"
              : "bg-bot-bubble text-bot-bubble-foreground rounded-bl-md border border-border/50"
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

const SUGGESTIONS = [
  "Explain quantum computing simply",
  "Write a haiku about the ocean",
  "Plan a 3-day trip to Kyoto",
  "Help me debug a tricky React bug",
];

function EmptyState({ onPick }: { onPick: (t: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center pt-8 pb-4 text-center"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl gradient-user text-primary-foreground bubble-shadow">
        <Sparkles className="h-6 w-6" />
      </div>
      <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
        How can I help today?
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Ask anything — from coding help to creative writing. I'm here to chat.
      </p>
      <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-2xl border border-border/60 bg-card/70 px-4 py-3 text-left text-sm text-foreground transition-all hover:border-primary/40 hover:bg-card hover:-translate-y-0.5 bubble-shadow"
          >
            {s}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
