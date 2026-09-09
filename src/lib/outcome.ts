import type { GoalRun } from "@/lib/mock-data";

export type DayEntry = { label: string; detail: string };

const DAY_RE = /^\s*(?:[-*•]\s*)?(day\s*\d+(?:\s*[–—-]\s*\d+)?)\s*[:.)-]\s*(.+)$/i;

/** Split a blob of text into lines / sentences we can scan for day markers. */
function toLines(text: string): string[] {
  return text
    .split(/\r?\n|(?<=\.)\s+(?=Day\s*\d)/i)
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Pull "Day N: do something" entries out of the summary and completed steps. */
export function extractDays(run: GoalRun): DayEntry[] {
  const seen = new Set<string>();
  const days: DayEntry[] = [];

  const push = (label: string, detail: string) => {
    const key = label.toLowerCase();
    if (seen.has(key) || !detail) return;
    seen.add(key);
    days.push({ label, detail });
  };

  // Prefer the backend's own plan tasks — titles like "Day 1: …" with real descriptions.
  for (const t of run.tasks) {
    const m = DAY_RE.exec(t.title);
    if (!m) continue;
    const label = m[1]!.replace(/\s+/g, " ").replace(/^day/i, "Day");
    const titleDetail = m[2]!.trim();
    const bits = [titleDetail, t.description, t.result].filter(Boolean);
    push(label, bits.join(" — "));
  }

  const source = [...toLines(run.result.summary), ...run.result.completedSteps.flatMap(toLines)];
  for (const line of source) {
    const m = DAY_RE.exec(line);
    if (!m) continue;
    const label = m[1]!.replace(/\s+/g, " ").replace(/^day/i, "Day");
    push(label, m[2]!.trim());
  }
  return days;
}

function norm(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

const EXECUTION_BOILERPLATE = /^execution completed for task/i;

/** Drop outcome lines that merely repeat a plan step title or raw execution boilerplate. */
export function withoutTaskEcho(items: string[], run: GoalRun): string[] {
  const titles = new Set(run.tasks.map((t) => norm(t.title)));
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (EXECUTION_BOILERPLATE.test(item)) continue;
    const key = norm(item);
    if (!key || titles.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
  }
  return out;
}

/** Summary text with any day lines removed, so it reads as a real conclusion. */
export function headlineSummary(run: GoalRun): string {
  const kept = toLines(run.result.summary).filter((l) => !DAY_RE.test(l));
  return kept.join(" ").trim();
}
