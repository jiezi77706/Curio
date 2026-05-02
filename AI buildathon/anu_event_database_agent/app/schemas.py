from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class EventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source_name: str
    source_url: str | None = None
    external_event_id: str | None = None
    title: str
    description: str | None = None
    short_summary: str | None = None
    topic_tags: list[str] = Field(default_factory=list)
    event_type: str | None = None
    organizer: str | None = None
    start_datetime: datetime | None = None
    end_datetime: datetime | None = None
    timezone: str
    venue_name: str | None = None
    venue_address: str | None = None
    online_or_physical: str
    registration_url: str | None = None
    price_type: str
    image_url: str | None = None
    status: str
    last_seen_at: datetime
    last_updated_at: datetime
    created_at: datetime
    raw_text: str | None = None
    raw_json: dict[str, Any] | list[Any] | None = None
    content_hash: str


class SyncRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source_name: str
    started_at: datetime
    finished_at: datetime | None = None
    status: str
    events_found: int
    events_created: int
    events_updated: int
    errors_json: list[dict[str, Any]] = Field(default_factory=list)


class CalendarPayloadSchema(BaseModel):
    title: str
    description: str
    location: str
    start: str | None = None
    end: str | None = None
    timezone: str
    url: str | None = None


class NotificationPayloadSchema(BaseModel):
    title: str
    message: str
    priority: str
    suggested_reminders: list[str] = Field(default_factory=list)


class VenueSchema(BaseModel):
    name: str | None = None
    address: str | None = None
    mode: str


class AgentExportEventSchema(BaseModel):
    id: str
    title: str
    summary: str
    description: str | None = None
    topics: list[str] = Field(default_factory=list)
    source: str
    source_url: str | None = None
    registration_url: str | None = None
    start_datetime: str | None = None
    end_datetime: str | None = None
    timezone: str
    venue: VenueSchema
    organizer: str | None = None
    status: str
    calendar_payload: CalendarPayloadSchema
    notification_payload: NotificationPayloadSchema


class AgentExportResponseSchema(BaseModel):
    generated_at: str | None = None
    total_events: int
    events: list[AgentExportEventSchema] = Field(default_factory=list)


class SyncSummaryResponse(BaseModel):
    status: str
    sync_run_id: str | None = None
    source_name: str = "all"
    started_at: datetime | None = None
    finished_at: datetime | None = None
    events_found: int = 0
    events_created: int = 0
    events_updated: int = 0
    errors: list[dict[str, Any]] = Field(default_factory=list)
