// Gray Swan Arena Bulk Export
// Runs inside your logged-in Arena tab and uses the same endpoints the Chats modal uses,
// so it only ever sees your own data. Nothing is sent anywhere else: the zip is built in the page.
(() => {
  if (window.__gsExport) return;

  const PAGE = 50; // server caps page size at 50
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const slugFromUrl = () => (location.pathname.match(/\/arena\/challenge\/([^/?#]+)/) || [])[1] || null;

  let cancelled = false;

  // ---------- networking ----------
  async function getJSON(url, tries = 6) {
    let lastErr;
    for (let i = 0; i < tries; i++) {
      if (cancelled) throw new Error('Cancelled');
      let r;
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 90000); // a hung request gets retried instead of freezing the export
      try {
        r = await fetch(url, { credentials: 'include', headers: { accept: 'application/json' }, signal: ctl.signal });
        if (r.ok) { const j = await r.json(); clearTimeout(timer); return j; }
      } catch (e) {
        clearTimeout(timer);
        lastErr = e;
        await sleep(1000 * 2 ** i);
        continue;
      }
      clearTimeout(timer);
      if (r.status === 429 || r.status >= 500) {
        const ra = Number(r.headers.get('retry-after'));
        lastErr = new Error(`HTTP ${r.status}`);
        await sleep(ra ? ra * 1000 : 1500 * 2 ** i);
        continue;
      }
      throw new Error(`HTTP ${r.status} for ${url}`);
    }
    throw new Error(`Gave up after ${tries} tries (${lastErr}) on ${url}`);
  }

  async function pool(items, n, fn) {
    const out = new Array(items.length);
    let next = 0;
    const workers = Array.from({ length: Math.max(1, Math.min(n, items.length)) }, async () => {
      while (next < items.length) {
        const k = next++;
        out[k] = await fn(items[k], k);
      }
    });
    await Promise.all(workers);
    return out;
  }

  // SvelteKit "__data.json" responses are encoded with devalue; this rebuilds the objects.
  function unflatten(arr) {
    const hydrated = new Array(arr.length);
    const seen = new Array(arr.length).fill(false);
    function h(i) {
      if (i === -1) return undefined;
      if (i === -2) return null;
      if (i === -3) return NaN;
      if (i === -4) return Infinity;
      if (i === -5) return -Infinity;
      if (i === -6) return -0;
      if (seen[i]) return hydrated[i];
      seen[i] = true;
      const v = arr[i];
      if (v === null || typeof v !== 'object') return (hydrated[i] = v);
      if (Array.isArray(v)) {
        if (typeof v[0] === 'string') {
          const t = v[0];
          if (t === 'Date') return (hydrated[i] = new Date(v[1]).toISOString());
          if (t === 'Set') { const s = []; hydrated[i] = s; for (let k = 1; k < v.length; k++) s.push(h(v[k])); return s; }
          if (t === 'Map') { const m = {}; hydrated[i] = m; for (let k = 1; k < v.length; k += 2) m[h(v[k])] = h(v[k + 1]); return m; }
          if (t === 'BigInt') return (hydrated[i] = String(v[1]));
          if (t === 'RegExp') return (hydrated[i] = String(v[1]));
          if (t === 'null') { const o = {}; hydrated[i] = o; for (let k = 1; k < v.length; k += 2) o[v[k]] = h(v[k + 1]); return o; }
        }
        const a = new Array(v.length);
        hydrated[i] = a;
        for (let k = 0; k < v.length; k++) a[k] = h(v[k]);
        return a;
      }
      const o = {};
      hydrated[i] = o;
      for (const k in v) o[k] = h(v[k]);
      return o;
    }
    return h(0);
  }

  async function svelteData(base, query) {
    const j = await getJSON(`${base}__data.json?${query}&x-sveltekit-invalidated=0001`);
    for (const n of j.nodes || []) {
      if (n && n.type === 'data' && Array.isArray(n.data)) {
        const d = unflatten(n.data);
        if (d && (d.batchGroupView || d.chatDetails)) return d;
      }
    }
    return {};
  }

  // ---------- fetching ----------
  async function totals(base) {
    const [c, s, b] = await Promise.all([
      getJSON(`${base}panels/chats?page=1&limit=1&sort=recent`).catch(() => null),
      getJSON(`${base}panels/submissions?page=1&limit=1`).catch(() => null),
      getJSON(`${base}panels/batches?page=1&limit=1`).catch(() => null),
    ]);
    return { chats: c?.total ?? 0, submissions: s?.total ?? 0, batches: b?.total ?? 0 };
  }

  // Fetches items #from..#to (1 = most recent) from a paginated panel.
  async function fetchRange(base, kind, from, to, opts, progress) {
    const key = kind === 'chats' ? 'chats' : 'userSubmissions';
    const extra = kind === 'chats' ? '&sort=recent' : '';
    const first = Math.floor((from - 1) / PAGE) + 1;
    const last = Math.ceil(to / PAGE);
    const pages = [];
    for (let p = first; p <= last; p++) pages.push(p);
    const submittedByChat = {};
    let done = 0;
    const res = await pool(pages, opts.concurrency, async (p) => {
      const j = await getJSON(`${base}panels/${kind}?page=${p}&limit=${PAGE}${extra}`);
      if (j.submittedMessageIdsByChat) Object.assign(submittedByChat, j.submittedMessageIdsByChat);
      progress(++done, pages.length);
      if (opts.delay) await sleep(opts.delay);
      return j[key] || [];
    });
    const offset = (first - 1) * PAGE;
    const items = res.flat().slice(from - 1 - offset, to - offset);
    if (kind === 'chats') {
      for (const c of items) if (submittedByChat[c._id]) c.submitted_message_ids = submittedByChat[c._id];
    }
    return items;
  }

  async function fetchBatchList(base) {
    const first = await getJSON(`${base}panels/batches?page=1&limit=${PAGE}`);
    const all = [...(first.batches || [])];
    const ids = new Set(all.map((b) => b.batchGroupId));
    for (let p = 2; all.length < (first.total || 0) && p < 200; p++) {
      const j = await getJSON(`${base}panels/batches?page=${p}&limit=${PAGE}`);
      const fresh = (j.batches || []).filter((b) => !ids.has(b.batchGroupId));
      if (!fresh.length) break;
      fresh.forEach((b) => ids.add(b.batchGroupId));
      all.push(...fresh);
    }
    return all;
  }

  async function fetchBatches(base, from, to, opts, progress, log) {
    const list = (await fetchBatchList(base)).slice(from - 1, to);
    let done = 0;
    const groups = await pool(list, opts.concurrency, async (b) => {
      const runs = [];
      const runIds = new Set();
      let query = `batchGroupId=${encodeURIComponent(b.batchGroupId)}`;
      for (let guard = 0; guard < 50; guard++) {
        const g = (await svelteData(base, query)).batchGroupView;
        if (!g) break;
        const fresh = (g.runs || []).filter((r) => !runIds.has(r.view?.batchId ?? r.startedAt));
        fresh.forEach((r) => runIds.add(r.view?.batchId ?? r.startedAt));
        runs.push(...fresh);
        if (!g.hasMore || !g.nextBefore || !fresh.length) {
          if (g.hasMore && !fresh.length) log(`Note: batch "${b.scenarioName}" reports more runs than could be loaded.`);
          break;
        }
        query = `batchGroupId=${encodeURIComponent(b.batchGroupId)}&before=${encodeURIComponent(g.nextBefore)}`;
      }
      progress(++done, list.length, 'batch lists');
      if (opts.delay) await sleep(opts.delay);
      return {
        ...b,
        runs: runs.map((r) => ({
          startedAt: r.startedAt ? new Date(r.startedAt).toISOString() : null,
          batchId: r.view?.batchId,
          behaviorId: r.view?.behaviorId,
          prompts: r.view?.prompts,
          models: r.view?.models,
          results: (r.view?.results || []).map((x) => ({ ...x })),
        })),
      };
    });

    if (opts.batchTranscripts) {
      const results = groups.flatMap((g) => g.runs.flatMap((r) => r.results)).filter((x) => x.chatId);
      let n = 0;
      await pool(results, opts.concurrency, async (res) => {
        try {
          const cd = (await svelteData(base, `chatId=${encodeURIComponent(res.chatId)}`)).chatDetails;
          if (cd) {
            res.messages = cd.newMessages || cd.newHistory?.messages || [];
            res.systemPrompt = cd.systemPrompt ?? null;
            res.title = cd.title ?? null;
            res.labels = cd.labels ?? null;
            res.chatGrading = cd.chatGrading ?? null;
          }
        } catch (e) {
          if (String(e).includes('Cancelled')) throw e;
          res.fetchError = String(e);
        }
        progress(++n, results.length, 'batch chats');
        if (opts.delay) await sleep(opts.delay);
      });
    }
    return groups;
  }

  // ---------- formatting ----------
  const contentText = (c) => (typeof c === 'string' ? c : c == null ? '' : JSON.stringify(c));
  const msgList = (m) => (Array.isArray(m) ? m : m && typeof m === 'object' ? Object.values(m) : []);
  const transcript = (msgs) => msgList(msgs).map((m) => `${String(m.role || '?').toUpperCase()}: ${contentText(m.content)}`).join('\n\n');
  const firstOf = (msgs, role) => contentText(msgList(msgs).find((m) => m.role === role)?.content);
  const lastOf = (msgs, role) => contentText([...msgList(msgs)].reverse().find((m) => m.role === role)?.content);

  function csvCell(v) {
    if (v == null) return '';
    const s = typeof v === 'string' ? v : typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }
  const toCSV = (rows, cols) => '﻿' + [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\r\n');

  const chatRows = (chats) => chats.map((c) => ({
    chat_id: c._id, created_at: c.created_at, updated_at: c.updated_at, model: c.model, model_id: c.model_id,
    behavior_id: c.behavior_id, title: c.title, submitted: c.submitted_message_ids ? 'yes' : 'no',
    message_count: msgList(c.messages).length, first_user_message: firstOf(c.messages, 'user'),
    last_assistant_message: lastOf(c.messages, 'assistant'), transcript: transcript(c.messages),
  }));
  const CHAT_COLS = ['chat_id', 'created_at', 'updated_at', 'model', 'model_id', 'behavior_id', 'title', 'submitted', 'message_count', 'first_user_message', 'last_assistant_message', 'transcript'];

  const messageRows = (items, idKey) => items.flatMap((c) => msgList(c.messages).map((m, i) => ({
    chat_id: c[idKey], index: i, role: m.role, model: m.model ?? c.model ?? '', created_at: m.created_at ?? m.timestamp ?? '', content: contentText(m.content),
  })));
  const MSG_COLS = ['chat_id', 'index', 'role', 'model', 'created_at', 'content'];

  const subRows = (subs) => subs.map((s) => ({
    submission_id: s._id, created_at: s.created_at, chat_id: s.chat_id, model_id: s.model_id, title: s.title,
    behavior: typeof s.behavior === 'object' ? s.behavior?.name ?? s.behavior?.id : s.behavior, category: s.category,
    successful: s.successful, grade_status: s.grade_status, reviewed: s.reviewed, severity: s.severity,
    first_user_message: firstOf(s.messages, 'user'), last_assistant_message: lastOf(s.messages, 'assistant'), transcript: transcript(s.messages),
  }));
  const SUB_COLS = ['submission_id', 'created_at', 'chat_id', 'model_id', 'title', 'behavior', 'category', 'successful', 'grade_status', 'reviewed', 'severity', 'first_user_message', 'last_assistant_message', 'transcript'];

  const batchRows = (groups) => groups.flatMap((g) => g.runs.flatMap((r) => r.results.map((x) => ({
    batch_group_id: g.batchGroupId, batch_id: r.batchId, scenario: g.scenarioName, behavior_id: g.behaviorId || r.behaviorId,
    run_started_at: r.startedAt, index: x.index, model: x.model, chat_id: x.chatId,
    submission_id: x.submission?.submissionId ?? '', successful: x.submission?.successful ?? '', grade_status: x.submission?.gradeStatus ?? '',
    prompt: x.prompt, response: lastOf(x.messages, 'assistant'), transcript: x.messages ? transcript(x.messages) : '', fetch_error: x.fetchError ?? '',
  }))));
  const BATCH_COLS = ['batch_group_id', 'batch_id', 'scenario', 'behavior_id', 'run_started_at', 'index', 'model', 'chat_id', 'submission_id', 'successful', 'grade_status', 'prompt', 'response', 'transcript', 'fetch_error'];

  function chunk(arr, size) {
    if (!size || size <= 0 || arr.length <= size) return [arr];
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }
  const pad = (n) => String(n).padStart(4, '0');

  // ---------- zip (deflate via the browser's built-in CompressionStream) ----------
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(u8) { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
  async function deflateRaw(u8) {
    const stream = new Blob([u8]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  async function makeZip(files) {
    const enc = new TextEncoder();
    const d = new Date();
    const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    const parts = [], central = [];
    let offset = 0;
    for (const f of files) {
      const name = enc.encode(f.name);
      const raw = enc.encode(f.data);
      const crc = crc32(raw);
      const comp = await deflateRaw(raw);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 8, true);
      lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true);
      lh.setUint32(18, comp.length, true); lh.setUint32(22, raw.length, true); lh.setUint16(26, name.length, true);
      parts.push(lh.buffer, name, comp);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
      ch.setUint16(10, 8, true); ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true);
      ch.setUint32(20, comp.length, true); ch.setUint32(24, raw.length, true); ch.setUint16(28, name.length, true);
      ch.setUint32(42, offset, true);
      central.push(ch.buffer, name);
      offset += 30 + name.length + comp.length;
    }
    const cdSize = central.reduce((s, b) => s + b.byteLength, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, end.buffer], { type: 'application/zip' });
  }

  // ---------- main export ----------
  function inDateRange(iso, after, before) {
    if (!after && !before) return true;
    const t = Date.parse(iso || '');
    if (Number.isNaN(t)) return true;
    if (after && t < Date.parse(after)) return false;
    if (before && t >= Date.parse(before) + 86400000) return false; // "before" date is inclusive
    return true;
  }

  async function runExport(opts, ui = { progress() {}, log() {} }) {
    cancelled = false;
    const slug = opts.slug || slugFromUrl();
    if (!slug) throw new Error('Open a challenge page first (URL must contain /arena/challenge/<name>).');
    const base = `/arena/challenge/${slug}/`;
    const files = [];
    const manifest = { tool: 'Gray Swan Arena Bulk Export 1.0', challenge: slug, exported_at: new Date().toISOString(), format: opts.format, options: { ...opts }, counts: {} };
    const wantJSON = opts.format === 'json' || opts.format === 'both';
    const wantCSV = opts.format === 'csv' || opts.format === 'both';

    const emit = (stem, items, toRows, cols, extra) => {
      const parts = chunk(items, opts.perFile);
      parts.forEach((part, i) => {
        const suffix = parts.length > 1 ? `_part${pad(i + 1)}` : '';
        if (wantJSON) files.push({ name: `${stem}${suffix}.json`, data: JSON.stringify(part, null, 2) });
        if (wantCSV) files.push({ name: `${stem}${suffix}.csv`, data: toCSV(toRows(part), cols) });
        if (wantCSV && extra) files.push({ name: `${stem}${suffix}_messages.csv`, data: toCSV(messageRows(part, extra), MSG_COLS) });
      });
    };

    if (opts.chats) {
      ui.log(`Fetching chats #${opts.chats.from}–#${opts.chats.to}…`);
      let chats = await fetchRange(base, 'chats', opts.chats.from, opts.chats.to, opts, (d, t) => ui.progress(d, t, 'chat pages'));
      chats = chats.filter((c) => inDateRange(c.created_at, opts.after, opts.before));
      manifest.counts.chats = chats.length;
      ui.log(`Got ${chats.length} chats.`);
      emit('chats', chats, chatRows, CHAT_COLS, opts.messagesCsv ? '_id' : null);
    }
    if (opts.submissions) {
      ui.log(`Fetching submissions #${opts.submissions.from}–#${opts.submissions.to}…`);
      let subs = await fetchRange(base, 'submissions', opts.submissions.from, opts.submissions.to, opts, (d, t) => ui.progress(d, t, 'submission pages'));
      subs = subs.filter((s) => inDateRange(s.created_at, opts.after, opts.before));
      manifest.counts.submissions = subs.length;
      ui.log(`Got ${subs.length} submissions.`);
      emit('submissions', subs, subRows, SUB_COLS, opts.messagesCsv ? '_id' : null);
    }
    if (opts.batches) {
      ui.log(`Fetching batches #${opts.batches.from}–#${opts.batches.to}${opts.batchTranscripts ? ' with full chat transcripts' : ''}…`);
      let groups = await fetchBatches(base, opts.batches.from, opts.batches.to, opts, (d, t, what) => ui.progress(d, t, what), ui.log);
      groups = groups.filter((g) => inDateRange(g.lastActivityAt, opts.after, opts.before));
      const nResults = groups.reduce((s, g) => s + g.runs.reduce((a, r) => a + r.results.length, 0), 0);
      const nErr = groups.reduce((s, g) => s + g.runs.reduce((a, r) => a + r.results.filter((x) => x.fetchError).length, 0), 0);
      manifest.counts.batches = groups.length;
      manifest.counts.batch_chats = nResults;
      if (nErr) manifest.counts.batch_chat_fetch_errors = nErr;
      ui.log(`Got ${groups.length} batches (${nResults} chats${nErr ? `, ${nErr} failed to load` : ''}).`);
      if (wantJSON) files.push({ name: 'batches.json', data: JSON.stringify(groups, null, 2) });
      if (wantCSV) {
        files.push({ name: 'batches.csv', data: toCSV(batchRows(groups), BATCH_COLS) });
        files.push({ name: 'batches_summary.csv', data: toCSV(groups.map((g) => ({ ...g, associationIds: undefined, runs: g.runs.length })), ['batchGroupId', 'scenarioName', 'behaviorId', 'title', 'promptCount', 'modelCount', 'chatCount', 'submittedCount', 'lastActivityAt', 'runs']) });
      }
    }

    files.unshift({ name: 'manifest.json', data: JSON.stringify(manifest, null, 2) });
    ui.log(`Building zip (${files.length} files)…`);
    const blob = await makeZip(files);
    const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
    const filename = `grayswan_${slug}_${stamp}.zip`;
    if (opts.save !== false) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    }
    ui.log(`Done: ${filename} (${(blob.size / 1048576).toFixed(1)} MB).`);
    return { blob, filename, manifest, files: files.map((f) => f.name) };
  }

  // ---------- UI ----------
  const CSS = `
  #gsx-btn{position:fixed;right:16px;bottom:84px;z-index:2147483646;background:#d7ff3a;color:#111;border:0;border-radius:6px;padding:9px 14px;font:600 12px/1 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.06em;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.4)}
  #gsx-panel{position:fixed;right:16px;bottom:130px;z-index:2147483647;width:390px;max-height:78vh;overflow:auto;background:#17191a;color:#e8e8e8;border:1px solid #3a3d3f;border-radius:8px;padding:14px 16px;font:13px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.6)}
  #gsx-panel h3{margin:0 0 2px;font:600 13px ui-monospace,Menlo,Consolas,monospace;letter-spacing:.08em;color:#d7ff3a}
  #gsx-panel .sub{color:#9a9fa3;font-size:12px;margin-bottom:10px}
  #gsx-panel fieldset{border:1px solid #2e3133;border-radius:6px;margin:0 0 10px;padding:8px 10px}
  #gsx-panel legend{padding:0 4px;color:#c9cdd0;font-size:12px}
  #gsx-panel label{display:inline-flex;align-items:center;gap:5px;margin-right:10px;cursor:pointer}
  #gsx-panel input[type=number],#gsx-panel input[type=date]{background:#0f1011;color:#eee;border:1px solid #3a3d3f;border-radius:4px;padding:3px 5px;width:80px;font:inherit}
  #gsx-panel input[type=date]{width:130px}
  #gsx-panel .row{display:flex;align-items:center;gap:6px;margin-top:6px;flex-wrap:wrap}
  #gsx-panel .chip{background:#26292b;border:1px solid #3a3d3f;color:#ddd;border-radius:4px;padding:2px 7px;font-size:11px;cursor:pointer}
  #gsx-panel .muted{color:#8b9094;font-size:11px}
  #gsx-panel .go{background:#d7ff3a;color:#111;border:0;border-radius:5px;padding:8px 14px;font-weight:700;cursor:pointer}
  #gsx-panel .go:disabled{opacity:.5;cursor:default}
  #gsx-panel .cancel{background:transparent;color:#ddd;border:1px solid #555;border-radius:5px;padding:7px 12px;cursor:pointer}
  #gsx-panel .bar{height:6px;background:#2a2d2f;border-radius:3px;overflow:hidden;margin-top:10px}
  #gsx-panel .bar>div{height:100%;width:0;background:#d7ff3a;transition:width .2s}
  #gsx-panel .log{margin-top:8px;max-height:130px;overflow:auto;background:#0f1011;border-radius:4px;padding:6px 8px;font:11px/1.5 ui-monospace,Menlo,Consolas,monospace;color:#b9bec2;white-space:pre-wrap}
  #gsx-panel .x{float:right;background:none;border:0;color:#aaa;font-size:16px;cursor:pointer}
  `;

  function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  function buildPanel() {
    const p = el(`
    <div id="gsx-panel">
      <button class="x" title="Close">✕</button>
      <h3>BULK EXPORT</h3>
      <div class="sub" data-k="slug"></div>

      <fieldset><legend><label><input type="checkbox" data-k="chats" checked> Chats <span class="muted" data-k="tc"></span></label></legend>
        <div class="row">From # <input type="number" min="1" data-k="cFrom" value="1"> to # <input type="number" min="1" data-k="cTo"></div>
        <div class="row"><span class="muted">#1 = most recent.</span>
          <span class="chip" data-q="c:100">latest 100</span><span class="chip" data-q="c:1000">latest 1000</span><span class="chip" data-q="c:all">all</span></div>
      </fieldset>

      <fieldset><legend><label><input type="checkbox" data-k="subs"> Submissions <span class="muted" data-k="ts"></span></label></legend>
        <div class="row">From # <input type="number" min="1" data-k="sFrom" value="1"> to # <input type="number" min="1" data-k="sTo"></div>
        <div class="row"><span class="chip" data-q="s:100">latest 100</span><span class="chip" data-q="s:all">all</span></div>
      </fieldset>

      <fieldset><legend><label><input type="checkbox" data-k="batches"> Batches <span class="muted" data-k="tb"></span></label></legend>
        <div class="row">From # <input type="number" min="1" data-k="bFrom" value="1"> to # <input type="number" min="1" data-k="bTo"></div>
        <div class="row"><label><input type="checkbox" data-k="bTx" checked> include every model's full response</label></div>
        <div class="row muted">Full responses need one request per chat in the batch, so this part is slower.</div>
      </fieldset>

      <fieldset><legend>Date filter (optional)</legend>
        <div class="row">From <input type="date" data-k="after"> to <input type="date" data-k="before"></div>
        <div class="row muted">Applied to the items inside the # range above.</div>
      </fieldset>

      <fieldset><legend>Format</legend>
        <label><input type="radio" name="gsx-fmt" value="json" checked> JSON</label>
        <label><input type="radio" name="gsx-fmt" value="csv"> CSV</label>
        <label><input type="radio" name="gsx-fmt" value="both"> Both</label>
        <div class="row"><label><input type="checkbox" data-k="msgCsv"> CSV: also one row per message</label></div>
        <div class="row">Split every <input type="number" min="0" data-k="perFile" value="0"> items per file <span class="muted">(0 = one file each)</span></div>
      </fieldset>

      <details><summary class="muted" style="cursor:pointer">Speed settings</summary>
        <div class="row">Parallel requests <input type="number" min="1" max="6" data-k="conc" value="3"> Pause (ms) <input type="number" min="0" data-k="delay" value="200"></div>
        <div class="row muted">If you get rate-limited, lower parallel requests to 1–2. The tool retries automatically.</div>
      </details>

      <div class="row" style="margin-top:12px"><button class="go">Download ZIP</button><button class="cancel" disabled>Cancel</button><span class="muted" data-k="status"></span></div>
      <div class="bar"><div></div></div>
      <div class="log" data-k="log"></div>
    </div>`);
    const $ = (k) => p.querySelector(`[data-k="${k}"]`);
    const T = { chats: 0, submissions: 0, batches: 0 };

    const log = (m) => { const L = $('log'); L.textContent += (L.textContent ? '\n' : '') + `[${new Date().toLocaleTimeString()}] ${m}`; L.scrollTop = L.scrollHeight; };
    const progress = (d, t, what) => { p.querySelector('.bar>div').style.width = `${t ? Math.round((d / t) * 100) : 0}%`; $('status').textContent = `${what}: ${d}/${t}`; };

    async function refreshTotals() {
      const slug = slugFromUrl();
      $('slug').textContent = slug ? `Challenge: ${slug}` : 'Open a challenge page to export.';
      if (!slug) return;
      const t = await totals(`/arena/challenge/${slug}/`);
      Object.assign(T, t);
      $('tc').textContent = `(${t.chats.toLocaleString()})`;
      $('ts').textContent = `(${t.submissions.toLocaleString()})`;
      $('tb').textContent = `(${t.batches.toLocaleString()})`;
      if (!$('cTo').value) $('cTo').value = t.chats;
      if (!$('sTo').value) $('sTo').value = t.submissions;
      if (!$('bTo').value) $('bTo').value = t.batches;
    }

    p.querySelectorAll('[data-q]').forEach((c) => c.addEventListener('click', () => {
      const [which, n] = c.dataset.q.split(':');
      const tot = which === 'c' ? T.chats : T.submissions;
      $(`${which}From`).value = 1;
      $(`${which}To`).value = n === 'all' ? tot : Math.min(Number(n), tot || Number(n));
    }));
    p.querySelector('.x').addEventListener('click', () => p.remove());
    p.querySelector('.cancel').addEventListener('click', () => { cancelled = true; log('Cancelling…'); });

    const range = (fk, tk, total) => {
      const from = Math.max(1, Number($(fk).value) || 1);
      const to = Math.min(Math.max(from, Number($(tk).value) || total), total || Infinity);
      return { from, to };
    };

    p.querySelector('.go').addEventListener('click', async () => {
      const go = p.querySelector('.go'), cancel = p.querySelector('.cancel');
      const opts = {
        chats: $('chats').checked ? range('cFrom', 'cTo', T.chats) : null,
        submissions: $('subs').checked ? range('sFrom', 'sTo', T.submissions) : null,
        batches: $('batches').checked ? range('bFrom', 'bTo', T.batches) : null,
        batchTranscripts: $('bTx').checked,
        after: $('after').value || null,
        before: $('before').value || null,
        format: p.querySelector('input[name="gsx-fmt"]:checked').value,
        messagesCsv: $('msgCsv').checked,
        perFile: Math.max(0, Number($('perFile').value) || 0),
        concurrency: Math.min(6, Math.max(1, Number($('conc').value) || 3)),
        delay: Math.max(0, Number($('delay').value) || 0),
      };
      if (!opts.chats && !opts.submissions && !opts.batches) { log('Tick at least one of Chats, Submissions or Batches.'); return; }
      go.disabled = true; cancel.disabled = false;
      try { await runExport(opts, { progress, log }); }
      catch (e) { log(`Stopped: ${e.message || e}`); }
      finally { go.disabled = false; cancel.disabled = true; }
    });

    refreshTotals().catch((e) => log(`Could not read totals: ${e.message || e}`));
    return p;
  }

  function mount() {
    if (document.getElementById('gsx-btn')) return;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    const btn = el(`<button id="gsx-btn" title="Bulk export chats, submissions and batches">⬇ BULK EXPORT</button>`);
    btn.addEventListener('click', () => {
      const open = document.getElementById('gsx-panel');
      if (open) open.remove(); else document.body.appendChild(buildPanel());
    });
    document.body.appendChild(btn);
  }

  window.__gsExport = { runExport, totals, unflatten, makeZip, cancel: () => { cancelled = true; } };
  mount();
})();
