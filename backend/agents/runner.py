from backend.memory.state import GoalState
from backend.models.schemas import Activity, ActivityType, TaskStatus
from backend.tools.execution import execute_task
from backend.tools.verification import verify_task


MAX_RETRIES = 2


def requires_approval(task_title: str, task_description: str) -> bool:
    """
    Detect tasks that may have consequential external effects.
    """

    text = f"{task_title} {task_description}".lower()

    approval_keywords = [
        "send",
        "email",
        "delete",
        "purchase",
        "buy",
        "pay",
        "publish",
        "post",
        "submit",
        "book",
        "cancel",
        "invite",
        "contact",
        "change account",
    ]

    return any(keyword in text for keyword in approval_keywords)


def run_task(state: GoalState, task_id: str) -> bool:
    """
    Execute one task, verify it, and retry failed tasks.

    Consequential tasks pause for human approval before execution.
    """

    if not state.plan:
        return False

    task = next(
        (task for task in state.plan.tasks if task.id == task_id),
        None,
    )

    if task is None:
        return False

    # Pause before consequential external actions.
    if requires_approval(task.title, task.description):
        state.request_approval(
            reason=(
                f"Task may perform a consequential action: "
                f"{task.title}"
            ),
            task_id=task_id,
        )

        return False

    for attempt in range(1, MAX_RETRIES + 1):
        state.update_task(task_id, TaskStatus.RUNNING)

        state.add_activity(
            Activity(
                type=ActivityType.TASK_STARTED,
                message=(
                    f"Started task: {task.title}"
                    f" (attempt {attempt}/{MAX_RETRIES})"
                ),
                task_id=task_id,
            )
        )

        execution = execute_task(
            task_title=task.title,
            task_description=task.description,
        )

        if not execution.get("success"):
            state.add_activity(
                Activity(
                    type=ActivityType.RECOVERY,
                    message=(
                        f"Execution failed for {task.title}. "
                        f"Recovery attempt {attempt}/{MAX_RETRIES}."
                    ),
                    task_id=task_id,
                )
            )

            if attempt == MAX_RETRIES:
                state.update_task(
                    task_id,
                    TaskStatus.FAILED,
                    result=execution.get("error"),
                )
                return False

            continue

        output = execution.get("output", "")

        state.add_activity(
            Activity(
                type=ActivityType.TOOL_USED,
                message=f"Execution tool used for: {task.title}",
                task_id=task_id,
            )
        )

        verification = verify_task(
            task_title=task.title,
            expected_outcome=task.expected_outcome,
            actual_output=output,
        )

        if verification.get("verified"):
            state.update_task(
                task_id,
                TaskStatus.COMPLETED,
                result=output,
            )

            task.verified = True

            state.add_activity(
                Activity(
                    type=ActivityType.VERIFICATION,
                    message=f"Verified task: {task.title}",
                    task_id=task_id,
                )
            )

            state.add_activity(
                Activity(
                    type=ActivityType.TASK_COMPLETED,
                    message=f"Completed and verified: {task.title}",
                    task_id=task_id,
                )
            )

            return True

        state.add_activity(
            Activity(
                type=ActivityType.VERIFICATION,
                message=(
                    f"Verification failed for {task.title}: "
                    f"{verification.get('reason', '')}"
                ),
                task_id=task_id,
            )
        )

        if attempt < MAX_RETRIES:
            state.add_activity(
                Activity(
                    type=ActivityType.RECOVERY,
                    message=(
                        f"GoalForge detected a failed outcome and "
                        f"is retrying: {task.title}"
                    ),
                    task_id=task_id,
                )
            )
        else:
            state.update_task(
                task_id,
                TaskStatus.FAILED,
                result=output,
            )

            state.add_activity(
                Activity(
                    type=ActivityType.RECOVERY,
                    message=(
                        f"Recovery failed after {MAX_RETRIES} attempts: "
                        f"{task.title}"
                    ),
                    task_id=task_id,
                )
            )

            return False

    return False


def run_plan(state: GoalState) -> GoalState:
    """
    Execute all tasks sequentially with recovery attempts.

    The plan pauses when a task requires human approval.
    """

    if not state.plan:
        return state

    for task in state.plan.tasks:
        success = run_task(state, task.id)

        if state.approval.required:
            state.add_activity(
                Activity(
                    type=ActivityType.APPROVAL_REQUIRED,
                    message=(
                        f"Plan paused until approval is received: "
                        f"{task.title}"
                    ),
                    task_id=task.id,
                )
            )
            break

        if not success:
            state.add_activity(
                Activity(
                    type=ActivityType.RECOVERY,
                    message=(
                        f"Plan execution stopped after task failure: "
                        f"{task.title}"
                    ),
                    task_id=task.id,
                )
            )
            break

    return state
