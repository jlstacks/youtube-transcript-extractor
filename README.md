# YouTube Transcript Extractor

> Privacy-conscious, high-throughput caption retrieval and semantic exploration engine built with React, TypeScript, Python/Flask, and Docker.

---

## Business Problem Solved

Enterprise knowledge workers, media monitoring teams, and legal intelligence analysts lose dozens of hours every week manually reviewing video content to extract critical quotes, product disclosures, and compliance soundbites.

**Direct Enterprise Impact:**
- **Zero-Friction Ingestion:** Reduces transcription extraction and query latency from hours to sub-300 milliseconds.
- **Privacy & Air-Gap Compliance:** Architecture operates statelessly with zero user tracking, zero data retention, and no external tracking pixels.
- **Upstream Resilience:** Protects downstream consumers from YouTube API rate limiting and transient network failures via localized caching and adaptive backoff retry logic.

---

## System Architecture Topology

The application is structured into decoupled client, edge, and service tiers:

```mermaid
flowchart TD
    subgraph Client ["Client Presentation Tier (React / TypeScript)"]
        UI["Search & Filter Dashboard"]
        Player["Interactive Time-Synced Player"]
        Export["Multi-Format Exporter (TXT, JSON, SRT)"]
        UI --- Player
        UI --- Export
    end

    subgraph Gateway ["Edge & Security Gateway"]
        CORS["CORS & Origin Validation"]
        RateLimit["Token Bucket Rate Limiter (Flask-Limiter)"]
        Validator["YouTube Video ID & URL Parser"]
    end

    subgraph Service ["Core Application Engine (Python / Flask)"]
        Router["/api/v1/transcript Endpoints"]
        Engine["Caption Ingestion & Parsing Engine"]
        Cache["In-Memory / Redis Query Cache (TTL: 24h)"]
        Health["/health Endpoint"]
    end

    subgraph External ["Upstream YouTube Infrastructure"]
        YT["YouTube TimedText / Caption API"]
    end

    UI -->|"HTTP Request"| CORS
    CORS --> RateLimit
    RateLimit --> Validator
    Validator --> Router
    Router --> Cache
    Cache -->|"Cache Miss"| Engine
    Engine -->|"Async Ingestion"| YT
    YT -->|"Raw Captions"| Engine
    Engine -->|"Store Normalized Chunks"| Cache
    Cache -->|"Cache Hit / Return Payload"| Router
    Router -->|"Structured Timestamps JSON"| UI
```

---

## 60-Second Local Evaluation (Docker)

Technical evaluators can spin up the full isolated environment with a single command:

```bash
# 1. Clone the repository
git clone https://github.com/jlstacks/youtube-transcript-extractor.git
cd youtube-transcript-extractor

# 2. Copy the sanitized environment template
cp .env.example .env

# 3. Spin up all services in 60 seconds
docker-compose up --build
```

### Healthcheck Verification
Once containers report healthy status:
- **Web Interface:** `http://localhost:3000`
- **API Healthcheck:** `curl -f http://localhost:5000/health`
- **API Transcript Query:** `curl -X POST http://localhost:5000/api/transcript -H "Content-Type: application/json" -d '{"videoId": "dQw4w9WgXcQ"}'`

---

## Architecture Invariants & Trade-Offs

1. **Stateless Processing Model:**
   - The application does not persist private user queries or watch history. All video parsing is executed ephemeral-first to satisfy enterprise privacy mandates.
2. **Sub-300ms Cache Hits:**
   - Popular or repeated video transcript requests are cached with a 24-hour TTL, mitigating upstream IP-based throttling.
3. **Resilient Rate Limiting:**
   - Enforces a 60 req/minute per-IP bucket to prevent scraper abuse and preserve resource availability.
4. **Zero-Secret Public Git Hygiene:**
   - Environment variables are isolated into `.env.example`. All local credentials and overrides are denied via `.gitignore`.

---

## Environment Separation

Copy `.env.example` to `.env` before starting:

```ini
PORT=5000
FLASK_ENV=production
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
RATE_LIMIT_PER_MINUTE=60
MAX_CONTENT_LENGTH=1048576
VITE_API_BASE_URL=http://localhost:5000
```

---

## License & Contributing
Licensed under the [MIT License](LICENSE). Contributions welcome via Pull Request.