from __future__ import annotations

import asyncio

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app import models  # noqa: F401
from app.api.agent_export import router as export_router
from app.api.events import router as events_router
from app.api.sync import router as sync_router
from app.config import settings
from app.database import init_db
from app.services.sync_service import run_sync, shutdown_scheduler, start_scheduler

app = FastAPI(
    title="ANU Event Database Agent",
    version="0.1.0",
    description="Local-first ANU student event database, sync API, and lightweight admin UI.",
)

app.mount("/static", StaticFiles(directory=str(settings.static_dir)), name="static")

app.include_router(export_router)
app.include_router(events_router)
app.include_router(sync_router)


@app.on_event("startup")
async def startup_event() -> None:
    init_db()
    start_scheduler()
    asyncio.create_task(run_sync(trigger="startup"))


@app.on_event("shutdown")
async def shutdown_event() -> None:
    shutdown_scheduler()
