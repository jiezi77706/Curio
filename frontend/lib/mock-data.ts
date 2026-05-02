/**
 * Mock event data for demo purposes.
 * Based on real ANU / Canberra event patterns from Humanitix and Rubric.
 */

export interface MockEvent {
  id: number
  title: string
  source: "Humanitix" | "Rubric" | "Eventbrite" | "ANU"
  category: string
  date: string
  time: string
  venue: string
  matchScore: number
  reason: string
  noClash: boolean
  isFree: boolean
  tags: string[]
  registrationUrl: string
}

export const MOCK_EVENTS: MockEvent[] = [
  {
    id: 1,
    title: "ANU International Student Welcome BBQ 2026",
    source: "Humanitix",
    category: "Social Events",
    date: "May 10, 2026",
    time: "12:00 PM – 3:00 PM",
    venue: "Fellows Oval, ANU Campus",
    matchScore: 97,
    reason: "Perfect for international students settling in — meet new friends and explore campus life in a relaxed outdoor setting.",
    noClash: true,
    isFree: true,
    tags: ["international", "social", "welcome"],
    registrationUrl: "https://events.humanitix.com/anu-international-welcome",
  },
  {
    id: 2,
    title: "TEDxCanberra 2026 Open Mic Night",
    source: "Humanitix",
    category: "Academic Talks",
    date: "May 14, 2026",
    time: "6:30 PM – 9:00 PM",
    venue: "Kambri Cultural Centre, ANU",
    matchScore: 94,
    reason: "Share your ideas or listen to inspiring student pitches — great for networking and building confidence in public speaking.",
    noClash: true,
    isFree: false,
    tags: ["seminar", "networking", "academic"],
    registrationUrl: "https://events.humanitix.com/tedxcanberra-2026-open-mic-night",
  },
  {
    id: 3,
    title: "Machine Learning Study Group – Weekly Session",
    source: "Rubric",
    category: "Academic Research",
    date: "May 12, 2026",
    time: "5:00 PM – 7:00 PM",
    venue: "CSIT Building N101, ANU",
    matchScore: 92,
    reason: "Weekly peer-learning session covering ML fundamentals and paper reviews — ideal for CS students wanting hands-on practice.",
    noClash: true,
    isFree: true,
    tags: ["AI", "academic", "study group"],
    registrationUrl: "https://campus.hellorubric.com/events/ml-study-group",
  },
  {
    id: 4,
    title: "Canberra Business Networking @ Ovolo Nishi",
    source: "Humanitix",
    category: "Career Development",
    date: "May 20, 2026",
    time: "1:00 PM – 4:00 PM",
    venue: "Ovolo Nishi Hotel, New Acton",
    matchScore: 89,
    reason: "Connect with Canberra professionals and startups — excellent for building your network before graduation.",
    noClash: true,
    isFree: true,
    tags: ["networking", "career", "professional"],
    registrationUrl: "https://events.humanitix.com/canberra-business-networking-event",
  },
  {
    id: 5,
    title: "ANU AI Society – Buildathon Sprint",
    source: "Rubric",
    category: "Entrepreneurship",
    date: "May 17, 2026",
    time: "9:00 AM – 6:00 PM",
    venue: "Marie Reay Teaching Centre, ANU",
    matchScore: 95,
    reason: "Build an AI product in one day with fellow students — hands-on experience that looks great on your resume.",
    noClash: true,
    isFree: true,
    tags: ["AI", "hackathon", "entrepreneurship"],
    registrationUrl: "https://campus.hellorubric.com/events/anu-ai-buildathon",
  },
  {
    id: 6,
    title: "Urban Wine Walk – Canberra Autumn 2026",
    source: "Humanitix",
    category: "Social Events",
    date: "May 23, 2026",
    time: "12:00 PM – 5:00 PM",
    venue: "Braddon, Canberra",
    matchScore: 78,
    reason: "Explore Canberra's vibrant food and wine scene — a fun way to discover the city with new friends.",
    noClash: true,
    isFree: false,
    tags: ["social", "canberra", "food"],
    registrationUrl: "https://events.humanitix.com/urbanwinewalkcanberraautumn2026",
  },
  {
    id: 7,
    title: "PhD Research Seminar – ANU College of Engineering",
    source: "Rubric",
    category: "Academic Talks",
    date: "May 15, 2026",
    time: "3:00 PM – 5:00 PM",
    venue: "Hancock Library Seminar Room, ANU",
    matchScore: 85,
    reason: "Hear cutting-edge research presentations from PhD candidates — great for understanding research pathways at ANU.",
    noClash: true,
    isFree: true,
    tags: ["research", "PhD", "seminar"],
    registrationUrl: "https://campus.hellorubric.com/events/phd-seminar",
  },
  {
    id: 8,
    title: "Scholarship & Visa Q&A for International Students",
    source: "ANU",
    category: "Information Session",
    date: "May 13, 2026",
    time: "2:00 PM – 4:00 PM",
    venue: "Chifley Library, ANU",
    matchScore: 91,
    reason: "Essential session for international students — get answers on scholarships, visa conditions, and work rights in Australia.",
    noClash: true,
    isFree: true,
    tags: ["international", "scholarship", "visa"],
    registrationUrl: "https://www.anu.edu.au/students/scholarships",
  },
  {
    id: 9,
    title: "Wellbeing Reset – Mindfulness for Students",
    source: "ANU",
    category: "Health & Wellness",
    date: "May 19, 2026",
    time: "12:00 PM – 1:00 PM",
    venue: "ANU Health & Wellbeing Centre",
    matchScore: 72,
    reason: "A guided mindfulness session to help manage exam stress and build healthy study habits.",
    noClash: true,
    isFree: true,
    tags: ["wellness", "mental health", "study support"],
    registrationUrl: "https://www.anu.edu.au/students/health-wellbeing",
  },
  {
    id: 10,
    title: "Chinese Student Association – Autumn Dinner 2026",
    source: "Rubric",
    category: "Cultural Events",
    date: "May 22, 2026",
    time: "6:30 PM – 9:30 PM",
    venue: "ANU Bar & Bistro, Kambri",
    matchScore: 88,
    reason: "Connect with the Chinese student community at ANU — great food, cultural performances, and new friendships.",
    noClash: true,
    isFree: false,
    tags: ["cultural", "social", "international"],
    registrationUrl: "https://campus.hellorubric.com/events/csa-autumn-dinner",
  },
]

export const CATEGORIES = [
  { id: "all",         label: "All",               count: MOCK_EVENTS.length },
  { id: "social",      label: "Social",             count: MOCK_EVENTS.filter(e => e.category === "Social Events" || e.category === "Cultural Events").length },
  { id: "academic",    label: "Academic",           count: MOCK_EVENTS.filter(e => ["Academic Talks", "Academic Research"].includes(e.category)).length },
  { id: "career",      label: "Career",             count: MOCK_EVENTS.filter(e => e.category === "Career Development").length },
  { id: "wellness",    label: "Wellness",           count: MOCK_EVENTS.filter(e => e.category === "Health & Wellness").length },
  { id: "free",        label: "Free",               count: MOCK_EVENTS.filter(e => e.isFree).length },
]
