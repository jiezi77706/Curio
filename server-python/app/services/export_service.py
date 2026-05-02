from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Event
from app.services.calendar_payload import build_calendar_payload
from app.services.notification_payload import build_notification_payload
from app.services.time_utils import coerce_timezone


def serialize_datetime(value: datetime | None) -> str | None:
    normalized = coerce_timezone(value)
    return normalized.isoformat() if normalized else None


def display_source_name(source_name: str) -> str:
    mapping = {"humanitix": "Humanitix", "rubric": "Rubric", "eventbrite": "Eventbrite"}
    return mapping.get(source_name, source_name.title())


def build_event_export_item(event: Event) -> dict[str, Any]:
    return {
        "id": event.id,
        "title": event.title,
        "summary": event.short_summary or event.description or "",
        "description": event.description,
        "topics": event.topic_tags or [],
        "source": display_source_name(event.source_name),
        "source_url": event.source_url,
        "registration_url": event.registration_url,
        "start_datetime": serialize_datetime(event.start_datetime),
        "end_datetime": serialize_datetime(event.end_datetime),
        "timezone": event.timezone,
        "venue": {
            "name": event.venue_name,
            "address": event.venue_address,
            "mode": event.online_or_physical,
        },
        "organizer": event.organizer,
        "status": event.status,
        "calendar_payload": build_calendar_payload(event),
        "notification_payload": build_notification_payload(event),
    }


def build_export_payload(db: Session) -> dict[str, Any]:
    events = list(db.scalars(select(Event)).all())
    events.sort(
        key=lambda event: (
            event.start_datetime is None,
            coerce_timezone(event.start_datetime) or datetime.max.replace(tzinfo=timezone.utc),
            event.title.lower(),
        )
    )
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_events": len(events),
        "events": [build_event_export_item(event) for event in events],
    }
    return payload


def write_export_file(payload: dict[str, Any]) -> None:
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    settings.export_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
