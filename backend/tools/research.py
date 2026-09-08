from strands import tool
from datetime import datetime, timezone


@tool
def research_topic(topic: str) -> dict:
    """
    Basic research tool.

    This is intentionally a safe, deterministic tool for now.
    We'll replace/extend it with real web research once the
    core agent architecture is working.
    """

    topic = topic.strip()

    if not topic:
        return {
            "success": False,
            "topic": topic,
            "error": "Research topic cannot be empty.",
        }

    return {
        "success": True,
        "topic": topic,
        "summary": (
            f"Research request prepared for: {topic}. "
            "A real web research provider will be connected here."
        ),
        "sources": [],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }