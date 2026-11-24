# Gray Swan Arena Bulk Export

A small Chrome extension that adds a **⬇ BULK EXPORT** button to Gray Swan Arena challenge pages.
It downloads your **chats**, **submissions** and **batches** (including every model's response in a batch)
as **JSON, CSV or both**, packed into **one .zip file**, for any range you choose.

It runs inside your own logged-in tab and calls the same endpoints the Chats modal uses, so it only sees
your own data. Nothing is sent anywhere else: the zip is built in your browser.

## Install (one time, about 1 minute)

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top-right switch).
3. Click **Load unpacked** and choose the `extension` folder in this project
   (`gray-swan-bulk-download\extension`).
4. Reload your Arena tab.

## Use

1. Open a challenge, e.g. `https://app.grayswan.ai/arena/challenge/hazard-hunt-november-26`.
2. Click **⬇ BULK EXPORT** (bottom-right). The panel shows your totals for each tab.
3. Pick what to export:
   - **Chats / Submissions / Batches**: tick any combination.
   - **From # / to #**: the range. `#1` is the most recent, so `1` to `2000` means "my 2,000 newest chats".
     The quick chips set *latest 100*, *latest 1000* or *all*.
   - **Batches → include every model's full response**: loads each chat in each batch (slower, one request per chat).
   - **Date filter** (optional): keeps only items inside those dates, *within* the # range.
   - **Format**: JSON, CSV or Both. *"One row per message"* adds a `_messages.csv` with one line per message.
   - **Split every N items per file**: handy for feeding files to GPT or another model under upload limits (0 = one file).
4. Click **Download ZIP**. A progress bar and log show what's happening; **Cancel** stops it.

## What's in the zip

| File | Contents |
|---|---|
| `manifest.json` | challenge, time, options used, item counts |
| `chats.json` / `chats.csv` | each chat: id, time, model, behavior, title, submitted?, first prompt, last reply, full transcript |
| `chats_messages.csv` | (optional) one row per message |
| `submissions.json` / `.csv` | your submissions with grading fields (successful, grade status, severity…) and transcript |
| `batches.json` | every batch → runs → per-model results (with full messages when enabled) |
| `batches.csv` | one row per model result: scenario, model, prompt, response, submission status |
| `batches_summary.csv` | one row per batch |

With splitting on, files become `chats_part0001.json`, `chats_part0002.json`, …

## Speed and limits

- The server returns at most 50 chats per request, about 3–5 s each. **All ~10,500 chats ≈ 211 requests ≈ 5–10 minutes**
  with the default 3 parallel requests.
- Batches with full responses need one request per batch chat (≈1,700 currently), so allow extra time.
- If the site rate-limits you, the tool waits and retries on its own. If it keeps happening, open
  *Speed settings* and set parallel requests to 1–2.
- Keep the tab open while it runs. Very large JSON exports (hundreds of MB) are fine in Chrome, but splitting
  helps if you're uploading to a chatbot.

## If something breaks

The Arena is a web app that can change. If an export stops with an error like `HTTP 404`, an endpoint
probably moved. The endpoints used are listed at the top of `extension/content.js`'s fetch functions:
`/panels/chats`, `/panels/submissions`, `/panels/batches` and the page's `__data.json?batchGroupId=…` /
`__data.json?chatId=…`.
