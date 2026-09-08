from strands import tool
from datetime import datetime, timezone


@tool
def execute_task(task_title: str, task_description: str) -> dict:
    """
    Execute a GoalForge task.

    This first version simulates a safe execution step.
    Real external actions will be connected later.
    """

    task_title = task_title.strip()
    task_description = task_description.strip()

    if not task_title or not task_description:
        return {
            "success": False,
            "error": "Task title and description are required.",
        }

    return {
        "success": True,
        "task": task_title,
        "description": task_description,
        "output": (
            f"Execution completed for task: {task_title}. "
            "Real external actions will be connected here."
        ),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }