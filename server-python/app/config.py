from __future__ import annotations

import os
from pathlib import Path


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


class Settings:
    def __init__(self) -> None:
        self.project_root = Path(__file__).resolve().parents[1]
        load_env_file(self.project_root / ".env")

        self.data_dir = self.project_root / "data"
        self.template_dir = self.project_root / "app" / "templates"
        self.static_dir = self.project_root / "app" / "static"
        self.seed_sources_path = self.data_dir / "seed_sources.json"
        self.export_path = self.data_dir / "events_export.json"

        self.default_timezone = "Australia/Sydney"
        self.sync_interval_hours = int(os.getenv("SYNC_INTERVAL_HOURS", "2"))
        self.http_timeout_seconds = float(os.getenv("HTTP_TIMEOUT_SECONDS", "20"))
        self.eventbrite_token = os.getenv("EVENTBRITE_TOKEN", "").strip()
        # Railway injects $PORT; fall back to APP_PORT for local dev
        self.app_host = os.getenv("APP_HOST", "0.0.0.0")
        self.app_port = int(os.getenv("PORT", os.getenv("APP_PORT", "8000")))
        self.user_agent = os.getenv("USER_AGENT", "ANUEventDatabaseAgent/0.1")

        raw_database_url = os.getenv("DATABASE_URL", "sqlite:///data/events.db")
        self.database_url = self._resolve_database_url(raw_database_url)

    def _resolve_database_url(self, raw_database_url: str) -> str:
        if raw_database_url.startswith("sqlite:///") and not raw_database_url.startswith("sqlite:////"):
            relative_path = raw_database_url.replace("sqlite:///", "", 1)
            if relative_path == ":memory:":
                return raw_database_url
            absolute_path = (self.project_root / relative_path).resolve()
            return f"sqlite:///{absolute_path}"
        return raw_database_url


settings = Settings()
