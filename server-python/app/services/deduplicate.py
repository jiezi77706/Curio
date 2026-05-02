from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any

from rapidfuzz.fuzz import token_set_ratio
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Event, utc_now


@dataclass
class UpsertResult:
    event: Event
    created: bool
    updated: bool


def normalize_title(title: str | None) -> str:
    if not title:
        return ""
    normalized = re.sub(r"[^a-z0-9\s]", " ", title.lower())
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def compute_content_hash(event_data: dict[str, Any]) -> str:
    payload = {key: value for key, value in event_data.items() if key != "content_hash"}
    encoded = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def event_date(value: datetime | None) -> date | None:
    return value.date() if value else None


def same_or_near_date(first: datetime | None, second: datetime | None, max_days: int = 1) -> bool:
    if not first or not second:
        return False
    return abs((first.date() - second.date()).days) <= max_days


def has_meaningful_value(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return value.strip() not in {"", "unknown"}
    if isinstance(value, (list, dict, tuple, set)):
        return bool(value)
    return True


def find_duplicate(session: Session, incoming: dict[str, Any]) -> Event | None:
    source_url = incoming.get("source_url")
    if source_url:
        existing = session.scalar(select(Event).where(Event.source_url == source_url))
        if existing:
            return existing

    external_event_id = incoming.get("external_event_id")
    source_name = incoming.get("source_name")
    if external_event_id and source_name:
        existing = session.scalar(
            select(Event).where(
                Event.external_event_id == external_event_id,
                Event.source_name == source_name,
            )
        )
        if existing:
            return existing

    incoming_title = normalize_title(incoming.get("title"))
    incoming_start = incoming.get("start_datetime")
    candidates = list(session.scalars(select(Event)).all())

    for candidate in candidates:
        if normalize_title(candidate.title) == incoming_title and event_date(candidate.start_datetime) == event_date(incoming_start):
            return candidate

    for candidate in candidates:
        if token_set_ratio(normalize_title(candidate.title), incoming_title) > 90 and same_or_near_date(candidate.start_datetime, incoming_start):
            return candidate

    return None


def apply_event_update(existing: Event, incoming: dict[str, Any], content_hash: str) -> bool:
    changed = False
    now = utc_now()

    for field, value in incoming.items():
        if field in {"id", "created_at", "content_hash"}:
            continue

        current_value = getattr(existing, field)
        if has_meaningful_value(value) or not has_meaningful_value(current_value):
            if current_value != value:
                setattr(existing, field, value)
                changed = True

    existing.last_seen_at = now

    if existing.content_hash != content_hash:
        existing.content_hash = content_hash
        existing.last_updated_at = now
        changed = True

    return changed


def upsert_event(session: Session, incoming: dict[str, Any]) -> UpsertResult:
    now = utc_now()
    content_hash = compute_content_hash(incoming)
    duplicate = find_duplicate(session, incoming)

    if duplicate:
        updated = apply_event_update(duplicate, incoming, content_hash)
        duplicate.last_seen_at = now
        return UpsertResult(event=duplicate, created=False, updated=updated)

    new_event = Event(
        **incoming,
        content_hash=content_hash,
        last_seen_at=now,
        last_updated_at=now,
        created_at=now,
    )
    session.add(new_event)
    return UpsertResult(event=new_event, created=True, updated=False)
