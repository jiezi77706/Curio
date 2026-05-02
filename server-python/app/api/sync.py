from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import SyncRunRead, SyncSummaryResponse
from app.services.sync_service import get_latest_sync_run, run_sync

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/run", response_model=SyncSummaryResponse)
async def trigger_sync() -> SyncSummaryResponse:
    summary = await run_sync(trigger="manual")
    return SyncSummaryResponse(**summary)


@router.get("/status")
def sync_status(db: Session = Depends(get_db)):
    latest = get_latest_sync_run(db)
    if latest is None:
        return {"status": "never_run"}
    return latest
