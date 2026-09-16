/* MATCHDAY global configuration */
window.CONFIG = {
  appName: 'MATCHDAY',

  /* TheSportsDB API key.
     '3' is the public free test key — works without registration (rate-limited).
     Get your own free key at https://www.thesportsdb.com (API section) and paste it here. */
  thesportsdbKey: '3',

  /* Cache TTLs — the guard against frequent API calls. */
  cacheTTL: {
    events: 30 * 60 * 1000,      // fixtures per date+sport: 30 min
    live:   60 * 1000,           // live scores snapshot: 60 sec
    form:   24 * 60 * 60 * 1000  // last-5-matches form: 24 hours
  },

  /* Live-score polling (ms). Runs ONLY when the page is visible AND a live match
     is on screen. 0 = disabled. */
  livePollMs: 120000,

  sports: [
    { id: 'all',        label: 'All sports' },
    { id: 'Soccer',     label: 'Football'   },
    { id: 'Basketball', label: 'Basketball' },
    { id: 'Tennis',     label: 'Tennis'     },
    { id: 'Hockey',     label: 'Hockey'     }
  ]
};