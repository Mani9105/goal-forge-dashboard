from enum import Enum

from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    WAITING_APPROVAL = "waiting_approval"
    COMPLETED = "completed"
    FAILED = "failed"


class ActivityType(str, Enum):
    GOAL_UNDERSTOOD = "goal_understood"
    PLAN_CREATED = "plan_created"
    TASK_STARTED = "task_started"
    TOOL_USED = "tool_used"
    TASK_COMPLETED = "task_completed"
    VERIFICATION = "verification"
    APPROVAL_REQUIRED = "approval_required"
    RECOVERY = "recovery"


class Task(BaseModel):
    id: str
    title: str
    description: str
    expected_outcome: str
    status: TaskStatus = TaskStatus.QUEUED
    result: str | None = None
    verified: bool = False


class Plan(BaseModel):
    objective: str
    tasks: list[Task] = Field(default_factory=list)


class Activity(BaseModel):
    type: ActivityType
    message: str
    task_id: str | None = None


class ApprovalRequest(BaseModel):
    required: bool = False
    reason: str | None = None
    task_id: str | None = None


class GoalRequest(BaseModel):
    goal: str = Field(min_length=3)


class GoalResponse(BaseModel):
    goal: str
    plan: Plan
    activities: list[Activity] = Field(default_factory=list)
    approval: ApprovalRequest = Field(default_factory=ApprovalRequest)
    result: str | None = None
class AgentTask(BaseModel):
    title: str
    description: str
    expected_outcome: str


class AgentPlan(BaseModel):
    objective: str
    tasks: list[AgentTask] = Field(default_factory=list)
