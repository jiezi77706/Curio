"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, Sparkles, Shield, Lock, User } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [studentId, setStudentId] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate login
    await new Promise(resolve => setTimeout(resolve, 800))
    router.push("/profile")
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div className="lg:w-1/2 bg-primary p-8 lg:p-16 flex flex-col justify-center items-center text-primary-foreground">
        <div className="max-w-md text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
            <div className="w-14 h-14 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">SmartANU</h1>
              <p className="text-sm text-primary-foreground/70">AI-Powered Recommendations</p>
            </div>
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 leading-tight text-balance">
            Discover Your Next
            <br />
            <span className="text-primary-foreground/90">Campus Opportunity</span>
          </h2>
          
          <p className="text-primary-foreground/80 text-lg mb-8 leading-relaxed">
            AI-driven personalized recommendations that integrate events from Rubric, Eventbrite, Humanitix, and more — intelligently matched to your timetable and interests.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">AI-Powered Matching</p>
                <p className="text-sm text-primary-foreground/70">Tailored recommendations based on your interests and schedule</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Zero Timetable Clashes</p>
                <p className="text-sm text-primary-foreground/70">Automatically filters out events that conflict with your classes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Login Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-9 h-9 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription className="text-base">
              Sign in with your ANU student account
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-sm font-medium">
                  Student ID
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="studentId"
                    type="text"
                    placeholder="u1234567"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                First time here?
                <a href="#" className="text-primary font-medium hover:underline ml-1">
                  Learn more
                </a>
              </p>
            </div>
            
            <div className="mt-8 pt-6 border-t text-center">
              <p className="text-xs text-muted-foreground">
                Protected by ANU Information Security Policy
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
