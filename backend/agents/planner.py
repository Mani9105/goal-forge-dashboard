import json

from backend.models.schemas import AgentPlan


def parse_agent_plan(agent_response: str) -> AgentPlan:
    """
    Convert the agent's JSON response into a validated AgentPlan.
    """

    text = agent_response.strip()

    if not text:
        raise ValueError("Agent returned an empty planning response.")

    # Handle responses wrapped in a Markdown JSON code block.
    if text.startswith("```"):
        lines = text.splitlines()

        if lines[0].startswith("```"):
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        text = "\n".join(lines).strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(
            "Agent planning response was not valid JSON."
        ) from exc

    return AgentPlan.model_validate(data)
