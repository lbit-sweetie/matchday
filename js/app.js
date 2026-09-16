/* Router, global events, live poller, countdown ticker.
   WebView rules (Unity/Android): no background polling, poll only when a live
   pill is visible AND the page is visible, longer interval inside WebView. */
(function () {
  var WEBVIEW = /wv|WebView|Unity|Android.*Version\/[0-9.]+.*Chrome\/[0-9.]+ Mobile/i.test(navigator.userAgent || '');
  var state = {
    route: 'home', param: null, sport: 'all', seg: 'all',
    league: '', leagueMeta: null, squads: {},
    dateISO: U.isoDate(U.today()),
    winStart: U.isoDate(U.addDays(U.today(), -3)),
    q: ''
  };
  var leagueCache = {};
  function leagueKeyOf(m) { return m.lid || ('nm:' + (m.league || 'Other')); }
  function rememberLeagues(list) {
    (list || []).forEach(function (m) {
      var k = leagueKeyOf(m);
      if (k && !leagueCache[k]) leagueCache[k] = { key: k, lid: k, num: (/^\d+$/.test(String(m.lid || '')) ? m.lid : null), name: m.league || 'League', season: m.season || null };
    });
  }
  function leagueMeta() { return state.leagueMeta; }
  var scrollMem = {}, pollTimer = null;

  function parseHash() {
    var h = (location.hash || '#/home').replace(/^#\/?/, '');
    var p = h.split('/');
    if (p[0] === 'match' && p[1]) { state.route = 'match'; state.param = p[1].split('?')[0]; }
    else if (p[0] === 'league' && p[1]) {
      state.route = 'league'; state.param = decodeURIComponent(p[1].split('?')[0]);
      var q = {};
      (p[1].split('?')[1] || '').split('&').forEach(function (kv) {
        var i = kv.split('=');
        if (i[0]) q[decodeURIComponent(i[0])] = decodeURIComponent(i[1] || '');
      });
      if (q.n || q.s || q.id) state.leagueMeta = { key: state.param, lid: state.param, num: q.id || (/^\d+$/.test(state.param) ? state.param : null), name: q.n || state.param, season: q.s || null };
      else if (leagueCache[state.param]) state.leagueMeta = leagueCache[state.param];
      else if (!state.leagueMeta || state.leagueMeta.key !== state.param) state.leagueMeta = { key: state.param, lid: state.param, num: (/^\d+$/.test(state.param) ? state.param : null), name: state.param, season: null };
    }
    else if (['home', 'matches', 'insights', 'favorites', 'profile'].indexOf(p[0]) >= 0) { state.route = p[0]; state.param = null; }
    else { state.route = 'home'; state.param = null; }
  }
  function tabForRoute() { return (state.route === 'match' || state.route === 'league') ? 'matches' : state.route; }
  function go(route) { location.hash = '#/' + route; }
  function findMatch(id) { return API.index[id] || U.favAll()[id] || null; }

  function render() {
    parseHash();
    document.getElementById('tabbar').innerHTML = UI.tabbar(tabForRoute());
    document.getElementById('statusbar').innerHTML = UI.statusbar();
    var fn = { home: Pages.home, matches: Pages.matches, insights: Pages.insights, favorites: Pages.favorites, profile: Pages.profile, match: Pages.matchDetail, league: Pages.leagueDetail }[state.route];
    var arg = (state.route === 'match' || state.route === 'league') ? state.param : undefined;
    var app = document.getElementById('app');
    Promise.resolve(fn(arg)).then(function (html) {
      app.innerHTML = html;
      app.classList.remove('fade');
      void app.offsetWidth; /* restart CSS animation */
      app.classList.add('fade');
      window.scrollTo(0, scrollMem[state.route + (state.param || '')] || 0);
    });
  }

  function updateBell() {
    var n = Object.keys(API.live).length;
    var b = document.getElementById('bellBadge');
    b.hidden = !n; b.textContent = n > 9 ? '9+' : String(n);
  }
  function startPoller() {
    if (pollTimer) clearInterval(pollTimer);
    var ms = U.settings().pollMs;
    if (WEBVIEW && ms && ms < 180000) ms = 180000; /* WebView floor: 3 min */
    if (!ms) return;
    pollTimer = setInterval(function () {
      if (document.hidden) return;
      if (['home', 'matches', 'insights', 'match', 'league'].indexOf(state.route) < 0) return;
      if (!document.querySelector('.pill.live')) return;   // poll ONLY when a live match is on screen
      API.pollLive().then(function () { updateBell(); render(); });
    }, Math.max(ms, 60000));
  }
  /* countdown ticker: updates all [data-cd] labels, zero requests */
  setInterval(function () {
    var els = document.querySelectorAll('[data-cd]');
    for (var i = 0; i < els.length; i++) els[i].textContent = U.countdownText(+els[i].getAttribute('data-cd'));
  }, 30000);

  function copyLink() {
    var url = location.href;
    function ok() { UI.toast('Link copied', 'link'); }
    function fb() {
      var ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) { UI.toast('Copy manually: ' + url, 'link'); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, fb);
    else fb();
  }

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest ? ev.target.closest('[data-action]') : null;
    if (!el) return;
    var a = el.getAttribute('data-action');
    if (a === 'tab') go(el.getAttribute('data-route'));
    else if (a === 'sport') { state.sport = el.getAttribute('data-sport'); state.league = ''; render(); }
    else if (a === 'league') {
      var lid = el.getAttribute('data-lid') || '';
      state.league = lid;
      if (lid) {
        state.leagueMeta = {
          key: lid, lid: lid,
          num: el.getAttribute('data-num') || ((leagueCache[lid] && leagueCache[lid].num) || (/^\d+$/.test(lid) ? lid : null)),
          name: el.getAttribute('data-name') || ((leagueCache[lid] && leagueCache[lid].name) || lid),
          season: el.getAttribute('data-season') || ((leagueCache[lid] && leagueCache[lid].season) || null)
        };
        leagueCache[lid] = state.leagueMeta;
      } else { state.leagueMeta = null; }
      render();
    }
    else if (a === 'open-league') {
      var olid = el.getAttribute('data-lid') || state.league;
      if (el.getAttribute('data-name')) {
        state.leagueMeta = {
          key: olid, lid: olid,
          num: el.getAttribute('data-num') || (/^\d+$/.test(olid || '') ? olid : null),
          name: el.getAttribute('data-name') || olid,
          season: el.getAttribute('data-season') || null
        };
        if (olid) leagueCache[olid] = state.leagueMeta;
      } else if (olid && leagueCache[olid]) { state.leagueMeta = leagueCache[olid]; }
      else if (state.leagueMeta && state.leagueMeta.key === olid) { /* keep */ }
      else if (olid) { state.leagueMeta = { key: olid, lid: olid, num: (/^\d+$/.test(olid) ? olid : null), name: olid, season: null }; }
      if (!state.leagueMeta) { UI.toast('Pick a league first', 'table'); return; }
      var url = '#/league/' + encodeURIComponent(state.leagueMeta.key) +
        '?n=' + encodeURIComponent(state.leagueMeta.name || '') +
        (state.leagueMeta.season ? '&s=' + encodeURIComponent(state.leagueMeta.season) : '') +
        (state.leagueMeta.num ? '&id=' + encodeURIComponent(state.leagueMeta.num) : '');
      location.hash = url;
    }
    else if (a === 'load-scorers') {
      el.disabled = true;
      var meta2 = state.leagueMeta || {};
      var cands = Object.keys(API.index).map(function (k) { return API.index[k]; })
        .filter(function (m) { return m.status === 'FT' && ((m.lid || ('nm:' + (m.league || 'Other'))) === meta2.key || m.league === meta2.name); })
        .sort(function (x, y) { return y.ts - x.ts; })
        .filter(function (m) { return !U.cacheGet('tln:' + m.id, CONFIG.cacheTTL.lineup); })
        .slice(0, CONFIG.scorersSample || 5);
      if (!cands.length) { render(); return; }
      UI.toast('Loading scorers…', 'ball');
      /* sequential: max N small requests, then one re-render */
      cands.reduce(function (pr, m) { return pr.then(function () { return API.getTimeline(m.id); }); }, Promise.resolve())
        .then(function () { render(); UI.toast('Scorers updated', 'check'); });
    }
    else if (a === 'show-squad') {
      el.disabled = true;
      var m3 = findMatch(el.getAttribute('data-id'));
      if (!m3 || !m3.tids) { render(); return; }
      UI.toast('Loading squads…', 'users');
      Promise.all([API.getSquad(m3.tids.h), API.getSquad(m3.tids.a)]).then(function (r) {
        state.squads[m3.id] = { h: r[0] || [], a: r[1] || [] };
        render();
      });
    }
    else if (a === 'seg') { state.seg = el.getAttribute('data-seg'); render(); }
    else if (a === 'date') { state.dateISO = el.getAttribute('data-iso'); render(); }
    else if (a === 'cal-prev') { state.winStart = U.isoDate(U.addDays(U.parseISO(state.winStart), -7)); render(); }
    else if (a === 'cal-next') { state.winStart = U.isoDate(U.addDays(U.parseISO(state.winStart), 7)); render(); }
    else if (a === 'open') location.hash = '#/match/' + el.getAttribute('data-id');
    else if (a === 'back') history.back();
    else if (a === 'fav') {
      var m = findMatch(el.getAttribute('data-id')); if (!m) return;
      var on = U.favToggle(m);
      UI.toast(on ? 'Added to favorites' : 'Removed from favorites', on ? 'starF' : 'star');
      render();
    }
    else if (a === 'save-pred') {
      var m2 = findMatch(el.getAttribute('data-id')); if (!m2) return;
      if (U.predHas(m2.id)) {
        U.predRemove(m2.id);
        UI.toast('Removed from saved', 'check');
      } else {
        U.predSave(m2, Predict.calc(m2));
        UI.toast('Prediction saved to profile', 'book');
      }
      render();
    }
    else if (a === 'copy-link') copyLink();
    else if (a === 'my-preds') go('favorites');
    else if (a === 'bell') {
      var n = Object.keys(API.live).length;
      UI.toast(n ? n + ' live match(es) right now' : 'No live matches right now', 'bell');
    }
    else if (a === 'signin') UI.toast('Auth is not available in this build', 'user');
    else if (a === 'soon') UI.toast('Coming soon', 'flame');
    else if (a === 'clear-cache') { U.store.clearPrefix('md:c:'); UI.toast('Cache cleared', 'check'); render(); }
  });

  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (!t || !t.getAttribute || t.getAttribute('data-setting') !== 'pollMs') return;
    U.setSettings({ pollMs: parseInt(t.value, 10) || 0 });
    startPoller();
    UI.toast('Refresh interval updated', 'check');
  });

  var qEl = document.getElementById('q');
  qEl.addEventListener('input', U.debounce(function () {
    state.q = qEl.value.trim();
    if (['home', 'matches', 'insights'].indexOf(state.route) >= 0) render();
  }, 250));

  window.addEventListener('hashchange', render);
  window.addEventListener('scroll', U.debounce(function () {
    scrollMem[state.route + (state.param || '')] = window.scrollY;
  }, 150), { passive: true });

  window.App = { state: state, findMatch: findMatch, go: go, render: render, rememberLeagues: rememberLeagues, leagueMeta: leagueMeta, isWebView: WEBVIEW };

  document.getElementById('logoIcon').innerHTML = UI.icon('pulse', 22);
  document.getElementById('searchIcon').innerHTML = UI.icon('search', 18);
  document.getElementById('bellIcon').innerHTML = UI.icon('bell', 20);
  API.pollLive().then(function () { updateBell(); document.getElementById('statusbar').innerHTML = UI.statusbar(); });
  startPoller();
  render();
})();