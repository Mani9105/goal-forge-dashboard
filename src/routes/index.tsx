import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { defaultRun, type GoalRun, type Status } from "@/lib/mock-data";
import { api } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GoalForge — Turn Goals Into Real Outcomes" },
      {
        name: "description",
        content:
          "Enter a real-world goal and GoalForge builds a plan, runs each step, asks for approval when needed and delivers the final outcome.",
      },
      { property: "og:title", content: "GoalForge — Turn Goals Into Real Outcomes" },
      {
        property: "og:description",
        content:
          "Enter a real-world goal and GoalForge builds a plan, runs each step, asks for approval when needed and delivers the final outcome.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const statusLabel: Record<Status, string> = {
  done: "Completed",
  running: "Running",
  queued: "Pending",
  awaiting: "Waiting on you",
};

const statusChip: Record<Status, string> = {
  done: "bg-mint/15 text-mint",
  running: "bg-brand/15 text-brand",
  queued: "bg-ink/8 text-ink-soft",
  awaiting: "bg-amber/15 text-ink",
};

function Dashboard() {
  const [run, setRun] = useState<GoalRun>(defaultRun);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.health().then((ok) => {
      if (!cancelled) setOnline(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const goal = draft.trim();
    if (!goal || loading) return;
    setLoading(true);
    setError(null);
    try {
      setRun(await api.generate(goal));
      setOnline(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build a plan.");
    } finally {
      setLoading(false);
    }
  };

  const runTask = async (id: string) => {
    if (busy || loading) return;
    setBusy(id);
    setError(null);
    try {
      let current = await api.executeTask(id, run.goal);
      setRun(current);
      // Roll straight on through the remaining steps until one needs a decision.
      while (current.approvals.length === 0) {
        const next = current.tasks.find((t) => t.status !== "done");
        if (!next) break;
        setBusy(next.id);
        current = await api.executeTask(next.id, current.goal);
        setRun(current);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not run that step.");
    } finally {
      setBusy(null);
    }
  };

  const decide = async (verdict: "approved" | "declined") => {
    if (busy || loading) return;
    setBusy(verdict);
    setError(null);
    try {
      setRun(await api.decideApproval(verdict, run.goal));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send that decision.");
    } finally {
      setBusy(null);
    }
  };

  const hasPlan = run.tasks.length > 0;
  const progress = run.result.progress;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-mist via-mist-2 to-ice font-display text-ink">
      <div className="pointer-events-none absolute -top-32 -left-24 size-[420px] rounded-full bg-brand/25 blur-[130px] orb-a" />
      <div className="pointer-events-none absolute top-10 right-0 size-[460px] rounded-full bg-brand-2/25 blur-[130px] orb-b" />
      <div className="pointer-events-none absolute bottom-[-140px] left-1/3 size-[440px] rounded-full bg-mint/20 blur-[130px] orb-c" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6">
        <header className="panel-glass flex items-center justify-between rounded-2xl px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-base font-semibold text-on-brand shadow-lg shadow-brand/30">
              GF
            </div>
            <div>
              <div className="text-lg font-semibold leading-none tracking-tight">GoalForge</div>
              <div className="mt-1 text-xs text-ink-soft">Turn goals into real outcomes.</div>
            </div>
          </div>
          <span
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] text-ink ${
              online === false ? "border-rose/40 bg-rose/10" : "border-mint/40 bg-mint/10"
            }`}
          >
            <span
              className={`size-2 rounded-full ${online === false ? "bg-rose" : "bg-mint"}`}
            />
            {online === false ? "offline" : online === null ? "connecting" : "online"}
          </span>
        </header>

        <section className="panel-glass rounded-2xl p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Your goal</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">What do you want to accomplish?</h1>
          <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={submit}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={loading}
              className="flex-1 rounded-xl border border-line/70 bg-panel/60 px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:border-brand/50 disabled:opacity-60"
              placeholder="e.g. Plan and secure a 10-day solo trip to the Dolomites under $3,200."
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-br from-brand to-brand-2 px-6 py-3 text-sm font-semibold text-on-brand shadow-lg shadow-brand/30 disabled:opacity-60"
            >
              {loading ? "Building…" : "Build My Plan"}
            </button>
          </form>
          {run.goal && !loading && <p className="mt-4 text-sm text-ink-soft">Goal: {run.goal}</p>}
          {error && (
            <p role="alert" className="mt-3 rounded-lg border border-rose/40 bg-rose/10 px-3 py-2 text-[13px] text-ink">
              {error}
            </p>
          )}
        </section>

        {run.approvals.length > 0 && (
          <section className="rounded-2xl border border-amber/40 bg-panel/60 p-6 backdrop-blur-2xl">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-ink-soft">
              <span className="size-2 rounded-full bg-amber" /> {run.approvals[0]!.title}
            </h2>
            <p className="mt-2 text-sm">{run.approvals[0]!.detail}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => decide("approved")}
                disabled={busy !== null || loading}
                className="rounded-xl bg-gradient-to-br from-brand to-brand-2 px-5 py-2.5 text-sm font-semibold text-on-brand shadow-lg shadow-brand/30 disabled:opacity-60"
              >
                Approve
              </button>
              <button
                onClick={() => decide("declined")}
                disabled={busy !== null || loading}
                className="rounded-xl border border-line/70 bg-panel/50 px-5 py-2.5 text-sm font-medium text-ink-soft disabled:opacity-60"
              >
                Decline
              </button>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="panel-glass rounded-2xl p-6 lg:col-span-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-soft">Your plan</h2>
                <p className="mt-1 text-sm text-ink-soft">A step-by-step plan to reach your goal.</p>
              </div>
              {hasPlan && (
                <span className="rounded-full bg-brand/10 px-3 py-1 font-mono text-[11px] text-brand">
                  {run.tasks.length} steps
                </span>
              )}
            </div>

            {!hasPlan ? (
              <p className="mt-6 text-sm text-ink-soft">
                {loading ? "Building your plan…" : "Enter a goal above to build your plan."}
              </p>
            ) : (
              <ol className="mt-5 space-y-4">
                {run.tasks.map((t, i) => (
                  <li key={t.id} className="rounded-xl border border-line/70 bg-panel/50 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/10 font-mono text-xs text-brand">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{t.title}</p>
                        {t.description && <p className="mt-1 text-[13px] text-ink-soft">{t.description}</p>}
                        {t.expectedOutcome && (
                          <p className="mt-2 text-[13px] text-ink-soft">
                            <span className="font-medium text-ink">Expected outcome:</span> {t.expectedOutcome}
                          </p>
                        )}
                        {t.result && (
                          <p className="mt-2 rounded-lg bg-mint/10 px-3 py-2 text-[13px] text-ink">{t.result}</p>
                        )}
                        {t.verified && (
                          <p className="mt-2 font-mono text-[11px] text-mint">✓ verified</p>
                        )}
                        
                      </div>
                      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                        <span className={`rounded-full px-3 py-1 font-mono text-[11px] ${statusChip[t.status]}`}>
                          {statusLabel[t.status]}
                        </span>
                        {t.status !== "done" && (
                          <button
                            type="button"
                            onClick={() => runTask(t.id)}
                            disabled={busy !== null || loading}
                            className="rounded-lg border border-brand/40 bg-brand/10 px-4 py-2 text-[13px] font-medium text-brand disabled:opacity-60"
                          >
                            {busy === t.id ? "Running…" : "Run Task"}
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="panel-glass h-fit rounded-2xl p-6 lg:col-span-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-soft">Final outcome</h2>
            <p className="mt-3 text-lg font-semibold leading-snug">
              {run.result.headline || (hasPlan ? "Run the steps to reach your outcome." : "No outcome yet.")}
            </p>
            {run.result.note && <p className="mt-2 text-sm text-ink-soft">{run.result.note}</p>}
            <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-ink-soft">
              <span>Progress</span>
              <span className="text-ink">{progress}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-mint transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress === 100 && (
              <div className="mt-4 rounded-xl bg-mint/10 px-4 py-3 text-sm">
                <p className="font-semibold text-ink">Goal completed</p>
                <p className="mt-1 text-ink-soft">Every step finished successfully.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
