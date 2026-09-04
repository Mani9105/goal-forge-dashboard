import { createFileRoute } from "@tanstack/react-router";
import { getDecision, setTaskStatus } from "@/lib/run-store.server";
import type { Status } from "@/lib/mock-data";

const allowed: Status[] = ["done", "running", "queued", "awaiting"];

export const Route = createFileRoute("/api/tasks/$taskId")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = (await request.json().catch(() => null)) as { status?: Status } | null;
        const status = body?.status;
        if (!status || !allowed.includes(status)) {
          return new Response(JSON.stringify({ error: "invalid status" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
        return new Response(
          JSON.stringify({ run: setTaskStatus(params.taskId, status), decision: getDecision() }),
          { headers: { "content-type": "application/json" } },
        );
      },
    },
  },
});
