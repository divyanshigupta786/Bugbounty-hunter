# Security Policy

## Security Model & Sandboxing

BugBounty Hunter executes untrusted code from third-party repositories and candidate test cases synthesized by AI models. To protect host systems:

1. **Network Isolation:** Sandbox containers are executed with `--network none` by default.
2. **Environment Sanitization:** Host environment variables, API tokens, cloud credentials, and SSH keys are explicitly excluded from sandbox execution contexts.
3. **SSRF Prevention:** Target URLs are validated to prevent connections to loopback, link-local, private IP spaces, or cloud metadata endpoints (`169.254.169.254`).
4. **Secret Redaction:** Logs, command traces, and execution output pass through pattern-based secret redaction before persistence.
5. **Resource Ceilings:** Process timeouts, memory limits, and CPU quotas are strictly enforced.

## Reporting a Security Vulnerability

If you discover a vulnerability or potential sandbox escape:
- Please **do not** open a public GitHub issue.
- Email security disclosures directly to `security@bugbounty-hunter.dev`.
- Include a reproducible Proof of Concept and expected remediation.
- We aim to respond within 48 hours and provide patches promptly.
