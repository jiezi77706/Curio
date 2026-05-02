# Student 2 — Data Ingestion (Mocked)

## Your role
You own the data. In a real version you'd be scraping Rubrik and Humanitix and pulling iCal feeds from MyTimetable. You will not do any of that. You will hand Student 3 two clean JSON files within the first 45 minutes, then help others.

## What you are NOT doing
- No real scraping (CORS will eat your time)
- No real API integrations
- No web scraping libraries — `events.json` already exists, use it
- No database

## What you ARE doing
1. **Confirm the events dataset works** (5 min) — `events.json` has 1500 events, 700 Rubrik + 800 Humanitix. Just open it and check.
2. **Set up the timetable file** (10 min) — `timetable_sample.json` already exists. Eyeball it.
3. **Build a small data-loader module** (30 min) — exports two functions Student 3 will call.
4. **Help integrate** (rest of the time) — debug whatever breaks.

---

## Paste this prompt into Claude / Cursor

> I have a hackathon prototype with 3 hours total. I'm Student 2, responsible for data loading. I have two files already:
>
> - `events.json` — array of 1500 events. Each event has fields: `id`, `source` ("rubrik" or "humanitix"), `title`, `description`, `tags` (array of strings), `start_time` (ISO 8601), `end_time` (ISO 8601), `location`, `price_aud`, `capacity`, `url`.
>
> - `timetable_sample.json` — one fake student's timetable. Fields: `student_id`, `name`, `course`, `semester`, and a `classes` array. Each class has `code`, `name`, `type`, `day` (e.g. "Monday"), `start_time` (e.g. "10:00"), `end_time` (e.g. "11:00"), `location`, `weeks`.
>
> Build me a `data.js` (or `data.py` — pick whichever the rest of the team is using) module that exports:
>
> 1. `loadEvents()` — reads `events.json` and returns the array as-is.
>
> 2. `loadTimetable()` — reads `timetable_sample.json` and returns it.
>
> 3. `getBusySlots(timetable, weekStartDate)` — takes the timetable plus a week start date (a Monday) and returns an array of `{ start: Date, end: Date }` objects representing every class instance in that week. Convert weekday names + HH:MM strings into proper Date objects anchored to that week.
>
> 4. `eventClashesWithBusy(event, busySlots)` — takes one event (with ISO start_time/end_time) and the array from #3. Returns true if the event time range overlaps with any busy slot, false otherwise. Two ranges overlap if `eventStart < slotEnd AND eventEnd > slotStart`.
>
> 5. `filterUpcoming(events, fromDate, daysAhead)` — returns only events that start between `fromDate` and `fromDate + daysAhead`. Default to 14 days.
>
> Write clean, commented code. Include 3 small test cases at the bottom of the file (e.g. `console.log(getBusySlots(...))`). Total file under 150 lines.

---

## After the AI gives you code

1. Run the test cases and confirm output looks right.
2. **Tell Student 3** these exact function names and signatures so they can import.
3. **Tell Student 4** which file path the JSON files live at so the deploy includes them.

## Bonus: faking the "scraper" for the demo

For the demo slide, you want to be able to say "we pull from Rubrik and Humanitix". Add a fake function:

```js
// In reality this would scrape rubrik.anu.edu.au and humanitix.com
// For the prototype, we read from a cached snapshot taken earlier today.
async function fetchLatestEvents() {
  console.log("Fetching events from Rubrik and Humanitix...");
  await new Promise(r => setTimeout(r, 1200));  // fake network delay
  return loadEvents();
}
```

This costs nothing and makes the demo sound real.

## If you finish early
- Generate a second timetable file (`timetable_engineering.json`) with a different course's classes — lets you toggle between two demo users.
- Add a `searchEvents(events, query)` helper that does case-insensitive substring match across title and description. Student 1 might want a search box.
- Pre-compute a tag frequency count and share it with Student 1 — they could use it to sort the interest tag picker by popularity.
