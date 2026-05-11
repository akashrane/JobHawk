from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from api.routes import jobs, applications, drafts, resume, settings as settings_router, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="JobHawk API",
    description="AI-powered job application agent",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
app.include_router(applications.router, prefix="/api/applications", tags=["applications"])
app.include_router(drafts.router, prefix="/api/drafts", tags=["drafts"])
app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["settings"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "environment": settings.environment}
