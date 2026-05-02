/**
 * API client for the SmartANU backend (server-python FastAPI)
 * Base URL is configured via NEXT_PUBLIC_API_URL environment variable.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

// ── Types matching server-python schemas ──────────────────────────────────────

export interface Event {
  id: string
  source_name: string
  source_url: string | null
  title: string
  description: string | null
  short_summary: string | null
  topic_tags: string[]
  event_type: string | null
  organizer: string | null
  start_datetime: string | null
  end_datetime: string | null
  timezone: string
  venue_name: string | null
  venue_address: string | null
  online_or_physical: string
  registration_url: string | null
  price_type: string
  image_url: string | null
  status: string
  last_seen_at: string
  last_updated_at: string
  created_at: string
  content_hash: string
}

export interface StudentProfile {
  major?: string
  year?: string
  interests: string[]
  goals: string[]
  background: string
  languages: string[]
  freeText?: string
}

export interface RecommendedEvent {
  id: string
  title: string
  priorityScore: number
  matchReason: string
  tags: string[]
  source_name: string | null
  start_datetime: string | null
  venue_name: string | null
  registration_url: string | null
  image_url: string | null
  organizer: string | null
  price_type: string | null
}

export interface RecommendResponse {
  total: number
  events: RecommendedEvent[]
}

export interface SyncStatus {
  id?: string
  status: string
  source_name?: string
  events_found?: number
  events_created?: number
  events_updated?: number
  started_at?: string
  finished_at?: string
}

// ── API functions ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

/** Fetch all upcoming events sorted by date */
export async function getUpcomingEvents(): Promise<Event[]> {
  return apiFetch<Event[]>("/events/upcoming")
}

/** Fetch all events */
export async function getAllEvents(): Promise<Event[]> {
  return apiFetch<Event[]>("/events")
}

/** Get a single event by ID */
export async function getEvent(id: string): Promise<Event> {
  return apiFetch<Event>(`/events/${id}`)
}

/** Get AI-powered recommendations for a student profile */
export async function getRecommendations(
  profile: StudentProfile,
  limit = 10
): Promise<RecommendResponse> {
  return apiFetch<RecommendResponse>("/recommend", {
    method: "POST",
    body: JSON.stringify({ profile, limit }),
  })
}

/** Get current sync status */
export async function getSyncStatus(): Promise<SyncStatus> {
  return apiFetch<SyncStatus>("/sync/status")
}

/** Trigger a manual sync */
export async function triggerSync(): Promise<SyncStatus> {
  return apiFetch<SyncStatus>("/sync/run", { method: "POST" })
}

/** Get the full agent export payload */
export async function getExport() {
  return apiFetch("/events/export")
}
