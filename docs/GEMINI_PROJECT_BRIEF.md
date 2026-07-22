# Original Gemini Canvas project brief

Source: Gemini Canvas export provided by the project author.

This document preserves the project documentation displayed by Gemini on July 22, 2026. The two original source downloads are preserved unchanged in `archive/gemini/`.

## YouTube Transcript Extractor

An automated, full-stack application for extracting, searching, and exporting closed captions and transcripts from YouTube videos with interactive timestamp navigation.

## Key features

- **Instant Caption Extraction:** Enter any YouTube link or video ID to fetch structured transcript lines.
- **Clickable Timestamps:** Jump directly to specific moments in the embedded YouTube video player.
- **Live In-Page Search:** Quickly search keywords across thousands of transcript dialogue lines.
- **Multi-Format Export:** Download or copy transcripts as Plain Text, Timestamped Text (`[00:00]`), or `.SRT` subtitles.
- **Search History:** Automatically caches recent searches locally in browser storage.
- **Offline Demo Mode:** Features client-side fallback preview if local backend API is offline.

## Original directory structure

```text
youtube-transcript-extractor/
├── backend/
│   ├── app.py              # Flask Python backend API server
│   └── requirements.txt    # Python dependencies
├── frontend/
│   └── App.jsx             # React application UI component
├── README.md               # Documentation guide
└── .gitignore              # Ignored local runtime files
```

## Original quickstart

### Python backend installation

```bash
cd backend
pip install flask flask-cors youtube-transcript-api
python app.py
```

The backend server launches at `http://localhost:5000`.

### Frontend React application

```bash
npm install
npm start
```

## Original API specification

### `POST /api/transcript`

Request body:

```json
{ "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
```

Example response:

```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "language": "English",
  "itemCount": 42,
  "transcript": [
    {
      "id": 1,
      "start": 0.5,
      "timestamp": "00:00",
      "text": "Hello world welcome to this tutorial"
    }
  ]
}
```

## Original license statement

MIT License — customize and use this project for personal portfolios or commercial applications.

## Changes in the production repository

The misleading automatic demo fallback was removed from live extraction. The repository now includes a complete frontend scaffold, current dependency pins, hardened API behavior, tests, CI, deployment guidance, a security policy, and a formal MIT license.
