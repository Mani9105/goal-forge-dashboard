from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import router

app = FastAPI(
    title="GoalForge API",
    description="Autonomous goal-to-outcome agent",
    version="0.1.0",
)

# The dashboard is served from a different origin, so browser calls need CORS.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost(:\d+)?|.*\.lovable\.app|.*\.lovableproject\.com)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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