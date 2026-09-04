import { createFileRoute } from "@tanstack/react-router";
import { decideApproval, getDecision } from "@/lib/run-store.server";

export const Route = createFileRoute("/api/approvals/$approvalId")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = (await request.json().catch(() => null)) as { verdict?: string } | null;
        const verdict = body?.verdict;
        if (verdict !== "approved" && verdict !== "declined") {
          return new Response(JSON.stringify({ error: "invalid verdict" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
        const run = decideApproval(params.approvalId, verdict);
        return new Response(JSON.stringify({ run, decision: getDecision() }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
