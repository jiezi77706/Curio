"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, CheckCircle2, Sparkles, ExternalLink } from "lucide-react"

interface Recommendation {
  id: number
  title: string
  source: string
  category: string
  date: string
  time: string
  venue: string
  matchScore: number
  reason: string
  noClash: boolean
}

interface RecommendationCardProps {
  recommendation: Recommendation
}

const sourceColors: Record<string, string> = {
  "Rubric": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Eventbrite": "bg-orange-500/10 text-orange-600 border-orange-500/20",
  "Humanitix": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "ANU Website": "bg-primary/10 text-primary border-primary/20",
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const { title, source, category, date, time, venue, matchScore, reason, noClash } = recommendation

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30 overflow-hidden">
      <CardContent className="p-0">
        {/* Match Score Header */}
        <div className="px-5 py-3 bg-muted/30 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={sourceColors[source] || "bg-muted"}>
              {source}
            </Badge>
            <Badge variant="secondary" className="bg-secondary/50">
              {category}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-bold text-primary">{matchScore}%</span>
          </div>
        </div>

        <div className="p-5">
          {/* Title */}
          <h3 className="font-semibold text-base mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 shrink-0" />
              <span>{date} · {time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">{venue}</span>
            </div>
          </div>

          {/* AI Reason */}
          <div className="p-3 rounded-lg bg-primary/5 mb-4">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {reason}
              </p>
            </div>
          </div>

          {/* No Clash Badge */}
          {noClash && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                No Timetable Clash
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button className="w-full gap-2 group-hover:bg-primary/90">
            Register Now
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
