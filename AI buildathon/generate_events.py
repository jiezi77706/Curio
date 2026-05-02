"""
Generate 1500 fake events split between Rubrik (700) and Humanitix (800).
Designed to look realistic for an ANU student hackathon prototype.
"""
import json
import random
from datetime import datetime, timedelta

random.seed(42)  # reproducible

# ----------------------------------------------------------------------------
# Tag pool — these match the dynamic interest tags the user picks in the UI.
# Keep them broad enough that most students will tick at least 2-3.
# ----------------------------------------------------------------------------
TAGS = [
    "ai", "machine-learning", "data-science", "programming", "web-dev",
    "cybersecurity", "robotics", "engineering", "physics", "maths",
    "biology", "chemistry", "medicine", "psychology", "neuroscience",
    "business", "entrepreneurship", "finance", "marketing", "economics",
    "law", "politics", "international-relations", "history", "philosophy",
    "art", "design", "music", "film", "photography",
    "writing", "literature", "languages", "culture", "religion",
    "sports", "fitness", "yoga", "hiking", "climbing",
    "food", "cooking", "wine", "coffee", "vegan",
    "career", "networking", "leadership", "public-speaking", "mentoring",
    "wellbeing", "mental-health", "meditation", "mindfulness", "sleep",
    "social", "party", "trivia", "games", "board-games",
    "volunteering", "sustainability", "climate", "environment", "activism",
    "research", "phd", "academic", "study-skills", "writing-skills",
    "free-food", "pizza", "coffee-free", "drinks", "bbq",
    "lgbtq", "diversity", "women-in-tech", "international-students",
    "startup", "hackathon", "competition", "workshop", "seminar",
    "movie-night", "open-mic", "concert", "festival", "exhibition",
]

# ----------------------------------------------------------------------------
# Title templates — mix of formats so the dataset doesn't look generated.
# {topic} gets filled from a topic pool, {speaker} from a name pool, etc.
# ----------------------------------------------------------------------------
RUBRIK_TITLE_TEMPLATES = [
    "{topic} Workshop",
    "Intro to {topic}",
    "Advanced {topic} Techniques",
    "{topic} for Beginners",
    "Mastering {topic}",
    "{topic} Bootcamp",
    "Hands-on {topic} Session",
    "{topic}: A Practical Guide",
    "{topic} Study Group",
    "{topic} Q&A with {speaker}",
    "Career Talk: {topic}",
    "Industry Panel on {topic}",
    "Research Seminar: {topic}",
    "{topic} Reading Group",
    "Lab Tour: {topic}",
    "Networking Night: {topic}",
    "Skill Up: {topic}",
    "{topic} Masterclass",
    "Guest Lecture: {topic}",
    "{topic} Drop-in Session",
]

HUMANITIX_TITLE_TEMPLATES = [
    "{topic} Night",
    "{topic} Festival",
    "{topic} Meetup",
    "Friday {topic} Social",
    "{topic} & Drinks",
    "ANU {topic} Club Welcome",
    "{topic} Pub Crawl",
    "Open Mic: {topic}",
    "{topic} Trivia Night",
    "{topic} Movie Screening",
    "{topic} Pop-up",
    "End of Semester {topic} Party",
    "{topic} Showcase",
    "{topic} Market",
    "Live Music: {topic}",
    "{topic} Tournament",
    "Campus {topic} Day",
    "{topic} Charity Event",
    "{topic} Launch Party",
    "Sunday {topic} Brunch",
    "{topic} Workshop & Wine",
    "{topic} Comedy Night",
    "{topic} Society AGM",
    "{topic} Welcome Drinks",
]

# Topics the templates pull from — each has the tags it implies.
TOPICS = {
    "Machine Learning": ["ai", "machine-learning", "data-science"],
    "Python Programming": ["programming", "web-dev", "data-science"],
    "Web Development": ["web-dev", "programming", "design"],
    "Cybersecurity": ["cybersecurity", "programming"],
    "Data Science": ["data-science", "ai", "research"],
    "Robotics": ["robotics", "engineering", "ai"],
    "Quantum Computing": ["physics", "ai", "research"],
    "Statistics": ["maths", "data-science", "research"],
    "Biology": ["biology", "research", "academic"],
    "Chemistry": ["chemistry", "research", "academic"],
    "Medicine": ["medicine", "biology", "career"],
    "Psychology": ["psychology", "wellbeing", "research"],
    "Neuroscience": ["neuroscience", "biology", "research"],
    "Startup Pitching": ["entrepreneurship", "startup", "business"],
    "Personal Finance": ["finance", "career", "business"],
    "Marketing": ["marketing", "business", "design"],
    "Economics": ["economics", "business", "research"],
    "Constitutional Law": ["law", "politics", "academic"],
    "International Relations": ["international-relations", "politics"],
    "Australian History": ["history", "culture", "academic"],
    "Philosophy": ["philosophy", "academic", "writing"],
    "Drawing": ["art", "design"],
    "UX Design": ["design", "web-dev", "art"],
    "Indie Music": ["music", "concert", "social"],
    "Indie Film": ["film", "movie-night", "art"],
    "Photography": ["photography", "art", "design"],
    "Creative Writing": ["writing", "literature", "art"],
    "Japanese Language": ["languages", "culture", "international-students"],
    "Mandarin Conversation": ["languages", "culture", "international-students"],
    "Climate Action": ["climate", "sustainability", "activism"],
    "Sustainability": ["sustainability", "environment", "climate"],
    "Social Soccer": ["sports", "fitness", "social"],
    "Bouldering": ["climbing", "fitness", "sports"],
    "Yoga": ["yoga", "wellbeing", "fitness", "mindfulness"],
    "Running Club": ["sports", "fitness", "social"],
    "Bushwalking": ["hiking", "fitness", "environment"],
    "Cooking": ["cooking", "food", "social"],
    "Vegan Food": ["vegan", "food", "sustainability"],
    "Wine Tasting": ["wine", "drinks", "food"],
    "Specialty Coffee": ["coffee", "food", "social"],
    "Career Fair": ["career", "networking", "business"],
    "Resume Workshop": ["career", "workshop", "academic"],
    "Public Speaking": ["public-speaking", "career", "leadership"],
    "Mindfulness": ["mindfulness", "wellbeing", "mental-health"],
    "Mental Health": ["mental-health", "wellbeing", "psychology"],
    "Sleep Science": ["sleep", "wellbeing", "research"],
    "Trivia": ["trivia", "social", "games"],
    "Board Games": ["board-games", "games", "social"],
    "Volunteering": ["volunteering", "social", "activism"],
    "Women in Tech": ["women-in-tech", "diversity", "career"],
    "Pride Week": ["lgbtq", "diversity", "social"],
    "International Students": ["international-students", "social", "diversity"],
    "Hackathon": ["hackathon", "competition", "programming", "ai"],
    "PhD Life": ["phd", "academic", "research", "wellbeing"],
    "Research Skills": ["research", "academic", "writing-skills"],
    "Study Skills": ["study-skills", "academic", "wellbeing"],
    "Pizza": ["pizza", "free-food", "social"],
    "BBQ": ["bbq", "free-food", "social"],
    "Karaoke": ["music", "social", "party"],
    "Live Comedy": ["social", "art", "party"],
    "Art Exhibition": ["exhibition", "art", "culture"],
    "Film Festival": ["festival", "film", "culture"],
    "Music Festival": ["festival", "music", "social"],
    "Halloween": ["party", "social", "festival"],
    "Diwali": ["culture", "festival", "international-students"],
    "Lunar New Year": ["culture", "festival", "international-students"],
    "Reading Group": ["literature", "writing", "academic"],
    "Debate": ["public-speaking", "politics", "academic"],
    "Mentoring": ["mentoring", "career", "leadership"],
    "Religion & Belief": ["religion", "philosophy", "culture"],
}

# Speakers / hosts — sound plausible without being real people.
SPEAKERS = [
    "Dr Sarah Chen", "Prof. James Walker", "Dr Priya Nair", "Dr Tom Hayes",
    "Dr Ayesha Khan", "Prof. Maria Rossi", "Dr Liam O'Brien", "Dr Emi Tanaka",
    "Prof. David Kim", "Dr Olivia Brown", "Dr Marcus Lee", "Dr Hannah Wright",
    "Industry Guest", "ANU Alumni Panel", "Visiting Researcher", "Student Panel",
]

# Locations — mix real ANU spots and generic Canberra venues.
ANU_LOCATIONS = [
    "Kambri Cinema", "Llewellyn Hall", "Manning Clark Centre Theatre 1",
    "Manning Clark Centre Theatre 2", "Hancock Library Level 2",
    "Chifley Library Meeting Room", "RSCS Seminar Room N101",
    "RSCS Seminar Room N115", "Hanna Neumann Building 145",
    "Birch Building Room 1.04", "Marie Reay Teaching Centre Room 4.02",
    "Marie Reay Teaching Centre Room 5.01", "Coombs Lecture Theatre",
    "Copland Theatre", "Innovation Hub Kambri", "Pop-Up Village",
    "ANU Sport Squash Courts", "ANU Pool", "Fellows Oval",
    "Sullivans Creek Path", "Mount Ainslie Trailhead",
]

CITY_LOCATIONS = [
    "Smith's Alternative", "The Phoenix Pub", "Sideway Bar", "Highball Express",
    "BentSpoke Brewing", "Capital Brewing Co", "Lonsdale Street Roasters",
    "Civic Square", "Glebe Park Pavilion", "Old Bus Depot Markets",
    "National Gallery of Australia", "National Library Theatre",
    "Canberra Theatre Centre", "Belconnen Arts Centre", "Tuggeranong Arts Centre",
]

# ----------------------------------------------------------------------------
# Description templates — short, varied, mention the topic and a hook.
# ----------------------------------------------------------------------------
DESC_TEMPLATES = [
    "Join us for a {duration} session covering {topic}. {hook}",
    "{hook} This {duration} event explores {topic} with {speaker}.",
    "Whether you're new to {topic} or experienced, you'll get something out of this {duration} session. {hook}",
    "A relaxed {duration} on {topic}. {hook}",
    "{hook} Come along to learn about {topic}. Light refreshments provided.",
    "Hands-on, friendly, no prerequisites. {topic} session run by {speaker}. {hook}",
    "{topic} fans, this one's for you. {hook} Free for ANU students.",
    "Drop in for a {duration} on {topic}. {hook}",
    "{hook} Featuring {topic} with discussion and Q&A.",
    "A casual gathering around {topic}. {hook} Bring a friend.",
]

HOOKS = [
    "Free pizza for the first 30 attendees.",
    "Open to all years and disciplines.",
    "BYO laptop.",
    "RSVP essential, spots limited.",
    "Includes networking time afterwards.",
    "Refreshments and snacks provided.",
    "Beginner friendly, no experience needed.",
    "Members and non-members welcome.",
    "Tickets going fast, book now.",
    "Wheelchair accessible venue.",
    "We'll have prizes for top participants.",
    "Bring your own questions.",
    "Free entry, donations welcome.",
    "Auslan interpreted on request.",
    "Hosted by the student society.",
]

DURATIONS = ["1-hour", "90-minute", "2-hour", "3-hour", "half-day", "evening"]


def random_datetime_in_semester():
    """
    Return a (start, end) datetime pair somewhere in the next 8 weeks.
    Events run between 8am and 10pm, last 1-3 hours.
    """
    base = datetime(2026, 5, 5, 0, 0)  # Monday after today's date
    day_offset = random.randint(0, 55)
    hour = random.choice([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
    minute = random.choice([0, 15, 30, 45])
    start = base + timedelta(days=day_offset, hours=hour, minutes=minute)
    duration_hours = random.choice([1, 1, 1, 1.5, 2, 2, 3])
    end = start + timedelta(hours=duration_hours)
    return start, end


def generate_event(event_id, source):
    """Generate one event dict. source is 'rubrik' or 'humanitix'."""
    topic, base_tags = random.choice(list(TOPICS.items()))

    # Title
    if source == "rubrik":
        template = random.choice(RUBRIK_TITLE_TEMPLATES)
    else:
        template = random.choice(HUMANITIX_TITLE_TEMPLATES)
    speaker = random.choice(SPEAKERS)
    title = template.format(topic=topic, speaker=speaker)

    # Tags — base tags plus 0-2 random extras for noise
    tags = list(base_tags)
    extra_count = random.choices([0, 1, 2], weights=[3, 4, 2])[0]
    while len(tags) < len(base_tags) + extra_count:
        candidate = random.choice(TAGS)
        if candidate not in tags:
            tags.append(candidate)

    # Time
    start, end = random_datetime_in_semester()

    # Location — Rubrik leans campus, Humanitix leans city venues
    if source == "rubrik":
        location = random.choices(
            [random.choice(ANU_LOCATIONS), random.choice(CITY_LOCATIONS)],
            weights=[8, 2]
        )[0]
    else:
        location = random.choices(
            [random.choice(ANU_LOCATIONS), random.choice(CITY_LOCATIONS)],
            weights=[3, 7]
        )[0]

    # Description
    desc = random.choice(DESC_TEMPLATES).format(
        topic=topic.lower(),
        speaker=speaker,
        duration=random.choice(DURATIONS),
        hook=random.choice(HOOKS),
    )

    # Price
    if source == "rubrik":
        price = 0  # campus events almost always free
    else:
        price = random.choices([0, 0, 0, 5, 10, 15, 20, 25], weights=[4, 3, 2, 2, 2, 1, 1, 1])[0]

    # Capacity
    capacity = random.choice([20, 30, 50, 75, 100, 150, 200, 300, 500])

    return {
        "id": f"{source[:3]}_{event_id:05d}",
        "source": source,
        "title": title,
        "description": desc,
        "tags": tags,
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "location": location,
        "price_aud": price,
        "capacity": capacity,
        "url": f"https://{source}.example.com/events/{event_id}",
    }


def main():
    events = []

    # 700 Rubrik (campus / academic / society events)
    for i in range(1, 701):
        events.append(generate_event(i, "rubrik"))

    # 800 Humanitix (broader Canberra events, paid+free, social leaning)
    for i in range(1, 801):
        events.append(generate_event(i, "humanitix"))

    # Shuffle so the file isn't grouped by source — feels more realistic
    random.shuffle(events)

    with open("/home/claude/anu_event_filter/events.json", "w") as f:
        json.dump(events, f, indent=2)

    print(f"Generated {len(events)} events")
    print(f"Rubrik:    {sum(1 for e in events if e['source'] == 'rubrik')}")
    print(f"Humanitix: {sum(1 for e in events if e['source'] == 'humanitix')}")
    print(f"\nSample Rubrik event:")
    print(json.dumps(next(e for e in events if e['source'] == 'rubrik'), indent=2))
    print(f"\nSample Humanitix event:")
    print(json.dumps(next(e for e in events if e['source'] == 'humanitix'), indent=2))


if __name__ == "__main__":
    main()
