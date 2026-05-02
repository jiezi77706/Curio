from __future__ import annotations

from typing import Any

from bs4 import BeautifulSoup

from app.scrapers.base import BaseScraper


class HumanitixScraper(BaseScraper):
    source_name = "humanitix"

    def parse(self, html: str, url: str) -> list[dict[str, Any]]:
        soup = BeautifulSoup(html, "html.parser")
        raw_text = self.extract_page_text(soup)
        events: list[dict[str, Any]] = []

        for payload in self.extract_json_ld(soup):
            payload_type = payload.get("@type")
            payload_types = payload_type if isinstance(payload_type, list) else [payload_type]
            if "Event" not in [str(item) for item in payload_types]:
                continue

            location = payload.get("location") or {}
            if isinstance(location, list) and location:
                location = location[0]

            if isinstance(location, dict):
                venue_name = location.get("name")
                address = location.get("address")
                venue_address = address.get("streetAddress") if isinstance(address, dict) else address
            else:
                venue_name = location
                venue_address = None

            organizer = payload.get("organizer")
            if isinstance(organizer, dict):
                organizer = organizer.get("name")

            image = payload.get("image")
            if isinstance(image, list):
                image = image[0] if image else None

            offers = payload.get("offers")
            if isinstance(offers, list) and offers:
                offers = offers[0]
            registration_url = None
            if isinstance(offers, dict):
                registration_url = offers.get("url")

            external_id = payload.get("identifier")
            if isinstance(external_id, dict):
                external_id = external_id.get("value")

            event = self.build_event(
                source_url=url,
                external_event_id=external_id or self.extract_external_id_from_url(url),
                title=payload.get("name") or payload.get("headline"),
                description=payload.get("description"),
                short_summary=self.summarize_text(payload.get("description")),
                event_type=payload.get("eventAttendanceMode"),
                organizer=organizer,
                start_datetime=self.parse_datetime_value(payload.get("startDate")),
                end_datetime=self.parse_datetime_value(payload.get("endDate")),
                venue_name=venue_name,
                venue_address=venue_address,
                online_or_physical=self.detect_mode(venue_name, venue_address, payload.get("description")),
                registration_url=registration_url or payload.get("url") or url,
                price_type=self.detect_price_type(payload.get("description"), offers),
                image_url=image,
                status="active" if payload.get("eventStatus") else "unknown",
                raw_text=raw_text,
                raw_json=payload,
            )
            events.append(event)

        if events:
            return events

        title = None
        if soup.find("h1"):
            title = soup.find("h1").get_text(" ", strip=True)
        if not title and soup.title:
            title = soup.title.get_text(" ", strip=True)

        description = None
        meta_description = soup.find("meta", attrs={"name": "description"})
        if meta_description and meta_description.get("content"):
            description = meta_description["content"]
        elif soup.find("p"):
            description = soup.find("p").get_text(" ", strip=True)

        time_tag = soup.find("time")
        start_datetime = None
        if time_tag:
            start_datetime = self.parse_datetime_value(time_tag.get("datetime") or time_tag.get_text(" ", strip=True))

        fallback_event = self.build_event(
            source_url=url,
            external_event_id=self.extract_external_id_from_url(url),
            title=title,
            description=description,
            short_summary=self.summarize_text(description or raw_text),
            start_datetime=start_datetime,
            venue_name="ANU Campus",
            online_or_physical=self.detect_mode(description, raw_text),
            registration_url=url,
            price_type=self.detect_price_type(description, raw_text),
            status="unknown",
            raw_text=raw_text,
            raw_json={},
        )
        return [fallback_event]
