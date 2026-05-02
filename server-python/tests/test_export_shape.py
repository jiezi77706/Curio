from datetime import datetime

from zoneinfo import ZoneInfo

from app.models import Event
from app.services.export_service import build_event_export_item


def test_export_contains_calendar_and_notification_payloads() -> None:
    tz = ZoneInfo("Australia/Sydney")
    event = Event(
        id="evt-123",
        source_name="humanitix",
        source_url="https://events.humanitix.com/anu-ai-showcase",
        external_event_id="humanitix-0001",
        title="ANU AI Showcase",
        description="A showcase for AI projects, networking, and research demos.",
        short_summary="A showcase for AI projects.",
        topic_tags=["AI", "networking"],
        event_type="showcase",
        organizer="ANU AI Society",
        start_datetime=datetime(2026, 6, 1, 18, 0, tzinfo=tz),
        end_datetime=datetime(2026, 6, 1, 20, 0, tzinfo=tz),
        timezone="Australia/Sydney",
        venue_name="Kambri Innovation Hub",
        venue_address="Union Court, Acton ACT 2601",
        online_or_physical="physical",
        registration_url="https://events.humanitix.com/anu-ai-showcase/tickets",
        price_type="free",
        image_url="https://events.humanitix.com/anu-ai-showcase.jpg",
        status="active",
        raw_text="Synthetic event",
        raw_json={"seeded": True},
        content_hash="hash",
    )

    export_item = build_event_export_item(event)

    assert "calendar_payload" in export_item
    assert "notification_payload" in export_item
    assert export_item["calendar_payload"]["timezone"] == "Australia/Sydney"
    assert export_item["notification_payload"]["priority"] in {"normal", "high"}
