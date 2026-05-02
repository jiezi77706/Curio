# Student 1 — Frontend & UI

## Your role
You own everything the user sees. By the end of hour 1 the page should look complete even though nothing is wired up yet. By end of hour 2 it talks to Student 3's filter function. By end of hour 3 it looks demo-ready.

## What you are NOT doing
- No real auth (no Google OAuth, no ANU SSO, no backend login)
- No database
- No mobile responsive (desktop demo only)
- No fancy animations

## The demo flow you are building
1. User lands on a page that says "ANU Event Finder"
2. Types a name into a fake login (e.g. "Alex")
3. Picks one course from a dropdown (5 hardcoded options)
4. Ticks 3-5 interest checkboxes (8-12 hardcoded tags)
5. Clicks "Find events for me"
6. Sees a list of 5 ranked event cards with "why this matches you" lines

That's it. Six steps, one page, one button.

---

## Paste this prompt into Claude / Cursor / v0 / Lovable

> I'm building a hackathon prototype called "ANU Event Finder". I have 3 hours.
>
> Build me a single-page React app (or plain HTML+JS if simpler) with the following structure, top to bottom:
>
> 1. **Header**: title "ANU Event Finder" and subtitle "Events that fit your timetable and interests"
>
> 2. **Step 1 - Login card**: a single text input labelled "Your name" and a placeholder "e.g. Alex". No password, no validation, just stores the name in state.
>
> 3. **Step 2 - Course card**: a dropdown labelled "Your course" with these options:
>    - Bachelor of Computing
>    - Bachelor of Science
>    - Bachelor of Arts
>    - Bachelor of Engineering
>    - Bachelor of Commerce
>
> 4. **Step 3 - Interests card**: a grid of toggleable tag pills (12 tags). Clicking toggles selected state with a coloured background. Tags:
>    `ai`, `programming`, `data-science`, `cybersecurity`, `business`, `design`, `music`, `sports`, `food`, `wellbeing`, `career`, `social`
>
> 5. **Step 4 - Action button**: large button labelled "Find events for me". When clicked, calls a function `getRecommendations(user)` and shows a loading spinner for 800ms (fake), then renders the results below.
>
> 6. **Results section**: list of event cards. Each card shows:
>    - Title (bold)
>    - Source badge ("Rubrik" in blue or "Humanitix" in purple)
>    - Date/time formatted nicely (e.g. "Wed 7 May, 2pm")
>    - Location
>    - Tag chips (max 4)
>    - A line of italic text: "Why this matches you: ..." (this comes from the filter)
>    - A "View event" link button
>
> **Styling requirements:**
> - Use Tailwind CSS
> - Clean, minimal, lots of whitespace
> - Card-based layout with soft shadows and rounded corners
> - One accent colour: indigo-600
> - Cards should stack vertically, max-width 700px, centered on the page
> - Light theme only, no dark mode toggle needed
>
> **Stub for the filter function:** Make `getRecommendations(user)` return this hardcoded array for now (Student 3 will replace it):
> ```js
> [
>   { id: "rub_00012", source: "rubrik", title: "Intro to Machine Learning", start_time: "2026-05-08T14:00:00", end_time: "2026-05-08T15:30:00", location: "Marie Reay Teaching Centre Room 4.02", tags: ["ai","machine-learning","programming"], why: "Matches your interest in AI and programming, and fits a free slot in your week." },
>   { id: "hum_00103", source: "humanitix", title: "Startup Pitch Night", start_time: "2026-05-09T19:00:00", end_time: "2026-05-09T22:00:00", location: "Smith's Alternative", tags: ["business","entrepreneurship","networking"], why: "You picked business and career - this is a chance to meet local founders." }
> ]
> ```
>
> Give me a single file I can run. If React, use a single .jsx with everything inline. Keep total code under 250 lines.

---

## After the AI gives you code

1. Get it running in the browser. Don't move on until you can see the page and click everything.
2. Drop the file into the shared repo (Student 4 will set this up in the first 15 min).
3. **Tell Student 3** the exact shape of the `user` object you pass to `getRecommendations`:
   ```js
   { name: "Alex", course: "Bachelor of Computing", interests: ["ai", "programming", "career"] }
   ```
4. **Tell Student 3** the exact shape of the event objects you expect back (matches the stub above, plus the `why` field).
5. Once Student 3's filter is ready (~hour 2), replace your stub with their function.

## If you finish early
- Add a "Hide events I've seen" toggle (just visual, no persistence needed)
- Add a "Surprise me" button that picks one random event
- Make the loading spinner a fake "AI is thinking..." message — sells the demo
