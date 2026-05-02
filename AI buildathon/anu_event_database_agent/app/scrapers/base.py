from __future__ import annotations

import json
import re
from datetime import datetime
from typing import Any
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
from dateutil import parser as date_parser
from zoneinfo import ZoneInfo

from app.config import settings


class BaseScraper:
    source_name = "base"

    def __init__(self, client: httpx.AsyncClient) -> None:
        self.client = client

    async def fetch(self, url: str) -> str:
        response = await self.client.get(url)
        response.raise_for_status()
        return response.text

    def parse(self, html: str, url: str) -> list[dict[str, Any]]:
        raise NotImplementedError

    async def scrape(self, urls: list[str]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        events: list[dict[str, Any]] = []
        errors: list[dict[str, Any]] = []

        for url in urls:
            try:
                html = await self.fetch(url)
                events.extend(self.parse(html, url))
            except Exception as exc:
                errors.append({"source": self.source_name, "url": url, "error": str(exc)})

        return events, errors

    def extract_json_ld(self, soup: BeautifulSoup) -> list[dict[str, Any]]:
        payloads: list[dict[str, Any]] = []
        for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
            raw_content = script.string or script.get_text(strip=True)
            if not raw_content:
                continue

            try:
                parsed = json.loads(raw_content)
            except json.JSONDecodeError:
                continue

            items = parsed if isinstance(parsed, list) else [parsed]
            for item in items:
                for candidate in self._flatten_jsonld_item(item):
                    if isinstance(candidate, dict):
                        payloads.append(candidate)
        return payloads

    def _flatten_jsonld_item(self, item: Any) -> list[Any]:
        if isinstance(item, dict) and "@graph" in item and isinstance(item["@graph"], list):
            return item["@graph"]
        return [item]

    def parse_datetime_value(self, value: Any) -> datetime | None:
        if not value:
            return None

        if isinstance(value, datetime):
            dt = value
        else:
            try:
                dt = date_parser.parse(str(value), fuzzy=True)
            except (ValueError, TypeError, OverflowError):
                return None

        tz = ZoneInfo(settings.default_timezone)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=tz)
        return dt.astimezone(tz)

    def summarize_text(self, text: str | None, max_length: int = 220) -> str | None:
        if not text:
            return None
        clean = " ".join(text.split())
        if len(clean) <= max_length:
            return clean
        return clean[: max_length - 3].rstrip() + "..."

    def clean_text(self, value: Any) -> str | None:
        if value is None:
            return None
        text = re.sub(r"\s+", " ", str(value)).strip()
        return text or None

    def extract_page_text(self, soup: BeautifulSoup, max_length: int = 4000) -> str:
        text = soup.get_text(" ", strip=True)
        text = re.sub(r"\s+", " ", text).strip()
        return text[:max_length]

    def detect_mode(self, *values: Any) -> str:
        combined = " ".join(str(value or "") for value in values).lower()
        if any(keyword in combined for keyword in ["zoom", "teams", "online", "webinar", "livestream"]):
            return "online"
        if any(keyword in combined for keyword in ["room", "hall", "building", "campus", "theatre", "lab"]):
            return "physical"
        return "unknown"

    def detect_price_type(self, *values: Any) -> str:
        combined = " ".join(str(value or "") for value in values).lower()
        if "free" in combined:
            return "free"
        if any(keyword in combined for keyword in ["$", "paid", "ticket", "price", "cost"]):
            return "paid"
        return "unknown"

    def extract_external_id_from_url(self, url: str) -> str | None:
        parsed = urlparse(url)
        path_parts = [part for part in parsed.path.split("/") if part]
        return path_parts[-1] if path_parts else None

    def build_event(
        self,
        *,
        source_url: str,
        title: str | None,
        description: str | None = None,
        short_summary: str | None = None,
        topic_tags: list[str] | None = None,
        event_type: str | None = None,
        organizer: str | None = None,
        start_datetime: datetime | None = None,
        end_datetime: datetime | None = None,
        timezone_name: str = settings.default_timezone,
        venue_name: str | None = None,
        venue_address: str | None = None,
        online_or_physical: str | None = None,
        registration_url: str | None = None,
        price_type: str | None = None,
        image_url: str | None = None,
        status: str | None = None,
        raw_text: str | None = None,
        raw_json: dict[str, Any] | None = None,
        external_event_id: str | None = None,
    ) -> dict[str, Any]:
        cleaned_title = self.clean_text(title) or "Untitled Event"
        cleaned_description = self.clean_text(description)
        raw_text = self.clean_text(raw_text)

        return {
            "source_name": self.source_name,
            "source_url": source_url,
            "external_event_id": external_event_id,
            "title": cleaned_title,
            "description": cleaned_description,
            "short_summary": short_summary or self.summarize_text(cleaned_description or raw_text),
            "topic_tags": topic_tags or [],
            "event_type": self.clean_text(event_type),
            "organizer": self.clean_text(organizer),
            "start_datetime": start_datetime,
            "end_datetime": end_datetime,
            "timezone": timezone_name,
            "venue_name": self.clean_text(venue_name),
            "venue_address": self.clean_text(venue_address),
            "online_or_physical": online_or_physical or self.detect_mode(venue_name, venue_address, description),
            "registration_url": registration_url or source_url,
            "price_type": price_type or self.detect_price_type(description, raw_text),
            "image_url": self.clean_text(image_url),
            "status": status or "unknown",
            "raw_text": raw_text,
            "raw_json": raw_json or {},
        }
