import json
import os

from strands import Agent
from strands.models.ollama import OllamaModel

from backend.agents.planner import parse_agent_plan
from backend.tools.execution import execute_task
from backend.tools.research import research_topic
from backend.tools.verification import verify_task


MODEL_ID = os.getenv(
    "GOALFORGE_MODEL_ID",
    "qwen2.5:7b",
)

SYSTEM_PROMPT = """
You are GoalForge, an autonomous goal-to-outcome agent.

Your first responsibility is to create a structured execution plan.

For the user's goal:

1. Understand the desired outcome.
2. Identify important requirements and constraints.
3. Break the goal into logical, actionable tasks.
4. Give every task:
   - title
   - description
   - expected_outcome

Return ONLY valid JSON.

The JSON must have exactly this structure:

{
  "objective": "one sentence describing the desired outcome",
  "tasks": [
    {
      "title": "task title",
      "description": "what needs to be done",
      "expected_outcome": "what successful completion looks like"
    }
  ]
}

Rules:

- Do not use Markdown.
- Do not put the JSON inside ``` fences.
- Do not add explanations before or after the JSON.
- Create practical tasks rather than vague advice.
- Tasks should move the user toward a real outcome.
- Do not claim that tasks have already been completed.
"""


def create_goalforge_agent() -> Agent:
    model = OllamaModel(
        model_id=MODEL_ID,
        host=os.getenv("OLLAMA_HOST", "http://localhost:11434"),
    )

    return Agent(
        model=model,
        system_prompt=SYSTEM_PROMPT,
        tools=[
            research_topic,
            execute_task,
            verify_task,
        ],
    )


def run_goal(goal: str):
    agent = create_goalforge_agent()

    response = agent(goal)

    response_text = str(response)

    plan = parse_agent_plan(response_text)

    return plan
