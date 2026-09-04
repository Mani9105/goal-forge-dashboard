import { createFileRoute } from "@tanstack/react-router";
import { createGoal, getDecision, getRun } from "@/lib/run-store.server";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/goals")({
  server: {
    handlers: {
      GET: () => json({ run: getRun(), decision: getDecision() }),
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as { goal?: string } | null;
        const goal = body?.goal?.trim();
        if (!goal) return json({ error: "goal is required" }, 400);
        return json({ run: createGoal(goal), decision: null });
      },
    },
  },
});
