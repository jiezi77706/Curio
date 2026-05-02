# Student 3 — AI Filter & Ranking Engine

## Your role
You are the brain. You take a user (name, course, interests, timetable) plus 1500 events and return the top 5 ranked events with a one-line "why this matches you" explanation. The explanation is what makes this look like AI rather than a SQL query.

## What you are NOT doing
- No vector embeddings (no time, and string match is enough at 1500 events)
- No fine-tuning, no model training
- No fancy ML — just (1) hard filter on time clashes, (2) score on tag overlap, (3) Claude API for the explanation line

## The function you are building

```js
async function getRecommendations(user, events, timetable) {
  // user: { name, course, interests: [...] }
  // events: array of 1500 from Student 2
  // timetable: object from Student 2
  // returns: array of top 5 events, each with a 'why' field added
}
```

That single function is your entire deliverable. Student 1 calls it. Student 2 supplies the inputs.

---

## Paste this prompt into Claude / Cursor

> I'm Student 3 in a 3-hour hackathon prototype. I need to build the matching/ranking engine.
>
> **Inputs I'll receive:**
> - `user`: `{ name, course, interests: ["ai", "programming", "career"] }`
> - `events`: array of 1500 events. Each has `id`, `source`, `title`, `description`, `tags` (array of strings), `start_time` (ISO 8601), `end_time` (ISO 8601), `location`.
> - `timetable`: `{ classes: [{ day: "Monday", start_time: "10:00", end_time: "11:00", weeks: "1-12" }, ...] }`
>
> **What I need:**
>
> Build `getRecommendations(user, events, timetable)` that returns the top 5 events. Algorithm:
>
> 1. **Hard filter — drop clashes.** For each event, check whether its time overlaps with any class in the user's timetable for that week. Drop clashes. (Student 2 is providing `eventClashesWithBusy(event, busySlots)` and `getBusySlots(timetable, weekStartDate)` — import and use those.)
>
> 2. **Hard filter — only future events.** Drop events with `start_time` in the past. Keep events in the next 14 days.
>
> 3. **Score by tag overlap.** For each remaining event, score = number of `event.tags` that appear in `user.interests`. Events with score 0 are dropped.
>
> 4. **Tiebreak by source diversity.** Prefer a mix of Rubrik and Humanitix. After sorting by score (descending), if the top 5 are all one source, swap one for the highest-scoring event from the other source.
>
> 5. **Add a "why" line for the top 5.** Call the Claude API once with all 5 events plus the user's interests, and ask it to write a one-sentence explanation per event tied to that user's interests. Parse the response and attach `why` to each event.
>
> **For the Claude API call**, here's the prompt to use:
>
> ```
> A user has these interests: {interests}
> Their course is: {course}
>
> Below are 5 events I'm recommending to them. For each, write ONE short sentence (max 20 words) explaining why this event matches their interests. Be specific - reference their actual interest tags. Be friendly, not formal.
>
> Return ONLY valid JSON in this exact shape:
> [
>   {"id": "...", "why": "..."},
>   ...
> ]
>
> Events:
> {json of the 5 events with id, title, tags}
> ```
>
> Use the Anthropic API with model `claude-sonnet-4-5` and `max_tokens: 500`. Parse the JSON response and merge the `why` field back into each event.
>
> **Fallback:** if the API call fails or takes longer than 5 seconds, fall back to a templated string: `"Matches your interest in {top 2 overlapping tags}."`. The demo cannot break because of an API hiccup.
>
> **Output:** array of 5 event objects, each with all original fields plus a new `why` field.
>
> Write clean, commented code. Single file. Include a small `main()` block at the bottom that loads the JSON files, runs `getRecommendations` with a hardcoded test user `{ name: "Alex", course: "Computing", interests: ["ai", "programming", "career"] }`, and prints the results. Total under 200 lines.

---

## After the AI gives you code

1. **Test with the hardcoded user first.** Run `main()` and eyeball the 5 results. Do they actually match the interests? If everything is "free pizza" you have a tag-noise problem — filter `interests` against a set of allowed tags.

2. **Time the function.** It needs to return in under 3 seconds total or the demo feels slow. The Claude call is the bottleneck.

3. **Tell Student 1** to wire `getRecommendations` into their button click. Replace the stub array.

4. **Tell Student 4** if you need an API key environment variable set up.

## The Claude API key

Anthropic API keys start with `sk-ant-`. If you don't have one:
- Quickest fallback: skip the API call entirely, use the templated string from step 5's fallback. The demo still works, the "why" lines are just slightly more generic.
- Or use OpenAI / Gemini if someone on the team has a free key — same prompt, different SDK.

## If you finish early

- **Diversify by time of day.** Right now the top 5 might all be evening events. Add a small bonus for events spread across morning/afternoon/evening.
- **Add a recency bias.** Slightly prefer events happening sooner — multiply score by `1 / (days_until + 1)` so this week beats next week on a tie.
- **Pre-compute interest embeddings** if you really want to flex. Use the Anthropic embedding endpoint to embed each event's title+description+tags once, then cosine-similarity against the user's interests joined as a string. This is genuinely better matching than tag overlap, but only attempt if you finish everything else with 30+ minutes left.
- **Generate a "you'd hate this" list.** As a joke slide for the demo, return 3 events with the LOWEST score. Crowd loves it.
