import { type ActivityItem, type GoalRun, type Status } from "@/lib/mock-data";

const DEFAULT_BASE_URL = "https://ominous-disco-97xxrx65vxpjh76g4-8000.app.github.dev";

const CONFIGURED = (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/+$/, "") ?? "";

export const BASE_URL = CONFIGURED || DEFAULT_BASE_URL;

/** Plan generation runs a local model, so it needs a long ceiling; everything else is quick. */
const GENERATE_TIMEOUT_MS = 180_000;
const ACTION_TIMEOUT_MS = 60_000;

export class ApiError extends Error {
  status: number | undefined;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path: string, init?: RequestInit, timeoutMs = ACTION_TIMEOUT_MS): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
    const text = await res.text();
    if (!res.ok) throw new ApiError(`${res.status} — ${readDetail(text)}`, res.status);
    if (!text) return {};
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new ApiError("The backend replied with something that was not valid JSON.");
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("The backend took too long to answer. Nothing was left running.");
    }
    throw new ApiError("Could not reach the backend. Check that it is running and reachable.");
  } finally {
    clearTimeout(timer);
  }
}

// FastAPI errors are {detail: "..."} or {detail: [{msg}]}.
function readDetail(text: string): string {
  try {
    const parsed = JSON.parse(text) as { detail?: unknown };
    const d = parsed.detail;
    if (typeof d === "string") return d.slice(0, 240);
    if (Array.isArray(d)) {
      return d
        .map((e) => str(rec(e)["msg"]))
        .filter(Boolean)
        .join("; ")
        .slice(0, 240);
    }
  } catch {
    /* fall through */
  }
  return (text || "no details").slice(0, 240);
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function rec(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function arr(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(rec) : [];
}

// backend TaskStatus -> UI Status
function toStatus(value: unknown): Status {
  switch (String(value ?? "").toLowerCase()) {
    case "completed":
      return "done";
    case "running":
      return "running";
    case "waiting_approval":
      return "awaiting";
    case "failed":
      return "done";
    default:
      return "queued";
  }
}

function progressFor(status: Status, verified: boolean): number {
  if (status === "done") return verified ? 100 : 95;
  if (status === "running") return 55;
  if (status === "awaiting") return 70;
  return 0;
}

const mintTypes = new Set(["task_completed", "verification", "plan_created"]);
const amberTypes = new Set(["approval_required", "recovery"]);

function toneFor(type: string): ActivityItem["tone"] {
  if (mintTypes.has(type)) return "mint";
  if (amberTypes.has(type)) return "amber";
  return "brand";
}

/** Map a FastAPI GoalResponse onto the shape the dashboard renders. */
export function normalizeRun(raw: unknown, fallbackGoal: string): GoalRun {
  const data = rec(raw);
  const plan = rec(data["plan"]);
  const backendTasks = arr(plan["tasks"]);
  const approval = rec(data["approval"]);

  const tasks = backendTasks.map((t, i) => {
    const id = str(t["id"], `task-${i + 1}`);
    const status = toStatus(t["status"]);
    const failed = String(t["status"] ?? "") === "failed";
    return {
      id,
      title: str(t["title"], `Task ${i + 1}`),
      description: str(t["description"]),
      expectedOutcome: str(t["expected_outcome"]),
      result: str(t["result"]),
      verified: t["verified"] === true,
      failed,
      status,
    };
  });

  const completed = tasks.filter((t) => t.status === "done").length;
  const confidence = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const objective = str(plan["objective"]);
  const resultText = str(data["result"]);

  return {
    goal: str(data["goal"], fallbackGoal),
    chips: [
      objective ? "objective set" : "",
      tasks.length ? `${tasks.length} tasks` : "",
      approval["required"] === true ? "approval pending" : "",
    ].filter(Boolean),
    plan: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      progress: progressFor(t.status, t.verified),
    })),
    activity: arr(data["activities"]).map((a, i) => {
      const type = str(a["type"], "event");
      return {
        id: `a${i + 1}`,
        agent: "GoalForge",
        message: str(a["message"]),
        time: `#${i + 1}`,
        kind: type.replace(/_/g, " "),
        tone: toneFor(type),
      };
    }),
    tasks: tasks.map((t) => ({ id: t.id, title: t.title, status: t.status })),
    approvals:
      approval["required"] === true
        ? [
            {
              id: str(approval["task_id"], "approval"),
              title: "Human approval required",
              detail: str(approval["reason"], "The agent paused before a consequential action."),
            },
          ]
        : [],
    result: {
      label: objective ? "Objective" : "Projected outcome",
      headline: resultText || objective || "—",
      note: tasks.length ? `${completed}/${tasks.length} tasks complete` : "",
      confidence,
    },
  };
}

export const api = {
  baseUrl: BASE_URL,

  health: async (): Promise<boolean> => {
    try {
      const payload = rec(await request("/health", { method: "GET" }, 10_000));
      return str(payload["status"]) === "healthy";
    } catch {
      return false;
    }
  },

  generate: async (goal: string): Promise<GoalRun> => {
    const payload = await request(
      "/generate",
      { method: "POST", body: JSON.stringify({ goal }) },
      GENERATE_TIMEOUT_MS,
    );
    return normalizeRun(payload, goal);
  },

  executeTask: async (taskId: string, goal: string): Promise<GoalRun> => {
    const payload = await request(
      `/execute/${encodeURIComponent(taskId)}?goal=${encodeURIComponent(goal)}`,
      { method: "POST" },
      GENERATE_TIMEOUT_MS,
    );
    return normalizeRun(payload, goal);
  },

  decideApproval: async (verdict: "approved" | "declined", goal: string): Promise<GoalRun> => {
    const path = verdict === "approved" ? "/approve" : "/decline";
    const payload = await request(
      `${path}?goal=${encodeURIComponent(goal)}`,
      { method: "POST" },
      GENERATE_TIMEOUT_MS,
    );
    return normalizeRun(payload, goal);
  },
};
