import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({
    meta: [
      { title: "Welcome — YouthBridge" },
      {
        name: "description",
        content:
          "A short check-in to set the tone for your wellbeing conversation with YouthBridge.",
      },
    ],
  }),
});

const MOODS = [
  "😔 Rough",
  "😐 Okay",
  "😊 Good",
  "😫 Overwhelmed",
  "😶 Numb",
  "✨ Great",
] as const;

const ENERGIES: { value: "low" | "medium" | "high"; label: string }[] = [
  { value: "low", label: "🪫 Low — I'm drained" },
  { value: "medium", label: "⚡ Medium — I'm getting by" },
  { value: "high", label: "🔥 High — I'm on it" },
];

function detectTime(): "morning" | "afternoon" | "evening" | "night" {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mood, setMood] = useState<string | null>(null);
  const [energy, setEnergy] = useState<"low" | "medium" | "high" | null>(null);

  function chooseMood(m: string) {
    setMood(m);
    setTimeout(() => setStep(2), 220);
  }

  function chooseEnergy(e: "low" | "medium" | "high") {
    setEnergy(e);
    setTimeout(() => setStep(3), 220);
  }

  function finish() {
    if (!mood || !energy) return;
    try {
      const prevCount = Number(localStorage.getItem("yb_session_count") || "0") || 0;
      const nextCount = prevCount + 1;
      const ctx = {
        mood,
        energy,
        time: detectTime(),
        sessionCount: nextCount,
      };
      localStorage.setItem("yb_context", JSON.stringify(ctx));
      localStorage.setItem("yb_session_count", String(nextCount));
    } catch {
      // ignore
    }
    navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="flex flex-col items-center text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-calm text-primary-foreground bubble-shadow">
          <Sparkles className="h-5 w-5" />
        </div>
        <h1 className="mt-3 font-display text-3xl tracking-tight text-foreground">
          YouthBridge
        </h1>
        <p className="text-xs text-muted-foreground">
          Your calm AI companion · Malaysia 🇲🇾
        </p>
      </motion.div>

      <div className="mt-6 flex items-center gap-1.5">
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className={cn(
              "h-1.5 rounded-full transition-all",
              s === step ? "w-6 bg-primary" : "w-2 bg-muted",
            )}
          />
        ))}
      </div>

      <div className="mt-8 w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            >
              <h2 className="text-center font-display text-2xl tracking-tight text-foreground">
                How are you feeling right now?
              </h2>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                There's no wrong answer.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {MOODS.map((m) => {
                  const selected = mood === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => chooseMood(m)}
                      className={cn(
                        "rounded-2xl border px-4 py-4 text-sm font-medium transition-all active:scale-95",
                        selected
                          ? "gradient-calm border-transparent text-primary-foreground bubble-shadow"
                          : "border-border/60 bg-card text-foreground hover:border-primary/40 card-shadow",
                      )}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            >
              <h2 className="text-center font-display text-2xl tracking-tight text-foreground">
                What's your energy level like?
              </h2>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                We'll tailor suggestions to match.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                {ENERGIES.map((e) => {
                  const selected = energy === e.value;
                  return (
                    <button
                      key={e.value}
                      type="button"
                      onClick={() => chooseEnergy(e.value)}
                      className={cn(
                        "rounded-2xl border px-5 py-4 text-left text-sm font-medium transition-all active:scale-[0.98]",
                        selected
                          ? "gradient-calm border-transparent text-primary-foreground bubble-shadow"
                          : "border-border/60 bg-card text-foreground hover:border-primary/40 card-shadow",
                      )}
                    >
                      {e.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="text-center"
            >
              <h2 className="font-display text-2xl tracking-tight text-foreground">
                You're in the right place.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                YouthBridge listens to how you're feeling and builds a personalized
                wellbeing picture — not a diagnosis, just honest reflection and real
                next steps.
              </p>
              <button
                type="button"
                onClick={finish}
                className="mt-6 inline-flex items-center gap-2 rounded-full gradient-calm px-6 py-3 text-sm font-medium text-primary-foreground bubble-shadow transition active:scale-95"
              >
                Start my check-in <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
