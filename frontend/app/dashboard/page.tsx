"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  GraduationCap,
  Search,
  Calendar,
  Sparkles,
  Bell,
  Filter,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { RecommendationCard } from "@/components/recommendation-card"
import { CategoryFilter } from "@/components/category-filter"
import {
  getRecommendations,
  getUpcomingEvents,
  type RecommendedEvent,
  type StudentProfile,
} from "@/lib/api"

// Default profile — in production this comes from the user's saved profile
const DEFAULT_PROFILE: StudentProfile = {
  major: "Computer Science",
  year: "first year",
  interests: ["programming", "AI", "networking", "career"],
  goals: ["settle in", "find study groups", "career development"],
  background: "international",
  languages: ["English"],
}

const CATEGORIES = [
  { id: "all",      label: "All",            count: 0 },
  { id: "career",   label: "Career",         count: 0 },
  { id: "academic", label: "Academic",       count: 0 },
  { id: "social",   label: "Social",         count: 0 },
  { id: "wellness", label: "Wellness",       count: 0 },
  { id: "free",     label: "Free",           count: 0 },
]

// Map backend topic_tags / price_type to frontend category IDs
function eventMatchesCategory(event: RecommendedEvent, category: string): boolean {
  if (category === "all") return true
  const tags = (event.tags || []).map(t => t.toLowerCase())
  const price = (event.price_type || "").toLowerCase()
  switch (category) {
    case "career":   return tags.some(t => ["career", "networking", "job", "internship", "professional"].includes(t))
    case "academic": return tags.some(t => ["academic", "seminar", "lecture", "research", "workshop", "phd"].includes(t))
    case "social":   return tags.some(t => ["social", "networking", "cultural", "international", "community"].includes(t))
    case "wellness": return tags.some(t => ["wellbeing", "wellness", "sport", "fitness", "mental health"].includes(t))
    case "free":     return price === "free"
    default:         return true
  }
}

export default function DashboardPage() {
  const [activeCategory, setActiveCategory]     = useState("all")
  const [searchQuery, setSearchQuery]           = useState("")
  const [recommendations, setRecommendations]   = useState<RecommendedEvent[]>([])
  const [totalEvents, setTotalEvents]           = useState(0)
  const [isLoading, setIsLoading]               = useState(true)
  const [error, setError]                       = useState<string | null>(null)
  const [topInsight, setTopInsight]             = useState<string>("")

  const loadRecommendations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Try AI recommendations first
      const result = await getRecommendations(DEFAULT_PROFILE, 20)
      setRecommendations(result.events)
      setTotalEvents(result.total)

      // Build AI insight from top 2 results
      if (result.events.length >= 2) {
        setTopInsight(
          `Based on your profile, we recommend prioritising ` +
          `"${result.events[0].title}" and "${result.events[1].title}" ` +
          `— both align strongly with your interests.`
        )
      }
    } catch (err) {
      // Fallback: load raw upcoming events if AI endpoint fails
      try {
        const events = await getUpcomingEvents()
        const fallback: RecommendedEvent[] = events.slice(0, 20).map(e => ({
          id: e.id,
          title: e.title,
          priorityScore: 75,
          matchReason: e.short_summary || e.description || "Upcoming event at ANU / Canberra",
          tags: e.topic_tags || [],
          source_name: e.source_name,
          start_datetime: e.start_datetime,
          venue_name: e.venue_name,
          registration_url: e.registration_url,
          image_url: e.image_url,
          organizer: e.organizer,
          price_type: e.price_type,
        }))
        setRecommendations(fallback)
        setTotalEvents(events.length)
        setTopInsight("Showing upcoming events. AI recommendations will appear once the model responds.")
      } catch {
        setError("Could not connect to the backend. Make sure server-python is running on port 8000.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRecommendations()
  }, [loadRecommendations])

  // Build category counts from loaded data
  const categoriesWithCounts = CATEGORIES.map(cat => ({
    ...cat,
    count: cat.id === "all"
      ? recommendations.length
      : recommendations.filter(r => eventMatchesCategory(r, cat.id)).length,
  }))

  const filtered = recommendations.filter(rec => {
    const matchesCat = eventMatchesCategory(rec, activeCategory)
    const matchesSearch = !searchQuery ||
      rec.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  const topScore = recommendations[0]?.priorityScore ?? 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">SmartANU</h1>
                <p className="text-xs text-muted-foreground">AI Recommendation Engine</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
              </Button>
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  ANU
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-1">Hello, Student 👋</h2>
          <p className="text-muted-foreground">
            {isLoading
              ? "Loading your personalised recommendations..."
              : error
              ? "Could not load recommendations"
              : <>We found <span className="text-primary font-semibold">{totalEvents}</span> curated opportunities for you</>
            }
          </p>
        </div>

        {/* Error state */}
        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" className="ml-auto" onClick={loadRecommendations}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search events, talks, workshops..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Button variant="outline" className="h-12 gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>

        {/* Category Filters */}
        <CategoryFilter
          categories={categoriesWithCounts}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* AI Insights */}
        {topInsight && !isLoading && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI Insights</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{topInsight}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">Top Picks For You</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-primary gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Getting AI recommendations...</span>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map(rec => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
              {filtered.length === 0 && !error && (
                <p className="col-span-3 text-center text-muted-foreground py-12">
                  No events match your current filter.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{totalEvents}</p>
              <p className="text-sm text-muted-foreground">Events Found</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-accent">{topScore}%</p>
              <p className="text-sm text-muted-foreground">Top Match</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-chart-3">0</p>
              <p className="text-sm text-muted-foreground">Conflicts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-chart-5">2</p>
              <p className="text-sm text-muted-foreground">Sources</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
