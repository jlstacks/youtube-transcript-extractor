# Security policy

## Supported versions

Security fixes are applied to the latest commit on the `main` branch.

## Reporting a vulnerability

Please use GitHub’s **Report a vulnerability** private advisory flow for this repository. Do not open a public issue containing exploit details, private data, tokens, or credentials.

Include the affected file or endpoint, reproduction steps, impact, and any suggested remediation. Maintainers should acknowledge a complete report within seven days and coordinate disclosure after a fix is available.

## Deployment responsibilities

- Serve the frontend and API over HTTPS.
- Set `ALLOWED_ORIGINS` to the exact deployed frontend origin.
- Use shared rate-limit storage for more than one API process or instance.
- Keep Python, Node, container, and transitive dependencies patched.
- Never enable Flask debug mode on a public interface.
- Do not add proxy credentials, cookies, transcript exports, or environment files to Git.
