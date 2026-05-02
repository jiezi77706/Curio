from datetime import datetime

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from zoneinfo import ZoneInfo

from app.database import Base
from app.models import Event
from app.services.deduplicate import upsert_event


def build_event_payload(title: str, source_url: str) -> dict:
    tz = ZoneInfo("Australia/Sydney")
    return {
        "source_name": "humanitix",
        "source_url": source_url,
        "external_event_id": None,
        "title": title,
        "description": "ANU AI Buildathon for student founders and machine learning teams.",
        "short_summary": "ANU AI Buildathon for student founders.",
        "topic_tags": ["AI", "hackathon"],
        "event_type": "hackathon",
        "organizer": "ANU AI Society",
        "start_datetime": datetime(2026, 6, 18, 9, 0, tzinfo=tz),
        "end_datetime": datetime(2026, 6, 18, 17, 0, tzinfo=tz),
        "timezone": "Australia/Sydney",
        "venue_name": "Kambri Innovation Hub",
        "venue_address": "Union Court, Acton ACT 2601",
        "online_or_physical": "physical",
        "registration_url": source_url,
        "price_type": "free",
        "image_url": "https://events.humanitix.com/sample.jpg",
        "status": "active",
        "raw_text": "Synthetic seeded event",
        "raw_json": {"seeded": True},
    }


def test_deduplicate_fuzzy_title_match() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, class_=Session, expire_on_commit=False)

    with TestingSession() as session:
        first = build_event_payload("AI Buildathon 2026", "https://events.humanitix.com/ai-buildathon-2026")
        second = build_event_payload("ANU AI Buildathon 2026", "https://events.humanitix.com/anu-ai-buildathon-2026")

        first_result = upsert_event(session, first)
        session.commit()
        second_result = upsert_event(session, second)
        session.commit()

        all_events = list(session.scalars(select(Event)).all())

    assert first_result.created is True
    assert second_result.created is False
    assert len(all_events) == 1
