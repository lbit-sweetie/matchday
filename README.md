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
- Fixtures per date+sport: cached 30 min in localStorage.
- Live scores: cached 60 s; polled only when the page is visible AND a live match is on screen
  (default every 2 min, configurable in Profile → Settings or `config.js`).
- Team form (last 5): cached 24 h.
- Any API failure → automatic Demo mode (status bar shows the current source).

## Local profile
Favorites, saved predictions and settings are stored in localStorage (per device/browser).

## Customize
- Colors: CSS variables in `css/style.css` (`:root`).
- Brand name: `index.html` + `js/config.js`.
- Sports list: `js/config.js` → `sports`.

Disclaimer: probabilities are estimates (demo model or market-implied) and do not
guarantee match results.