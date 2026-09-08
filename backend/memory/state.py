from datetime import datetime, timezone

from backend.models.schemas import (
    Activity,
    ApprovalRequest,
    Plan,
    TaskStatus,
)


class GoalState:
    """Runtime state for one GoalForge execution."""

    def __init__(self, goal: str):
        self.goal = goal
        self.plan: Plan | None = None
        self.activities: list[Activity] = []
        self.approval = ApprovalRequest()
        self.result: str | None = None
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = self.created_at

    def set_plan(self, plan: Plan):
        self.plan = plan
        self._touch()

    def add_activity(self, activity: Activity):
        self.activities.append(activity)
        self._touch()

    def update_task(
        self,
        task_id: str,
        status: TaskStatus,
        result: str | None = None,
    ) -> bool:
        if not self.plan:
            return False

        for task in self.plan.tasks:
            if task.id == task_id:
                task.status = status

                if result is not None:
                    task.result = result

                self._touch()
                return True

        return False

    def request_approval(
        self,
        reason: str,
        task_id: str | None = None,
    ):
        self.approval = ApprovalRequest(
            required=True,
            reason=reason,
            task_id=task_id,
        )

        self.add_activity(
            Activity(
                type="approval_required",
                message=f"Human approval required: {reason}",
                task_id=task_id,
            )
        )

        if task_id:
            self.update_task(
                task_id,
                TaskStatus.WAITING_APPROVAL,
            )

        self._touch()

    def approve(self):
        self.clear_approval()

    def decline(self):
        task_id = self.approval.task_id

        if task_id:
            self.update_task(
                task_id,
                TaskStatus.FAILED,
                result="Human approval declined.",
            )

        self.clear_approval()

    def clear_approval(self):
        self.approval = ApprovalRequest()
        self._touch()

    def set_result(self, result: str):
        self.result = result
        self._touch()

    def _touch(self):
        self.updated_at = datetime.now(timezone.utc)
