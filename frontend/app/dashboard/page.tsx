"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  GraduationCap, Search, Calendar, Sparkles,
  Bell, Filter, ChevronRight, MapPin, Clock,
  CheckCircle2, ExternalLink,
} from "lucide-react"
import { CategoryFilter } from "@/components/category-filter"
import { MOCK_EVENTS, CATEGORIES, type MockEvent } from "@/lib/mock-data"

// ── Recommendation Card (inline, uses MockEvent) ─────────────────────────────
function EventCard({ event }: { event: MockEvent }) {
  const sourceColors: Record<string, string> = {
    Humanitix: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    Rubric:    "bg-blue-500/10 text-blue-600 border-blue-500/20",
    Eventbrite:"bg-orange-500/10 text-orange-600 border-orange-500/20",
    ANU:       "bg-primary/10 text-primary border-primary/20",
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30 overflow-hidden">
      <CardContent className="p-0">
        <div className="px-5 py-3 bg-muted/30 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={sourceColors[event.source] || "bg-muted"}>
              {event.source}
            </Badge>
            {event.isFree && (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                Free
              </Badge>
            )}
            <Badge variant="secondary" className="bg-secondary/50 text-xs">
              {event.category}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm text-primary">{event.matchScore}%</span>
          </div>
        </div>

        <div className="p-5">
          <h3 className="font-semibold text-base mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 shrink-0" />
              <span>{event.date} · {event.time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-primary/5 mb-4">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {event.reason}
              </p>
            </div>
          </div>

          {event.noClash && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                No Timetable Clash
              </div>
            </div>
          )}

          <Button
            className="w-full gap-2 group-hover:bg-primary/90"
            onClick={() => window.open(event.registrationUrl, "_blank")}
          >
            Register Now
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery]       = useState("")

  const filtered = MOCK_EVENTS.filter(event => {
    const matchesSearch = !searchQuery ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCat = (() => {
      if (activeCategory === "all")      return true
      if (activeCategory === "social")   return ["Social Events", "Cultural Events"].includes(event.category)
      if (activeCategory === "academic") return ["Academic Talks", "Academic Research"].includes(event.category)
      if (activeCategory === "career")   return event.category === "Career Development"
      if (activeCategory === "wellness") return event.category === "Health & Wellness"
      if (activeCategory === "free")     return event.isFree
      return true
    })()

    return matchesSearch && matchesCat
  })

  const topScore = Math.max(...MOCK_EVENTS.map(e => e.matchScore))
  const freeCount = MOCK_EVENTS.filter(e => e.isFree).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
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
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
            </Button>
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">ANU</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-1">Hello, Student 👋</h2>
          <p className="text-muted-foreground">
            We found <span className="text-primary font-semibold">{MOCK_EVENTS.length}</span> curated opportunities for you in Canberra this week
          </p>
        </div>

        {/* Search */}
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
          categories={CATEGORIES}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* AI Insights */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI Insights</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Based on your profile as an international CS student, we recommend prioritising the{" "}
                  <span className="text-primary font-medium">ANU International Welcome BBQ</span> and{" "}
                  <span className="text-primary font-medium">AI Society Buildathon</span> this week — both align strongly with your goals of settling in and building technical skills.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events Grid */}
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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
            {filtered.length === 0 && (
              <p className="col-span-3 text-center text-muted-foreground py-12">
                No events match your search.
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Card><CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{MOCK_EVENTS.length}</p>
            <p className="text-sm text-muted-foreground">Events Found</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-accent">{topScore}%</p>
            <p className="text-sm text-muted-foreground">Top Match</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-chart-3">{freeCount}</p>
            <p className="text-sm text-muted-foreground">Free Events</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-chart-5">3</p>
            <p className="text-sm text-muted-foreground">Sources</p>
          </CardContent></Card>
        </div>
      </main>
    </div>
  )
}
