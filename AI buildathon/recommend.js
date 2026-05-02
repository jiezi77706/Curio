// recommend.js — Matching/ranking engine for hackathon prototype
// Owner: Student 3. Exports: getRecommendations(user, events, timetable)

const fs = require('fs');
const path = require('path');

// Student 2's helpers — assumed to live in ./busy.js.
const { eventClashesWithBusy, getBusySlots } = require('./busy');

const CLAUDE_MODEL = 'claude-sonnet-4-5';
const CLAUDE_MAX_TOKENS = 500;
const CLAUDE_TIMEOUT_MS = 5000;
const HORIZON_DAYS = 14;
const TOP_N = 5;

// --- helpers ---------------------------------------------------------------

// Count how many event tags are in the user's interest list (case-insensitive).
function scoreEvent(event, interests) {
  const set = new Set(interests.map(i => i.toLowerCase()));
  return (event.tags || []).filter(t => set.has(t.toLowerCase())).length;
}

// Tags shared between event and user — used for the fallback "why" line.
function overlappingTags(event, interests) {
  const set = new Set(interests.map(i => i.toLowerCase()));
  return (event.tags || []).filter(t => set.has(t.toLowerCase()));
}

// Monday 00:00 of the week containing `date` — fed to getBusySlots.
function mondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

// Cache busy slots per week so we don't recompute for every event.
function makeBusySlotsCache(timetable) {
  const cache = new Map();
  return (eventStart) => {
    const key = mondayOfWeek(eventStart).toISOString();
    if (!cache.has(key)) cache.set(key, getBusySlots(timetable, new Date(key)));
    return cache.get(key);
  };
}

// --- core pipeline ---------------------------------------------------------

// Hard filters: future, within 14-day horizon, no timetable clash.
function filterEvents(events, timetable, now = new Date()) {
  const horizon = new Date(now.getTime() + HORIZON_DAYS * 86400000);
  const busyFor = makeBusySlotsCache(timetable);
  return events.filter(ev => {
    const start = new Date(ev.start_time);
    if (isNaN(start) || start < now || start > horizon) return false;
    return !eventClashesWithBusy(ev, busyFor(start));
  });
}

// Score by tag overlap, drop zeros, sort descending.
function scoreAndRank(events, interests) {
  return events
    .map(ev => ({ ev, score: scoreEvent(ev, interests) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => ({ ...x.ev, _score: x.score }));
}

// If the top N are all one source, swap the weakest for the best from the other.
function diversifyBySource(ranked, n = TOP_N) {
  const top = ranked.slice(0, n);
  if (top.length < n) return top;
  if (new Set(top.map(e => e.source)).size > 1) return top;
  const dominant = top[0].source;
  const other = ranked.find(e => e.source && e.source !== dominant);
  if (!other) return top; // nothing to swap with
  return [...top.slice(0, -1), other];
}

// --- "why" generation ------------------------------------------------------

function buildWhyPrompt(user, top) {
  const slim = top.map(e => ({ id: e.id, title: e.title, tags: e.tags }));
  return `A user has these interests: ${JSON.stringify(user.interests)}
Their course is: ${user.course}

Below are 5 events I'm recommending to them. For each, write ONE short sentence (max 20 words) explaining why this event matches their interests. Be specific - reference their actual interest tags. Be friendly, not formal.

Return ONLY valid JSON in this exact shape:
[
  {"id": "...", "why": "..."},
  ...
]

Events:
${JSON.stringify(slim, null, 2)}`;
}

function fallbackWhy(event, interests) {
  const overlaps = overlappingTags(event, interests).slice(0, 2);
  if (overlaps.length === 0) return 'Looks like a good fit for you.';
  return `Matches your interest in ${overlaps.join(' and ')}.`;
}

// Call Anthropic API with 5s timeout. Returns Map<id, why> or null on failure.
async function fetchWhys(user, top) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLAUDE_TIMEOUT_MS);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: CLAUDE_MAX_TOKENS,
        messages: [{ role: 'user', content: buildWhyPrompt(user, top) }],
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = (data.content || [])
      .filter(b => b.type === 'text').map(b => b.text).join('').trim();
    // Strip ```json fences if the model added them.
    const clean = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(clean);
    if (!Array.isArray(parsed)) return null;
    const map = new Map();
    for (const row of parsed) if (row && row.id) map.set(row.id, row.why);
    return map;
  } catch {
    return null; // timeout, network, parse — caller falls back
  } finally {
    clearTimeout(timer);
  }
}

async function attachWhys(user, top) {
  const whys = await fetchWhys(user, top);
  return top.map(ev => {
    const why = (whys && whys.get(ev.id)) || fallbackWhy(ev, user.interests);
    const { _score, ...clean } = ev;
    return { ...clean, why };
  });
}

// --- public entry point ----------------------------------------------------

async function getRecommendations(user, events, timetable) {
  const filtered = filterEvents(events, timetable);
  const ranked = scoreAndRank(filtered, user.interests);
  const top = diversifyBySource(ranked, TOP_N);
  return attachWhys(user, top);
}

module.exports = { getRecommendations };

// --- demo main -------------------------------------------------------------

async function main() {
  const events = JSON.parse(fs.readFileSync(path.join(__dirname, 'events.json'), 'utf8'));
  const timetable = JSON.parse(fs.readFileSync(path.join(__dirname, 'timetable.json'), 'utf8'));
  const user = { name: 'Alex', course: 'Computing', interests: ['ai', 'programming', 'career'] };
  const recs = await getRecommendations(user, events, timetable);

  console.log(`Top ${recs.length} for ${user.name}:\n`);
  for (const r of recs) {
    console.log(`• [${r.source}] ${r.title}`);
    console.log(`  ${r.start_time} @ ${r.location}`);
    console.log(`  tags: ${(r.tags || []).join(', ')}`);
    console.log(`  why:  ${r.why}\n`);
  }
}

if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
