# How to run this prototype

You have 3 files in this folder:
- `index.html` — the whole app
- `events.json` — 1500 fake events
- `timetable_sample.json` — sample student timetable

## ⚠️ You can't just double-click index.html

Modern browsers block `fetch()` calls when you open a file directly with `file://`. You need to serve the files from a tiny local web server. Don't worry — this takes 30 seconds.

## Option A: Python (easiest, comes pre-installed on Mac/Linux)

1. Open Terminal (Mac) or Command Prompt (Windows)
2. Navigate to this folder:
   ```
   cd path/to/this/folder
   ```
3. Start the server:
   ```
   python3 -m http.server 8000
   ```
   (On Windows, try `python -m http.server 8000`)
4. Open your browser and go to:
   ```
   http://localhost:8000
   ```
5. The app should load. Click around, click "Find events for me", and you'll see 5 ranked events.

## Option B: VS Code Live Server extension

1. Open the folder in VS Code
2. Install the "Live Server" extension (by Ritwick Dey) if you don't have it
3. Right-click `index.html` → "Open with Live Server"
4. Browser opens automatically

## Option C: Node (if you have it)

```
npx serve .
```
Then open the URL it prints (usually `http://localhost:3000`).

## What you should see

A clean form with:
- A name field (pre-filled with "Alex")
- A course dropdown
- 12 interest tag pills (3 are pre-selected: ai, programming, career)
- A big "Find events for me" button

Click the button. After a brief loading spinner, 5 event cards appear with:
- Event title and source badge (Rubrik or Humanitix)
- Date, time, location
- Tag pills
- A "💡 Why this matches you:" line in italic indigo text
- A "View event →" link

## Test ideas

1. **Default click** — should return 5 events related to AI, programming, or career
2. **Untick all interests, retick only `music`, `food`, `social`** — should return totally different events (festivals, social nights, food meetups)
3. **Click the button 3 times in a row with the same selections** — the events should be the same, but the "why" wording should vary slightly
4. **Untick everything and click** — should show an alert asking you to pick at least one interest
5. **Check timetable clashes** — the sample timetable has Monday 10-11am (COMP1100). None of the returned events should fall in that slot.

## How to deploy it (to share a public URL)

The whole app is one HTML file plus two JSON files. Easiest deploy options:

**Netlify drag-and-drop**: go to [app.netlify.com/drop](https://app.netlify.com/drop), drag the folder, get a URL.

**Vercel**: install the Vercel CLI (`npm i -g vercel`), run `vercel` in the folder, follow the prompts.

**GitHub Pages**: push the folder to a repo, enable Pages in the repo settings.

Done.
