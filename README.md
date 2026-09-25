# Busy Bee Pro 🐝 — PWA

Busy Bee Pro is a personal productivity suite packaged as a Progressive Web App (PWA). It's
installable on desktop and mobile, works offline once loaded, and deploys as a static site —
no build step, no server, no database. Everything (lists, notes, FreshDesk/JIRA/Twilio
analytics, JSON tools, Markdown and PDF viewers) runs entirely in your browser; imported files
are read locally and nothing is uploaded anywhere.

Live site (GitHub Pages): `https://emm-strength-gh.github.io/busy-bee/`
Repository: <https://github.com/emm-strength-gh/busy-bee>

---

## Features

### Lists & notes (core organizer)
- **Home** — an app-launcher grid that jumps straight to any tool.
- **Overview** — the default landing page, with a card per list.
- **Lists** — two built-in starter lists (**Daily Work** and **Must Do**) plus any number of
  custom lists. When creating a list you pick a type:
  | Type | What it holds |
  |---|---|
  | Todo | Checkable todos; items can be marked *daily* so they auto-reset each new day |
  | Notes | Items that are mainly rich-text notes |
  | Links | Items with a URL |
  | Budget | Items with a price, a base currency and an optional conversion rate/total |
- **Rich-text notes** on any item (bold, italic, underline, strikethrough, bullet/numbered
  lists), saved automatically as you type.
- **Archive** — completed todos can be archived per list.
- **Password-protected lists** — list contents are encrypted in the browser with AES-GCM
  (key derived via PBKDF2). The password itself is never stored. Locked lists are excluded
  from search and counters until unlocked.
- **Search** across list titles, item text, notes and URLs.
- **Counters** side panel — totals for todos, notes and lists.
- **Dark / light theme** toggle.

### Tools menu (floating button, bottom-right)
| Tool | What it does |
|---|---|
| **JSON Tools → JSON to CSV** | Flattens a nested JSON export (contacts, status, consent) into a CSV with `DD.MM.YYYY` dates |
| **JSON Tools → Stitch JSON** | Deep-merges two JSON files key by key; arrays are joined, the second file wins on conflicts |
| **FreshDesk Report** | Load a Freshdesk ticket CSV export for volume, agent and helpdesk-performance breakdowns; date-range filters (7d/21d/30d/1m/3m/all), unresolved and "Immediate Attention Required" ticket lists, and a monthly **Summary & Analysis** view |
| **JIRA Dashboard** | Import a JIRA support-ticket JSON export to see a dashboard, with a link to open the matching filter in Jira |
| **Twilio** | Import a Twilio call-log CSV export for a call-volume dashboard |
| **Study Manager** | Track studies (study name, Study ID, tenant, sponsor, study mailbox) with a status of **Active**, **Draft** or **Closed** and any number of **study managers** and **project coordinators**. Add, edit and delete studies; add or remove people as name chips; change status straight from a study card. Filter by status, tenant, sponsor or person, search, sort, and export to CSV. Import an existing list from **.xlsx** or **.csv** (see below) |
| **Markdown Viewer** | Renders `.md` files (marked + highlight.js) with text highlighting |
| **World Clock** | Five time zones (Stockholm, London, New York, Chicago, Manila) with live weather |
| **PDF Viewer** | Open or drop a PDF (pdf.js) to view and highlight it |
| **Install App** | Appears when the browser is ready to install the PWA |
| **Open file / Save backup / Export CSV** | Restore from or save a JSON backup of all lists (including Study Manager studies and Markdown/PDF highlights); export lists as CSV |
| **Clear all data** | Wipes all lists, Study Manager studies, highlights and session state, resetting to the two starter lists |

### Study Manager import
**Import** accepts `.xlsx` (the first worksheet) or `.csv`. The header row is detected automatically,
and columns are matched by name:

| Column header contains | Becomes |
|---|---|
| "Study ID" / "Protocol" | Study ID |
| "Mail" | Study mailbox |
| "Coordinator" | Project coordinators |
| "Manager" | Study managers |
| "Status" | Status (`Active` / `Draft` / `Closed`; anything else or blank → Active) |
| "Sponsor" | Sponsor |
| "Tenant" | Tenant |
| "Study" / "Name" | Study name |

- Several people in one cell are split on `/`, `,`, `;`, `&`, "and" and "or".
- A row with no study name uses its Study ID, or failing that its sponsor/tenant, as the name.
- Re-importing **merges**: rows matching an existing study (by Study ID, otherwise by name)
  update it, and everything else is added.
- `.xlsx` files are read by a small built-in reader (the browser's `DecompressionStream`), so no
  extra library is needed and it works offline.

**Privacy:** the study list (including people's names) is stored only in your browser. It is
never written into the app's files, so it isn't published to the public GitHub repo. Use
**Save backup** to keep a copy or move it to another device.

### App shortcuts
The manifest defines home-screen / taskbar shortcuts that open the app directly on a view via
`index.html?view=<name>` — **Home** (`app-home`), **PDF Viewer** (`pdf-viewer`) and
**FreshDesk Report** (`freshdesk`).

---

## What's in this folder

| File | Purpose |
|---|---|
| `index.html` | The main app — a single self-contained file (HTML + CSS + JS). GitHub Pages serves it at the site root |
| `markdown-viewer.html` | Markdown Viewer, embedded via iframe from the main app |
| `world-clock.html` | World Clock (with live weather), embedded via iframe from the main app |
| `pdf-viewer.html` | PDF Viewer, embedded via iframe from the main app |
| `manifest.json` | PWA manifest — name, icons, colors, install behavior, app shortcuts |
| `sw.js` | Service worker — caches the app so it works offline and can be installed |
| `icons/` | App icons (192px, 512px, maskable 512px, Apple touch icon, 32px favicon) |
| `.nojekyll` | (In the repo) tells GitHub Pages not to run the site through Jekyll |
| `busybee.html` | Local working copy of `index.html` (currently identical). Not deployed |

**Keep the deployed files together, in the same folder structure.** The app loads the three
viewer pages by relative filename, and the manifest/service worker reference the icons by
relative path.

---

## How it works

### Architecture
- No framework, no bundler, no dependencies to install. Each page is plain HTML with inline
  CSS and JavaScript.
- The Markdown Viewer, World Clock and PDF Viewer run inside iframes and talk to the main app
  with `postMessage` (e.g. so highlights are mirrored into the main app's backup).
- External resources loaded from CDNs: Google Fonts; `marked` and `highlight.js`
  (Markdown Viewer); `pdf.js` (PDF Viewer).
- World Clock calls public APIs for time-sync (Cloudflare trace, timeapi.io,
  worldtimeapi.org) and weather (Open-Meteo).

### Data storage
All data lives in the browser's `localStorage` for the site's origin:

| Key | Contents |
|---|---|
| `organizer.data.v4` | All lists and items (older `organizer.lists.v3` / `.v2` / `organizer.todos.v1` data is migrated automatically) |
| `busybee.theme` | Light/dark preference |
| `busybee_session_v1` | Last open view, restored on next launch |
| `busybee_fd_v1` | Imported FreshDesk data |
| `busybee_jira_v1` | Imported JIRA data |
| `busybee_twilio_v1` | Imported Twilio data |
| `busybee_studies_v1` | Study Manager studies |
| `busybee_md_hl_mirror_v1` / `busybee_pdf_hl_mirror_v1` | Mirrored Markdown/PDF highlights (included in backups) |

Browser storage can be cleared (private browsing, clearing site data, a new device), so use
**Save backup** regularly to keep a portable JSON file.

### Offline caching (`sw.js`)
- The app shell (all four pages, manifest and icons) is precached on install.
- HTML pages are **network-first** — online you always get the latest deploy; offline you get
  the last cached copy.
- Live-data endpoints (World Clock time-sync and weather) are **network-only** and never cached.
- Everything else (fonts, CDN scripts, images) is **cache-first**.

---

## Deploying to GitHub Pages

1. Add the files to the repo root — via the GitHub web UI ("Add file" → "Upload files") or:
   ```bash
   git add .
   git commit -m "Describe your change"
   git push
   ```
2. **Enable Pages** (one-time): repo → **Settings** → **Pages** → Source "Deploy from a
   branch", Branch `main`, folder `/ (root)` → **Save**.
3. The site publishes in about a minute at `https://<username>.github.io/<repo>/`.
4. Install it:
   - **Desktop (Chrome/Edge)**: the install icon (⊕) in the address bar, or **Install App**
     in the Tools menu.
   - **Android (Chrome)**: the "Install app" prompt, or **Install App** in the Tools menu.
   - **iPhone/iPad (Safari)**: Share → "Add to Home Screen".

## Updating the app

1. Edit `index.html` (or the other files).
2. Bump the version at the top of `sw.js` so browsers drop the old cache:
   ```js
   const CACHE_VERSION = "v13"; // was "v12"
   ```
3. Upload/commit with a message describing what changed, then push. Visitors get the new
   version on their next visit or app relaunch.

## Browser support notes

- **Offline mode & installability** work in Chrome, Edge and other Chromium browsers, and in
  Chrome/Firefox on Android.
- **Safari/iOS** supports Add to Home Screen and offline caching, but not the automatic
  install prompt.
- **Password-protected lists** need the Web Crypto API (all modern browsers, served over
  HTTPS or from `localhost`).
- **Weather** in World Clock needs an internet connection; it shows "—" when offline.
  Everything else keeps working.

## Security note

Protected lists are encrypted locally, but the app also includes a built-in recovery
(master) key whose hash ships in `index.html`. Treat list passwords as a privacy
convenience, not a guarantee against someone who has both the source and your exported
backup file.
