# Security Policy

## What the extension can access

- It runs **only** on `https://app.grayswan.ai/arena/*`.
- It requests **no extension permissions** (see `extension/manifest.json`).
- It only makes **read** requests to `app.grayswan.ai` using your existing session, and it never sends data anywhere else.
- Exports are built in the page and saved to your computer. Nothing is uploaded.

## Supported versions

Only the latest release gets fixes.

## Reporting a vulnerability

If you find a security or privacy problem (for example, a way the extension could leak data or act on
your account), **please don't open a public issue**. Report it privately via GitHub's
[**Report a vulnerability**](https://github.com/Swapnil-Biswas/gray-swan-bulk-downloader/security/advisories/new)
form on this repository.

Include steps to reproduce and the impact. You should get a reply within a few days.

Issues with the Gray Swan Arena platform itself should go to Gray Swan, not this project.
