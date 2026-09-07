# Busy Bee Pro — PWA

This is a Progressive Web App (PWA) build of Busy Bee Pro. It's installable on desktop and
mobile, works offline once loaded, and deploys as a static site — no build step, no server,
no database. Everything (lists, notes, FreshDesk/JIRA/Twilio analytics, JSON tools) still
runs entirely in your browser; nothing is uploaded anywhere.

## What's in this folder

| File | Purpose |
|---|---|
| `index.html` | The main app (this is the file GitHub Pages serves at your site's root) |
| `markdown-viewer.html` | Markdown Viewer, embedded via iframe from the main app |
| `world-clock.html` | World Clock (with live weather), embedded via iframe from the main app |
| `manifest.json` | PWA manifest — app name, icons, colors, install behavior |
| `sw.js` | Service worker — caches the app so it works offline and can be installed |
| `icons/` | App icons (192px, 512px, maskable, Apple touch icon, favicon) |
| `.nojekyll` | Tells GitHub Pages not to run this through Jekyll (keeps everything served as-is) |

**Keep all of these files together, in the same folder structure, when you deploy.** The app
loads `markdown-viewer.html` and `world-clock.html` by relative filename, and the manifest/
service worker reference the icons by relative path.

## Deploying to GitHub Pages

1. **Create a repository** on GitHub (either a new one, or reuse an existing one). It can be
   public or private — Pages works with both.
2. **Add these files to the repo root** (or a subfolder like `/docs` if you prefer — see step 4).
   You can do this via the GitHub web UI ("Add file" → "Upload files", drag the whole folder
   in), or from the command line:
   ```bash
   git init
   git add .
   git commit -m "Busy Bee Pro PWA"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
3. **Enable Pages**: on GitHub, go to your repo → **Settings** → **Pages**.
   - Under "Build and deployment", set **Source** to "Deploy from a branch".
   - Set **Branch** to `main` and the folder to `/ (root)` (or `/docs` if that's where you put
     the files).
   - Click **Save**.
4. GitHub will build and publish the site — this usually takes under a minute. The same
   Settings → Pages screen will show you the live URL, typically:
   ```
   https://<your-username>.github.io/<your-repo>/
   ```
5. Open that URL. You should see Busy Bee Pro. From here:
   - **Desktop (Chrome/Edge)**: an install icon (⊕) appears in the address bar, or use the
     "Install App" button that appears in the left sidebar once the browser is ready to
     install it.
   - **Android (Chrome)**: you'll get an "Add to Home screen" / "Install app" prompt, or use
     the "Install App" sidebar button.
   - **iPhone/iPad (Safari)**: tap the Share icon → "Add to Home Screen" (iOS doesn't support
     the automatic install prompt, this is the standard way PWAs install on iOS).

Once installed, it opens in its own window (no browser address bar), gets its own icon on
your home screen / app list, and keeps working without an internet connection.

## Updating the app later

Because of the offline cache, browsers may keep showing a cached copy for a little while
after you push changes. To make sure everyone gets the update promptly:

1. Make your changes to `index.html` (or the other files).
2. Open `sw.js` and bump the version string at the top:
   ```js
   const CACHE_VERSION = "v2"; // was "v1"
   ```
   This isn't optional busywork — it's what tells the service worker to throw away the old
   cached files and fetch fresh ones. Skipping this step means visitors can keep seeing the
   old version for a while even after you've deployed the update.
3. Commit and push. Visitors who already have the app open will get the new version on their
   next visit (or the next time they relaunch the installed app).

## A note on custom domains

If you point a custom domain at this GitHub Pages site (via a `CNAME` file or your repo's
Pages settings), everything here still works unchanged — all paths are relative, so the app
doesn't care whether it's served from `username.github.io/reponame/`, a custom domain, or a
local file.

## Browser support notes

- **Offline mode & installability** work in Chrome, Edge, and other Chromium-based browsers,
  and in Chrome/Firefox on Android.
- **Safari/iOS** supports "Add to Home Screen" and offline caching, but not the automatic
  install-prompt banner (Apple's browsers don't fire `beforeinstallprompt`) — use the Share
  → "Add to Home Screen" path instead.
- The **FreshDesk/JIRA/Twilio import features** still work exactly as before — you import a
  CSV/JSON file from your device each time, nothing is fetched from a server. Weather in
  World Clock does require an internet connection (it calls the free Open-Meteo API), so
  that one panel will show "—" if you're genuinely offline; everything else keeps working.
