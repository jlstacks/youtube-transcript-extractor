# Release review

Review date: July 22, 2026

## Outcome

The Gemini export was a visual prototype plus a Flask example, not a runnable repository. This release candidate preserves those originals and replaces the deployment path with tested, production-oriented code.

## Findings addressed

| Area | Original risk | Resolution |
| --- | --- | --- |
| Runtime compatibility | Used the pre-1.0 static `YouTubeTranscriptApi.list_transcripts` call and dictionary transcript items | Updated to the 1.2 API (`YouTubeTranscriptApi().list`) and typed snippet attributes |
| CORS | Allowed every origin on every route | Limited CORS to `/api/*` and configured origins |
| Debugging | Bound Flask debug mode to all interfaces | Debug is off; local server binds to loopback; Gunicorn is provided for production |
| Error disclosure | Returned raw exception strings to clients | Returns safe user messages and logs internal detail server-side |
| Abuse/cost | No rate or request-size controls | Added a 16 KiB request limit and configurable per-client transcript limit |
| URL validation | Broad regex could accept misleading non-YouTube URLs | Uses parsed URLs, explicit YouTube hosts, known route forms, and strict IDs |
| Product trust | A backend failure silently produced simulated transcript content | Removed automatic demo substitution; failures remain failures |
| Privacy | Full transcript persistence was not clearly disclosed | Added an on-screen disclosure, ten-item cap, and clear-history action |
| Embed privacy | Used the standard YouTube embed host | Uses `youtube-nocookie.com` and omits autoplay |
| Clipboard | Ignored denied clipboard permissions | Handles failure and directs users to downloads |
| Frontend delivery | Loose TSX expected Tailwind and had no build configuration | Added Vite, TypeScript, responsive CSS, tests, and a production build |
| GitHub readiness | No ignore rules, license file, security policy, test workflow, or deployable server | Added each release artifact and documented checks |

## Remaining operational risks

- The transcript library uses an undocumented YouTube endpoint. Changes or blocks outside this repository can interrupt service.
- Public cloud IP ranges are commonly blocked by YouTube. A deployment may need a permitted proxy strategy or a different architecture.
- In-memory rate limits apply to one process. Use a shared Redis-compatible storage URI for multi-process or multi-instance deployments.
- Captions may be copyrighted. Operators and users are responsible for permitted use and compliance with YouTube’s terms.
- The application does not authenticate users. If exposed publicly, retain rate limiting and add platform-level abuse monitoring.
