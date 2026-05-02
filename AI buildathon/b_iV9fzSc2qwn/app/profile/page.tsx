"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Upload, Check, ArrowRight, Calendar, BookOpen } from "lucide-react"

const interests = [
  { id: "career", label: "Career Development", icon: "briefcase" },
  { id: "networking", label: "Networking", icon: "users" },
  { id: "startup", label: "Entrepreneurship", icon: "rocket" },
  { id: "sports", label: "Sports & Fitness", icon: "activity" },
  { id: "academic", label: "Academic Research", icon: "book" },
  { id: "social", label: "Social Events", icon: "party" },
  { id: "ai", label: "Artificial Intelligence", icon: "cpu" },
  { id: "seminar", label: "Seminars & Talks", icon: "mic" },
]

const categories = [
  { id: "workshop", label: "Workshops" },
  { id: "networking", label: "Networking Events" },
  { id: "career", label: "Career Fairs" },
  { id: "sports", label: "Sports Events" },
  { id: "cultural", label: "Cultural Activities" },
  { id: "academic", label: "Academic Talks" },
]

const degrees = [
  "Bachelor of Computer Science",
  "Master of Data Science",
  "Master of Artificial Intelligence",
  "Master of Business Information Systems",
  "Bachelor of Software Engineering",
  "Master of Information Technology",
  "Master of Cybersecurity",
  "Master of Applied Data Analytics",
]

export default function ProfilePage() {
  const router = useRouter()
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [degree, setDegree] = useState("")
  const [timetableUploaded, setTimetableUploaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleTimetableUpload = () => {
    setTimetableUploaded(true)
  }

  const handleContinue = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">SmartANU</h1>
              <p className="text-xs text-muted-foreground">Profile Setup</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Step 1 of 2</span>
            <div className="flex gap-1">
              <div className="w-8 h-1.5 rounded-full bg-primary" />
              <div className="w-8 h-1.5 rounded-full bg-muted" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Set Up Your Preferences</h2>
          <p className="text-muted-foreground">Help us deliver the most relevant event recommendations for you</p>
        </div>

        <div className="grid gap-6">
          {/* Degree Selection */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Degree Program</CardTitle>
                  <CardDescription>Select your current degree program</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Select value={degree} onValueChange={setDegree}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select your degree program" />
                </SelectTrigger>
                <SelectContent>
                  {degrees.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Interests */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <span className="text-xl">*</span>
                </div>
                <div>
                  <CardTitle className="text-lg">Interest Tags</CardTitle>
                  <CardDescription>Select areas you are interested in (multiple allowed)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {interests.map(interest => (
                  <Badge
                    key={interest.id}
                    variant={selectedInterests.includes(interest.id) ? "default" : "outline"}
                    className={`px-4 py-2 text-sm cursor-pointer transition-all ${
                      selectedInterests.includes(interest.id) 
                        ? "bg-primary hover:bg-primary/90" 
                        : "hover:bg-muted"
                    }`}
                    onClick={() => toggleInterest(interest.id)}
                  >
                    {interest.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-chart-3/20 flex items-center justify-center">
                  <span className="text-xl">#</span>
                </div>
                <div>
                  <CardTitle className="text-lg">Event Category Preferences</CardTitle>
                  <CardDescription>Choose your preferred types of events</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedCategories.includes(cat.id)
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{cat.label}</span>
                      {selectedCategories.includes(cat.id) && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timetable Import */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-chart-2/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-chart-2" />
                </div>
                <div>
                  <CardTitle className="text-lg">Timetable Import</CardTitle>
                  <CardDescription>Import your class schedule to avoid event conflicts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!timetableUploaded ? (
                <button
                  onClick={handleTimetableUpload}
                  className="w-full p-8 border-2 border-dashed rounded-xl hover:border-primary hover:bg-muted/50 transition-all group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">Click to import timetable</p>
                      <p className="text-sm text-muted-foreground">Supports direct sync from ISIS portal</p>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="p-6 bg-accent/10 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                      <Check className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-accent-foreground">Timetable successfully imported</p>
                      <p className="text-sm text-muted-foreground">Detected 12 courses with 35 time slots</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Continue Button */}
          <Button 
            onClick={handleContinue}
            className="h-14 text-base font-medium"
            disabled={!degree || selectedInterests.length === 0 || isLoading}
          >
            {isLoading ? (
              "Generating recommendations..."
            ) : (
              <>
                Explore Recommendations
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}
