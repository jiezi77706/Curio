"""End-to-end API test for the ANU Event Aggregator backend."""
import urllib.request
import json

BASE = "http://127.0.0.1:8000"

def get(path):
    with urllib.request.urlopen(f"{BASE}{path}", timeout=10) as r:
        return json.loads(r.read())

def post(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(
        f"{BASE}{path}", data=body,
        headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {"error": e.code, "detail": e.read().decode()}

# ── Test 1: events list ───────────────────────────────────────────────────────
print("Test 1: GET /events/upcoming")
events = get("/events/upcoming")
print(f"  ✅ {len(events)} upcoming events\n")

# ── Test 2: sync status ───────────────────────────────────────────────────────
print("Test 2: GET /sync/status")
status = get("/sync/status")
print(f"  ✅ status={status.get('status')} found={status.get('events_found')}\n")

# ── Test 3: AI recommend ──────────────────────────────────────────────────────
print("Test 3: POST /recommend")
result = post("/recommend", {
    "profile": {
        "major": "Computer Science",
        "year": "first year",
        "interests": ["programming", "AI", "making friends"],
        "goals": ["settle in", "find study groups"],
        "background": "international",
        "languages": ["Chinese", "English"]
    },
    "limit": 5
})

if "error" in result:
    print(f"  ❌ {result}")
else:
    print(f"  ✅ {result['total']} recommendations")
    for e in result["events"]:
        print(f"    [{e['priorityScore']}] {e['title']}")
        print(f"         → {e['matchReason']}")
