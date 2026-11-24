<div align="center">

<img src="extension/icons/icon128.png" width="96" alt="Bulk Export icon">

# Gray Swan Arena Bulk Export

**Download all your Gray Swan Arena chats, submissions and batches as JSON or CSV in one zip file.**

[![License: MIT](https://img.shields.io/badge/License-MIT-d7ff3a.svg)](LICENSE)
![Chrome](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)
![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)
[![CI](https://github.com/Swapnil-Biswas/gray-swan-bulk-downloader/actions/workflows/ci.yml/badge.svg)](https://github.com/Swapnil-Biswas/gray-swan-bulk-downloader/actions/workflows/ci.yml)

</div>

---

## Contents

- [Why this exists](#why-this-exists)
- [Features](#features)
- [Install (step by step)](#install-step-by-step)
- [Using it (step by step)](#using-it-step-by-step)
- [What you get in the zip](#what-you-get-in-the-zip)
- [Giving the export to ChatGPT, Claude or another model](#giving-the-export-to-chatgpt-claude-or-another-model)
- [How long does it take?](#how-long-does-it-take)
- [How it works](#how-it-works)
- [Privacy and safety](#privacy-and-safety)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Updating and uninstalling](#updating-and-uninstalling)
- [Contributing](#contributing) · [License](#license)

---

## Why this exists

The Arena's **Chats** window only lets you select the **10 chats on the current page** and download them as JSON.
With thousands of chats (10,000+ is common in a busy challenge) that means **over a thousand pages** of
select → download → next. **Batches can't be downloaded at all.**

This extension adds a **⬇ BULK EXPORT** button. You choose a range like *"my newest 2,000 chats"* or *"everything"*,
and it downloads it all into **one zip file**.

## Features

| | |
|---|---|
| 📦 **One zip file** | Everything you pick, in one download |
| 🔢 **Pick a range** | `From # … to #` (where `#1` = most recent), or the *latest 100 / latest 1000 / all* buttons |
| 🗂️ **Chats, Submissions, Batches** | Any combination. Batches include **every model's full response** |
| 📄 **JSON, CSV or both** | CSV opens in Excel or Google Sheets; JSON keeps every field |
| 📅 **Date filter** | Keep only items between two dates |
| ✂️ **Split into parts** | e.g. 1000 chats per file, so each file is small enough to upload to an AI model |
| 🔁 **Automatic retries** | Waits and retries if the site rate-limits or a request hangs |
| ⛔ **Cancel any time** | Stops cleanly. Nothing is saved until the export finishes |
| 💾 **Remember settings** | Optional switch that fills in your last export's settings next time |
| 🚦 **One export at a time** | Exports started in other tabs wait their turn, so the server isn't hit several times over |
| 🔒 **Private** | Runs in your own tab; nothing is sent anywhere except Gray Swan's own site |
| 🪶 **Zero dependencies** | About 600 lines of plain JavaScript, with no libraries or build step |

---

## Install (step by step)

> You only do this once. It takes about a minute. The extension isn't on the Chrome Web Store, so you load it
> directly from this folder. That is a normal, supported Chrome feature called "Load unpacked".

### Step 1: Download this project

**Option A (easiest):** at the top of this page click the green **Code** button → **Download ZIP**, then
**extract** the zip (right-click → *Extract All…* on Windows).

**Option B (git):**

```bash
git clone https://github.com/Swapnil-Biswas/gray-swan-bulk-downloader.git
```

Either way you'll end up with a folder that contains an **`extension`** folder inside it.

### Step 2: Load it into Chrome

<img src="docs/images/install-steps.svg" alt="Install steps: open chrome://extensions, turn on Developer mode, click Load unpacked and pick the extension folder" width="100%">

1. Open a new tab and go to **`chrome://extensions`**.
2. Turn on **Developer mode** (switch in the top-right corner).
3. Click **Load unpacked**.
4. Select the **`extension`** folder (the one that contains `manifest.json`). Choose the folder itself,
   not a file inside it.
5. You'll see **Gray Swan Arena Bulk Export** in your list of extensions. Make sure its switch is on.

> Works in **Chrome, Edge, Brave, Arc, Opera** and other Chromium browsers. In Edge the page is `edge://extensions`.

### Step 3: Reload the Arena

Go to your Arena tab (or open <https://app.grayswan.ai/arena>), log in, and **reload the page** (F5).

---

## Using it (step by step)

### Step 1: Open a challenge and click **⬇ BULK EXPORT**

Open the challenge you want to export, e.g. `https://app.grayswan.ai/arena/challenge/hazard-hunt-november-26`.
The lime **⬇ BULK EXPORT** button appears in the **bottom-right corner**.

<img src="docs/images/01-bulk-export-button.png" alt="Arena challenge page with the BULK EXPORT button in the bottom-right corner" width="100%">

### Step 2: Choose what to export

The panel opens and shows **how many items you have** in each tab. In this example: 10,532 chats, 1,358 submissions and 48 batches.

<img src="docs/images/02-export-panel.png" alt="Bulk export panel showing Chats, Submissions and Batches with From/To ranges" width="380" align="right">

**Remember settings** (the switch at the top):

- **On** (default): the settings you used for your last export are filled in automatically the next time you open
  the panel, even after closing the tab or restarting Chrome. The note next to the switch says
  *(last settings loaded)* when this happens.
- **Off**: the saved settings are deleted, and the panel opens with the defaults every time.
- If you had a range set to **all**, it stays "all" as your totals grow, so it always means every item.
- Settings are stored only in this browser. They're never sent anywhere.

**Tick any of the three sections:**

- **Chats**: every conversation you've had in this challenge.
- **Submissions**: the chats you submitted as breaks, including grading results
  (successful, grade status, severity).
- **Batches**: your batch runs (one prompt sent to many models). Keep
  **"include every model's full response"** ticked to get what each model actually replied.

**Set the range for each one:**

- `#1` is your **most recent** item.
- `From # 1 to # 2000` → your 2,000 newest chats.
- `From # 2001 to # 4000` → the next 2,000 (handy for exporting in chunks).
- Quick buttons: **latest 100**, **latest 1000**, **all**.

**Date filter (optional):** set *From* and/or *to* to keep only items in that date range.
It applies **within** the `#` range, so to filter all chats by date, set the range to **all** first.

<br clear="right">

### Step 3: Choose the format

<img src="docs/images/03-format-and-speed.png" alt="Format options JSON / CSV / Both, split setting and speed settings" width="380" align="right">

| Option | What it does |
|---|---|
| **JSON** | Full data with every field, exactly as the Arena stores it. Best for scripts and AI models. |
| **CSV** | One row per chat, with a ready-to-read `transcript` column. Opens in Excel or Google Sheets. |
| **Both** | Both formats in the same zip. |
| **CSV: also one row per message** | Adds `*_messages.csv` with one line per message. Useful for filtering by role or model. |
| **Split every N items per file** | `0` = one file per section. `1000` = `chats_part0001.json`, `chats_part0002.json`, … |

**Speed settings** (click to expand): leave the defaults (3 parallel requests, 200 ms pause) unless you
get rate-limited. Then lower *Parallel requests* to 1 or 2.

<br clear="right">

### Step 4: Click **Download ZIP** and wait

<img src="docs/images/04-progress.png" alt="Export in progress: progress bar shows chat pages 8 of 20" width="380" align="right">

- The **progress bar** and counter show what's being fetched (`chat pages 8/20`, `batch chats 38/62`, …).
- The **log** shows each stage.
- **Keep the tab open** until it finishes. You can switch to other tabs.
- **Cancel** stops the export. Nothing is saved if you cancel.

When it's done, the log says something like:

```
Got 100 chats.
Got 20 submissions.
Got 2 batches (62 chats).
Building zip (8 files)…
Done: grayswan_hazard-hunt-november-26_2026-11-24-17-41.zip (0.5 MB).
```

…and the zip lands in your **Downloads** folder.

<br clear="right">

> 💡 **Tip:** try a small export first (e.g. *latest 100* chats plus batches `1` to `2`) to see the format, then do the big one.

---

## What you get in the zip

```
grayswan_<challenge>_<date-time>.zip
├── manifest.json            ← what was exported: challenge, time, options, counts
├── chats.json               ← full chat objects
├── chats.csv                ← one row per chat
├── chats_messages.csv       ← (optional) one row per message
├── submissions.json
├── submissions.csv
├── submissions_messages.csv ← (optional)
├── batches.json             ← batch → runs → each model's result + full messages
├── batches.csv              ← one row per model result in each batch
└── batches_summary.csv      ← one row per batch
```

With splitting turned on, files are numbered, e.g. `chats_part0001.json`, `chats_part0002.json`.

<details>
<summary><b>CSV columns: chats.csv</b></summary>

| Column | Meaning |
|---|---|
| `chat_id` | Arena chat ID |
| `created_at`, `updated_at` | Timestamps (UTC, ISO 8601) |
| `model`, `model_id` | Model codename and ID |
| `behavior_id` | Scenario / behavior the chat targeted |
| `title` | Chat title |
| `submitted` | `yes` if any message in the chat was submitted |
| `message_count` | Number of messages |
| `first_user_message` | Your first prompt |
| `last_assistant_message` | The model's last reply |
| `transcript` | Whole conversation as `USER: …` / `ASSISTANT: …` |

</details>

<details>
<summary><b>CSV columns: submissions.csv</b></summary>

`submission_id`, `created_at`, `chat_id`, `model_id`, `title`, `behavior`, `category`, `successful`,
`grade_status`, `reviewed`, `severity`, `first_user_message`, `last_assistant_message`, `transcript`

</details>

<details>
<summary><b>CSV columns: batches.csv</b></summary>

| Column | Meaning |
|---|---|
| `batch_group_id`, `batch_id` | Batch identifiers |
| `scenario`, `behavior_id` | Scenario name and ID |
| `run_started_at` | When the batch run started |
| `index`, `model` | Position in the batch and model codename |
| `chat_id` | The chat created for that model |
| `submission_id`, `successful`, `grade_status` | Submission and grading info (blank if not submitted) |
| `prompt` | The prompt sent |
| `response` | That model's reply |
| `transcript` | Full conversation |
| `fetch_error` | Filled in only if that one chat couldn't be loaded |

</details>

<details>
<summary><b>JSON structure: batches.json</b></summary>

```jsonc
[
  {
    "batchGroupId": "…",
    "scenarioName": "Kigo: Haiku Reply Length",
    "behaviorId": "kigo-haiku-response-length",
    "title": "<the prompt>",
    "modelCount": 20, "chatCount": 20, "submittedCount": 20,
    "lastActivityAt": "2026-11-24T06:08:09.864Z",
    "runs": [
      {
        "startedAt": "…", "batchId": "…", "prompts": ["…"], "models": ["…"],
        "results": [
          {
            "index": 0, "model": "Aluminum Raven Exalted", "chatId": "…", "prompt": "…",
            "submission": { "submissionId": "…", "successful": true, "gradeStatus": "…" },
            "messages": [ { "role": "user", "content": "…" }, { "role": "assistant", "content": "…" } ]
          }
        ]
      }
    ]
  }
]
```

</details>

**CSV tips:** files are UTF-8 with a BOM, so Excel shows emoji and non-English text correctly. Excel cells hold
at most 32,767 characters, so very long transcripts get cut off *in Excel's display only*. The CSV file and the
JSON still have the full text.

---

## Giving the export to ChatGPT, Claude or another model

1. In the panel, choose **JSON** (best for models) or **CSV** (best for spreadsheets).
2. Set **Split every** to around **500–1000** so each file is small enough to upload.
3. Unzip the download and upload the part files you want reviewed.
4. Example prompt:

   > *"These are my red-teaming chats from a Gray Swan Arena challenge (JSON). For each chat, tell me whether
   > the model's reply meets the scenario's goal, and list the chat_ids that look like successful breaks."*

---

## How long does it take?

The Arena returns at most **50 chats per request** and each request takes roughly 3–5 seconds.

| Export | Requests | Typical time (defaults) |
|---|---|---|
| 1,000 chats | 20 | ~30 seconds |
| 10,000 chats | 200 | ~5–10 minutes |
| All submissions (~1,400) | 28 | ~1 minute |
| 48 batches, without responses | 48 | ~2–4 minutes |
| 48 batches, **with full responses** (~1,700 chats) | ~1,750 | ~20–25 minutes |

Big JSON exports can be **hundreds of MB uncompressed**. The zip is compressed, so the download is much smaller.

### Using several tabs

Only **one export runs at a time** across all your Arena tabs. If you click **Download ZIP** in a second tab while
another export is running, the log shows:

```
Another export is running in another tab. This one will start when it finishes (Cancel to stop waiting).
```

It starts on its own when the first one finishes, or you can press **Cancel** to stop waiting. This keeps the
load on Gray Swan's servers the same however many tabs you use. Opening more tabs doesn't make exports faster
anyway, because the server is the bottleneck. To export a lot, use **one tab** with a big range, or chunks
one after another.

---

## How it works

<img src="docs/images/how-it-works.svg" alt="Diagram: the extension panel calls the Arena's own endpoints with your session, builds JSON/CSV files in the page, and saves one zip" width="100%">

- The extension is a single **content script** ([`extension/content.js`](extension/content.js)) that only runs
  on `https://app.grayswan.ai/arena/*`.
- It calls the **same endpoints the Arena's Chats window already uses**, with your normal logged-in session:

  | Data | Endpoint |
  |---|---|
  | Chats | `/arena/challenge/<slug>/panels/chats?page=N&limit=50&sort=recent` |
  | Submissions | `/arena/challenge/<slug>/panels/submissions?page=N&limit=50` |
  | Batch list | `/arena/challenge/<slug>/panels/batches` |
  | Batch runs | `/arena/challenge/<slug>/__data.json?batchGroupId=…` |
  | One batch chat | `/arena/challenge/<slug>/__data.json?chatId=…` |

- The `__data.json` responses use SvelteKit's *devalue* encoding, which the script decodes.
- The zip is built **in the page** with the browser's built-in `CompressionStream` (deflate) and a small
  zip writer, then saved through a normal download link.
- Requests run a few at a time. A `429 Too Many Requests` or server error is retried with increasing waits,
  and any request that hangs for more than 90 s is retried.

---

## Privacy and safety

- **Your data only.** It uses your own session, so it can only see what you can already see in the Chats window.
- **No servers, no tracking.** Nothing is sent anywhere except Gray Swan's own site. There are no analytics or
  third-party requests.
- **No special permissions.** The manifest asks for no extension permissions: no tabs, no storage, no cookies,
  no "access all sites". It only runs a script on Arena pages.
- **Read-only.** It only reads data. It never submits, edits or deletes anything in your account.
- **Small and readable.** One file of plain JavaScript you can read before installing.
- Your exports contain your prompts and model outputs. Treat the zip like the sensitive file it is.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| **I don't see the ⬇ BULK EXPORT button** | Reload the Arena tab (F5). Check the extension is switched on in `chrome://extensions`. The button only appears on `app.grayswan.ai/arena/…` pages. |
| **Panel says "Open a challenge page to export."** | Open a specific challenge (URL contains `/arena/challenge/<name>`), then click the button again. |
| **Totals don't show / show 0** | You may be logged out. Log in, reload, and open the panel again. |
| **Log shows `HTTP 429`, or it's very slow** | You're being rate-limited. The tool waits and retries on its own. Lower *Parallel requests* to 1–2 under *Speed settings*. |
| **`Stopped: HTTP 401/403`** | Your session expired. Log in again and restart the export. |
| **`Stopped: HTTP 404`** | The Arena probably changed an endpoint. Please [open an issue](https://github.com/Swapnil-Biswas/gray-swan-bulk-downloader/issues). |
| **Some batch rows have `fetch_error`** | Those individual chats failed after retries. Run the export again for just those batches. |
| **Download didn't appear** | Check Chrome's download bar or `chrome://downloads`. Chrome may ask once to allow downloads from this site. |
| **Log says "Another export is running in another tab"** | Another Arena tab is exporting. Wait (it starts automatically) or press Cancel. If no other export is running, close any other Arena tabs and try again. |
| **My settings didn't come back** | Check the **Remember settings** switch is on. Settings are saved when you click **Download ZIP**. Private/Incognito windows forget them when closed. |
| **Tab froze on a huge export** | Export in chunks (e.g. `1–5000`, then `5001–10000`) and/or use **Split every**. |
| **`chrome://extensions` says "Manifest file is missing"** | You picked the wrong folder. Pick the inner **`extension`** folder. |

---

## FAQ

**Is this official?**
No. It's an independent, open-source tool. It isn't made or endorsed by Gray Swan AI.

**Does it work for other challenges / waves?**
Yes. Open any challenge page and it exports that challenge. Run it once per challenge.

**Can it export other people's chats?**
No. It uses your own session, so it only sees your own data.

**Why "#1 = most recent"?**
That's the order the Arena's Chats window uses (*Most recent*), so `#1–#10` matches the first page you see there.

**Chrome shows a "Developer mode extensions" warning.**
That's normal for any extension loaded with *Load unpacked*. You can dismiss it.

**Does it use my Arena energy or affect my submissions?**
No. It only reads data and never sends messages or submissions.

---

## Updating and uninstalling

**Update:** download the latest version (or run `git pull`), then click the **↻ reload** icon on the extension's
card in `chrome://extensions` and reload your Arena tab.

**Uninstall:** click **Remove** on the extension's card in `chrome://extensions`.

---

## Project structure

```
gray-swan-bulk-downloader/
├── extension/
│   ├── manifest.json     ← Chrome extension manifest (MV3, no permissions)
│   ├── content.js        ← the whole tool: UI, fetching, CSV/JSON, zip writer
│   └── icons/            ← extension icons
├── docs/images/          ← screenshots and diagrams used in this README
├── .github/              ← CI, release workflow, issue and PR templates
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

## Contributing

Bug reports, ideas and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).
If the Arena changes and something breaks, an issue with the log text is the most helpful thing you can send.

## License

[MIT](LICENSE) © 2026 Swapnil Biswas

*Gray Swan, Gray Swan Arena and related names are trademarks of their respective owners. This project is not
affiliated with or endorsed by Gray Swan AI.*
