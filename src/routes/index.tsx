import { createFileRoute } from "@tanstack/react-router";
import { ChatApp } from "@/components/ChatApp";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Lumi — AI Chat Assistant" },
      {
        name: "description",
        content: "Chat with Lumi, a fast, friendly AI assistant. Ask anything.",
      },
      { property: "og:title", content: "Lumi — AI Chat Assistant" },
      {
        property: "og:description",
        content: "Chat with Lumi, a fast, friendly AI assistant. Ask anything.",
      },
    ],
  }),
});

function Index() {
  return <ChatApp />;
}
