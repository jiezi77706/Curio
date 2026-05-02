from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union
from uuid import uuid4

from sqlalchemy import DateTime, Index, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (
        Index("ix_events_source_external", "source_name", "external_event_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    source_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    source_url: Mapped[Optional[str]] = mapped_column(String(1000), unique=True, nullable=True)
    external_event_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    short_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    topic_tags: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    event_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    organizer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    start_datetime: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    end_datetime: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    timezone: Mapped[str] = mapped_column(String(64), default="Australia/Sydney", nullable=False)
    venue_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    venue_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    online_or_physical: Mapped[str] = mapped_column(String(50), default="unknown", nullable=False)
    registration_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    price_type: Mapped[str] = mapped_column(String(50), default="unknown", nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="unknown", nullable=False)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    last_updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    raw_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Use Any for the JSON column — avoids Union type eval issues on Python 3.9
    raw_json: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)


class SyncRun(Base):
    __tablename__ = "sync_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    source_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="running")
    events_found: Mapped[int] = mapped_column(default=0, nullable=False)
    events_created: Mapped[int] = mapped_column(default=0, nullable=False)
    events_updated: Mapped[int] = mapped_column(default=0, nullable=False)
    errors_json: Mapped[List[Any]] = mapped_column(JSON, default=list, nullable=False)
