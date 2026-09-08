//#region node_modules/.nitro/vite/services/ssr/assets/mock-data-DI5bw04E.js
var defaultRun = {
	goal: "Plan and secure a 10-day solo trip to the Dolomites under $3,200.",
	chips: [
		"Travel",
		"$3,200 budget",
		"10 days",
		"Sep 12–21"
	],
	plan: [
		{
			id: "p1",
			title: "Scout flights & compare fares for Sep 12–21",
			status: "done",
			progress: 100
		},
		{
			id: "p2",
			title: "Shortlist 4 alpine lodges within budget",
			status: "done",
			progress: 100
		},
		{
			id: "p3",
			title: "Draft daily itinerary with hikes & gear",
			status: "running",
			progress: 62
		},
		{
			id: "p4",
			title: "Book, insure & finalize payment",
			status: "queued",
			progress: 0
		}
	],
	activity: [
		{
			id: "a1",
			agent: "FareAgent",
			message: "FareAgent re-ran 3 carriers",
			time: "09:41",
			kind: "pricing",
			tone: "brand"
		},
		{
			id: "a2",
			agent: "LodgeAgent",
			message: "LodgeAgent verified 4 stays",
			time: "09:38",
			kind: "sourcing",
			tone: "mint"
		},
		{
			id: "a3",
			agent: "Planner",
			message: "Planner drafting day 4–10",
			time: "now",
			kind: "composing",
			tone: "amber"
		}
	],
	tasks: [
		{
			id: "t1",
			title: "Collect passport details",
			status: "done"
		},
		{
			id: "t2",
			title: "Confirm travel dates",
			status: "done"
		},
		{
			id: "t3",
			title: "Approve gear list",
			status: "awaiting"
		}
	],
	approvals: [{
		id: "ap1",
		title: "Book return flight · $612",
		detail: "Lufthansa LH-118 · Sep 21 · refundable"
	}],
	result: {
		label: "Projected outcome",
		headline: "$2,948",
		note: "under budget",
		confidence: 87,
		summary: "Your goal has been completed through the planned steps below.",
		completedSteps: [
			"Understand the basics of Python",
			"Practice coding exercises",
			"Build projects",
			"Read documentation and blogs",
			"Participate in coding communities",
			"Review and summarize weekly",
			"Prepare for a final test"
		]
	}
};
function buildRun(goal) {
	return {
		goal: goal.trim(),
		chips: [
			"New goal",
			"Auto-scoped",
			"4 agents",
			"Draft v1"
		],
		plan: [
			{
				id: "p1",
				title: "Clarify scope, constraints & success criteria",
				status: "done",
				progress: 100
			},
			{
				id: "p2",
				title: "Research options and gather source data",
				status: "running",
				progress: 45
			},
			{
				id: "p3",
				title: "Draft the working plan with trade-offs",
				status: "queued",
				progress: 0
			},
			{
				id: "p4",
				title: "Execute, verify & hand off results",
				status: "queued",
				progress: 0
			}
		],
		activity: [
			{
				id: "a1",
				agent: "Planner",
				message: "Goal parsed · 4 steps generated",
				time: "now",
				kind: "init",
				tone: "brand"
			},
			{
				id: "a2",
				agent: "ScoutAgent",
				message: "ScoutAgent gathering sources",
				time: "now",
				kind: "research",
				tone: "amber"
			},
			{
				id: "a3",
				agent: "CheckAgent",
				message: "Constraints validated",
				time: "now",
				kind: "review",
				tone: "mint"
			}
		],
		tasks: [
			{
				id: "t1",
				title: "Capture constraints",
				status: "done"
			},
			{
				id: "t2",
				title: "Compare candidate approaches",
				status: "running"
			},
			{
				id: "t3",
				title: "Approve working budget",
				status: "awaiting"
			}
		],
		approvals: [{
			id: "ap1",
			title: "Start research spend · $40",
			detail: "Paid data sources · cancel anytime"
		}],
		result: {
			label: "Projected outcome",
			headline: "In progress",
			note: "estimating",
			confidence: 41
		}
	};
}
//#endregion
export { defaultRun as n, buildRun as t };
