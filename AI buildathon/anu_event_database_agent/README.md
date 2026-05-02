# ANU Event Database Agent

ANU Event Database Agent is a local-first MVP that collects public ANU student event data into a SQLite database, exposes it through a FastAPI API, and provides a simple admin/event viewer UI. The project is designed as a clean data layer that other AI agents can use for calendar booking, reminders, recommendations, and chatbot answers.

For immediate local usability, the sync pipeline also seeds a realistic synthetic dataset of 500+ ANU-style events modeled after Humanitix and Rubric listings. That means the database is useful on day one even if live scraping is incomplete or unavailable.

## What It Does

- Scrapes public Humanitix event pages.
- Scrapes public Rubric / HelloRubric pages and event detail pages when available.
- Includes a safe Eventbrite stub for manual public URLs and future API expansion.
- Seeds 520 realistic fake Humanitix/Rubric-style events with timing, venue, topics, and registration data.
- Stores normalized events in SQLite at `data/events.db`.
- Deduplicates events across sync runs.
- Classifies events into simple topic tags.
- Exports clean AI-agent-ready JSON at `GET /events/export`.
- Runs scheduled background syncs every 2 hours.
- Provides a simple HTML event viewer and manual sync control.

## Tech Stack

- Python 3.11+
- FastAPI
- SQLite
- SQLAlchemy 2.0
- Pydantic
- APScheduler
- httpx
- BeautifulSoup4
- python-dateutil
- rapidfuzz
- Jinja2
- Uvicorn

## Install

```bash
cd anu_event_database_agent
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
cd anu_event_database_agent
source .venv/bin/activate
python run.py
```

Local app URL:

- `http://127.0.0.1:8000/`

## How to Add Humanitix / Rubric URLs

Edit [`data/seed_sources.json`](/Users/Sakib/Documents/Agent_Mats/anu_event_database_agent/data/seed_sources.json) and append public URLs to the relevant arrays:

- `humanitix`
- `rubric`
- `eventbrite`

The next manual or scheduled sync will ingest them.

## How the 2-Hour Sync Works

- FastAPI starts an APScheduler background scheduler on app startup.
- A sync job runs every 2 hours by default.
- Manual sync is also available through the web UI or `POST /sync/run`.
- Each run records a `SyncRun` row with counts, timestamps, status, and collected errors.
- Scraper failures are isolated so one bad source does not crash the whole sync.
- Each sync refreshes the 500+ synthetic event catalog so the local database stays populated and export-ready.

## API Endpoints

- `GET /` - HTML event viewer
- `GET /events` - all events as JSON
- `GET /events/upcoming` - upcoming events as JSON
- `GET /events/{event_id}` - event detail as JSON, or HTML with `?view=html`
- `GET /events/export` - AI-agent-ready clean JSON export
- `POST /sync/run` - manually trigger sync
- `GET /sync/status` - latest sync status

## How Other Agents Should Use `/events/export`

Use `GET /events/export` as the stable integration point for downstream agent workflows. It returns:

- normalized event metadata
- topic tags
- venue mode and address
- calendar-ready payloads
- notification-ready payloads

This makes it suitable for:

- calendar creation agents
- reminder agents
- recommendation agents
- chatbot retrieval layers

## Notes

- SQLite is the default local MVP backend.
- The architecture is clean enough to swap to PostgreSQL later by changing configuration and engine settings.
- Public-page scraping is intentionally conservative and does not attempt to bypass anti-bot protections.
