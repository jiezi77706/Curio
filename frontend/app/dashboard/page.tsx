"use client"

import { useState } from "react"
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
  ChevronRight
} from "lucide-react"
import { RecommendationCard } from "@/components/recommendation-card"
import { CategoryFilter } from "@/components/category-filter"

const recommendations = [
  {
    id: 1,
    title: "AI Startup Workshop: From Idea to Product",
    source: "Rubric",
    category: "Entrepreneurship",
    date: "May 8, 2026",
    time: "2:00 PM - 5:00 PM",
    venue: "Marie Reay Teaching Centre",
    matchScore: 96,
    reason: "Based on your AI and entrepreneurship interests, this workshop perfectly aligns with your career goals",
    noClash: true,
  },
  {
    id: 2,
    title: "Google Campus Recruiting Session",
    source: "ANU Website",
    category: "Career Development",
    date: "May 10, 2026",
    time: "6:00 PM - 8:00 PM",
    venue: "Manning Clark Hall",
    matchScore: 94,
    reason: "As a Computer Science student, Google's technical roles are an excellent fit for your career path",
    noClash: true,
  },
  {
    id: 3,
    title: "Data Science Competition: Kaggle Challenge",
    source: "Eventbrite",
    category: "Academic Research",
    date: "May 12, 2026",
    time: "9:00 AM - 6:00 PM",
    venue: "CSIT Building N101",
    matchScore: 91,
    reason: "Highly relevant to your data science interests — a great opportunity to gain hands-on experience",
    noClash: true,
  },
  {
    id: 4,
    title: "International Student Social Night",
    source: "Humanitix",
    category: "Social Events",
    date: "May 15, 2026",
    time: "7:00 PM - 10:00 PM",
    venue: "ANU Bar & Bistro",
    matchScore: 88,
    reason: "Build cross-cultural connections and meet like-minded peers from around the world",
    noClash: true,
  },
  {
    id: 5,
    title: "Machine Learning Seminar: Latest Paper Reviews",
    source: "Rubric",
    category: "Academic Talks",
    date: "May 18, 2026",
    time: "3:00 PM - 5:00 PM",
    venue: "Hancock Building",
    matchScore: 85,
    reason: "Dive deep into cutting-edge ML research and network with professors and researchers",
    noClash: true,
  },
  {
    id: 6,
    title: "Basketball Friendly: Computing vs Business",
    source: "ANU Website",
    category: "Sports & Fitness",
    date: "May 20, 2026",
    time: "4:00 PM - 6:00 PM",
    venue: "ANU Sport & Recreation",
    matchScore: 82,
    reason: "Balance academics with athletics and strengthen teamwork skills",
    noClash: true,
  },
]

const categories = [
  { id: "all", label: "All", count: 24 },
  { id: "career", label: "Career", count: 8 },
  { id: "startup", label: "Entrepreneurship", count: 5 },
  { id: "academic", label: "Academic", count: 6 },
  { id: "social", label: "Social", count: 3 },
  { id: "sports", label: "Sports", count: 2 },
]

export default function DashboardPage() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredRecommendations = recommendations.filter(rec => {
    if (activeCategory !== "all") {
      const categoryMap: Record<string, string[]> = {
        career: ["Career Development"],
        startup: ["Entrepreneurship"],
        academic: ["Academic Research", "Academic Talks"],
        social: ["Social Events"],
        sports: ["Sports & Fitness"],
      }
      const validCategories = categoryMap[activeCategory] || []
      if (!validCategories.includes(rec.category)) {
        return false
      }
    }
    if (searchQuery && !rec.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

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
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
              </Button>
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  JD
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-1">Hello, John</h2>
          <p className="text-muted-foreground">
            We found <span className="text-primary font-semibold">24</span> curated opportunities for you this week
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search events, talks, workshops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Button variant="outline" className="h-12 gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>

        {/* Category Quick Filters */}
        <CategoryFilter 
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* AI Insights Card */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI Insights</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Based on your interest profile, we recommend prioritizing the <span className="text-primary font-medium">AI Startup Workshop</span> and 
                  <span className="text-primary font-medium"> Google Campus Recruiting Session</span> this week — both align strongly with your career objectives.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Recommendations Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">This Week&apos;s Top Picks</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-primary gap-1">
              View All
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRecommendations.map(rec => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">24</p>
              <p className="text-sm text-muted-foreground">Weekly Picks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-accent">96%</p>
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
              <p className="text-3xl font-bold text-chart-5">4</p>
              <p className="text-sm text-muted-foreground">Sources</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
