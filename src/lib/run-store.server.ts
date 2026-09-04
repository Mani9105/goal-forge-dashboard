import { buildRun, defaultRun, type GoalRun, type Status } from "@/lib/mock-data";

// In-memory mock backend store (per server instance).
let current: GoalRun = defaultRun;
let lastDecision: string | null = null;

export function getRun(): GoalRun {
  return current;
}

export function getDecision(): string | null {
  return lastDecision;
}

export function createGoal(goal: string): GoalRun {
  current = buildRun(goal);
  lastDecision = null;
  return current;
}

export function setTaskStatus(id: string, status: Status): GoalRun {
  current = {
    ...current,
    tasks: current.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
  };
  return current;
}

export function decideApproval(id: string, verdict: "approved" | "declined"): GoalRun {
  lastDecision = verdict;
  current = {
    ...current,
    approvals: current.approvals.filter((a) => a.id !== id),
    tasks: current.tasks.map((t) =>
      t.status === "awaiting" ? { ...t, status: verdict === "approved" ? "done" : "queued" } : t,
    ),
  };
  return current;
}

export function agentStatus() {
  const running = current.plan.filter((p) => p.status === "running").length;
  return {
    online: true,
    agents: current.activity.map((a) => a.agent),
    active: Math.max(running, 1),
  };
}
