from fastapi import APIRouter, HTTPException

from backend.agents.orchestrator import generate_final_outcome, run_goal
from backend.agents.runner import run_plan
from backend.memory.state import GoalState
from backend.models.schemas import (
    Activity,
    ActivityType,
    ApprovalRequest,
    GoalRequest,
    GoalResponse,
    FinalOutcome,
    Plan,
    Task,
    TaskStatus,
)

router = APIRouter()

# Runtime state for active GoalForge sessions.
goal_states: dict[str, GoalState] = {}


@router.post("/generate", response_model=GoalResponse)
def generate_goal(request: GoalRequest):
    """
    Generate a plan and store its runtime state.
    """

    goal = request.goal.strip()

    if not goal:
        raise HTTPException(
            status_code=400,
            detail="Goal cannot be empty.",
        )

    try:
        agent_plan = run_goal(goal)

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"GoalForge agent execution failed: {exc}",
        ) from exc

    tasks = []

    for index, agent_task in enumerate(agent_plan.tasks, start=1):
        tasks.append(
            Task(
                id=f"task-{index}",
                title=agent_task.title,
                description=agent_task.description,
                expected_outcome=agent_task.expected_outcome,
                status=TaskStatus.QUEUED,
            )
        )

    if not tasks:
        raise HTTPException(
            status_code=502,
            detail="GoalForge agent returned a plan with no tasks.",
        )

    plan = Plan(
        objective=agent_plan.objective,
        tasks=tasks,
    )

    state = GoalState(goal)
    state.set_plan(plan)

    state.add_activity(
        Activity(
            type=ActivityType.GOAL_UNDERSTOOD,
            message="Goal understood by GoalForge.",
        )
    )

    state.add_activity(
        Activity(
            type=ActivityType.PLAN_CREATED,
            message=f"Created an execution plan with {len(tasks)} tasks.",
        )
    )

    goal_states[goal] = state

    return GoalResponse(
        goal=goal,
        plan=plan,
        activities=state.activities,
        approval=state.approval,
        result=state.result,
    )


@router.post("/execute/{task_id}", response_model=GoalResponse)
def execute_goal_task(task_id: str, goal: str):
    """
    Execute one task from an existing GoalForge session.
    """

    state = goal_states.get(goal)

    if state is None:
        raise HTTPException(
            status_code=404,
            detail="Goal session not found.",
        )

    success = run_plan(state)

    all_completed = (
        state.plan is not None
        and all(
            task.status == TaskStatus.COMPLETED and task.verified
            for task in state.plan.tasks
        )
    )

    if all_completed:
        completed = [
            task
            for task in state.plan.tasks
            if task.status == TaskStatus.COMPLETED and task.verified
        ]

        try:
            outcome = generate_final_outcome(
                state.goal,
                state.plan,
            )

            state.set_result(
                FinalOutcome(
                    summary=outcome.get(
                        "summary",
                        f"GoalForge completed: {state.plan.objective}",
                    ),
                    completed_steps=outcome.get(
                        "completed_steps",
                        [
                            task.result or task.expected_outcome
                            for task in completed
                        ],
                    ),
                    next_steps=outcome.get("next_steps", []),
                )
            )

        except Exception:
            state.set_result(
                FinalOutcome(
                    summary=f"GoalForge completed: {state.plan.objective}",
                    completed_steps=[
                        task.result or task.expected_outcome
                        for task in completed
                    ],
                    next_steps=[],
                )
            )

    return GoalResponse(
        goal=state.goal,
        plan=state.plan,
        activities=state.activities,
        approval=state.approval,
        result=state.result,
    )


@router.post("/approve", response_model=GoalResponse)
def approve_goal(goal: str):
    """
    Approve the currently paused consequential action.
    """

    state = goal_states.get(goal)

    if state is None:
        raise HTTPException(
            status_code=404,
            detail="Goal session not found.",
        )

    if not state.approval.required:
        raise HTTPException(
            status_code=400,
            detail="No approval is currently required.",
        )

    task_id = state.approval.task_id

    state.approve()

    if task_id:
        run_plan(state)

    return GoalResponse(
        goal=state.goal,
        plan=state.plan,
        activities=state.activities,
        approval=state.approval,
        result=state.result,
    )


@router.post("/decline", response_model=GoalResponse)
def decline_goal(goal: str):
    """
    Decline the currently requested consequential action.
    """

    state = goal_states.get(goal)

    if state is None:
        raise HTTPException(
            status_code=404,
            detail="Goal session not found.",
        )

    if not state.approval.required:
        raise HTTPException(
            status_code=400,
            detail="No approval is currently required.",
        )

    state.decline()

    state.add_activity(
        Activity(
            type=ActivityType.RECOVERY,
            message="Human declined the requested action.",
        )
    )

    return GoalResponse(
        goal=state.goal,
        plan=state.plan,
        activities=state.activities,
        approval=state.approval,
        result=state.result,
    )
