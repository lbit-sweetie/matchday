# MATCHDAY — live sports & analytics (static site)

Frontend-only sports analytics site: real fixtures, live scores and
match probabilities for Football, Basketball, Tennis and Hockey.
Dark-forest green theme, mobile-first, bottom tab navigation. No backend.

## Run
1. Upload the whole folder to any static hosting (Netlify, Vercel, GitHub Pages, cPanel `public_html`).
   Or just open `index.html` locally / run `python -m http.server`.
2. Done — the site works out of the box.

## Real data & API key
- Data source: TheSportsDB (free API).
- Works without registration via the public test key `3` (rate-limited).
- Get your own free key: https://www.thesportsdb.com → sign up → API section.
  Paste it into `js/config.js` → `thesportsdbKey`.

## Request budget (why the API is not overloaded)
Built for an Android WebView (Unity): minimal traffic, no background polling.
Typical session costs ~9 requests total; re-renders cost 0 (localStorage cache).

| Data | Requests | Cache |
|---|---|---|
| Fixtures per date+sport | 4 on first open | 30 min |
| Live scores | 1 at boot, then only if a live pill is visible AND page is visible (2 min; 3 min floor in WebView) | 60 s |
| Team form (last 5) | 2 per match detail, first open only | 24 h |
| Match lineup | 1 per match detail, first open only | 24 h |
| Team squads (fallback) | 0 — only via explicit "Show team squads" button | 7 days |
| League standings | 1 per league hub, first open only | 12 h |
| Scorers | 0 — aggregated from cached timelines; "Load scorers" fetches max 5, user-initiated | 24 h |

- Deep links (`#/match/id`, `#/league/id`) resolve with 1 request max, then cache.
- Any total API failure → automatic Demo mode (status bar shows the current source).

## Features
- League chips (local filter, 0 requests) + League hub: standings, fixtures, scorers.
- Match detail: starting XI + substitutes, squad fallback, league hub link, form guide.

## Local profile
Favorites, saved predictions and settings are stored in localStorage (per device/browser).

## Customize
- Colors: CSS variables in `css/style.css` (`:root`).
- Brand name: `index.html` + `js/config.js`.
- Sports list: `js/config.js` → `sports`.

Disclaimer: probabilities are estimates (demo model or market-implied) and do not
guarantee match results.