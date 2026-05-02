from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Event
from app.schemas import EventRead, SyncRunRead
from app.services.sync_service import get_latest_sync_run
from app.services.time_utils import coerce_timezone

router = APIRouter()
templates = Jinja2Templates(directory=str(settings.template_dir))


def _matches_filters(event: Event, q: str | None, source: str | None, topic: str | None) -> bool:
    if q:
        needle = q.lower().strip()
        haystacks = [
            event.title or "",
            event.description or "",
            event.organizer or "",
            event.venue_name or "",
        ]
        if needle not in " ".join(haystacks).lower():
            return False

    if source and event.source_name.lower() != source.lower():
        return False

    if topic and topic not in (event.topic_tags or []):
        return False

    return True


def _sorted_events(events: list[Event]) -> list[Event]:
    return sorted(
        events,
        key=lambda event: (
            event.start_datetime is None,
            coerce_timezone(event.start_datetime) or datetime.max.replace(tzinfo=timezone.utc),
            -(event.last_updated_at.timestamp() if event.last_updated_at else 0),
        ),
    )


@router.get("/", response_class=HTMLResponse, include_in_schema=False)
def index(
    request: Request,
    q: str | None = Query(default=None),
    source: str | None = Query(default=None),
    topic: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> HTMLResponse:
    events = list(db.scalars(select(Event)).all())
    latest_sync = get_latest_sync_run(db)

    filtered_events = [event for event in events if _matches_filters(event, q, source, topic)]
    filtered_events = _sorted_events(filtered_events)

    sources = sorted({event.source_name for event in events if event.source_name})
    topics = sorted({tag for event in events for tag in (event.topic_tags or [])})

    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "request": request,
            "events": filtered_events,
            "sources": sources,
            "topics": topics,
            "selected_source": source or "",
            "selected_topic": topic or "",
            "query": q or "",
            "latest_sync": latest_sync,
        },
    )


@router.get("/events", response_model=list[EventRead])
def list_events(db: Session = Depends(get_db)) -> list[Event]:
    events = list(db.scalars(select(Event)).all())
    return _sorted_events(events)


@router.get("/events/upcoming", response_model=list[EventRead])
def upcoming_events(db: Session = Depends(get_db)) -> list[Event]:
    now = datetime.now(timezone.utc)
    events = list(db.scalars(select(Event)).all())
    upcoming = [
        event
        for event in events
        if coerce_timezone(event.start_datetime) and coerce_timezone(event.start_datetime).astimezone(timezone.utc) >= now
    ]
    return _sorted_events(upcoming)


@router.get("/events/{event_id}", response_model=EventRead)
def get_event(
    event_id: str,
    request: Request,
    view: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if view == "html":
        return templates.TemplateResponse(
            request=request,
            name="event_detail.html",
            context={"request": request, "event": event},
        )

    return event
