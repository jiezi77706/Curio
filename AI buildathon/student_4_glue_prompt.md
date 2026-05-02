# Student 4 — Glue, Deploy & Demo

## Your role
You are not building a feature. You are building the conditions for the other three to succeed and ensuring there is something to demo at minute 180. You are the most important role for whether this prototype actually exists.

## What you do, in order

### First 15 minutes (during alignment)
1. Create the GitHub repo (or just a shared folder if Git would slow people down).
2. Pick the stack and **say it out loud**: "We're using React + plain JS, all in one HTML file, deployed on Vercel." Now nobody can argue.
3. Create the empty file structure:
   ```
   /
     index.html (or App.jsx)        ← Student 1
     data.js                        ← Student 2
     events.json                    ← already provided
     timetable_sample.json          ← already provided
     filter.js                      ← Student 3
     README.md                      ← you
   ```
4. Drop `events.json` and `timetable_sample.json` into the repo.
5. Confirm everyone has the API key for whichever LLM you're using (Student 3 needs it most).

### Hour 1 — float and unblock
- You're not coding yet. You're walking between students every 10 minutes asking "what's blocking you?"
- If anyone is stuck on the same thing for 15 minutes, jump in.
- Common stalls: Tailwind not loading (just CDN it), CORS errors (use `import` from `./events.json` not fetch), JSON path wrong (resolve relative to script location).

### Hour 2 — integrate
This is YOUR hour. The other three should each have something working in isolation. Your job is to make them talk.

The integration sequence:
1. Student 1's UI imports Student 2's `data.js` → can it load and console.log the events?
2. Student 1's "Find events" button calls Student 3's `getRecommendations` → does it return 5 events?
3. Student 1 renders those 5 events with `why` lines visible → does the page show them?

If any step fails, fix it yourself rather than block whoever wrote it. They should be polishing.

### Hour 3 — polish, deploy, rehearse
1. **First 20 min**: deploy. Vercel/Netlify drop-zone if frontend-only. Replit if you need a Python backend running. Get a public URL.
2. **Next 15 min**: write the README and make one slide / one-pager (problem, solution, demo screenshot, future work).
3. **Next 15 min**: rehearse the demo. Twice. Time it — should be 2 minutes max.
4. **Last 10 min**: take 3 screenshots and a 30-second screen recording as your **backup plan**. If the live demo dies on stage, you play the video.

---

## Paste this prompt into Claude / Cursor

> I'm coordinating a 3-hour hackathon prototype called "ANU Event Finder". Four people, four files.
>
> **Setup tasks I need help with:**
>
> 1. Write me a complete `README.md` that includes:
>    - One-line description: "ANU Event Finder helps students discover Rubrik and Humanitix events that match their interests and don't clash with their classes."
>    - The problem (3 bullet points)
>    - The solution / how it works (3 bullet points, mention "AI-generated explanations")
>    - Tech stack
>    - "How to run locally" section with `git clone`, `npm install`, `npm run dev` (or equivalent for the chosen stack)
>    - "Future work" section listing: real ANU SSO login, real Rubrik & Humanitix scrapers, MyTimetable iCal sync, vector embeddings for semantic matching, mobile app
>    - Credits section: "Built in 3 hours by [Names] at [Hackathon name]"
>
> 2. Write me a `package.json` for a minimal React + Vite app that includes:
>    - React 18, Tailwind, and `@anthropic-ai/sdk` for the Claude calls
>    - `dev`, `build`, `preview` scripts
>
> 3. Write me a Vercel `vercel.json` config that handles a single-page app correctly (rewrites all routes to `index.html`).
>
> 4. Write me a `.env.example` file showing `VITE_ANTHROPIC_API_KEY=your_key_here` with a comment warning that in production this key should never be exposed client-side, but for the demo it's fine.
>
> 5. Write me a 90-second demo script (the actual words to say while clicking) that walks through: (a) the problem, (b) the user filling in their profile, (c) clicking "find events", (d) showing the why-this-matches lines as the AI moment, (e) one sentence on what's next.

---

## Your demo script template

> "Hi, we built ANU Event Finder. Right now if you want to find an event on campus you have to check Rubrik for academic stuff, Humanitix for everything else, and then manually check whether it clashes with your timetable. We make that automatic.
>
> Here's the prototype. I tell it my name, my course is Computing, and my interests are AI, programming, and career. I click 'find events for me'.
>
> [point at screen]
>
> The system has filtered 1500 events down to the top 5 that match my interests AND don't clash with my classes. What I'm proudest of is this line — *['why this matches you' line]* — that's generated live by Claude using my interests as context. So it's not just keyword matching, it's actually explaining the recommendation in human terms.
>
> Next steps would be real integrations with Rubrik, Humanitix, and ANU MyTimetable. We'd also add embeddings for semantic matching — so 'I like coding' would surface 'web dev workshop' even without exact tag overlap. Thanks!"

That's 90 seconds. Practise it twice.

## Backup plan (this is not optional)
At minute 165, regardless of what's working:
1. Open the deployed site (or localhost).
2. Walk through the demo flow with screen recording on.
3. Save the .mov / .mp4 somewhere accessible.
4. Take 4 screenshots: empty state, filled-in form, results list, one event card close-up.

If anything breaks at minute 175, you play the recording. The judges will not know.

## If something is on fire at minute 150
Triage in this order:
1. **Does the page render?** If no — Student 1's problem, drop everything.
2. **Does clicking the button do anything?** If no — wiring problem, you fix it.
3. **Are events appearing?** If no — Student 2's data isn't loading, check file paths.
4. **Are the "why" lines appearing?** If no — switch Student 3 to the templated fallback string. Don't debug the API call with 30 minutes left.

The order matters. A page with a working button and templated "why" lines beats a half-broken page with a perfect ML model. Always.
