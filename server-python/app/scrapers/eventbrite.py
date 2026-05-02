from __future__ import annotations

from typing import Any

from bs4 import BeautifulSoup

from app.config import settings
from app.scrapers.base import BaseScraper


class EventbriteScraper(BaseScraper):
    source_name = "eventbrite"

    def __init__(self, client) -> None:
        super().__init__(client)
        self.eventbrite_token = settings.eventbrite_token

    def parse(self, html: str, url: str) -> list[dict[str, Any]]:
        soup = BeautifulSoup(html, "html.parser")
        raw_text = self.extract_page_text(soup)
        events: list[dict[str, Any]] = []

        for payload in self.extract_json_ld(soup):
            payload_type = payload.get("@type")
            payload_types = payload_type if isinstance(payload_type, list) else [payload_type]
            if "Event" not in [str(item) for item in payload_types]:
                continue

            organizer = payload.get("organizer")
            if isinstance(organizer, dict):
                organizer = organizer.get("name")

            location = payload.get("location")
            venue_name = location.get("name") if isinstance(location, dict) else None
            address = location.get("address") if isinstance(location, dict) else None

            events.append(
                self.build_event(
                    source_url=url,
                    external_event_id=self.extract_external_id_from_url(url),
                    title=payload.get("name"),
                    description=payload.get("description"),
                    short_summary=self.summarize_text(payload.get("description")),
                    organizer=organizer,
                    start_datetime=self.parse_datetime_value(payload.get("startDate")),
                    end_datetime=self.parse_datetime_value(payload.get("endDate")),
                    venue_name=venue_name,
                    venue_address=address if isinstance(address, str) else None,
                    online_or_physical=self.detect_mode(venue_name, address, payload.get("description")),
                    registration_url=payload.get("url") or url,
                    price_type=self.detect_price_type(payload.get("offers"), payload.get("description")),
                    image_url=payload.get("image"),
                    status="active",
                    raw_text=raw_text,
                    raw_json=payload,
                )
            )

        if events:
            return events

        title = soup.find("h1").get_text(" ", strip=True) if soup.find("h1") else (soup.title.get_text(" ", strip=True) if soup.title else "Eventbrite Event")
        return [
            self.build_event(
                source_url=url,
                external_event_id=self.extract_external_id_from_url(url),
                title=title,
                description=self.summarize_text(raw_text, max_length=500),
                short_summary=self.summarize_text(raw_text),
                registration_url=url,
                price_type=self.detect_price_type(raw_text),
                status="unknown",
                raw_text=raw_text,
                raw_json={"token_configured": bool(self.eventbrite_token)},
            )
        ]
