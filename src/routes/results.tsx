import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  GraduationCap,
  HeartPulse,
  Leaf,
  MapPin,
  RotateCcw,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/results")({
  component: ResultsPage,
  head: () => ({
    meta: [
      { title: "Your Wellbeing Dashboard — YouthBridge" },
      {
        name: "description",
        content:
          "Personalized wellbeing analysis and recommendations for youth in Malaysia.",
      },
    ],
  }),
});

type Recommendation = { title: string; description: string; location?: string };

type LevelKey = "low" | "medium" | "high";

type Metric = { level: LevelKey | string; score: number };

type Analysis = {
  state: "stressed" | "lonely" | "unmotivated" | "normal" | string;
  severity: LevelKey | string;
  summary?: string;
  confidence?: number;
  indicators?: string[];
  causes?: string[];
  location?: string;
  metrics?: {
    stress?: Metric;
    social?: Metric;
    motivation?: Metric;
  };
  recommendations: {
    wellbeing?: Recommendation[];
    social?: Recommendation[];
    learning?: Recommendation[];
    health?: Recommendation[];
  };
};

const STATE_COPY: Record<string, { label: string; emoji: string; tone: string }> = {
  stressed: {
    label: "You may be experiencing stress",
    emoji: "😣",
    tone: "Let's slow things down together.",
  },
  lonely: {
    label: "You may be feeling lonely",
    emoji: "🫂",
    tone: "Connection is closer than it feels.",
  },
  unmotivated: {
    label: "You may be feeling unmotivated",
    emoji: "🌱",
    tone: "Small steps build big momentum.",
  },
  normal: {
    label: "You're doing well overall",
    emoji: "✨",
    tone: "Keep nurturing what's working.",
  },
};

const SEVERITY_META: Record<string, { label: string; pct: number; color: string; ring: string }> = {
  low: { label: "Low", pct: 33, color: "bg-success", ring: "ring-success/30" },
  medium: { label: "Medium", pct: 66, color: "bg-warning", ring: "ring-warning/30" },
  high: { label: "High", pct: 100, color: "bg-destructive", ring: "ring-destructive/30" },
};

function ResultsPage() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("yb_analysis");
      if (raw) setAnalysis(JSON.parse(raw));
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  if (loaded && !analysis) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl text-foreground">No analysis yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Have a short chat first, then tap "Finish & Analyze" to see your dashboard.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full gradient-calm px-5 py-2.5 text-sm font-medium text-primary-foreground bubble-shadow"
          >
            <ArrowLeft className="h-4 w-4" /> Start chatting
          </Link>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const stateKey = (analysis.state || "normal").toLowerCase();
  const stateCopy = STATE_COPY[stateKey] ?? STATE_COPY.normal;
  const sevKey = (analysis.severity || "low").toLowerCase();
  const sev = SEVERITY_META[sevKey] ?? SEVERITY_META.low;

  const recs = analysis.recommendations || {};
  const indicators = analysis.indicators ?? [];
  const causes = analysis.causes ?? [];
  const confidence = clampPct(analysis.confidence);
  const location = (analysis.location || "Malaysia").trim();

  const metrics = analysis.metrics ?? {};
  const stressScore = clampPct(metrics.stress?.score);
  const socialScore = clampPct(metrics.social?.score);
  const motivationScore = clampPct(metrics.motivation?.score);

  function handleRestart() {
    try {
      localStorage.removeItem("yb_analysis");
      localStorage.removeItem("yb_transcript");
    } catch {
      // ignore
    }
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-[100dvh] px-4 pb-16 pt-6 sm:pt-10">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to chat
          </Link>
          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Start over
          </button>
        </motion.div>

        {/* High severity banner */}
        {sevKey === "high" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 card-shadow"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="text-sm">
              <p className="font-semibold text-destructive">
                You might be experiencing significant emotional stress.
              </p>
              <p className="mt-1 text-foreground/80">
                Please consider reaching out for support. In Malaysia you can call{" "}
                <span className="font-medium">Befrienders KL: 03-7627 2929</span> (24/7,
                free & confidential), or speak to your university counselor.
              </p>
            </div>
          </motion.div>
        )}

        {/* Hero state */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-6 overflow-hidden rounded-3xl border border-border/60 bg-card p-6 sm:p-8 card-shadow"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl gradient-calm text-3xl">
                <span aria-hidden>{stateCopy.emoji}</span>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                  Detected State
                </p>
                <h1 className="mt-1 font-display text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
                  {stateCopy.label}
                </h1>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  {analysis.summary || stateCopy.tone}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {location}
                  </span>
                  {confidence !== null && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                      <Target className="h-3 w-3" /> {confidence}% confidence
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Severity */}
            <div className="w-full sm:w-64">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium uppercase tracking-wider text-muted-foreground">
                  Severity
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold ring-2 ring-inset",
                    sev.ring,
                    sevKey === "low" && "text-success",
                    sevKey === "medium" && "text-warning",
                    sevKey === "high" && "text-destructive",
                  )}
                >
                  {sev.label}
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${sev.pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={cn("h-full rounded-full", sev.color)}
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Wellbeing metrics */}
        {(stressScore !== null || socialScore !== null || motivationScore !== null) && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <MetricBar
              label="Stress level"
              score={stressScore}
              level={metrics.stress?.level}
              invert
            />
            <MetricBar
              label="Social connection"
              score={socialScore}
              level={metrics.social?.level}
            />
            <MetricBar
              label="Motivation"
              score={motivationScore}
              level={metrics.motivation?.level}
            />
          </motion.section>
        )}

        {/* Insight summary: indicators + causes */}
        {(indicators.length > 0 || causes.length > 0) && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            {indicators.length > 0 && (
              <div className="rounded-3xl border border-border/60 bg-card p-5 card-shadow">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-lg text-foreground">Key indicators</h3>
                </div>
                <ul className="mt-3 space-y-2">
                  {indicators.map((ind, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-foreground/85"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {causes.length > 0 && (
              <div className="rounded-3xl border border-border/60 bg-card p-5 card-shadow">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-lg text-foreground">Possible causes</h3>
                </div>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {causes.map((c, i) => (
                    <li
                      key={i}
                      className="rounded-full border border-border/50 bg-background/70 px-3 py-1 text-xs text-foreground/85"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.section>
        )}

        {/* Recommendations */}
        <h2 className="mt-10 font-display text-2xl tracking-tight text-foreground">
          Smart recommendations for you
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tailored next steps — designed for life in {location} 🇲🇾
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <RecCard
            title="Wellbeing"
            subtitle="Daily calming actions"
            icon={<Leaf className="h-5 w-5" />}
            items={recs.wellbeing}
            accent="from-emerald-400/15 to-teal-400/10"
            iconClass="bg-emerald-500/15 text-emerald-700"
            delay={0.1}
          />
          <RecCard
            title="Social"
            subtitle="Connect with people nearby"
            icon={<Users className="h-5 w-5" />}
            items={recs.social}
            accent="from-sky-400/15 to-blue-400/10"
            iconClass="bg-sky-500/15 text-sky-700"
            delay={0.15}
          />
          <RecCard
            title="Learning"
            subtitle="Build skills, find purpose"
            icon={<GraduationCap className="h-5 w-5" />}
            items={recs.learning}
            accent="from-indigo-400/15 to-violet-400/10"
            iconClass="bg-indigo-500/15 text-indigo-700"
            delay={0.2}
          />
          <RecCard
            title="Health"
            subtitle="Care & professional support"
            icon={<HeartPulse className="h-5 w-5" />}
            items={recs.health}
            accent="from-rose-400/15 to-pink-400/10"
            iconClass="bg-rose-500/15 text-rose-700"
            delay={0.25}
          />
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Brain className="h-3.5 w-3.5" />
          <span>
            Generated by AI · Not a medical diagnosis · For real concerns, speak to a
            professional.
          </span>
        </div>
      </div>
    </div>
  );
}

function clampPct(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function MetricBar({
  label,
  score,
  level,
  invert = false,
}: {
  label: string;
  score: number | null;
  level?: string;
  invert?: boolean;
}) {
  if (score === null) return null;

  // For stress (invert=true), high score = bad. For social/motivation, high score = good.
  const isHealthy = invert ? score < 40 : score >= 70;
  const isWarning = invert ? score >= 40 && score < 70 : score >= 40 && score < 70;

  const barColor = isHealthy ? "bg-success" : isWarning ? "bg-warning" : "bg-destructive";
  const textColor = isHealthy ? "text-success" : isWarning ? "text-warning" : "text-destructive";
  const displayLevel =
    (level as string | undefined) ??
    (score >= 70 ? "high" : score >= 40 ? "medium" : "low");

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 card-shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span className={cn("text-[11px] font-semibold capitalize", textColor)}>
          {displayLevel}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", barColor)}
        />
      </div>
      <p className="mt-1.5 text-right text-[11px] text-muted-foreground">{score}/100</p>
    </div>
  );
}

function RecCard({
  title,
  subtitle,
  icon,
  items,
  accent,
  iconClass,
  delay = 0,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items?: Recommendation[];
  accent: string;
  iconClass: string;
  delay?: number;
}) {
  const list = items && items.length > 0 ? items : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/60 bg-card p-5 card-shadow",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br opacity-70",
          accent,
        )}
      />
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            iconClass,
          )}
        >
          {icon}
        </div>
        <div>
          <h3 className="font-display text-xl text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {list ? (
          list.map((r, i) => (
            <li
              key={i}
              className="rounded-2xl border border-border/40 bg-background/60 p-3"
            >
              <p className="text-sm font-medium text-foreground">{r.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {r.description}
              </p>
              {r.location && (
                <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  <MapPin className="h-2.5 w-2.5" /> {r.location}
                </p>
              )}
            </li>
          ))
        ) : (
          <li className="rounded-2xl border border-dashed border-border/50 p-3 text-xs text-muted-foreground">
            No specific suggestions in this category right now.
          </li>
        )}
      </ul>
    </motion.div>
  );
}
