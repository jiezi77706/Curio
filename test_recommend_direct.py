"""Test recommend directly in the server process (no HTTP timeout)."""
import sys, json
sys.path.insert(0, "server-python")

# Load env
import os
with open("server-python/.env") as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

from app.api.recommend import _call_gemini, SYSTEM_PROMPT, _events_to_context
from app.database import SessionLocal
from app.models import Event
from sqlalchemy import select

# Get 5 events from DB
with SessionLocal() as db:
    events = list(db.scalars(select(Event).limit(5)).all())

print(f"Testing with {len(events)} events...")

profile_text = """
Student profile:
- Background: international
- Major/Field: Computer Science
- Year: first year
- Interests: programming, AI, making friends
- Goals: settle in, find study groups
- Languages: Chinese, English
"""

events_json = json.dumps(_events_to_context(events), ensure_ascii=False)
user_message = f"{profile_text}\n\nEvents to rank:\n{events_json}"

print("Calling Gemini...")
raw = _call_gemini(SYSTEM_PROMPT, user_message)
print(f"Raw response (first 500 chars):\n{raw[:500]}\n")

# Parse
clean = raw.strip()
start = clean.find("[")
end = clean.rfind("]")
if start != -1 and end != -1:
    ranked = json.loads(clean[start:end+1])
    print(f"✅ Parsed {len(ranked)} ranked events:")
    for e in ranked:
        print(f"  [{e['priorityScore']}] {e['title']}")
        print(f"       → {e['matchReason']}")
else:
    print("❌ Could not find JSON array in response")
