from __future__ import annotations

TOPIC_KEYWORDS: dict[str, list[str]] = {
    "AI": ["ai", "artificial intelligence", "generative ai", "llm"],
    "machine learning": ["machine learning", "ml", "deep learning"],
    "hackathon": ["hackathon", "buildathon", "codefest"],
    "workshop": ["workshop", "bootcamp", "hands-on"],
    "research": ["research", "researcher", "research showcase"],
    "PhD": ["phd", "doctoral", "doctorate"],
    "startup": ["startup", "founder", "venture"],
    "entrepreneurship": ["entrepreneurship", "entrepreneur", "innovation challenge"],
    "career": ["career", "employer", "resume", "cv", "internship", "job"],
    "networking": ["networking", "meet and greet", "industry night"],
    "wellbeing": ["wellbeing", "well-being", "mental health", "mindfulness"],
    "scholarship": ["scholarship", "funding round", "grant"],
    "international students": ["international students", "international student", "global student"],
    "accommodation": ["accommodation", "housing", "residential hall"],
    "visa": ["visa", "migration", "immigration"],
    "instrumentation": ["instrumentation", "microscopy", "spectroscopy"],
    "laboratory": ["laboratory", "lab", "wet lab", "dry lab"],
    "seminar": ["seminar", "colloquium", "guest lecture"],
    "assignment": ["assignment", "assessment", "exam prep"],
    "study support": ["study support", "study help", "peer assisted study", "drop-in support"],
    "academic skills": ["academic skills", "writing support", "study skills", "time management"],
}


def classify_topics(title: str | None, description: str | None, organizer: str | None) -> list[str]:
    combined = " ".join([title or "", description or "", organizer or ""]).lower()
    matches: list[str] = []
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(keyword in combined for keyword in keywords):
            matches.append(topic)
    return matches
