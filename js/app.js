/* Router, global events, live poller, countdown ticker */
(function () {
  var state = {
    route: 'home', param: null, sport: 'all', seg: 'all',
    dateISO: U.isoDate(U.today()),
    winStart: U.isoDate(U.addDays(U.today(), -3)),
    q: ''
  };
  var scrollMem = {}, pollTimer = null;

  function parseHash() {
    var h = (location.hash || '#/home').replace(/^#\/?/, '');
    var p = h.split('/');
    if (p[0] === 'match' && p[1]) { state.route = 'match'; state.param = p[1]; }
    else if (['home', 'matches', 'insights', 'favorites', 'profile'].indexOf(p[0]) >= 0) { state.route = p[0]; state.param = null; }
    else { state.route = 'home'; state.param = null; }
  }
  function tabForRoute() { return state.route === 'match' ? 'insights' : state.route; }
  function go(route) { location.hash = '#/' + route; }
  function findMatch(id) { return API.index[id] || U.favAll()[id] || null; }

  function render() {
    parseHash();
    document.getElementById('tabbar').innerHTML = UI.tabbar(tabForRoute());
    document.getElementById('statusbar').innerHTML = UI.statusbar();
    var fn = { home: Pages.home, matches: Pages.matches, insights: Pages.insights, favorites: Pages.favorites, profile: Pages.profile, match: Pages.matchDetail }[state.route];
    var arg = state.route === 'match' ? state.param : undefined;
    Promise.resolve(fn(arg)).then(function (html) {
      document.getElementById('app').innerHTML = html;
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
    if (!ms) return;
    pollTimer = setInterval(function () {
      if (document.hidden) return;
      if (['home', 'matches', 'insights', 'match'].indexOf(state.route) < 0) return;
      if (!document.querySelector('.pill.live')) return;   // poll ONLY when a live match is on screen
      API.pollLive().then(function () { updateBell(); render(); });
    }, Math.max(ms, 30000));
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
    else if (a === 'sport') { state.sport = el.getAttribute('data-sport'); render(); }
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
      U.predSave(m2, Predict.calc(m2));
      UI.toast('Prediction saved to profile', 'book');
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

  window.App = { state: state, findMatch: findMatch, go: go, render: render };

  document.getElementById('logoIcon').innerHTML = UI.icon('pulse', 22);
  document.getElementById('searchIcon').innerHTML = UI.icon('search', 18);
  document.getElementById('bellIcon').innerHTML = UI.icon('bell', 20);
  API.pollLive().then(function () { updateBell(); document.getElementById('statusbar').innerHTML = UI.statusbar(); });
  startPoller();
  render();
})();