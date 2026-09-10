export type Status = "done" | "running" | "queued" | "awaiting";

export type TaskItem = {
  id: string;
  title: string;
  description: string;
  expectedOutcome: string;
  result: string;
  verified: boolean;
  failed: boolean;
  status: Status;
};

export type ApprovalItem = {
  id: string;
  title: string;
  detail: string;
};

export type GoalRun = {
  goal: string;
  tasks: TaskItem[];
  approvals: ApprovalItem[];
  result: {
    headline: string;
    note: string;
    progress: number;
    summary: string;
    completedSteps: string[];
    nextSteps: string[];
  };
};

/** Empty starting state — nothing is shown until the backend replies. */
export const defaultRun: GoalRun = {
  goal: "",
  tasks: [],
  approvals: [],
  result: { headline: "", note: "", progress: 0, summary: "", completedSteps: [], nextSteps: [] },
};
