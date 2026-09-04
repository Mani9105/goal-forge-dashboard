import { buildRun, defaultRun, type GoalRun, type Status } from "@/lib/mock-data";

export type RunPayload = { run: GoalRun; decision: string | null };
export type AgentStatus = { online: boolean; agents: string[]; active: number };

export type ApiResult<T> = { data: T; source: "api" | "mock" };

const TIMEOUT_MS = 4000;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(path, {
      ...init,
      signal: controller.signal,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`${path} failed with ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function withFallback<T>(fn: () => Promise<T>, fallback: () => T): Promise<ApiResult<T>> {
  try {
    return { data: await fn(), source: "api" };
  } catch {
    return { data: fallback(), source: "mock" };
  }
}

function localDecide(run: GoalRun, id: string, verdict: string): RunPayload {
  return {
    decision: verdict,
    run: {
      ...run,
      approvals: run.approvals.filter((a) => a.id !== id),
      tasks: run.tasks.map((t) =>
        t.status === "awaiting" ? { ...t, status: verdict === "approved" ? "done" : "queued" } : t,
      ),
    },
  };
}

export const api = {
  getRun: () =>
    withFallback(
      () => request<RunPayload>("/api/goals"),
      () => ({ run: defaultRun, decision: null }),
    ),

  createGoal: (goal: string) =>
    withFallback(
      () => request<RunPayload>("/api/goals", { method: "POST", body: JSON.stringify({ goal }) }),
      () => ({ run: buildRun(goal), decision: null }),
    ),

  updateTask: (run: GoalRun, taskId: string, status: Status) =>
    withFallback(
      () =>
        request<RunPayload>(`/api/tasks/${taskId}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }),
      () => ({
        decision: null,
        run: { ...run, tasks: run.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)) },
      }),
    ),

  decideApproval: (run: GoalRun, approvalId: string, verdict: "approved" | "declined") =>
    withFallback(
      () =>
        request<RunPayload>(`/api/approvals/${approvalId}`, {
          method: "POST",
          body: JSON.stringify({ verdict }),
        }),
      () => localDecide(run, approvalId, verdict),
    ),

  getAgentStatus: () =>
    withFallback(
      () => request<AgentStatus>("/api/agent-status"),
      () => ({ online: false, agents: defaultRun.activity.map((a) => a.agent), active: 4 }),
    ),
};
