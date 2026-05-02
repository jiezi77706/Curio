from __future__ import annotations

import re
from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from app.scrapers.base import BaseScraper

# Humanitix list-page URL patterns
_LIST_PAGE_PATTERNS = [
    r"humanitix\.com/events/",
    r"humanitix\.com/au/events/",
    r"humanitix\.com/[a-z]{2}/events/",
]


def _is_list_page(url: str) -> bool:
    return any(re.search(p, url) for p in _LIST_PAGE_PATTERNS)


class HumanitixScraper(BaseScraper):
    source_name = "humanitix"

    # ── list-page scraping ────────────────────────────────────────────────────

    async def scrape(self, urls: list[str]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        events: list[dict[str, Any]] = []
        errors: list[dict[str, Any]] = []
        seen_urls: set[str] = set()

        for url in urls:
            try:
                html = await self.fetch(url)
                if _is_list_page(url):
                    detail_urls = self._extract_event_links(html, url)
                    for detail_url in detail_urls:
                        if detail_url in seen_urls:
                            continue
                        seen_urls.add(detail_url)
                        try:
                            detail_html = await self.fetch(detail_url)
                            parsed = self.parse(detail_html, detail_url)
                            events.extend(parsed)
                        except Exception as exc:
                            errors.append({"source": self.source_name, "url": detail_url, "error": str(exc)})
                else:
                    seen_urls.add(url)
                    events.extend(self.parse(html, url))
            except Exception as exc:
                errors.append({"source": self.source_name, "url": url, "error": str(exc)})

        return events, errors

    def _extract_event_links(self, html: str, base_url: str) -> list[str]:
        """Extract individual event URLs from a Humanitix listing page."""
        soup = BeautifulSoup(html, "html.parser")
        links: list[str] = []
        seen: set[str] = set()

        for anchor in soup.find_all("a", href=True):
            href = str(anchor["href"]).strip()
            # Humanitix event detail pages live on events.humanitix.com
            if "events.humanitix.com/" not in href and "humanitix.com/au/" not in href:
                continue
            # Skip list pages, host pages, and non-event paths
            if any(skip in href for skip in ["/host/", "/au/events/", "/events/australia", "/for-hosts", "/impact"]):
                continue
            absolute = urljoin(base_url, href).split("?")[0].rstrip("/")
            if absolute not in seen and len(absolute) > 30:
                seen.add(absolute)
                links.append(absolute)

        return links[:40]  # cap per list page to avoid overloading

    # ── detail-page parsing ───────────────────────────────────────────────────

    def parse(self, html: str, url: str) -> list[dict[str, Any]]:
        soup = BeautifulSoup(html, "html.parser")
        raw_text = self.extract_page_text(soup)

        # 1. Try JSON-LD (most reliable)
        for payload in self.extract_json_ld(soup):
            payload_type = payload.get("@type")
            payload_types = payload_type if isinstance(payload_type, list) else [payload_type]
            if "Event" not in [str(t) for t in payload_types]:
                continue

            location = payload.get("location") or {}
            if isinstance(location, list) and location:
                location = location[0]

            if isinstance(location, dict):
                venue_name = location.get("name")
                address = location.get("address")
                venue_address = address.get("streetAddress") if isinstance(address, dict) else address
            else:
                venue_name = str(location) if location else None
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

            return [self.build_event(
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
            )]

        # 2. Fallback: parse from HTML meta/tags
        title = None
        if soup.find("h1"):
            title = soup.find("h1").get_text(" ", strip=True)
        if not title and soup.title:
            title = soup.title.get_text(" ", strip=True)

        description = None
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc and meta_desc.get("content"):
            description = meta_desc["content"]
        elif soup.find("p"):
            description = soup.find("p").get_text(" ", strip=True)

        time_tag = soup.find("time")
        start_datetime = None
        if time_tag:
            start_datetime = self.parse_datetime_value(
                time_tag.get("datetime") or time_tag.get_text(" ", strip=True)
            )

        return [self.build_event(
            source_url=url,
            external_event_id=self.extract_external_id_from_url(url),
            title=title,
            description=description,
            short_summary=self.summarize_text(description or raw_text),
            start_datetime=start_datetime,
            venue_name="Canberra",
            online_or_physical=self.detect_mode(description, raw_text),
            registration_url=url,
            price_type=self.detect_price_type(description, raw_text),
            status="unknown",
            raw_text=raw_text,
            raw_json={},
        )]
