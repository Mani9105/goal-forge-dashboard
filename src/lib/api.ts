import { defaultRun, type GoalRun, type Status } from "@/lib/mock-data";

const TIMEOUT_MS = 30_000;

const CONFIGURED = (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/+$/, "") ?? "";

/** True when a FastAPI backend URL is configured; otherwise we use the built-in /api routes. */
export const isRemoteBackend = CONFIGURED.length > 0;

const BASE_URL = isRemoteBackend ? CONFIGURED : "/api";

const paths = {
  generate: isRemoteBackend ? "/generate" : "/goals",
  run: isRemoteBackend ? "/run" : "/goals",
  task: (id: string) => (isRemoteBackend ? `/tasks/${encodeURIComponent(id)}` : `/tasks/${encodeURIComponent(id)}`),
  approval: (id: string) =>
    isRemoteBackend ? `/approvals/${encodeURIComponent(id)}` : `/approvals/${encodeURIComponent(id)}`,
  agentStatus: isRemoteBackend ? "/agent-status" : "/agent-status",
};

export class ApiError extends Error {
  status: number | undefined;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new ApiError(
        `Backend returned ${res.status}${detail ? `: ${readDetail(detail)}` : ""}`,
        res.status,
      );
    }
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new ApiError("Backend returned a response that was not valid JSON.");
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("Backend did not respond in time.");
    }
    throw new ApiError("Could not reach the backend.");
  } finally {
    clearTimeout(timer);
  }
}

// FastAPI validation errors come back as {detail: "..."} or {detail: [{msg, loc}]}.
function readDetail(text: string): string {
  try {
    const parsed = JSON.parse(text) as { detail?: unknown };
    const d = parsed.detail;
    if (typeof d === "string") return d.slice(0, 200);
    if (Array.isArray(d)) {
      return d
        .map((e) => str(rec(e)["msg"]))
        .filter(Boolean)
        .join("; ")
        .slice(0, 200);
    }
  } catch {
    /* fall through to raw text */
  }
  return text.slice(0, 200);
}

const statuses: Status[] = ["done", "running", "queued", "awaiting"];

function toStatus(value: unknown, fallback: Status = "queued"): Status {
  const v = String(value ?? "").toLowerCase();
  if (statuses.includes(v as Status)) return v as Status;
  if (v === "completed" || v === "complete" || v === "finished" || v === "success") return "done";
  if (v === "in_progress" || v === "in-progress" || v === "active" || v === "started") return "running";
  if (v === "pending" || v === "todo" || v === "not_started") return "queued";
  if (v === "waiting" || v === "awaiting_approval" || v === "blocked") return "awaiting";
  if (typeof value === "boolean") return value ? "done" : "queued";
  return fallback;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function rec(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function list(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.map((v) => (typeof v === "string" ? { title: v } : rec(v)));
  return [];
}

function pick(source: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) if (source[key] !== undefined && source[key] !== null) return source[key];
  return undefined;
}

// Normalize whatever the backend returns into the GoalRun the UI renders.
// Nothing is invented: missing collections stay empty.
export function normalizeRun(raw: unknown, goal: string): GoalRun {
  const data = rec(raw);
  const nested = rec(pick(data, "run", "result_data", "data"));
  const run = Object.keys(nested).length > 0 ? nested : data;

  return {
    goal: str(pick(run, "goal", "objective", "prompt"), goal),
    chips: (Array.isArray(pick(run, "chips", "tags", "labels")) ? (pick(run, "chips", "tags", "labels") as unknown[]) : [])
      .map((c) => str(c))
      .filter(Boolean),
    plan: list(pick(run, "plan", "steps", "plan_steps")).map((step, i) => ({
      id: str(pick(step, "id", "step_id"), `p${i + 1}`),
      title: str(pick(step, "title", "name", "step", "description"), `Step ${i + 1}`),
      status: toStatus(pick(step, "status", "state")),
      progress: Math.min(100, Math.max(0, num(pick(step, "progress", "percent"), 0))),
    })),
    activity: list(pick(run, "activity", "events", "activity_events", "logs")).map((item, i) => {
      const tone = str(pick(item, "tone"));
      return {
        id: str(pick(item, "id", "event_id"), `a${i + 1}`),
        agent: str(pick(item, "agent", "agent_name", "source"), "Agent"),
        message: str(pick(item, "message", "event", "text", "description")),
        time: str(pick(item, "time", "timestamp", "created_at"), ""),
        kind: str(pick(item, "kind", "type", "category"), ""),
        tone: tone === "mint" || tone === "amber" ? tone : ("brand" as const),
      };
    }),
    tasks: list(pick(run, "tasks", "todos", "actions")).map((task, i) => ({
      id: str(pick(task, "id", "task_id"), `t${i + 1}`),
      title: str(pick(task, "title", "name", "task", "description"), `Task ${i + 1}`),
      status: toStatus(pick(task, "status", "state", "done")),
    })),
    approvals: list(pick(run, "approvals", "approval_requests", "pending_approvals")).map((ap, i) => ({
      id: str(pick(ap, "id", "approval_id"), `ap${i + 1}`),
      title: str(pick(ap, "title", "name", "question")),
      detail: str(pick(ap, "detail", "description", "reason", "message")),
    })),
    result: (() => {
      const r = rec(pick(run, "result", "final_result", "outcome"));
      return {
        label: str(pick(r, "label", "title"), "Projected outcome"),
        headline: str(pick(r, "headline", "outcome", "summary", "value"), "—"),
        note: str(pick(r, "note", "subtitle", "detail")),
        confidence: Math.min(100, Math.max(0, num(pick(r, "confidence", "score"), 0))),
      };
    })(),
  };
}

function withFallback(run: GoalRun, goal: string): GoalRun {
  // Keep the panels meaningful if the backend omits a section entirely.
  return {
    ...run,
    goal: run.goal || goal || defaultRun.goal,
  };
}

export const api = {
  isRemote: isRemoteBackend,
  baseUrl: BASE_URL,

  generate: async (goal: string): Promise<GoalRun> => {
    const payload = await request(paths.generate, {
      method: "POST",
      body: JSON.stringify({ goal, prompt: goal }),
    });
    return withFallback(normalizeRun(payload, goal), goal);
  },

  getRun: async (): Promise<GoalRun> => {
    const payload = await request(paths.run);
    return withFallback(normalizeRun(payload, ""), "");
  },

  setTaskStatus: async (id: string, status: Status, goal: string): Promise<GoalRun | null> => {
    const payload = await request(paths.task(id), {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    const run = normalizeRun(payload, goal);
    return run.tasks.length ? withFallback(run, goal) : null;
  },

  decideApproval: async (
    id: string,
    verdict: "approved" | "declined",
    goal: string,
  ): Promise<GoalRun | null> => {
    const payload = await request(paths.approval(id), {
      method: "POST",
      body: JSON.stringify({ verdict, decision: verdict, approved: verdict === "approved" }),
    });
    const run = normalizeRun(payload, goal);
    return run.tasks.length || run.plan.length ? withFallback(run, goal) : null;
  },

  agentStatus: async (): Promise<{ active: number; online: boolean }> => {
    const payload = rec(await request(paths.agentStatus));
    return { active: num(pick(payload, "active", "agents_active"), 0), online: payload["online"] !== false };
  },
};
