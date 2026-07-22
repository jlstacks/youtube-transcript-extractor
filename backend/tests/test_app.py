from dataclasses import dataclass

import pytest

from app import create_app, extract_video_id, format_srt_time


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5", "dQw4w9WgXcQ"),
        ("https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"),
        ("youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://music.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://example.com/watch?v=dQw4w9WgXcQ", None),
        ("not-a-video!", None),
        (None, None),
    ],
)
def test_extract_video_id(value, expected):
    assert extract_video_id(value) == expected


def test_srt_rounding_carries_to_next_second():
    assert format_srt_time(59.9996) == "00:01:00,000"


@dataclass
class Snippet:
    text: str
    start: float
    duration: float


class FakeTranscript:
    language = "English"
    language_code = "en"
    is_generated = False

    def fetch(self):
        return [Snippet("Hello\nworld", 0.5, 1.25)]


class FakeTranscriptList:
    def find_transcript(self, _languages):
        return FakeTranscript()


class FakeApi:
    def list(self, video_id):
        assert video_id == "dQw4w9WgXcQ"
        return FakeTranscriptList()


@pytest.fixture
def client():
    return create_app(transcript_api=FakeApi(), testing=True).test_client()


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json["status"] == "online"
    assert response.headers["X-Content-Type-Options"] == "nosniff"


def test_transcript_success(client):
    response = client.post("/api/transcript", json={"url": "https://youtu.be/dQw4w9WgXcQ"})
    assert response.status_code == 200
    assert response.json["fullText"] == "Hello world"
    assert response.json["srtText"].startswith("1\n00:00:00,500")


def test_rejects_non_json(client):
    response = client.post("/api/transcript", data="url=dQw4w9WgXcQ")
    assert response.status_code == 415


def test_rejects_invalid_host(client):
    response = client.post("/api/transcript", json={"url": "https://example.com/watch?v=dQw4w9WgXcQ"})
    assert response.status_code == 400
