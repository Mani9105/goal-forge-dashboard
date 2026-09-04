import { createFileRoute } from "@tanstack/react-router";
import { agentStatus } from "@/lib/run-store.server";

export const Route = createFileRoute("/api/agent-status")({
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify(agentStatus()), {
          headers: { "content-type": "application/json" },
        }),
    },
  },
});
