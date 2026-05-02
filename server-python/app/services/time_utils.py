from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from app.config import settings


def coerce_timezone(value: datetime | None) -> datetime | None:
    if value is None:
        return None

    timezone = ZoneInfo(settings.default_timezone)
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone)
    return value.astimezone(timezone)
