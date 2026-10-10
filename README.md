# Matata · Robotikos akademija

Landing page for the Matata programme (screen-free storytelling robotics, Tale-Bot Pro, ages 3 and 4). Static site, no build step.

- `index.html` public landing (both age tracks, waitlist form → Supabase `ra_waitlist`)
- `komandai/` internal team page (noindex)
- `lankstinukas/` A5 two-sided leaflet + `lankstinukas.pdf`
- `assets/og-src.html` source for `assets/og.png` (render at 1200×630)

Tracking: `track.js` (cookieless, anonymous events) + Microsoft Clarity only after consent („Leisti"). `CLARITY_ID` in `js/main.js` is empty until the Clarity project exists.

QA: open with `?qa=1` to list elements wider than the viewport. `?age=4` preselects the 4-year track, `?src=<channel>` tags the waitlist row.
