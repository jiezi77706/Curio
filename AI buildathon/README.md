# ANU Event Finder — 3-Hour Prototype Pack

This bundle contains everything four students need to build a working prototype in 3 hours.

## Files

| File | Owner | What it is |
|---|---|---|
| `events.json` | Student 2 (provided) | 1500 fake events: 700 Rubrik + 800 Humanitix |
| `timetable_sample.json` | Student 2 (provided) | One demo student's class schedule |
| `student_1_frontend_prompt.md` | Student 1 | Detailed prompt for building the UI |
| `student_2_data_prompt.md` | Student 2 | Detailed prompt for the data loader module |
| `student_3_filter_prompt.md` | Student 3 | Detailed prompt for the matching + AI engine |
| `student_4_glue_prompt.md` | Student 4 | Detailed prompt for setup, deploy, and demo |
| `generate_events.py` | (reference) | The script that produced events.json — re-run if you need different data |

## How to use

1. **First 15 minutes — everyone in one place.** Open the four prompt files together. Read each other's roles so you know who depends on whom.

2. **Each student opens their own prompt file** and pastes the prompt section into Claude / Cursor / ChatGPT to generate starter code.

3. **Stick to the contracts.** The prompts have been written so that:
   - Student 1's `getRecommendations(user)` matches Student 3's function signature
   - Student 2's `loadEvents()` and `eventClashesWithBusy()` are exactly what Student 3 imports
   - Student 4's repo structure matches everyone's expected file paths

4. **Time check at minute 60:** Student 1 has a clickable form. Student 2 has loaded events into memory. Student 3 has tested filtering on hardcoded data. Student 4 has the repo deployed (even if empty).

5. **Time check at minute 120:** Everything talks to everything. Real button → real filter → real results on screen. Maybe ugly. Doesn't matter.

6. **Time check at minute 180:** Polished, deployed, demo rehearsed twice, backup video saved.

## Dataset summary

`events.json` contains 1500 events with realistic variety:

- **Sources**: 700 Rubrik (campus-leaning, mostly free, academic), 800 Humanitix (city-leaning, mix of free/paid, social)
- **Tags**: ~85 unique tags spanning academic subjects, hobbies, lifestyle, career, social
- **Locations**: Real ANU venues (Kambri, Manning Clark, RSCS) and Canberra venues (Smith's Alternative, BentSpoke, etc.)
- **Times**: Spread across the next 8 weeks, between 8am and 10pm
- **Format**: ISO 8601 timestamps, ready to parse with `new Date(event.start_time)` in JS or `datetime.fromisoformat()` in Python

Each event looks like:
```json
{
  "id": "rub_00128",
  "source": "rubrik",
  "title": "Biology Q&A with Industry Guest",
  "description": "Drop in for an evening on biology. Tickets going fast, book now.",
  "tags": ["biology", "research", "academic"],
  "start_time": "2026-06-23T14:00:00",
  "end_time": "2026-06-23T15:00:00",
  "location": "Marie Reay Teaching Centre Room 4.02",
  "price_aud": 0,
  "capacity": 150,
  "url": "https://rubrik.example.com/events/128"
}
```

## The shared contract everyone codes against

```js
// User profile (Student 1 produces, Student 3 consumes)
{
  name: "Alex",
  course: "Bachelor of Computing",
  interests: ["ai", "programming", "career"]
}

// Event (Student 2 supplies, Student 3 ranks, Student 1 displays)
{
  id, source, title, description, tags, start_time, end_time,
  location, price_aud, capacity, url,
  why  // ← added by Student 3 after ranking
}

// Function signature everyone agrees on
async function getRecommendations(user, events, timetable) → array of 5 events
```

If anything breaks during integration, it's almost always because someone deviated from this contract. Fix the contract violation, don't add a translation layer.

## Good luck.
Ship something. Polish later. 🚀
