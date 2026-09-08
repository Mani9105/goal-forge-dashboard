from strands import tool
from datetime import datetime, timezone


@tool
def verify_task(
    task_title: str,
    expected_outcome: str,
    actual_output: str,
) -> dict:
    """
    Verify whether the actual output meaningfully matches
    the expected outcome using deterministic checks.
    """

    task_title = task_title.strip()
    expected_outcome = expected_outcome.strip()
    actual_output = actual_output.strip()

    if not task_title:
        return {
            "verified": False,
            "reason": "Task title is missing.",
        }

    if not expected_outcome:
        return {
            "verified": False,
            "reason": "Expected outcome is missing.",
        }

    if not actual_output:
        return {
            "verified": False,
            "reason": "No execution output was produced.",
        }

    # Normalize text for comparison.
    expected_words = {
        word.strip(".,!?;:()[]{}\"'")
        for word in expected_outcome.lower().split()
        if len(word.strip(".,!?;:()[]{}\"'")) >= 4
    }

    actual_text = actual_output.lower()

    # Check how much of the meaningful expected language
    # appears in the actual result.
    matched_words = [
        word for word in expected_words
        if word in actual_text
    ]

    match_ratio = (
        len(matched_words) / len(expected_words)
        if expected_words
        else 0
    )

    # Require both useful output and meaningful overlap
    # with the expected outcome.
    verified = len(actual_output) >= 20 and match_ratio >= 0.30

    return {
        "verified": verified,
        "task": task_title,
        "expected_outcome": expected_outcome,
        "actual_output": actual_output,
        "matched_words": matched_words,
        "match_ratio": round(match_ratio, 2),
        "reason": (
            "Output meaningfully matches the expected outcome."
            if verified
            else (
                "Output does not sufficiently match the expected outcome."
            )
        ),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
