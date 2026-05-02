from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import AgentExportResponseSchema
from app.services.export_service import build_export_payload

router = APIRouter(tags=["export"])


@router.get("/events/export", response_model=AgentExportResponseSchema)
def export_events(db: Session = Depends(get_db)) -> AgentExportResponseSchema:
    payload = build_export_payload(db)
    return AgentExportResponseSchema(**payload)
