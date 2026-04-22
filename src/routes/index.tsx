import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChatApp } from "@/components/ChatApp";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "YouthBridge Connect — AI Wellbeing Companion" },
      {
        name: "description",
        content:
          "Chat with YouthBridge, an empathetic AI companion for Malaysian youth. Get a personalized wellbeing analysis and actionable next steps.",
      },
      { property: "og:title", content: "YouthBridge Connect — AI Wellbeing Companion" },
      {
        property: "og:description",
        content:
          "Talk to an AI that listens, analyzes how you feel, and recommends real next steps in Malaysia.",
      },
    ],
  }),
});

function Index() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const ctx = localStorage.getItem("yb_context");
      if (!ctx) {
        navigate({ to: "/onboarding" });
        return;
      }
    } catch {
      navigate({ to: "/onboarding" });
      return;
    }
    setReady(true);
  }, [navigate]);

  if (!ready) return null;
  return <ChatApp />;
}
