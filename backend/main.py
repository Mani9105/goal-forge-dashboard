from fastapi import FastAPI

from backend.api.routes import router

app = FastAPI(
    title="GoalForge API",
    description="Autonomous goal-to-outcome agent",
    version="0.1.0",
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "name": "GoalForge",
        "status": "online",
        "message": "Goal-to-outcome agent API",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}