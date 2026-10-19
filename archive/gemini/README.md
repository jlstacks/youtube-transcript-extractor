# Archived prototype

These files originated as the Gemini-generated prototype and remain reference material for provenance and comparison. They are not part of the supported application and must not be deployed or run as a public service.

Targeted safety edits disable dynamic iframe/link destinations, disable Flask debug mode, bind the development server to loopback, and replace raw exception details with a generic response. The original imported source remains available in Git history before these safety edits; this directory is no longer a byte-for-byte copy of that source. Other prototype limitations remain, including permissive CORS and outdated API usage.

Use the hardened implementation in `backend/` and `frontend/`, whose security controls and production instructions are documented in the repository root README. Docker build contexts exclude this archive entirely.
