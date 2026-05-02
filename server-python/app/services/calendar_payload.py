from __future__ import annotations

from typing import Any

from app.services.time_utils import coerce_timezone


def _iso(value: Any) -> str | None:
    normalized = coerce_timezone(value)
    return normalized.isoformat() if normalized else None


def _as_text(value: Any) -> str:
    return str(value) if value is not None else ""


def build_calendar_payload(event: Any) -> dict[str, str | None]:
    venue_bits = [getattr(event, "venue_name", None), getattr(event, "venue_address", None)]
    location = ", ".join([bit for bit in venue_bits if bit]) or ("Online" if getattr(event, "online_or_physical", "") == "online" else "")

    description_parts = [
        getattr(event, "short_summary", None),
        getattr(event, "description", None),
        getattr(event, "registration_url", None),
    ]
    description = "\n\n".join([_as_text(part).strip() for part in description_parts if part]).strip()

    return {
        "title": _as_text(getattr(event, "title", "")),
        "description": description,
        "location": location,
        "start": _iso(getattr(event, "start_datetime", None)),
        "end": _iso(getattr(event, "end_datetime", None)),
        "timezone": _as_text(getattr(event, "timezone", "Australia/Sydney")),
        "url": getattr(event, "registration_url", None) or getattr(event, "source_url", None),
    }
