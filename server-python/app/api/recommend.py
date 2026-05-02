from __future__ import annotations

import json
import os
import urllib.request
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Event
from app.services.time_utils import coerce_timezone
from datetime import datetime, timezone

router = APIRouter(tags=["recommend"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
GEMINI_URL     = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

SYSTEM_PROMPT = """
You are an AI assistant helping international students and freshmen at the
Australian National University (ANU) in Canberra discover relevant events.

Given a student profile and a list of upcoming events, rank the events by
relevance and return a JSON array sorted by priorityScore (highest first).

Prioritization rules:
1. Orientation / welcome / international student events → highest priority
2. Academic seminars, lectures, workshops relevant to their field
3. Social and networking events (making friends, settling in)
4. Cultural events (multicultural, language, food)
5. Sports and wellness
6. General community events → lowest priority

Output ONLY a valid JSON array. Each item:
{
  "id": "<event id>",
  "title": "<event title>",
  "priorityScore": <1-100>,
  "matchReason": "<1-2 sentences in simple English>",
  "tags": ["<tag1>", "<tag2>"]
}
"""


class StudentProfile(BaseModel):
    major: str | None = Field(default=None, description="Field of study")
    year: str | None = Field(default=None, description="e.g. first year, postgrad")
    interests: list[str] = Field(default_factory=list)
    goals: list[str] = Field(default_factory=list)
    background: str = Field(default="international", description="international or domestic")
    languages: list[str] = Field(default_factory=list)
    freeText: str | None = Field(default=None, description="Any extra context")


class RecommendRequest(BaseModel):
    profile: StudentProfile
    limit: int = Field(default=10, ge=1, le=50)


class RecommendedEvent(BaseModel):
    id: str
    title: str
    priorityScore: int
    matchReason: str
    tags: list[str] = Field(default_factory=list)
    # Full event fields
    source_name: str | None = None
    start_datetime: str | None = None
    venue_name: str | None = None
    registration_url: str | None = None
    image_url: str | None = None
    organizer: str | None = None
    price_type: str | None = None


class RecommendResponse(BaseModel):
    total: int
    events: list[RecommendedEvent]


def _call_gemini(system_prompt: str, user_message: str) -> str:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured")

    body = json.dumps({
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": user_message}]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 8192},
    }).encode()

    req = urllib.request.Request(
        GEMINI_URL,
        data=body,
        headers={
            "Content-Type": "application/json",
            "X-goog-api-key": GEMINI_API_KEY,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except urllib.error.HTTPError as e:
        detail = e.read().decode()
        raise HTTPException(status_code=502, detail=f"Gemini API error: {detail}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini call failed: {e}")


def _events_to_context(events: list[Event]) -> list[dict[str, Any]]:
    """Convert DB events to a compact dict for the AI prompt."""
    result = []
    for e in events:
        result.append({
            "id": e.id,
            "title": e.title,
            "description": (e.short_summary or e.description or "")[:200],
            "topics": e.topic_tags or [],
            "organizer": e.organizer or "",
            "venue": e.venue_name or "",
            "start": str(e.start_datetime) if e.start_datetime else "",
            "price": e.price_type or "",
            "source": e.source_name,
        })
    return result


@router.post("/recommend", response_model=RecommendResponse)
def recommend_events(
    body: RecommendRequest,
    db: Session = Depends(get_db),
) -> RecommendResponse:
    """
    Given a student profile, return AI-ranked upcoming events.
    """
    # Fetch upcoming events from DB (max 60 to keep prompt manageable)
    now = datetime.now(timezone.utc)
    all_events = list(db.scalars(select(Event)).all())
    upcoming = [
        e for e in all_events
        if e.start_datetime is None
        or (coerce_timezone(e.start_datetime) and coerce_timezone(e.start_datetime) >= now)
    ]
    # Sort by date, take first 60
    upcoming.sort(key=lambda e: (
        e.start_datetime is None,
        coerce_timezone(e.start_datetime) or datetime.max.replace(tzinfo=timezone.utc),
    ))
    candidate_events = upcoming[:20]  # 20 events keeps prompt within token budget

    if not candidate_events:
        return RecommendResponse(total=0, events=[])

    # Build prompt
    profile = body.profile
    profile_text = f"""
Student profile:
- Background: {profile.background}
- Major/Field: {profile.major or 'not specified'}
- Year: {profile.year or 'not specified'}
- Interests: {', '.join(profile.interests) or 'not specified'}
- Goals: {', '.join(profile.goals) or 'not specified'}
- Languages: {', '.join(profile.languages) or 'not specified'}
{f'- Additional context: {profile.freeText}' if profile.freeText else ''}
"""

    events_json = json.dumps(_events_to_context(candidate_events), ensure_ascii=False)
    user_message = f"{profile_text}\n\nEvents to rank:\n{events_json}"

    # Call Gemini
    raw_response = _call_gemini(SYSTEM_PROMPT, user_message)

    # Parse response — strip markdown fences, find the JSON array
    try:
        clean = raw_response.strip()
        # Strip ```json ... ``` or ``` ... ``` fences
        if "```" in clean:
            parts = clean.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("["):
                    clean = part
                    break
        # Find the JSON array boundaries robustly
        start = clean.find("[")
        end = clean.rfind("]")
        if start != -1 and end != -1:
            clean = clean[start:end + 1]
        ranked: list[dict] = json.loads(clean)
    except Exception:
        raise HTTPException(status_code=502, detail=f"Failed to parse Gemini response: {raw_response[:200]}")

    # Build event lookup map
    event_map = {e.id: e for e in candidate_events}

    # Merge AI ranking with DB data
    result: list[RecommendedEvent] = []
    for item in ranked[: body.limit]:
        event_id = item.get("id")
        db_event = event_map.get(event_id)
        result.append(RecommendedEvent(
            id=event_id or "",
            title=item.get("title", ""),
            priorityScore=int(item.get("priorityScore", 50)),
            matchReason=item.get("matchReason", ""),
            tags=item.get("tags", []),
            source_name=db_event.source_name if db_event else None,
            start_datetime=str(db_event.start_datetime) if db_event and db_event.start_datetime else None,
            venue_name=db_event.venue_name if db_event else None,
            registration_url=db_event.registration_url if db_event else None,
            image_url=db_event.image_url if db_event else None,
            organizer=db_event.organizer if db_event else None,
            price_type=db_event.price_type if db_event else None,
        ))

    return RecommendResponse(total=len(result), events=result)
