/* Icons + shared UI blocks (petrol & gold edition) */
(function () {
  var P = {
    pulse: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
    home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8z"/>',
    starF: '<path fill="currentColor" stroke="none" d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 3H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    arr: '<path d="M7 17L17 7M9 7h8v8"/>',
    chevL: '<path d="M14 6l-6 6 6 6"/>',
    chevR: '<path d="M10 6l6 6-6 6"/>',
    book: '<path d="M6 4h12v17l-6-4-6 4z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 8h.01"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
    flame: '<path d="M12 3s5 4.5 5 9a5 5 0 0 1-10 0c0-2 1-4 2.5-5.5C10.5 5.5 12 3 12 3z"/>',
    check: '<path d="M5 13l4 4L19 7"/>',
    link: '<path d="M10 14a4 4 0 0 0 6 .5l2-2a4 4 0 0 0-5.6-5.6l-1 1"/><path d="M14 10a4 4 0 0 0-6-.5l-2 2a4 4 0 0 0 5.6 5.6l1-1"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
  };
  function icon(name, size) {
    size = size || 20;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (P[name] || '') + '</svg>';
  }
  function toast(msg, ic) {
    var wrap = document.getElementById('toasts');
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = icon(ic || 'pulse', 18) + '<span>' + U.esc(msg) + '</span>';
    wrap.appendChild(el);
    setTimeout(function () { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; }, 2200);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2600);
  }
  function badge(team, cls) {
    var img = team.badge ? '<img src="' + U.esc(team.badge) + '" alt="" loading="lazy" onerror="this.parentNode.classList.add(\'nofm\')">' : '';
    return '<span class="badge ' + (cls || '') + (team.badge ? '' : ' nofm') + '">' + img +
      '<span class="fb">' + U.esc(U.initials(team.name)) + '</span></span>';
  }
  function statusPill(m) {
    if (m.status === 'LIVE') return '<span class="pill live"><i></i>' + U.esc(m.minute || 'LIVE') + '</span>';
    if (m.status === 'FT') return '<span class="pill ft">FT</span>';
    return '';
  }
  function formDots(arr) {
    return '<span class="fdots">' + arr.map(function (x) { return '<i class="fdot ' + x + '"></i>'; }).join('') + '</span>';
  }
  /* forms come ONLY from local cache — zero extra requests */
  function cachedForms(m) {
    if (!m.tids || !m.tids.h || !m.tids.a) return null;
    var h = U.cacheGet('form:' + m.tids.h, CONFIG.cacheTTL.form);
    var a = U.cacheGet('form:' + m.tids.a, CONFIG.cacheTTL.form);
    return (h && a) ? { h: h, a: a } : null;
  }
  function matchRow(m) {
    var fav = U.favHas(m.id);
    var sc = function (v, ft) { return v != null ? '<span class="sc' + (ft ? ' ft' : '') + '">' + v + '</span>' : ''; };
    var f = cachedForms(m);
    return '<div class="match" data-action="open" data-id="' + U.esc(m.id) + '"><div class="m-grid">' +
      '<div class="m-time"><div class="t">' + U.fmtTime(m.ts) + '</div><div class="lg">' + U.esc(m.league) + '</div></div>' +
      '<div class="m-teams">' +
      '<div class="m-row">' + badge(m.home) + '<span class="nm">' + U.esc(m.home.name) + '</span>' + sc(m.sh, m.status === 'FT') + '</div>' +
      '<div class="m-row">' + badge(m.away) + '<span class="nm">' + U.esc(m.away.name) + '</span>' + sc(m.sa, m.status === 'FT') + '</div>' +
      '</div><div class="m-side">' +
      '<button class="favbtn' + (fav ? ' on' : '') + '" data-action="fav" data-id="' + U.esc(m.id) + '" aria-label="Favorite">' + icon(fav ? 'starF' : 'star', 20) + '</button>' +
      statusPill(m) + '</div></div>' +
      (f ? '<div class="m-form"><span class="side">' + U.esc(U.abbr(m.home.name)) + ' ' + formDots(f.h) + '</span>' +
        '<span class="side">' + formDots(f.a) + ' ' + U.esc(U.abbr(m.away.name)) + '</span></div>' : '') +
      '</div>';
  }
  function chips(active) {
    return '<div class="chips">' + CONFIG.sports.map(function (s) {
      return '<button class="chip' + (s.id === active ? ' active' : '') + '" data-action="sport" data-sport="' + s.id + '">' + U.esc(s.label) + '</button>';
    }).join('') + '</div>';
  }
  function seg(active) {
    var opts = [['all', 'All'], ['live', 'Live'], ['upcoming', 'Soon'], ['finished', 'Done']];
    return '<span class="seg">' + opts.map(function (o) {
      return '<button class="' + (o[0] === active ? 'active' : '') + '" data-action="seg" data-seg="' + o[0] + '">' + o[1] + '</button>';
    }).join('') + '</span>';
  }
  function dateStrip(winStart, activeISO, sport) {
    var days = '';
    for (var i = 0; i < 7; i++) {
      var d = U.addDays(U.parseISO(winStart), i), iso = U.isoDate(d);
      var has = API.source === 'demo' ? true : U.cacheHas('ev:' + sport + ':' + iso);
      days += '<button class="day' + (iso === activeISO ? ' active' : '') + (has ? ' has' : '') + '" data-action="date" data-iso="' + iso + '">' +
        '<span class="dow">' + (iso === U.isoDate(U.today()) ? 'today' : U.DOW[d.getDay()]) + '</span>' +
        '<span class="num">' + d.getDate() + '</span><span class="dot"></span></button>';
    }
    return '<div class="calcard"><button class="calnav" data-action="cal-prev" aria-label="Previous week">' + icon('chevL', 18) + '</button>' +
      '<div class="calrow">' + days + '</div>' +
      '<button class="calnav" data-action="cal-next" aria-label="Next week">' + icon('chevR', 18) + '</button></div>';
  }
  function empty(ic, title, text) {
    return '<div class="empty"><div class="ei">' + icon(ic, 40) + '</div><b>' + U.esc(title) + '</b><span>' + U.esc(text) + '</span></div>';
  }
  var TABS = [
    { r: 'home', l: 'Home', i: 'home' }, { r: 'matches', l: 'Matches', i: 'cal' },
    { r: 'insights', l: 'Insights', i: 'target' }, { r: 'favorites', l: 'Saved', i: 'star' },
    { r: 'profile', l: 'Profile', i: 'user' }
  ];
  function tabbar(active) {
    return '<div class="tbin">' + TABS.map(function (t) {
      return '<button class="tab' + (t.r === active ? ' active' : '') + '" data-action="tab" data-route="' + t.r + '">' + icon(t.i, 22) + '<span>' + t.l + '</span></button>';
    }).join('') + '</div>';
  }
  function statusbar() {
    var demo = API.source === 'demo';
    return '<div class="sb-l"><span class="sdot' + (demo ? ' off' : '') + '"></span><span>' +
      (demo ? 'Offline · sample data' : 'Live data · TheSportsDB') + '</span></div>' +
      '<span class="sb-r">' + API.calls + ' API request' + (API.calls === 1 ? '' : 's') + ' this session</span>';
  }
  function formChips(arr) {
    return '<span class="chips5">' + arr.map(function (x) { return '<span class="fchip ' + x + '">' + x + '</span>'; }).join('') + '</span>';
  }
  function cdSpan(ts) { return '<span class="cd" data-cd="' + ts + '">' + U.countdownText(ts) + '</span>'; }
  window.UI = {
    icon: icon, toast: toast, badge: badge, statusPill: statusPill, matchRow: matchRow,
    chips: chips, seg: seg, dateStrip: dateStrip, empty: empty, tabbar: tabbar,
    statusbar: statusbar, formChips: formChips, cdSpan: cdSpan, formDots: formDots
  };
})();