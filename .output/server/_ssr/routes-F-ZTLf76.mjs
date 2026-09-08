import { n as __toESM } from "../_runtime.mjs";
import { n as defaultRun } from "./mock-data-DI5bw04E.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-F-ZTLf76.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var BASE_URL = ({
	"BASE_URL": "/",
	"DEV": false,
	"MODE": "production",
	"PROD": true,
	"SSR": true,
	"TSS_DEV_SERVER": "false",
	"TSS_DEV_SSR_STYLES_BASEPATH": "/",
	"TSS_DEV_SSR_STYLES_ENABLED": "true",
	"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
	"TSS_INLINE_CSS_ENABLED": "false",
	"TSS_ROUTER_BASEPATH": "",
	"TSS_SERVER_FN_BASE": "/_serverFn/"
}["VITE_API_BASE_URL"]?.replace(/\/+$/, "") ?? "") || "https://ominous-disco-97xxrx65vxpjh76g4-8000.app.github.dev";
/** Plan generation runs a local model, so it needs a long ceiling; everything else is quick. */
var GENERATE_TIMEOUT_MS = 18e4;
var ACTION_TIMEOUT_MS = 6e4;
var ApiError = class extends Error {
	status;
	constructor(message, status) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}
};
async function request(path, init, timeoutMs = ACTION_TIMEOUT_MS) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(`${BASE_URL}${path}`, {
			...init,
			signal: controller.signal,
			headers: {
				"content-type": "application/json",
				...init?.headers ?? {}
			}
		});
		const text = await res.text();
		if (!res.ok) throw new ApiError(`${res.status} — ${readDetail(text)}`, res.status);
		if (!text) return {};
		try {
			return JSON.parse(text);
		} catch {
			throw new ApiError("The backend replied with something that was not valid JSON.");
		}
	} catch (err) {
		if (err instanceof ApiError) throw err;
		if (err instanceof DOMException && err.name === "AbortError") throw new ApiError("The backend took too long to answer. Nothing was left running.");
		throw new ApiError("Could not reach the backend. Check that it is running and reachable.");
	} finally {
		clearTimeout(timer);
	}
}
function readDetail(text) {
	try {
		const d = JSON.parse(text).detail;
		if (typeof d === "string") return d.slice(0, 240);
		if (Array.isArray(d)) return d.map((e) => str(rec(e)["msg"])).filter(Boolean).join("; ").slice(0, 240);
	} catch {}
	return (text || "no details").slice(0, 240);
}
function str(value, fallback = "") {
	return typeof value === "string" && value.trim() ? value : fallback;
}
function rec(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function arr(value) {
	return Array.isArray(value) ? value.map(rec) : [];
}
function toStatus(value) {
	switch (String(value ?? "").toLowerCase()) {
		case "completed": return "done";
		case "running": return "running";
		case "waiting_approval": return "awaiting";
		case "failed": return "done";
		default: return "queued";
	}
}
function progressFor(status, verified) {
	if (status === "done") return verified ? 100 : 95;
	if (status === "running") return 55;
	if (status === "awaiting") return 70;
	return 0;
}
var mintTypes = /* @__PURE__ */ new Set([
	"task_completed",
	"verification",
	"plan_created"
]);
var amberTypes = /* @__PURE__ */ new Set(["approval_required", "recovery"]);
function toneFor(type) {
	if (mintTypes.has(type)) return "mint";
	if (amberTypes.has(type)) return "amber";
	return "brand";
}
/** Map a FastAPI GoalResponse onto the shape the dashboard renders. */
function normalizeRun(raw, fallbackGoal) {
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
			status
		};
	});
	const completed = tasks.filter((t) => t.status === "done").length;
	const confidence = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
	const objective = str(plan["objective"]);
	const resultText = str(data["result"]);
	return {
		goal: str(data["goal"], fallbackGoal),
		chips: [
			objective ? "objective set" : "",
			tasks.length ? `${tasks.length} tasks` : "",
			approval["required"] === true ? "approval pending" : ""
		].filter(Boolean),
		plan: tasks.map((t) => ({
			id: t.id,
			title: t.title,
			status: t.status,
			progress: progressFor(t.status, t.verified)
		})),
		activity: arr(data["activities"]).map((a, i) => {
			const type = str(a["type"], "event");
			return {
				id: `a${i + 1}`,
				agent: "GoalForge",
				message: str(a["message"]),
				time: `#${i + 1}`,
				kind: type.replace(/_/g, " "),
				tone: toneFor(type)
			};
		}),
		tasks: tasks.map((t) => ({
			id: t.id,
			title: t.title,
			status: t.status
		})),
		approvals: approval["required"] === true ? [{
			id: str(approval["task_id"], "approval"),
			title: "Human approval required",
			detail: str(approval["reason"], "The agent paused before a consequential action.")
		}] : [],
		result: {
			label: objective ? "Objective" : "Projected outcome",
			headline: resultText || objective || "—",
			note: tasks.length ? `${completed}/${tasks.length} tasks complete` : "",
			confidence
		}
	};
}
var api = {
	baseUrl: BASE_URL,
	health: async () => {
		try {
			return str(rec(await request("/health", { method: "GET" }, 1e4))["status"]) === "healthy";
		} catch {
			return false;
		}
	},
	generate: async (goal) => {
		return normalizeRun(await request("/generate", {
			method: "POST",
			body: JSON.stringify({ goal })
		}, GENERATE_TIMEOUT_MS), goal);
	},
	executeTask: async (taskId, goal) => {
		return normalizeRun(await request(`/execute/${encodeURIComponent(taskId)}?goal=${encodeURIComponent(goal)}`, { method: "POST" }, GENERATE_TIMEOUT_MS), goal);
	},
	decideApproval: async (verdict, goal) => {
		return normalizeRun(await request(`${verdict === "approved" ? "/approve" : "/decline"}?goal=${encodeURIComponent(goal)}`, { method: "POST" }, GENERATE_TIMEOUT_MS), goal);
	}
};
var statusText = {
	done: "text-mint",
	running: "text-brand",
	queued: "text-ink-soft",
	awaiting: "text-brand"
};
var navItems = [
	"Dashboard",
	"Agents",
	"History",
	"Settings"
];
function Dashboard() {
	const [run, setRun] = (0, import_react.useState)(defaultRun);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [tasks, setTasks] = (0, import_react.useState)(defaultRun.tasks);
	const [approvals, setApprovals] = (0, import_react.useState)(defaultRun.approvals);
	const [decided, setDecided] = (0, import_react.useState)(null);
	const [activeNav, setActiveNav] = (0, import_react.useState)("Dashboard");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(null);
	const [online, setOnline] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const applyRun = (next) => {
		setRun(next);
		setTasks(next.tasks);
		setApprovals(next.approvals);
	};
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		api.health().then((ok) => {
			if (!cancelled) setOnline(ok);
		});
		return () => {
			cancelled = true;
		};
	}, []);
	const submit = async (e) => {
		e.preventDefault();
		const goal = draft.trim();
		if (!goal || loading) return;
		setDraft("");
		setLoading(true);
		setError(null);
		setDecided(null);
		try {
			applyRun(await api.generate(goal));
			setOnline(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Goal generation failed.");
		} finally {
			setLoading(false);
		}
	};
	const decide = async (id, verdict) => {
		if (busy || loading) return;
		setBusy(id);
		setError(null);
		try {
			applyRun(await api.decideApproval(verdict, run.goal));
			setDecided(verdict);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not send that decision.");
		} finally {
			setBusy(null);
		}
	};
	const toggleTask = async (id) => {
		if (busy || loading) return;
		const target = tasks.find((t) => t.id === id);
		if (!target || target.status === "done") return;
		setBusy(id);
		setError(null);
		setTasks((ts) => ts.map((t) => t.id === id ? {
			...t,
			status: "running"
		} : t));
		try {
			applyRun(await api.executeTask(id, run.goal));
		} catch (err) {
			setTasks((ts) => ts.map((t) => t.id === id ? {
				...t,
				status: target.status
			} : t));
			setError(err instanceof Error ? err.message : "Could not run that task.");
		} finally {
			setBusy(null);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-mist via-mist-2 to-ice font-display text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -top-32 -left-24 size-[420px] rounded-full bg-brand/25 blur-[130px] orb-a" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute top-10 right-0 size-[460px] rounded-full bg-brand-2/25 blur-[130px] orb-b" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute bottom-[-140px] left-1/3 size-[440px] rounded-full bg-mint/20 blur-[130px] orb-c" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-10 mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "panel-glass flex items-center justify-between rounded-2xl px-6 py-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-base font-semibold text-on-brand shadow-lg shadow-brand/30",
								children: "GF"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-lg font-semibold leading-none tracking-tight",
								children: "GoalForge"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft",
								children: "Agent Orchestration"
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							className: "hidden items-center gap-1 rounded-xl border border-line/60 bg-panel/40 p-1 lg:flex",
							children: navItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setActiveNav(item),
								className: activeNav === item ? "rounded-lg bg-panel/80 px-4 py-2 text-sm font-medium shadow-sm" : "rounded-lg px-4 py-2 text-sm text-ink-soft hover:text-ink",
								children: item
							}, item))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: `flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] text-ink ${online === false ? "border-rose/40 bg-rose/10" : "border-mint/40 bg-mint/10"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `size-2 rounded-full shadow ${online === false ? "bg-rose shadow-rose/50" : "bg-mint shadow-mint/50"}` }),
									" ",
									online === false ? "backend offline" : online === null ? "checking backend" : "backend online"
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid size-10 place-items-center rounded-full bg-gradient-to-br from-ink to-brand-2 text-xs font-semibold text-on-brand",
								children: "AR"
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 gap-6 lg:grid-cols-12",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "lg:col-span-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "panel-glass rounded-2xl p-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-sm font-semibold uppercase tracking-[0.18em] text-ink-soft",
										children: "Goal Input"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded-full bg-brand/10 px-3 py-1 font-mono text-[11px] text-brand",
										children: "Ready"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 rounded-xl border border-line/70 bg-panel/60 p-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-lg font-medium leading-snug",
										children: run.goal
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-4 flex flex-wrap gap-2",
										children: run.chips.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "rounded-lg border border-line/70 bg-panel/50 px-3 py-1 font-mono text-[11px] text-ink-soft",
											children: c
										}, c))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									className: "mt-4 flex gap-3",
									onSubmit: submit,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: draft,
										onChange: (e) => setDraft(e.target.value),
										disabled: loading,
										className: "flex-1 rounded-xl border border-line/70 bg-panel/50 px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:border-brand/50 disabled:opacity-60",
										placeholder: "Describe a real-world goal…"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "submit",
										disabled: loading,
										className: "rounded-xl bg-gradient-to-br from-brand to-brand-2 px-5 py-3 text-sm font-semibold text-on-brand shadow-lg shadow-brand/30 disabled:opacity-60",
										children: loading ? "Forging…" : "Forge Plan"
									})]
								}),
								loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 font-mono text-[11px] text-brand",
									children: "Contacting backend · generating plan…"
								}),
								error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									role: "alert",
									className: "mt-3 rounded-lg border border-rose/40 bg-rose/10 px-3 py-2 font-mono text-[11px] text-ink",
									children: ["Backend error — ", error]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "panel-glass mt-6 rounded-2xl p-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-sm font-semibold uppercase tracking-[0.18em] text-ink-soft",
									children: "Plan"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-[11px] text-ink-soft",
									children: "v3 · updated 2m ago"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
								className: "mt-5 space-y-4",
								children: run.plan.map((step, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex gap-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `grid size-8 shrink-0 place-items-center rounded-full font-mono text-xs font-medium ${step.status === "done" ? "bg-mint/15 text-mint" : step.status === "running" ? "bg-brand/15 text-brand" : "bg-ink/8 text-ink-soft"}`,
											children: i + 1
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium",
												children: step.title
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: `h-full rounded-full transition-all duration-700 ${step.status === "done" ? "bg-mint" : step.status === "running" ? "bg-gradient-to-r from-brand to-brand-2" : "bg-ink/30"}`,
													style: { width: `${step.progress}%` }
												})
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `self-center font-mono text-[11px] ${statusText[step.status]}`,
											children: step.status
										})
									]
								}, step.id))
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-6 lg:col-span-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "panel-glass rounded-2xl p-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-sm font-semibold uppercase tracking-[0.18em] text-ink-soft",
										children: "Agent Activity"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-amber shadow shadow-amber/50" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-5 space-y-4 font-mono text-[12px]",
									children: run.activity.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `mt-0.5 size-2 shrink-0 rounded-full ${a.tone === "brand" ? "bg-brand" : a.tone === "mint" ? "bg-mint" : "bg-amber"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-ink",
											children: a.message
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-ink-soft/80",
											children: [
												a.time,
												" · ",
												a.kind
											]
										})] })]
									}, a.id))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "panel-glass rounded-2xl p-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-sm font-semibold uppercase tracking-[0.18em] text-ink-soft",
									children: "Tasks"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-4 space-y-3 text-sm",
									children: tasks.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => toggleTask(t.id),
										disabled: busy !== null || loading,
										"aria-pressed": t.status === "done",
										className: "flex w-full items-center gap-3 text-left",
										children: [
											t.status === "done" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "grid size-5 place-items-center rounded-md bg-mint/15 text-mint",
												children: "✓"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-5 rounded-md border-2 border-brand/60" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "flex-1",
												children: t.title
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `font-mono text-[11px] ${t.status === "done" ? "text-ink-soft" : "text-brand"}`,
												children: t.status
											})
										]
									}) }, t.id))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "rounded-2xl border border-amber/40 bg-panel/60 p-6 shadow-[0_18px_50px_-20px_color-mix(in_oklab,var(--color-amber)_40%,transparent)] backdrop-blur-2xl",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
									className: "flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-ink-soft",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-amber" }), " Approval Request"]
								}), approvals.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 font-mono text-[11px] text-ink-soft",
									children: decided ? `Last request ${decided}. Nothing else waiting.` : "Nothing waiting on you."
								}) : approvals.map((ap) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 text-sm font-medium",
										children: ap.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 font-mono text-[11px] text-ink-soft",
										children: ap.detail
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-4 flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => decide(ap.id, "approved"),
											disabled: busy !== null || loading,
											className: "flex-1 rounded-xl bg-gradient-to-br from-brand to-brand-2 px-4 py-2.5 text-sm font-semibold text-on-brand shadow-lg shadow-brand/30",
											children: "Approve"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => decide(ap.id, "declined"),
											disabled: busy !== null || loading,
											className: "rounded-xl border border-line/70 bg-panel/50 px-4 py-2.5 text-sm font-medium text-ink-soft",
											children: "Decline"
										})]
									})
								] }, ap.id))]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "panel-glass max-h-[720px] overflow-y-auto rounded-2xl p-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-sm font-semibold uppercase tracking-[0.18em] text-ink-soft",
									children: "Final Outcome"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 rounded-xl border border-mint/30 bg-gradient-to-br from-panel/70 to-mint/5 p-5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-mono text-[11px] uppercase tracking-[0.14em] text-mint",
											children: run.result.label
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-xl font-semibold tracking-tight",
											children: run.result.headline
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-sm text-ink-soft",
											children: run.result.note
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-5 border-t border-line/60 pt-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft",
													children: "Final Plan"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-2 text-sm text-ink-soft",
													children: run.result.summary
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
													className: "mt-4 space-y-3",
													children: (run.result.completedSteps ?? run.plan.map((step) => step.title)).map((step, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
														className: "flex gap-3",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "grid size-6 shrink-0 place-items-center rounded-full bg-mint/15 font-mono text-[10px] text-mint",
															children: i + 1
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-sm font-medium",
															children: step
														})]
													}, `${step}-${i}`))
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-5 border-t border-line/60 pt-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium text-mint",
												children: "✓ Goal completed and verified"
											})
										})
									]
								})]
							})
						]
					})]
				})]
			})
		]
	});
}
//#endregion
export { Dashboard as component };
