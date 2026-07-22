"""Flask API for retrieving public YouTube caption tracks."""

from __future__ import annotations

import logging
import os
import re
from urllib.parse import parse_qs, urlparse

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    CouldNotRetrieveTranscript,
    IpBlocked,
    NoTranscriptFound,
    RequestBlocked,
    TranscriptsDisabled,
    VideoUnavailable,
)

VIDEO_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")
MAX_INPUT_LENGTH = 2_048
DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"


def extract_video_id(value: object) -> str | None:
    """Return a validated YouTube video ID from an ID or supported URL."""
    if not isinstance(value, str):
        return None

    candidate = value.strip()
    if not candidate or len(candidate) > MAX_INPUT_LENGTH:
        return None
    if VIDEO_ID_RE.fullmatch(candidate):
        return candidate

    try:
        parsed = urlparse(candidate if "://" in candidate else f"https://{candidate}")
    except ValueError:
        return None

    host = (parsed.hostname or "").lower().rstrip(".")
    if host.startswith("www."):
        host = host[4:]

    video_id: str | None = None
    if host == "youtu.be":
        video_id = parsed.path.strip("/").split("/")[0]
    elif host == "youtube.com" or host.endswith(".youtube.com"):
        if parsed.path == "/watch":
            video_id = parse_qs(parsed.query).get("v", [None])[0]
        else:
            segments = [segment for segment in parsed.path.split("/") if segment]
            if len(segments) >= 2 and segments[0] in {"embed", "live", "shorts", "v"}:
                video_id = segments[1]

    return video_id if video_id and VIDEO_ID_RE.fullmatch(video_id) else None


def format_timestamp(seconds: float) -> str:
    total_seconds = max(0, int(seconds))
    hours, remainder = divmod(total_seconds, 3_600)
    minutes, secs = divmod(remainder, 60)
    return f"{hours}:{minutes:02d}:{secs:02d}" if hours else f"{minutes:02d}:{secs:02d}"


def format_srt_time(seconds: float) -> str:
    total_ms = max(0, round(seconds * 1_000))
    hours, remainder = divmod(total_ms, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, milliseconds = divmod(remainder, 1_000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{milliseconds:03d}"


def serialize_transcript(fetched: object) -> tuple[list[dict], str, str, str]:
    items: list[dict] = []
    plain_lines: list[str] = []
    timestamped_lines: list[str] = []
    srt_blocks: list[str] = []

    for index, snippet in enumerate(fetched, start=1):
        text = str(getattr(snippet, "text", "")).replace("\n", " ").strip()
        start = max(0.0, float(getattr(snippet, "start", 0.0)))
        duration = max(0.0, float(getattr(snippet, "duration", 0.0)))
        timestamp = format_timestamp(start)
        items.append(
            {
                "id": index,
                "start": round(start, 3),
                "duration": round(duration, 3),
                "timestamp": timestamp,
                "text": text,
            }
        )
        plain_lines.append(text)
        timestamped_lines.append(f"[{timestamp}] {text}")
        srt_blocks.append(
            f"{index}\n{format_srt_time(start)} --> {format_srt_time(start + duration)}\n{text}"
        )

    return items, " ".join(plain_lines), "\n".join(timestamped_lines), "\n\n".join(srt_blocks)


def _allowed_origins() -> list[str]:
    return [
        origin.strip()
        for origin in os.getenv("ALLOWED_ORIGINS", DEFAULT_ORIGINS).split(",")
        if origin.strip()
    ]


def create_app(*, transcript_api: object | None = None, testing: bool = False) -> Flask:
    app = Flask(__name__)
    app.config.update(
        TESTING=testing,
        MAX_CONTENT_LENGTH=16 * 1_024,
        JSON_SORT_KEYS=False,
    )

    CORS(
        app,
        resources={r"/api/*": {"origins": _allowed_origins()}},
        methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
        supports_credentials=False,
        max_age=600,
    )
    limiter = Limiter(
        key_func=get_remote_address,
        app=app,
        default_limits=[],
        storage_uri=os.getenv("RATELIMIT_STORAGE_URI", "memory://"),
        headers_enabled=True,
    )
    api = transcript_api or YouTubeTranscriptApi()

    @app.after_request
    def add_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.get("/api/health")
    @limiter.exempt
    def health_check():
        return jsonify({"status": "online", "service": "YouTube Transcript Extractor"})

    @app.post("/api/transcript")
    @limiter.limit(os.getenv("TRANSCRIPT_RATE_LIMIT", "20 per hour"))
    def get_transcript():
        if not request.is_json:
            return jsonify({"success": False, "error": "Request body must be JSON."}), 415

        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"success": False, "error": "Request body must be a JSON object."}), 400

        video_id = extract_video_id(data.get("url") or data.get("videoId"))
        if not video_id:
            return (
                jsonify({"success": False, "error": "Enter a valid YouTube URL or 11-character video ID."}),
                400,
            )

        try:
            transcript_list = api.list(video_id)
            try:
                transcript = transcript_list.find_transcript(["en", "en-US", "en-GB"])
            except NoTranscriptFound:
                transcript = next(iter(transcript_list))

            fetched = transcript.fetch()
            items, full_text, formatted_text, srt_text = serialize_transcript(fetched)
            return jsonify(
                {
                    "success": True,
                    "videoId": video_id,
                    "videoUrl": f"https://www.youtube.com/watch?v={video_id}",
                    "language": transcript.language,
                    "languageCode": transcript.language_code,
                    "isGenerated": transcript.is_generated,
                    "itemCount": len(items),
                    "transcript": items,
                    "fullText": full_text,
                    "formattedText": formatted_text,
                    "srtText": srt_text,
                }
            )
        except (TranscriptsDisabled, NoTranscriptFound):
            return (
                jsonify({"success": False, "error": "No accessible captions were found for this video."}),
                404,
            )
        except VideoUnavailable:
            return jsonify({"success": False, "error": "This video is unavailable or private."}), 404
        except (RequestBlocked, IpBlocked):
            app.logger.warning("YouTube blocked a transcript request for video %s", video_id)
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "YouTube temporarily blocked the transcript request. Try again later.",
                    }
                ),
                503,
            )
        except CouldNotRetrieveTranscript:
            app.logger.info("Transcript retrieval failed for video %s", video_id)
            return jsonify({"success": False, "error": "The transcript could not be retrieved."}), 502
        except Exception:
            app.logger.exception("Unexpected transcript error for video %s", video_id)
            return jsonify({"success": False, "error": "An unexpected server error occurred."}), 500

    @app.errorhandler(413)
    def request_too_large(_error):
        return jsonify({"success": False, "error": "Request body is too large."}), 413

    @app.errorhandler(429)
    def rate_limit_exceeded(_error):
        return jsonify({"success": False, "error": "Too many requests. Please try again later."}), 429

    return app


app = create_app()

if __name__ == "__main__":
    logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5000")), debug=False)
