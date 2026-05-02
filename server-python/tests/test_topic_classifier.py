from app.services.topic_classifier import classify_topics


def test_topic_classifier_matches_multiple_topics() -> None:
    topics = classify_topics(
        "ANU AI Hackathon and Career Workshop",
        "A hands-on machine learning buildathon with resume coaching and networking.",
        "ANU Careers and Employability",
    )

    assert "AI" in topics
    assert "hackathon" in topics
    assert "workshop" in topics
    assert "machine learning" in topics
    assert "career" in topics
    assert "networking" in topics
