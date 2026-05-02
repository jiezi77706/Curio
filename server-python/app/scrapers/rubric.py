from __future__ import annotations

import re
from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from app.scrapers.base import BaseScraper


class RubricScraper(BaseScraper):
    source_name = "rubric"

    def parse(self, html: str, url: str) -> list[dict[str, Any]]:
        soup = BeautifulSoup(html, "html.parser")
        raw_text = self.extract_page_text(soup)
        title = soup.find("h1").get_text(" ", strip=True) if soup.find("h1") else (soup.title.get_text(" ", strip=True) if soup.title else "Rubric Event")
        return [
            self.build_event(
                source_url=url,
                external_event_id=self.extract_external_id_from_url(url),
                title=title,
                description=self.summarize_text(raw_text, max_length=500),
                short_summary=self.summarize_text(raw_text),
                start_datetime=self._extract_best_datetime(raw_text),
                venue_name=self._extract_venue(raw_text),
                online_or_physical=self.detect_mode(raw_text),
                registration_url=url,
                price_type=self.detect_price_type(raw_text),
                status="active",
                raw_text=raw_text,
                raw_json={},
            )
        ]

    async def scrape(self, urls: list[str]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        events: list[dict[str, Any]] = []
        errors: list[dict[str, Any]] = []

        for url in urls:
            try:
                listing_html = await self.fetch(url)
                listing_soup = BeautifulSoup(listing_html, "html.parser")
                links = self._extract_event_links(listing_soup, url)

                if not links:
                    events.extend(self.parse(listing_html, url))
                    continue

                for link in links:
                    try:
                        detail_html = await self.fetch(link)
                        events.append(self._parse_detail_page(detail_html, link, url))
                    except Exception as exc:
                        errors.append({"source": self.source_name, "url": link, "error": str(exc)})
            except Exception as exc:
                errors.append({"source": self.source_name, "url": url, "error": str(exc)})

        return events, errors

    def _extract_event_links(self, soup: BeautifulSoup, base_url: str) -> list[str]:
        candidates: list[str] = []
        for anchor in soup.find_all("a", href=True):
            href = anchor["href"].strip()
            text = anchor.get_text(" ", strip=True)
            absolute = urljoin(base_url, href)
            lowered = absolute.lower()
            if not text:
                continue
            if any(token in lowered for token in ["/event", "/events/", "/e/"]):
                candidates.append(absolute)

        scripts_text = soup.get_text(" ", strip=True)
        for match in re.findall(r"https?://[^\s\"']+", scripts_text):
            lowered = match.lower()
            if "hellorubric.com" in lowered and "/event" in lowered:
                candidates.append(match)

        deduped: list[str] = []
        seen = set()
        for candidate in candidates:
            if candidate in seen:
                continue
            seen.add(candidate)
            deduped.append(candidate)
        return deduped[:25]

    def _parse_detail_page(self, html: str, url: str, parent_url: str) -> dict[str, Any]:
        soup = BeautifulSoup(html, "html.parser")
        raw_text = self.extract_page_text(soup)

        title = None
        for tag_name in ["h1", "h2"]:
            tag = soup.find(tag_name)
            if tag:
                title = tag.get_text(" ", strip=True)
                break
        if not title and soup.title:
            title = soup.title.get_text(" ", strip=True)

        description = None
        meta_description = soup.find("meta", attrs={"name": "description"})
        if meta_description and meta_description.get("content"):
            description = meta_description["content"]
        else:
            paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
            description = " ".join(paragraphs[:4]) if paragraphs else raw_text[:600]

        start_datetime = self._extract_best_datetime(raw_text)
        venue_name = self._extract_venue(raw_text)

        return self.build_event(
            source_url=url,
            external_event_id=self.extract_external_id_from_url(url),
            title=title,
            description=description,
            short_summary=self.summarize_text(description or raw_text),
            organizer="ANU Student Group",
            start_datetime=start_datetime,
            venue_name=venue_name,
            online_or_physical=self.detect_mode(venue_name, description, raw_text),
            registration_url=url,
            price_type=self.detect_price_type(description, raw_text),
            status="active",
            raw_text=raw_text,
            raw_json={"parent_url": parent_url},
        )

    def _extract_best_datetime(self, text: str):
        for line in re.split(r"(?<=[.!?])\s+", text):
            lowered = line.lower()
            if any(keyword in lowered for keyword in ["am", "pm", "mon", "tue", "wed", "thu", "fri", "sat", "sun"]):
                parsed = self.parse_datetime_value(line)
                if parsed:
                    return parsed
        return self.parse_datetime_value(text[:120])

    def _extract_venue(self, text: str) -> str | None:
        match = re.search(r"(room|hall|building|theatre|lab)\s+[a-z0-9\- ]+", text, flags=re.IGNORECASE)
        return match.group(0) if match else None
