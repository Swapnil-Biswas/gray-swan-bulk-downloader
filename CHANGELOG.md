# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-11-24

### Added
- **⬇ BULK EXPORT** button and panel on Gray Swan Arena challenge pages.
- Export **chats**, **submissions** and **batches** (with every model's full response) from a challenge.
- `From # … to #` range for each section (where `#1` = most recent), plus *latest 100 / latest 1000 / all* buttons.
- Optional date filter.
- **JSON**, **CSV** or **both**; optional one-row-per-message CSV.
- Split output into parts of N items per file.
- Single **zip** download built in the browser (deflate via `CompressionStream`), with a `manifest.json`.
- Progress bar, log and Cancel.
- Automatic retry with backoff on `429`/`5xx`, and a 90 s timeout for hung requests.
- Adjustable parallel requests and pause.

[1.0.0]: https://github.com/Swapnil-Biswas/gray-swan-bulk-downloader/releases/tag/v1.0.0
