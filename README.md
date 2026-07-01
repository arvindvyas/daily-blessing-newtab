# Daily Blessing — Verse & Shloka New Tab

A calm new-tab page that shows a **daily spiritual message**, a clock, and a
simple prayer list. Pick your tradition — **Christian** (Bible, KJV),
**Hindu** (Bhagavad Gita shlokas + Hindi thoughts), or a **mix** of both.
No ads, no tracking, works fully offline.

## Features
- A message of the day (deterministic — same all day, new one each day)
- **Tradition selector**: Mix (default) / Christian / Hindu
- Gita shlokas show the **Sanskrit + Hindi meaning**; Bible shows KJV verses
- **Another** to browse more, **Copy**, and **♥ Favorite**
- A lightweight **prayer / intentions** list (add, check off, delete)
- Clock + time-aware greeting (optional name)
- Light / dark / auto theme
- Everything is stored locally via `chrome.storage.sync` — nothing leaves your device

## Content & copyright
All content is **public domain**, so it ships freely and safely:
- **Bible** → King James Version (modern translations like NIV/ESV are copyrighted).
- **Gita** → original Sanskrit shlokas (ancient = public domain); Hindi meanings
  are written for this project, not copied from a copyrighted translation.

## Permissions
Only `storage`. No host permissions, no network access — which also means no
"untrusted developer" install warning.

## Run locally
1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → select this folder
3. Open a new tab.

## Files
- `manifest.json` — MV3 config (new tab override)
- `newtab.html/.css/.js` — the page
- `verses.js` — the KJV verse set (add more here)
- `icons/` — cross icon
