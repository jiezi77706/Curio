"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Sparkles, ExternalLink } from "lucide-react"
import type { RecommendedEvent } from "@/lib/api"

interface RecommendationCardProps {
  recommendation: RecommendedEvent
}

const sourceColors: Record<string, string> = {
  humanitix: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  eventbrite: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  rubric:     "bg-blue-500/10 text-blue-600 border-blue-500/20",
}

function formatDate(iso: string | null): string {
  if (!iso) return "Date TBC"
  try {
    return new Date(iso).toLocaleDateString("en-AU", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    })
  } catch {
    return iso
  }
}

function scoreColor(score: number): string {
  if (score >= 90) return "text-emerald-600"
  if (score >= 75) return "text-primary"
  if (score >= 60) return "text-amber-600"
  return "text-muted-foreground"
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const {
    title,
    source_name,
    tags,
    start_datetime,
    venue_name,
    priorityScore,
    matchReason,
    registration_url,
    price_type,
  } = recommendation

  const sourceKey = (source_name || "").toLowerCase()
  const colorClass = sourceColors[sourceKey] || "bg-muted text-muted-foreground border-border"
  const isFree = (price_type || "").toLowerCase() === "free"

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30 overflow-hidden">
      <CardContent className="p-0">
        {/* Header row */}
        <div className="px-5 py-3 bg-muted/30 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={colorClass}>
              {source_name || "Unknown"}
            </Badge>
            {isFree && (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                Free
              </Badge>
            )}
            {tags.slice(0, 1).map(tag => (
              <Badge key={tag} variant="secondary" className="bg-secondary/50 capitalize">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className={`font-bold text-sm ${scoreColor(priorityScore)}`}>
              {priorityScore}%
            </span>
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
              <span>{formatDate(start_datetime)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">{venue_name || "Venue TBC"}</span>
            </div>
          </div>

          {/* AI reason */}
          <div className="p-3 rounded-lg bg-primary/5 mb-4">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {matchReason}
              </p>
            </div>
          </div>

          {/* CTA */}
          <Button
            className="w-full gap-2 group-hover:bg-primary/90"
            disabled={!registration_url}
            onClick={() => registration_url && window.open(registration_url, "_blank")}
          >
            {registration_url ? "Register Now" : "Details TBC"}
            {registration_url && <ExternalLink className="w-4 h-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
