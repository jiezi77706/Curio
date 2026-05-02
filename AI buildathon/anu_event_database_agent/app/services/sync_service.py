from __future__ import annotations

import asyncio
import json
import logging
import re
from datetime import datetime, timedelta
from typing import Any

import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import desc, select
from zoneinfo import ZoneInfo

from app.config import settings
from app.database import SessionLocal
from app.models import SyncRun
from app.scrapers.eventbrite import EventbriteScraper
from app.scrapers.humanitix import HumanitixScraper
from app.scrapers.rubric import RubricScraper
from app.services.deduplicate import upsert_event
from app.services.export_service import build_export_payload, write_export_file
from app.services.topic_classifier import classify_topics

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone=settings.default_timezone)
sync_lock = asyncio.Lock()
TARGET_FAKE_EVENT_COUNT = 520


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "event"


def start_scheduler() -> None:
    if scheduler.get_job("anu-event-sync") is None:
        scheduler.add_job(
            run_sync,
            "interval",
            hours=settings.sync_interval_hours,
            id="anu-event-sync",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
        )
    if not scheduler.running:
        scheduler.start()
        logger.info("APScheduler started with %s-hour interval", settings.sync_interval_hours)


def shutdown_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped")


def load_seed_sources() -> dict[str, list[str]]:
    if not settings.seed_sources_path.exists():
        return {"humanitix": [], "rubric": [], "eventbrite": []}

    data = json.loads(settings.seed_sources_path.read_text(encoding="utf-8"))
    return {
        "humanitix": data.get("humanitix", []),
        "rubric": data.get("rubric", []),
        "eventbrite": data.get("eventbrite", []),
    }


def get_latest_sync_run(db) -> SyncRun | None:
    return db.scalar(select(SyncRun).order_by(desc(SyncRun.started_at)))


def _create_sync_run(trigger: str) -> str:
    with SessionLocal() as db:
        sync_run = SyncRun(source_name="all", status=f"running:{trigger}")
        db.add(sync_run)
        db.commit()
        db.refresh(sync_run)
        return sync_run.id


def _finish_sync_run(sync_run_id: str, **values: Any) -> None:
    with SessionLocal() as db:
        sync_run = db.get(SyncRun, sync_run_id)
        if not sync_run:
            return
        for key, value in values.items():
            setattr(sync_run, key, value)
        db.commit()


def _merge_topics(event: dict[str, Any]) -> list[str]:
    detected = classify_topics(event.get("title"), event.get("description"), event.get("organizer"))
    merged = []
    for topic in list(event.get("topic_tags", [])) + detected:
        if topic not in merged:
            merged.append(topic)
    return merged


def _build_fake_description(profile: dict[str, Any], organizer: str, venue: dict[str, str], start_datetime: datetime, index: int) -> str:
    topic_text = ", ".join(profile["topics"])
    start_text = start_datetime.strftime("%A %d %B %Y at %I:%M %p")
    return (
        f"{profile['intro']} Hosted by {organizer}, this ANU-focused event covers {topic_text}. "
        f"The session runs on {start_text} at {venue['name']} and includes Q&A, student networking, "
        f"practical takeaways, and links for follow-up resources. Event batch reference {index:03d}."
    )


def generate_fake_events(total_events: int = TARGET_FAKE_EVENT_COUNT) -> list[dict[str, Any]]:
    tz = ZoneInfo(settings.default_timezone)
    now = datetime.now(tz).replace(minute=0, second=0, microsecond=0)

    profiles = [
        {"label": "AI Buildathon", "topics": ["AI", "hackathon", "machine learning"], "event_type": "hackathon", "duration_hours": 8, "price_type": "free", "intro": "A high-energy build session for ANU students exploring applied AI products."},
        {"label": "ML Career Workshop", "topics": ["machine learning", "career", "networking"], "event_type": "workshop", "duration_hours": 2, "price_type": "free", "intro": "A practical session on machine learning pathways, portfolios, and industry conversations."},
        {"label": "PhD Research Seminar", "topics": ["PhD", "research", "seminar"], "event_type": "seminar", "duration_hours": 2, "price_type": "free", "intro": "A research-led seminar for postgraduate students and supervisors across ANU."},
        {"label": "Startup Founder Night", "topics": ["startup", "entrepreneurship", "networking"], "event_type": "networking", "duration_hours": 3, "price_type": "paid", "intro": "An evening event connecting student founders, mentors, and venture-curious teams."},
        {"label": "Wellbeing Reset Session", "topics": ["wellbeing", "study support", "academic skills"], "event_type": "wellbeing", "duration_hours": 1, "price_type": "free", "intro": "A guided support session to help students manage workload, stress, and study routines."},
        {"label": "Scholarship and Visa Q&A", "topics": ["scholarship", "visa", "international students"], "event_type": "information session", "duration_hours": 2, "price_type": "free", "intro": "A public information session for current and prospective ANU students navigating funding and visa questions."},
        {"label": "Instrumentation Lab Demo", "topics": ["instrumentation", "laboratory", "research"], "event_type": "laboratory demo", "duration_hours": 2, "price_type": "free", "intro": "A hands-on demonstration of instrumentation workflows, lab practice, and research support."},
        {"label": "Assignment Survival Workshop", "topics": ["assignment", "study support", "academic skills"], "event_type": "workshop", "duration_hours": 2, "price_type": "free", "intro": "A student support workshop focused on assignment planning, writing structure, and study systems."},
        {"label": "Accommodation Info Session", "topics": ["accommodation", "international students", "wellbeing"], "event_type": "information session", "duration_hours": 1, "price_type": "free", "intro": "A support session covering ANU accommodation options, budgeting, and settling into Canberra."},
        {"label": "AI Research Showcase", "topics": ["AI", "research", "seminar"], "event_type": "showcase", "duration_hours": 3, "price_type": "free", "intro": "A showcase of student and faculty projects spanning AI methods, research translation, and demos."},
    ]

    organizers = [
        "ANU AI Society",
        "ANU College of Engineering, Computing and Cybernetics",
        "ANU Careers and Employability",
        "ANU Research School of Computer Science",
        "ANU Postgraduate and Research Students' Association",
        "ANU Student Central",
        "ANU InnovationACT",
        "ANU International Student Department",
        "ANU Academic Skills Team",
        "ANU Health, Safety and Wellbeing",
    ]

    venues = [
        {"name": "Marie Reay Teaching Centre", "address": "155 University Ave, Acton ACT 2601", "mode": "physical"},
        {"name": "Hedley Bull Theatre", "address": "130 Garran Rd, Acton ACT 2601", "mode": "physical"},
        {"name": "Kambri Innovation Hub", "address": "Union Court, Acton ACT 2601", "mode": "physical"},
        {"name": "Hancock Library Seminar Room", "address": "43 Garran Rd, Acton ACT 2601", "mode": "physical"},
        {"name": "Research School Instrumentation Lab", "address": "North Rd, Acton ACT 2601", "mode": "physical"},
        {"name": "Zoom Webinar Room", "address": "", "mode": "online"},
        {"name": "Microsoft Teams Live Room", "address": "", "mode": "online"},
        {"name": "ANU Online Student Hub", "address": "", "mode": "online"},
    ]

    events: list[dict[str, Any]] = []
    for index in range(total_events):
        profile = profiles[index % len(profiles)]
        organizer = organizers[index % len(organizers)]
        venue = venues[index % len(venues)]
        source_name = "humanitix" if index % 3 != 0 else "rubric"

        day_offset = (index * 2) % 210
        hour_offset = [9, 11, 14, 16, 18][index % 5]
        start_datetime = (now + timedelta(days=day_offset)).replace(hour=hour_offset, minute=0, second=0, microsecond=0)
        end_datetime = start_datetime + timedelta(hours=profile["duration_hours"])

        title = f"{profile['label']} Series {index + 1:03d}"
        description = _build_fake_description(profile, organizer, venue, start_datetime, index + 1)
        slug = slugify(f"{title}-{index + 1}")

        if source_name == "humanitix":
            source_url = f"https://events.humanitix.com/{slug}"
            image_url = f"https://images.humanitix.com/synthetic/{slug}.jpg"
        else:
            source_url = f"https://campus.hellorubric.com/events/{slug}"
            image_url = f"https://campus.hellorubric.com/assets/{slug}.jpg"

        registration_url = source_url
        if source_name == "humanitix":
            registration_url = f"{source_url}/tickets"

        events.append(
            {
                "source_name": source_name,
                "source_url": source_url,
                "external_event_id": f"{source_name}-{index + 1:04d}",
                "title": title,
                "description": description,
                "short_summary": description[:210] + ("..." if len(description) > 210 else ""),
                "topic_tags": profile["topics"],
                "event_type": profile["event_type"],
                "organizer": organizer,
                "start_datetime": start_datetime,
                "end_datetime": end_datetime,
                "timezone": settings.default_timezone,
                "venue_name": venue["name"],
                "venue_address": venue["address"] or None,
                "online_or_physical": venue["mode"],
                "registration_url": registration_url,
                "price_type": profile["price_type"],
                "image_url": image_url,
                "status": "active",
                "raw_text": description,
                "raw_json": {
                    "seeded": True,
                    "source_family": source_name,
                    "profile": profile["label"],
                    "series_number": index + 1,
                },
            }
        )

    return events


async def _collect_scraped_events(seed_sources: dict[str, list[str]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    headers = {"User-Agent": settings.user_agent}
    timeout = httpx.Timeout(settings.http_timeout_seconds)
    async with httpx.AsyncClient(headers=headers, timeout=timeout, follow_redirects=True) as client:
        scrapers = [
            HumanitixScraper(client),
            RubricScraper(client),
            EventbriteScraper(client),
        ]

        all_events: list[dict[str, Any]] = []
        all_errors: list[dict[str, Any]] = []

        for scraper in scrapers:
            urls = seed_sources.get(scraper.source_name, [])
            if not urls:
                continue
            events, errors = await scraper.scrape(urls)
            all_events.extend(events)
            all_errors.extend(errors)

        return all_events, all_errors


async def run_sync(trigger: str = "manual") -> dict[str, Any]:
    if sync_lock.locked():
        return {
            "status": "skipped",
            "sync_run_id": None,
            "source_name": "all",
            "started_at": None,
            "finished_at": None,
            "events_found": 0,
            "events_created": 0,
            "events_updated": 0,
            "errors": [{"source": "system", "error": "Sync already running"}],
        }

    async with sync_lock:
        started_at = datetime.now(ZoneInfo(settings.default_timezone))
        sync_run_id = _create_sync_run(trigger)
        logger.info("Starting sync run %s (%s)", sync_run_id, trigger)

        errors: list[dict[str, Any]] = []
        events_found = 0
        events_created = 0
        events_updated = 0
        status = "success"

        try:
            seed_sources = load_seed_sources()
            scraped_events, scrape_errors = await _collect_scraped_events(seed_sources)
            fake_events = generate_fake_events(TARGET_FAKE_EVENT_COUNT)
            all_events = scraped_events + fake_events
            errors.extend(scrape_errors)

            for event in all_events:
                event["topic_tags"] = _merge_topics(event)

            events_found = len(all_events)

            with SessionLocal() as db:
                for event in all_events:
                    result = upsert_event(db, event)
                    if result.created:
                        events_created += 1
                    elif result.updated:
                        events_updated += 1

                db.commit()
                export_payload = build_export_payload(db)
                write_export_file(export_payload)

            if errors:
                status = "partial_success"
        except Exception as exc:
            logger.exception("Sync run %s failed", sync_run_id)
            status = "failed"
            errors.append({"source": "system", "error": str(exc)})
        finally:
            finished_at = datetime.now(ZoneInfo(settings.default_timezone))
            _finish_sync_run(
                sync_run_id,
                finished_at=finished_at,
                status=status,
                events_found=events_found,
                events_created=events_created,
                events_updated=events_updated,
                errors_json=errors,
            )
            logger.info(
                "Finished sync run %s with status=%s found=%s created=%s updated=%s",
                sync_run_id,
                status,
                events_found,
                events_created,
                events_updated,
            )

        return {
            "status": status,
            "sync_run_id": sync_run_id,
            "source_name": "all",
            "started_at": started_at,
            "finished_at": finished_at,
            "events_found": events_found,
            "events_created": events_created,
            "events_updated": events_updated,
            "errors": errors,
        }
