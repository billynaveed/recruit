# Security Policy

## Reporting a vulnerability

Please do not report security vulnerabilities through public GitHub issues.

Instead, report them privately using
[GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
for this repository, or by emailing the maintainers at the address configured
in `NEXT_PUBLIC_CONTACT_EMAIL` for your deployment.

Please include:

- A description of the issue and its impact
- Steps to reproduce
- Any relevant logs or proof-of-concept (without including real user data)

We will acknowledge your report as soon as we can and keep you updated on
remediation progress.

## Deploying securely

This is open-source software you self-host. A few essentials when running it:

- Set a strong, unique `SESSION_SECRET` (32+ random bytes).
- Set `COOKIE_SECURE=true` when serving over HTTPS.
- Restrict admin sign-in by setting `ADMIN_HOSTED_DOMAIN` to your own Google
  Workspace domain. The default is deliberately unusable so a misconfigured
  deployment fails closed.
- Keep `ANTHROPIC_API_KEY` and database credentials out of version control;
  they belong in `.env`, which is gitignored.
- Rotate any credential that may have been exposed.
