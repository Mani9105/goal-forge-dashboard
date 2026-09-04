import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { buildRun, defaultRun, type GoalRun, type Status } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GoalForge — AI Agent Goal Dashboard" },
      {
        name: "description",
        content:
          "Enter a real-world goal and watch GoalForge agents plan, execute tasks, request approvals and deliver results.",
      },
      { property: "og:title", content: "GoalForge — AI Agent Goal Dashboard" },
      {
        property: "og:description",
        content:
          "Enter a real-world goal and watch GoalForge agents plan, execute tasks, request approvals and deliver results.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const statusText: Record<Status, string> = {
  done: "text-mint",
  running: "text-brand",
  queued: "text-ink-soft",
  awaiting: "text-brand",
};

const navItems = ["Dashboard", "Agents", "History", "Settings"];

function Dashboard() {
  const [run, setRun] = useState<GoalRun>(defaultRun);
  const [draft, setDraft] = useState("");
  const [tasks, setTasks] = useState(defaultRun.tasks);
  const [approvals, setApprovals] = useState(defaultRun.approvals);
  const [decided, setDecided] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("Dashboard");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const next = buildRun(draft);
    setRun(next);
    setTasks(next.tasks);
    setApprovals(next.approvals);
    setDecided(null);
    setDraft("");
  };

  const decide = (id: string, verdict: string) => {
    setApprovals((a) => a.filter((x) => x.id !== id));
    setDecided(verdict);
    setTasks((ts) =>
      ts.map((t) =>
        t.status === "awaiting" ? { ...t, status: verdict === "approved" ? "done" : "queued" } : t,
      ),
    );
  };

  const toggleTask = (id: string) => {
    setTasks((ts) =>
      ts.map((t) => (t.id === id ? { ...t, status: t.status === "done" ? "queued" : "done" } : t)),
    );
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-mist via-mist-2 to-ice font-display text-ink">
      <div className="pointer-events-none absolute -top-32 -left-24 size-[420px] rounded-full bg-brand/25 blur-[130px] orb-a" />
      <div className="pointer-events-none absolute top-10 right-0 size-[460px] rounded-full bg-brand-2/25 blur-[130px] orb-b" />
      <div className="pointer-events-none absolute bottom-[-140px] left-1/3 size-[440px] rounded-full bg-mint/20 blur-[130px] orb-c" />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6">
        <header className="panel-glass flex items-center justify-between rounded-2xl px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-base font-semibold text-on-brand shadow-lg shadow-brand/30">
              GF
            </div>
            <div>
              <div className="text-lg font-semibold leading-none tracking-tight">GoalForge</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                Agent Orchestration
              </div>
            </div>
          </div>
          <nav className="hidden items-center gap-1 rounded-xl border border-line/60 bg-panel/40 p-1 lg:flex">
            <span className="rounded-lg bg-panel/80 px-4 py-2 text-sm font-medium shadow-sm">Dashboard</span>
            <span className="rounded-lg px-4 py-2 text-sm text-ink-soft hover:text-ink">Agents</span>
            <span className="rounded-lg px-4 py-2 text-sm text-ink-soft hover:text-ink">History</span>
            <span className="rounded-lg px-4 py-2 text-sm text-ink-soft hover:text-ink">Settings</span>
          </nav>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full border border-mint/40 bg-mint/10 px-3 py-1.5 font-mono text-[11px] text-ink">
              <span className="size-2 rounded-full bg-mint shadow shadow-mint/50" /> 4 agents live
            </span>
            <div className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-ink to-brand-2 text-xs font-semibold text-on-brand">
              AR
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <section className="panel-glass rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-soft">Goal Input</h2>
                <span className="rounded-full bg-brand/10 px-3 py-1 font-mono text-[11px] text-brand">Ready</span>
              </div>
              <div className="mt-4 rounded-xl border border-line/70 bg-panel/60 p-4">
                <p className="text-lg font-medium leading-snug">{run.goal}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {run.chips.map((c) => (
                    <span
                      key={c}
                      className="rounded-lg border border-line/70 bg-panel/50 px-3 py-1 font-mono text-[11px] text-ink-soft"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <form className="mt-4 flex gap-3" onSubmit={submit}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="flex-1 rounded-xl border border-line/70 bg-panel/50 px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:border-brand/50"
                  placeholder="Describe a real-world goal…"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-br from-brand to-brand-2 px-5 py-3 text-sm font-semibold text-on-brand shadow-lg shadow-brand/30"
                >
                  Forge Plan
                </button>
              </form>
            </section>

            <section className="panel-glass mt-6 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-soft">Plan</h2>
                <span className="font-mono text-[11px] text-ink-soft">v3 · updated 2m ago</span>
              </div>
              <ol className="mt-5 space-y-4">
                {run.plan.map((step, i) => (
                  <li key={step.id} className="flex gap-4">
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full font-mono text-xs font-medium ${
                        step.status === "done"
                          ? "bg-mint/15 text-mint"
                          : step.status === "running"
                            ? "bg-brand/15 text-brand"
                            : "bg-ink/8 text-ink-soft"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{step.title}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            step.status === "done"
                              ? "bg-mint"
                              : step.status === "running"
                                ? "bg-gradient-to-r from-brand to-brand-2"
                                : "bg-ink/30"
                          }`}
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                    </div>
                    <span className={`self-center font-mono text-[11px] ${statusText[step.status]}`}>
                      {step.status}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <section className="panel-glass rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-soft">Agent Activity</h2>
                <span className="size-2 rounded-full bg-amber shadow shadow-amber/50" />
              </div>
              <ul className="mt-5 space-y-4 font-mono text-[12px]">
                {run.activity.map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <span
                      className={`mt-0.5 size-2 shrink-0 rounded-full ${
                        a.tone === "brand" ? "bg-brand" : a.tone === "mint" ? "bg-mint" : "bg-amber"
                      }`}
                    />
                    <div>
                      <p className="text-ink">{a.message}</p>
                      <p className="text-ink-soft/80">
                        {a.time} · {a.kind}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel-glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-soft">Tasks</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {run.tasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-3">
                    {t.status === "done" ? (
                      <span className="grid size-5 place-items-center rounded-md bg-mint/15 text-mint">✓</span>
                    ) : (
                      <span className="size-5 rounded-md border-2 border-brand/60" />
                    )}
                    <span className="flex-1">{t.title}</span>
                    <span
                      className={`font-mono text-[11px] ${t.status === "done" ? "text-ink-soft" : "text-brand"}`}
                    >
                      {t.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-amber/40 bg-panel/60 p-6 shadow-[0_18px_50px_-20px_color-mix(in_oklab,var(--color-amber)_40%,transparent)] backdrop-blur-2xl">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-ink-soft">
                <span className="size-2 rounded-full bg-amber" /> Approval Request
              </h2>
              {approvals.length === 0 ? (
                <p className="mt-3 font-mono text-[11px] text-ink-soft">
                  {decided ? `Last request ${decided}. Nothing else waiting.` : "Nothing waiting on you."}
                </p>
              ) : (
                approvals.map((ap) => (
                  <div key={ap.id}>
                    <p className="mt-3 text-sm font-medium">{ap.title}</p>
                    <p className="mt-1 font-mono text-[11px] text-ink-soft">{ap.detail}</p>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => decide(ap.id, "approved")}
                        className="flex-1 rounded-xl bg-gradient-to-br from-brand to-brand-2 px-4 py-2.5 text-sm font-semibold text-on-brand shadow-lg shadow-brand/30"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => decide(ap.id, "declined")}
                        className="rounded-xl border border-line/70 bg-panel/50 px-4 py-2.5 text-sm font-medium text-ink-soft"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>

            <section className="panel-glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-soft">Final Result</h2>
              <div className="mt-4 rounded-xl border border-line/70 bg-gradient-to-br from-panel/70 to-brand/5 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">{run.result.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {run.result.headline}{" "}
                  <span className="text-sm font-normal text-mint">{run.result.note}</span>
                </p>
                <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-ink-soft">
                  <span>Plan confidence</span>
                  <span className="text-ink">{run.result.confidence}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-mint transition-all duration-700"
                    style={{ width: `${run.result.confidence}%` }}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
