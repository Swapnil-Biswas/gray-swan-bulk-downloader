# Contributing

Thanks for helping improve Gray Swan Arena Bulk Export!

## Reporting a bug

Open an [issue](https://github.com/Swapnil-Biswas/gray-swan-bulk-downloader/issues/new/choose) using the
**Bug report** template and include:

- The text from the panel's **log** box (it shows which step failed and the HTTP status).
- What you selected (sections, ranges, format).
- Browser name and version.

**Please don't paste exported chats, cookies or account details into issues.**

## Development setup

There is no build step and there are no dependencies.

1. Fork and clone the repo.
2. Load the `extension/` folder in `chrome://extensions` → **Developer mode** → **Load unpacked**.
3. Edit `extension/content.js`.
4. Click **↻ reload** on the extension's card, then reload the Arena tab.

Quick syntax check before committing:

```bash
node --check extension/content.js
```

## Code guidelines

- Keep it **dependency-free**: one content script, plain JavaScript, no bundler.
- Keep it **read-only**: the tool must never send messages, submit, edit or delete anything.
- Keep it **private**: no network requests to anything other than `app.grayswan.ai`, and no analytics.
- Don't add extension permissions unless they're truly needed. Explain why in the PR if you do.
- Be gentle with the Arena's servers: keep requests limited and retry with backoff.

## Pull requests

1. Create a branch from `main`.
2. Make your change and test it on a real challenge with a small range.
3. Add a line under an **Unreleased** heading in `CHANGELOG.md`.
4. Open a PR and fill in the template.

## Releasing (maintainers)

1. Bump `version` in `extension/manifest.json` and move the changelog entries under the new version.
2. Commit, then tag: `git tag v1.x.y && git push origin v1.x.y`.
3. The **Release** workflow builds `gray-swan-bulk-export-v1.x.y.zip` (the `extension/` folder) and attaches it
   to a GitHub release.
