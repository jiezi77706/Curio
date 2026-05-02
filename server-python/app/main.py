from __future__ import annotations

import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import models  # noqa: F401
from app.api.agent_export import router as export_router
from app.api.events import router as events_router
from app.api.recommend import router as recommend_router
from app.api.sync import router as sync_router
from app.config import settings
from app.database import init_db
from app.services.sync_service import run_sync, shutdown_scheduler, start_scheduler

app = FastAPI(
    title="ANU Event Database Agent",
    version="0.2.0",
    description="ANU student event aggregator with Gemini AI recommendations.",
)

# ── CORS — allow React frontend on any localhost port ─────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(settings.static_dir)), name="static")

app.include_router(export_router)
app.include_router(events_router)
app.include_router(sync_router)
app.include_router(recommend_router)


@app.on_event("startup")
async def startup_event() -> None:
    init_db()
    start_scheduler()
    asyncio.create_task(run_sync(trigger="startup"))


@app.on_event("shutdown")
async def shutdown_event() -> None:
    shutdown_scheduler()
