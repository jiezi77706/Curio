from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.services.time_utils import coerce_timezone


def build_notification_payload(event: Any) -> dict[str, Any]:
    start_datetime = coerce_timezone(getattr(event, "start_datetime", None))
    priority = "normal"
    suggested_reminders = ["24_hours_before", "2_hours_before"]

    if start_datetime:
        hours_until = (start_datetime.astimezone(timezone.utc) - datetime.now(timezone.utc)).total_seconds() / 3600
        if hours_until <= 48:
            priority = "high"
        if hours_until <= 6:
            suggested_reminders = ["2_hours_before", "30_minutes_before"]

    title = getattr(event, "title", "Upcoming event")
    venue = getattr(event, "venue_name", None) or ("Online" if getattr(event, "online_or_physical", "") == "online" else "ANU")
    start_text = start_datetime.strftime("%a %d %b %Y %I:%M %p") if start_datetime else "time TBC"

    return {
        "title": title,
        "message": f"{title} is scheduled for {start_text} at {venue}.",
        "priority": priority,
        "suggested_reminders": suggested_reminders,
    }
