import type { GoalRun, Status } from "@/lib/mock-data";

const TIMEOUT_MS = 30_000;

const BASE_URL = (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/+$/, "") ?? "";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  if (!BASE_URL) throw new ApiError("VITE_API_BASE_URL is not configured.");
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
      throw new ApiError(`Backend returned ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
    }
    return (await res.json()) as unknown;
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

const statuses: Status[] = ["done", "running", "queued", "awaiting"];

function toStatus(value: unknown): Status {
  return statuses.includes(value as Status) ? (value as Status) : "queued";
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
  return Array.isArray(value) ? value.map(rec) : [];
}

// Normalize the FastAPI /generate payload into the GoalRun the UI renders.
// No invented content: missing collections become empty, text falls back to the goal.
function normalizeRun(raw: unknown, goal: string): GoalRun {
  const data = rec(raw);
  const run = rec(data["run"]) && Object.keys(rec(data["run"])).length > 0 ? rec(data["run"]) : data;

  return {
    goal: str(run["goal"], goal),
    chips: (Array.isArray(run["chips"]) ? run["chips"] : []).map((c) => str(c)).filter(Boolean),
    plan: list(run["plan"]).map((step, i) => ({
      id: str(step["id"], `p${i + 1}`),
      title: str(step["title"] ?? step["name"] ?? step["step"], `Step ${i + 1}`),
      status: toStatus(step["status"]),
      progress: Math.min(100, Math.max(0, num(step["progress"], 0))),
    })),
    activity: list(run["activity"]).map((item, i) => {
      const tone = str(item["tone"]);
      return {
        id: str(item["id"], `a${i + 1}`),
        agent: str(item["agent"] ?? item["agent_name"], "Agent"),
        message: str(item["message"] ?? item["event"] ?? item["text"]),
        time: str(item["time"] ?? item["timestamp"], ""),
        kind: str(item["kind"] ?? item["type"], ""),
        tone: tone === "mint" || tone === "amber" ? tone : ("brand" as const),
      };
    }),
    tasks: list(run["tasks"]).map((task, i) => ({
      id: str(task["id"], `t${i + 1}`),
      title: str(task["title"] ?? task["name"] ?? task["task"], `Task ${i + 1}`),
      status: toStatus(task["status"]),
    })),
    approvals: list(run["approvals"]).map((ap, i) => ({
      id: str(ap["id"], `ap${i + 1}`),
      title: str(ap["title"] ?? ap["name"]),
      detail: str(ap["detail"] ?? ap["description"]),
    })),
    result: (() => {
      const r = rec(run["result"]);
      return {
        label: str(r["label"], "Projected outcome"),
        headline: str(r["headline"] ?? r["outcome"], "—"),
        note: str(r["note"]),
        confidence: Math.min(100, Math.max(0, num(r["confidence"], 0))),
      };
    })(),
  };
}

export const api = {
  generate: async (goal: string): Promise<GoalRun> => {
    const payload = await request("/generate", {
      method: "POST",
      body: JSON.stringify({ goal }),
    });
    return normalizeRun(payload, goal);
  },
};
