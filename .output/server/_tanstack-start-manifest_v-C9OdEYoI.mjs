//#region node_modules/.nitro/vite/services/ssr/assets/_tanstack-start-manifest_v-C9OdEYoI.js
var tsrStartManifest = () => ({ routes: {
	__root__: {
		filePath: "/workspaces/goal-forge-dashboard/src/routes/__root.tsx",
		children: [
			"/",
			"/api/agent-status",
			"/api/goals",
			"/api/approvals/$approvalId",
			"/api/tasks/$taskId"
		],
		preloads: ["/assets/index-C4oRlR20.js"],
		scripts: [{ attrs: {
			type: "module",
			async: !0,
			src: "/assets/index-C4oRlR20.js"
		} }]
	},
	"/": {
		filePath: "/workspaces/goal-forge-dashboard/src/routes/index.tsx",
		children: void 0,
		preloads: ["/assets/routes-CXw9tvGP.js"]
	}
} });
//#endregion
export { tsrStartManifest };
