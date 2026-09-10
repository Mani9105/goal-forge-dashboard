from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import router

app = FastAPI(title="GoalForge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://goal-forge-dashboard.vercel.app"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {"message": "GoalForge API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}
