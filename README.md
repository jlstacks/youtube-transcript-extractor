# YouTube Transcript Extractor

A privacy-conscious full-stack app for retrieving available public YouTube captions, searching them by keyword or timestamp, jumping through the video, and exporting TXT or SRT files.

![Status: release candidate](https://img.shields.io/badge/status-release%20candidate-89eddb)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

## Features

- Accepts standard YouTube links, `youtu.be` links, Shorts, Live, embeds, and raw video IDs.
- Retrieves creator-supplied or auto-generated caption tracks without a YouTube API key.
- Searches transcript text in the browser and jumps the privacy-enhanced video embed to any caption.
- Copies plain or timestamped text and exports UTF-8 TXT or SRT files.
- Keeps the ten most recent transcripts in local browser storage with a one-click clear action.
- Includes input validation, request-size limits, origin-restricted CORS, rate limiting, safe client errors, security headers, and production WSGI configuration.

## Repository layout

```text
.
├── archive/gemini/        # Original Gemini-generated source files, unchanged
├── backend/               # Flask API, Python dependencies, and tests
├── docs/                  # Original project brief and review notes
├── frontend/              # Vite + React + TypeScript application
├── .github/workflows/     # CI checks for both stacks
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

## Prerequisites

- Python 3.10 or newer
- Node.js 20.19+, 22.12+, or a newer supported release
- npm

## Local setup

### 1. Start the API

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
python app.py
```

The API listens on `http://127.0.0.1:5000`. Do not use Flask’s development server for public hosting.

### 2. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` calls to the local Flask server.

## Configuration

Backend environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `ALLOWED_ORIGINS` | Local Vite origins | Comma-separated frontend origins allowed by CORS |
| `TRANSCRIPT_RATE_LIMIT` | `20 per hour` | Per-client transcript request limit |
| `RATELIMIT_STORAGE_URI` | `memory://` | Flask-Limiter storage; use Redis for multi-instance hosting |
| `PORT` | `5000` | Local development port |
| `LOG_LEVEL` | `INFO` | Python logging level |

Frontend environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Same origin | Public base URL of the deployed Flask API |

Copy the relevant `.env.example` file before changing values. Never commit secrets. This project needs no API key.

## Tests and release checks

```bash
# Backend
cd backend
python -m pytest
ruff check .
pip-audit -r requirements-prod.txt

# Frontend
cd frontend
npm test
npm run build
npm audit --audit-level=high
```

GitHub Actions runs these checks on pushes and pull requests.

## Production notes

Build the frontend with `npm run build` and host `frontend/dist` on a static host. Run the API behind HTTPS with a production WSGI server. A container entry point is included:

```bash
cd backend
docker build -t youtube-transcript-api .
docker run --rm -p 8000:8000 \
  -e ALLOWED_ORIGINS=https://your-frontend.example \
  youtube-transcript-api
```

For multiple API instances, point `RATELIMIT_STORAGE_URI` at a shared Redis service. Set `VITE_API_BASE_URL` at frontend build time to the public API origin.

## Important limitations

This project uses the third-party [`youtube-transcript-api`](https://github.com/jdepoix/youtube-transcript-api), which relies on an undocumented YouTube web-client interface. YouTube can change or block that interface, and cloud-hosting IPs are frequently blocked. Private, age-restricted, caption-disabled, or unavailable videos may not work.

Only retrieve and reuse transcripts when you have the right to do so. Follow YouTube’s terms, creators’ rights, and applicable copyright and privacy rules. This repository is not affiliated with or endorsed by YouTube or Google.

## Privacy

The app sends the video ID to the configured Flask API, which requests captions from YouTube. Transcript history is stored only in the current browser’s local storage. It can be cleared from the History screen. The repository includes no analytics, accounts, cookies, advertising, or tracking code.

## Origin

The initial concept, source files, and documentation were exported from the shared Gemini Canvas linked in [`docs/GEMINI_PROJECT_BRIEF.md`](docs/GEMINI_PROJECT_BRIEF.md). The original downloads remain unchanged in `archive/gemini/` for provenance and comparison.

## License

[MIT](LICENSE)
