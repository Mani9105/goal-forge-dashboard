def verify_task(
    task_title: str,
    expected_outcome: str,
    actual_output: str,
) -> dict:
    """
    Verify that an execution produced a usable result.

    GoalForge's current execution layer is a simulated executor, so
    successful execution is considered verified. This keeps verification
    deterministic until real external tools are connected.
    """

    success = bool(actual_output and actual_output.strip())

    return {
        "verified": success,
        "reason": (
            "Execution produced a result."
            if success
            else "Execution produced no result."
        ),
    }
