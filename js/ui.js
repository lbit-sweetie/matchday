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
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    table: '<path d="M4 5h16v14H4z"/><path d="M4 10h16M4 14.5h16M9 10v9M15 10v9"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5"/><circle cx="17" cy="9" r="2.6"/><path d="M16 15.2c2.6.3 4.6 1.7 5.5 4.8"/>',
    ball: '<circle cx="12" cy="12" r="9"/><path d="M12 7l3 2.2-1.2 3.6h-3.6L9 9.2z"/><path d="M12 3v4M5 10l3.5 1M19 10l-3.5 1M7.5 18.5L10 15M16.5 18.5L14 15"/>',
    basket: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6c2.8 3.4 2.8 9.4 0 12.8M18.4 5.6c-2.8 3.4-2.8 9.4 0 12.8"/>',
    tennis: '<circle cx="12" cy="12" r="9"/><path d="M6.5 3.5c2.8 4 2.8 13 0 17M17.5 3.5c-2.8 4-2.8 13 0 17"/>',
    hockey: '<path d="M5 21L13.5 3.5M13.5 3.5H17M13.5 3.5L11.5 8.5"/><circle cx="17.5" cy="18" r="2.4"/>'
  };
  function sportIcon(sport, size) {
    var map = { Soccer: 'ball', Basketball: 'basket', Tennis: 'tennis', Hockey: 'hockey' };
    return icon(map[sport] || 'pulse', size || 14);
  }
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
    var sc = function (v) {
      if (v == null) return '';
      var cls = m.status === 'LIVE' ? 'sc live' : (m.status === 'FT' ? 'sc ft' : 'sc');
      return '<span class="' + cls + '">' + v + '</span>';
    };
    var f = cachedForms(m);
    var timeTop = m.status === 'LIVE' && m.minute
      ? '<div class="t live-t">' + U.esc(m.minute) + '</div><div class="lg">' + U.esc(m.league) + '</div>'
      : '<div class="t">' + U.fmtTime(m.ts) + '</div><div class="lg">' + U.esc(m.league) + '</div>';
    return '<div class="match' + (m.status === 'LIVE' ? ' is-live' : '') + '" data-action="open" data-id="' + U.esc(m.id) + '" data-sport="' + U.esc(m.sport || '') + '"><div class="m-grid">' +
      '<div class="m-time">' + timeTop + '</div>' +
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
  /* Unique leagues from an already-loaded list — 0 API requests.
     Key is the numeric id when present, else a stable name key (old cache). */
  function leagueKey(m) { return m.lid || ('nm:' + (m.league || 'Other')); }
  function leaguesFromList(list) {
    var map = {};
    list.forEach(function (m) {
      var k = leagueKey(m);
      if (!map[k]) map[k] = { key: k, num: (/^\d+$/.test(String(m.lid || '')) ? m.lid : null), name: m.league || 'Other', season: m.season || null, count: 0, sport: m.sport };
      map[k].count++;
      if (!map[k].season && m.season) map[k].season = m.season;
      if (!map[k].num && /^\d+$/.test(String(m.lid || ''))) map[k].num = m.lid;
    });
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return b.count - a.count; }).slice(0, 12);
  }
  /* League filter row: filters locally + opens the league hub (table/scorers). */
  function leagueChips(list, activeKey) {
    var leagues = leaguesFromList(list);
    if (!leagues.length) return '';
    var btns = ['<button class="chip lchip' + (!activeKey ? ' active' : '') + '" data-action="league" data-lid="">All leagues</button>'];
    leagues.forEach(function (l) {
      btns.push('<button class="chip lchip' + (activeKey && activeKey === l.key ? ' active' : '') + '" data-action="league" data-lid="' + U.esc(l.key) + '" data-num="' + U.esc(l.num || '') + '" data-name="' + U.esc(l.name) + '" data-season="' + U.esc(l.season || '') + '" title="' + U.esc(l.name) + ' · ' + l.count + '">' +
        U.esc(l.name.length > 18 ? l.name.slice(0, 17) + '…' : l.name) + '</button>');
    });
    return '<div class="lbar"><div class="chips lchips">' + btns.join('') + '</div>' +
      (activeKey ? '<button class="btn btn-ghost league-open" data-action="open-league" data-lid="' + U.esc(activeKey) + '">' + icon('table', 16) + 'Table & scorers</button>' : '') + '</div>';
  }
  function tableHtml(rows, demo) {
    if (!rows || !rows.length) return empty('table', 'No standings yet', 'The free feed publishes tables for featured leagues only.');
    var out = rows.slice(0, 12).map(function (r, i) {
      var cls = i < 3 ? ' tp' : '';
      var badge = r.strBadge ? '<img src="' + U.esc(r.strBadge) + '" alt="" loading="lazy">' : '<span class="fb">' + U.esc(U.initials(r.strTeam)) + '</span>';
      return '<div class="trow' + cls + '"><span class="rk">' + (r.intRank || (i + 1)) + '</span>' +
        '<span class="tbadge">' + badge + '</span>' +
        '<span class="tnm">' + U.esc(r.strTeam) + '</span>' +
        '<span class="tst">' + U.esc(r.intPlayed || '-') + '</span>' +
        '<span class="tst hide-s">+' + U.esc(r.intGoalDifference || '0') + '</span>' +
        '<b class="tpt">' + U.esc(r.intPoints || '0') + '</b></div>';
    }).join('');
    return '<div class="tbl"><div class="trow thead"><span class="rk">#</span><span class="tbadge"></span><span class="tnm">Team</span><span class="tst">P</span><span class="tst hide-s">GD</span><b class="tpt">Pts</b></div>' + out + '</div>' +
      (demo ? '<p class="tiny" style="margin-top:10px">Sample standings — offline mode.</p>' : '<p class="tiny" style="margin-top:10px">Standings cached 12 h to save traffic.</p>');
  }
  function xiList(arr) {
    if (!arr.length) return '<p class="tiny">Not published.</p>';
    return '<ul class="xi">' + arr.map(function (p) {
      return '<li><span class="xnum">' + U.esc(p.num || '–') + '</span>' +
        '<span class="xnm">' + U.esc(p.name) + '</span>' +
        '<span class="xpos">' + U.esc(p.pos) + '</span></li>';
    }).join('') + '</ul>';
  }
  function lineupHtml(split, m) {
    function col(title, badge, arr, subs) {
      return '<div class="xi-col"><div class="xi-head">' + badge + '<b>' + U.esc(title) + '</b></div>' + xiList(arr) +
        (subs && subs.length ? '<details class="subs"><summary>Substitutes (' + subs.length + ')</summary>' + xiList(subs) + '</details>' : '') + '</div>';
    }
    return '<div class="xi-grid">' +
      col(m.home.name, badge(m.home, 'mid'), split.h, split.hSub) +
      col(m.away.name, badge(m.away, 'mid'), split.a, split.aSub) + '</div>';
  }
  function squadHtml(players, cap) {
    var rows = (players || []).slice(0, cap || 14);
    if (!rows.length) return '';
    return '<ul class="xi">' + rows.map(function (p) {
      return '<li><span class="xnum">' + U.esc(p.strNumber || '–') + '</span>' +
        '<span class="xnm">' + U.esc(p.strPlayer) + '</span>' +
        '<span class="xpos">' + U.esc((p.strPosition || '').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 3)) + '</span></li>';
    }).join('') + '</ul>';
  }
  function scorersHtml(agg) {
    if (!agg.rows.length) return empty('ball', 'No scorer data yet', agg.cached ? 'Loaded matches had no goal events.' : 'Tap “Load scorers” to fetch a few recent goal timelines.');
    return '<ol class="scor">' + agg.rows.map(function (s, i) {
      return '<li class="srow"><span class="rk">' + (i + 1) + '</span>' +
        '<span class="snm">' + U.esc(s.name) + '<span class="stm">' + U.esc(s.team) + '</span></span>' +
        '<b class="sgl">' + s.goals + '</b></li>';
    }).join('') + '</ol>' +
      '<p class="tiny" style="margin-top:10px">Based on ' + agg.cached + ' of ' + agg.total + ' loaded matches · timelines cached 24 h.</p>';
  }
  function skeleton(n) {
    var s = '';
    for (var i = 0; i < (n || 3); i++) s += '<div class="skel"><i></i><i></i><i></i></div>';
    return '<div aria-hidden="true">' + s + '</div>';
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
  function formChips(arr) {
    return '<span class="chips5">' + arr.map(function (x) { return '<span class="fchip ' + x + '">' + x + '</span>'; }).join('') + '</span>';
  }
  function cdSpan(ts) { return '<span class="cd" data-cd="' + ts + '">' + U.countdownText(ts) + '</span>'; }
  window.UI = {
    icon: icon, toast: toast, badge: badge, statusPill: statusPill, matchRow: matchRow,
    chips: chips, seg: seg, dateStrip: dateStrip, empty: empty, tabbar: tabbar,
    formChips: formChips, cdSpan: cdSpan, formDots: formDots,
    leaguesFromList: leaguesFromList, leagueChips: leagueChips, tableHtml: tableHtml,
    lineupHtml: lineupHtml, squadHtml: squadHtml, scorersHtml: scorersHtml, skeleton: skeleton,
    sportIcon: sportIcon
  };
})();