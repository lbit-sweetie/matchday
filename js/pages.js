/* Page renderers · unique copy · petrol & gold edition */
(function () {
  function byTs(a, b) { return a.ts - b.ts; }
  function viewed(list) { return list.map(API.viewMatch); }
  function filterList(list, q) {
    if (!q) return list;
    q = q.toLowerCase();
    return list.filter(function (m) { return (m.home.name + ' ' + m.away.name + ' ' + m.league).toLowerCase().indexOf(q) >= 0; });
  }
  /* League filter — pure local filtering, 0 API requests. */
  function leagueKey(m) { return m.lid || ('nm:' + (m.league || 'Other')); }
  function leagueFilter(list, key) {
    if (!key) return list;
    return list.filter(function (m) { return leagueKey(m) === key; });
  }
  function segFilter(list, seg) {
    if (seg === 'live') return list.filter(function (m) { return m.status === 'LIVE'; });
    if (seg === 'upcoming') return list.filter(function (m) { return m.status === 'NS'; });
    if (seg === 'finished') return list.filter(function (m) { return m.status === 'FT'; });
    return list;
  }
  function pickFeatured(v) {
    if (!v.length) return null;
    function sc(m) { return (m.status === 'LIVE' ? 100 : m.status === 'NS' ? 50 : 0) + (m.sport === 'Soccer' ? 10 : 0); }
    return v.slice().sort(function (a, b) { return sc(b) - sc(a); })[0];
  }
  function winText(o, m) { return o.label === 'Draw' ? 'Draw' : (o.label === m.home.name ? 'Home win' : 'Away win'); }

  function home() {
    var st = App.state;
    return API.getEvents(st.dateISO, st.sport).then(function (list) {
      var v = viewed(list).sort(byTs);
      App.rememberLeagues(v);
      var f = pickFeatured(leagueFilter(v, st.league));
      var rows = leagueFilter(filterList(v, st.q), st.league);
      var mid = f ? (f.status === 'NS'
        ? '<div class="t">' + U.fmtTime(f.ts) + '</div><div class="d">Kick-off in ' + UI.cdSpan(f.ts) + '</div>'
        : '<div class="t">' + (f.sh != null ? f.sh + ':' + f.sa : U.fmtTime(f.ts)) + '</div><div class="d">' + U.fmtDayMonth(f.ts) + (f.status === 'LIVE' ? ' · <span class="live-txt">live now</span>' : ' · finished') + '</div>') : '';
      return '<section class="hero"><span class="wm">MD</span>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span class="eyebrow">' + UI.icon('flame', 14) + 'Matchday intelligence</span>' +
        (f ? '<span class="tiny">' + U.esc(f.league) + '</span>' : '') + '</div>' +
        '<h1>Read the game.<br><span class="accent">Before it happens.</span></h1>' +
        '<p>Fixtures, live scores and model probabilities for football, basketball, tennis and hockey — in one clean feed.</p>' +
        (f ? '<div style="margin-top:18px"><button class="btn btn-primary" data-action="open" data-id="' + U.esc(f.id) + '">Open match center ' + UI.icon('arr', 16) + '</button></div>' +
          '<div class="hero-match">' +
          '<div class="hm-team">' + UI.badge(f.home) + '<span>' + U.esc(f.home.name) + '</span></div>' +
          '<div class="hm-mid">' + mid + '</div>' +
          '<div class="hm-team right">' + UI.badge(f.away) + '<span>' + U.esc(f.away.name) + '</span></div>' +
          '</div>' : '') +
        '</section>' +
        UI.chips(st.sport) +
        UI.leagueChips(v, st.league) +
        '<div class="section-head"><h2>Today & beyond</h2><button class="link" data-action="tab" data-route="matches">Full calendar ' + UI.icon('arr', 14) + '</button></div>' +
        UI.dateStrip(st.winStart, st.dateISO, st.sport) +
        (rows.length ? '<div class="matchlist">' + rows.slice(0, 6).map(UI.matchRow).join('') + '</div>'
          : UI.empty('cal', 'Nothing here yet', 'Try another date, sport or search query.'));
    });
  }

  function matches() {
    var st = App.state;
    return API.getEvents(st.dateISO, st.sport).then(function (list) {
      var v = viewed(list).sort(byTs);
      App.rememberLeagues(v);
      var rows = segFilter(leagueFilter(filterList(v, st.q), st.league), st.seg);
      return '<div class="page-head"><span class="eyebrow">' + UI.icon('cal', 14) + 'Schedule</span>' +
        '<div class="head-row"><h1>' + U.esc(U.relDay(st.dateISO)) + '</h1>' + UI.seg(st.seg) + '</div>' +
        '<div class="sub">' + U.esc(U.fmtLong(U.parseISO(st.dateISO))) + ' · ' + rows.length + ' event' + (rows.length === 1 ? '' : 's') + '</div></div>' +
        UI.chips(st.sport) + UI.leagueChips(v, st.league) + UI.dateStrip(st.winStart, st.dateISO, st.sport) +
        (rows.length ? '<div class="matchlist">' + rows.map(UI.matchRow).join('') + '</div>'
          : UI.empty('cal', 'No matches in this view', 'Switch the filter, the day or the sport.'));
    });
  }

  function insightCard(m) {
    var p = Predict.calc(m);
    return '<div class="icard" data-action="open" data-id="' + U.esc(m.id) + '">' +
      '<div class="ic-head"><span class="eyebrow">' + UI.icon('pulse', 14) + 'Model card</span>' + UI.icon('arr', 18) + '</div>' +
      '<div class="ic-meta"><span class="ic-teams">' + UI.badge(m.home) + UI.badge(m.away) + '</span>' +
      '<span class="ic-league">' + U.esc(m.league) + ' · ' + U.fmtTime(m.ts) + '</span></div>' +
      '<h3>' + U.esc(m.home.name) + ' — ' + U.esc(m.away.name) + '</h3>' +
      '<div class="prob-row"><span class="lb">' + U.esc(winText(p.top, m)) + '</span><span class="vl">' + p.top.pct + '%</span></div>' +
      '<div class="bar"><i style="width:' + p.top.pct + '%"></i></div>' +
      '<div class="ic-foot">' + (p.demo ? 'Demo model estimate' : 'Market-implied estimate') + '</div></div>';
  }

  function insights() {
    var st = App.state;
    return API.getEvents(U.isoDate(U.today()), st.sport).then(function (list) {
      var up = filterList(viewed(list).filter(function (m) { return m.status !== 'FT'; }).sort(byTs), st.q);
      return '<div class="page-head"><div class="head-row"><div>' +
        '<span class="eyebrow">' + UI.icon('target', 14) + 'Model room</span>' +
        '<h1>Probabilities, explained</h1>' +
        '<div class="sub">Market-implied chances, team form and match context — updated with the fixtures.</div></div>' +
        '<button class="btn btn-ghost" data-action="my-preds">' + UI.icon('book', 16) + 'My predictions</button></div></div>' +
        UI.chips(st.sport) +
        '<div class="card"><div class="note"><div class="nic">' + UI.icon('pulse', 22) + '</div><div>' +
        '<h3>How to read these numbers</h3><p>Every percentage is an implied probability: market odds inverted and de-margined. It is an estimate of chance, not a promise of result.</p>' +
        '</div></div></div>' +
        (up.length ? up.map(insightCard).join('') : UI.empty('target', 'No upcoming matches', 'Switch sport or check back later today.'));
    });
  }

  /* Match detail: form (cached) + lineup (1 lazy req, cached 24h).
     Squads load only via explicit button (2 reqs max, cached 7 days). */
  function matchDetail(id) {
    var cached = App.findMatch(id);
    var base = cached ? Promise.resolve(cached) : API.lookupEvent(id).catch(function () { return null; });
    return base.then(function (found) {
      if (!found) return '<button class="back" data-action="back">' + UI.icon('chevL', 16) + 'Back</button>' +
        UI.empty('search', 'Match not found', 'Open it from any list once more, please.');
      var m = API.viewMatch(found);
      App.rememberLeagues([m]);
      var p = Predict.calc(m);
      var lineupP = m.demo ? Promise.resolve(Demo.lineup(m)) : API.getLineup(m.id);
      return Promise.all([API.getForm(m), lineupP]).then(function (r) {
        var form = r[0], rawLin = r[1];
        var split = rawLin ? API.splitLineup(rawLin) : (m.demo ? API.splitLineup(rawLin) : null);
        var saved = U.predHas(m.id);
        var leagueBtn = (m.lid || m.league)
          ? '<button class="btn btn-ghost" data-action="open-league" data-lid="' + U.esc(m.lid || ('nm:' + m.league)) + '" data-num="' + U.esc(/^\d+$/.test(String(m.lid || '')) ? m.lid : '') + '" data-name="' + U.esc(m.league) + '" data-season="' + U.esc(m.season || '') + '">' + UI.icon('table', 18) + 'League hub</button>' : '';
        var lineupCard;
        if (split && (split.h.length || split.a.length)) {
          lineupCard = '<div class="card"><div class="ic-head"><span class="eyebrow">' + UI.icon('users', 14) + 'Lineups</span>' +
            '<span class="tiny">Starting XI</span></div><div style="margin-top:14px">' + UI.lineupHtml(split, m) + '</div></div>';
        } else if (m.tids && (m.tids.h || m.tids.a)) {
          var sq = App.state.squads && App.state.squads[m.id];
          lineupCard = '<div class="card"><div class="ic-head"><span class="eyebrow">' + UI.icon('users', 14) + 'Players</span>' +
            '<span class="tiny">Lineup not published yet</span></div>' +
            (sq ? '<div class="xi-grid"><div class="xi-col"><div class="xi-head">' + UI.badge(m.home, 'mid') + '<b>' + U.esc(m.home.name) + '</b></div>' + UI.squadHtml(sq.h) + '</div>' +
              '<div class="xi-col"><div class="xi-head">' + UI.badge(m.away, 'mid') + '<b>' + U.esc(m.away.name) + '</b></div>' + UI.squadHtml(sq.a) + '</div></div>'
              : '<p class="tiny" style="margin:12px 0">Official lineups appear here about an hour before kick-off. Meanwhile you can view both squads.</p>' +
              '<button class="btn btn-ghost btn-wide" data-action="show-squad" data-id="' + U.esc(m.id) + '">' + UI.icon('users', 18) + 'Show team squads</button>') + '</div>';
        } else {
          lineupCard = '';
        }
        return '<button class="back" data-action="back">' + UI.icon('chevL', 16) + 'Back</button>' +
        '<div class="page-head"><span class="eyebrow">' + UI.sportIcon(m.sport) + U.esc(m.sport) + (m.league ? ' · ' + U.esc(m.league) : '') + '</span>' +
        '<h1>Match probability card</h1>' +
        '<div class="sub">' + U.esc(m.home.name) + ' — ' + U.esc(m.away.name) + ' · ' + U.fmtDayMonth(m.ts) + ', ' + U.fmtTime(m.ts) +
        (m.status === 'NS' ? ' · kick-off in ' + UI.cdSpan(m.ts) : '') + '</div></div>' +
        '<div class="card"><div class="ic-head"><span class="eyebrow">' + UI.icon('pulse', 14) + 'Outcome split</span>' +
        '<span class="tiny">' + (p.demo ? 'Offline sample data' : 'Live market data') + '</span></div>' +
        '<div class="vs">' + UI.badge(m.home, 'big') + '<span class="v">VS</span>' + UI.badge(m.away, 'big') + '</div>' +
        '<div class="bigprob"><div class="n">' + p.top.pct + '%</div><div class="c">' + U.esc(p.top.label === 'Draw' ? 'Draw' : p.top.label + ' to win') + '</div></div>' +
        p.outcomes.map(function (o) {
          return '<div class="o-row"><div class="o-top"><span>' + U.esc(o.label) + '</span><b>' + o.pct + '%</b></div>' +
            '<div class="bar"><i class="' + o.cls + '" style="width:' + o.pct + '%"></i></div></div>';
        }).join('') +
        '<div class="margin"><span>Bookmaker margin (removed)</span><b>' + p.margin + '%</b></div>' +
        '<div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">' +
        '<button class="btn ' + (saved ? 'btn-ghost is-saved' : 'btn-primary') + '" style="flex:1;min-width:180px" data-action="save-pred" data-id="' + U.esc(m.id) + '">' +
        UI.icon(saved ? 'check' : 'book', 18) + (saved ? 'Saved · tap to remove' : 'Save prediction') + '</button>' +
        '<button class="btn btn-ghost" data-action="copy-link" aria-label="Copy link">' + UI.icon('link', 18) + '</button>' + leagueBtn + '</div></div>' +
        lineupCard +
        '<div class="card"><span class="eyebrow">' + UI.icon('info', 14) + 'Inside the model</span>' +
        '<div class="note" style="margin-top:14px"><div><h3>Three steps to a fair chance</h3></div></div>' +
        '<ol class="steps"><li>Take the market odd K for each outcome.</li>' +
        '<li>Invert it: 1 / K is the raw implied chance, margin included.</li>' +
        '<li>Normalize across outcomes so the total equals exactly 100%.</li></ol>' +
        '<div class="formula">p(i) = (1 / K(i)) / &#931; (1 / K)</div>' +
        '<p class="tiny" style="margin-top:12px">Normalization strips the margin. Injuries, line-ups and table position are not modelled separately. Estimates never guarantee results.</p></div>' +
        '<div class="card"><div class="note"><div class="nic">' + UI.icon('trophy', 22) + '</div><div>' +
        '<h3>Form guide</h3><p>Last five matches · newest first</p></div></div>' +
        '<div class="form-row">' + UI.badge(m.home, 'mid') + '<span class="nm">' + U.esc(m.home.name) + '</span>' + UI.formChips(form.h) + '</div>' +
        '<div class="form-row">' + UI.badge(m.away, 'mid') + '<span class="nm">' + U.esc(m.away.name) + '</span>' + UI.formChips(form.a) + '</div></div>';
      });
    });
  }

  /* League hub: standings (1 req / 12h) + local fixtures (0 req) +
     scorers from cache (0 req, user-initiated load of ≤5 timelines). */
  function leagueDetail() {
    var meta = App.leagueMeta() || {};
    var key = meta.key || meta.lid || '', name = meta.name || 'League', season = meta.season || null;
    var num = meta.num || (/^\d+$/.test(String(key)) ? key : null);
    if (!key) return Promise.resolve('<button class="back" data-action="back">' + UI.icon('chevL', 16) + 'Back</button>' +
      UI.empty('table', 'Pick a league first', 'Use the league chips on Matches or Home.'));
    var inIndex = Object.keys(API.index).map(function (k) { return API.index[k]; })
      .filter(function (m) { return (m.lid || ('nm:' + (m.league || 'Other'))) === key || m.league === name; });
    var tableP = (!num || String(key).indexOf('dm-') === 0)
      ? Promise.resolve({ rows: String(key).indexOf('dm-') === 0 ? Demo.table(name) : null, demo: String(key).indexOf('dm-') === 0 }) :
      API.getTable(num, season).then(function (t) { return { rows: t, demo: false }; });
    return tableP.then(function (t) {
      var agg = API.scorersFromCache(inIndex.filter(function (m) { return m.status === 'FT'; }));
      var fixtures = inIndex.slice().sort(byTs).slice(0, 8);
      return '<button class="back" data-action="back">' + UI.icon('chevL', 16) + 'Back</button>' +
        '<div class="page-head"><span class="eyebrow">' + UI.icon('table', 14) + 'League hub</span>' +
        '<h1>' + U.esc(name) + '</h1>' +
        '<div class="sub">' + (season ? U.esc(season) + ' · ' : '') + inIndex.length + ' loaded matches · standings cached 12 h</div></div>' +
        '<div class="card"><div class="ic-head"><span class="eyebrow">' + UI.icon('trophy', 14) + 'Standings</span>' +
        '<span class="tiny">' + (t.rows ? 'Top 12' : 'Unavailable') + '</span></div>' +
        '<div style="margin-top:14px">' + (t.rows ? UI.tableHtml(t.rows, t.demo) : UI.empty('table', 'No standings in free feed', 'This league has no published table. Fixtures below still work.')) + '</div></div>' +
        '<div class="section-head"><h2>Matches</h2><button class="link" data-action="tab" data-route="matches">All matches ' + UI.icon('arr', 14) + '</button></div>' +
        (fixtures.length ? '<div class="matchlist">' + fixtures.map(API.viewMatch).map(UI.matchRow).join('') + '</div>'
          : UI.empty('cal', 'No loaded matches', 'Open Matches first — fixtures appear here with zero extra requests.')) +
        '<div class="section-head"><h2>Scorers</h2>' +
        (agg.cached < Math.min(agg.total, CONFIG.scorersSample) && agg.total
          ? '<button class="link" data-action="load-scorers">Load scorers ' + UI.icon('arr', 14) + '</button>' : '') + '</div>' +
        '<div class="card">' + UI.scorersHtml(agg) + '</div>';
    });
  }

  function favorites() {
    var favs = Object.keys(U.favAll()).map(function (k) { return U.favAll()[k]; });
    var preds = Object.keys(U.predAll()).map(function (k) { return U.predAll()[k]; });
    var favHtml = favs.length
      ? '<div class="matchlist">' + viewed(favs).sort(byTs).map(UI.matchRow).join('') + '</div>'
      : UI.empty('star', 'No saved matches yet', 'Tap the star on any match card to keep it here.');
    var predHtml = preds.length
      ? preds.sort(function (a, b) { return b.savedAt - a.savedAt; }).map(function (p) {
          return '<div class="icard" data-action="open" data-id="' + U.esc(p.match.id) + '">' +
            '<div class="ic-head"><span class="eyebrow">' + UI.icon('book', 14) + 'Saved prediction</span>' +
            '<span class="ic-league">' + U.fmtDayMonth(p.savedAt) + '</span></div>' +
            '<h3>' + U.esc(p.match.home.name) + ' — ' + U.esc(p.match.away.name) + '</h3>' +
            '<div class="prob-row"><span class="lb">' + U.esc(p.topLabel) + '</span><span class="vl">' + p.topProb + '%</span></div>' +
            '<div class="bar"><i style="width:' + p.topProb + '%"></i></div></div>';
        }).join('')
      : UI.empty('book', 'No saved predictions', 'Open a model card and press "Save prediction".');
    return Promise.resolve(
      '<div class="page-head"><span class="eyebrow">' + UI.icon('star', 14) + 'Locker room</span>' +
      '<h1>Your saves</h1><div class="sub">Matches and predictions you keep — stored locally on this device.</div></div>' +
      '<div class="section-head"><h2>Saved matches</h2></div>' + favHtml +
      '<div class="section-head"><h2>Saved predictions</h2></div>' + predHtml);
  }

  function profile() {
    var favs = U.favAll(), preds = U.predAll();
    var fn = Object.keys(favs).length, pn = Object.keys(preds).length;
    var leagues = {}; Object.keys(favs).forEach(function (k) { leagues[favs[k].league] = 1; });
    var ln = Object.keys(leagues).length;
    var s = U.settings();
    var two = function (n) { return n < 10 ? '0' + n : '' + n; };
    return Promise.resolve(
      '<div class="page-head"><span class="eyebrow">' + UI.icon('user', 14) + 'Member zone</span>' +
      '<h1>My MATCHDAY</h1><div class="sub">Your follows, saves and app settings in one place.</div></div>' +
      '<div class="p-hero"><div class="p-top"><div class="avatar">' + UI.icon('user', 30) + '<span class="ok">' + UI.icon('check', 12) + '</span></div>' +
      '<div><span class="eyebrow">Matchday member</span><h2>Sports fan</h2><div class="tag">Following the game since day one</div></div></div>' +
      '<div style="margin-top:16px"><button class="btn btn-ghost btn-wide" data-action="signin">Sign in ' + UI.icon('arr', 16) + '</button></div></div>' +
      '<div class="stats">' +
      '<div class="stat">' + UI.icon('star', 22) + '<div class="n">' + two(fn) + '</div><div class="l">Matches in favorites</div></div>' +
      '<div class="stat">' + UI.icon('target', 22) + '<div class="n">' + two(pn) + '</div><div class="l">Saved predictions</div></div>' +
      '<div class="stat">' + UI.icon('trophy', 22) + '<div class="n">' + two(ln) + '</div><div class="l">Leagues followed</div></div>' +
      '</div>' +
      '<div class="menu">' +
      '<button class="mitem" data-action="tab" data-route="favorites"><span class="mic">' + UI.icon('star', 20) + '</span><span class="tt"><b>My favorites</b><span>Saved matches and predictions</span></span><span class="ch">' + UI.icon('chevR', 18) + '</span></button>' +
      '<button class="mitem" data-action="soon"><span class="mic">' + UI.icon('trophy', 20) + '</span><span class="tt"><b>My tournaments</b><span>Competitions you follow</span></span><span class="ch">' + UI.icon('chevR', 18) + '</span></button>' +
      '<button class="mitem" data-action="soon"><span class="mic">' + UI.icon('bell', 20) + '</span><span class="tt"><b>Reminders</b><span>Upcoming events and notifications</span></span><span class="ch">' + UI.icon('chevR', 18) + '</span></button>' +
      '</div>' +
      '<div class="card"><div class="setrow"><span class="lb">Live score refresh</span>' +
      '<select class="sel" data-setting="pollMs">' +
      '<option value="0"' + (s.pollMs === 0 ? ' selected' : '') + '>Off</option>' +
      '<option value="60000"' + (s.pollMs === 60000 ? ' selected' : '') + '>Every minute</option>' +
      '<option value="120000"' + (s.pollMs === 120000 ? ' selected' : '') + '>Every 2 minutes</option>' +
      '<option value="300000"' + (s.pollMs === 300000 ? ' selected' : '') + '>Every 5 minutes</option></select></div>' +
      '<div style="margin-top:14px"><button class="btn btn-ghost btn-wide" data-action="clear-cache">Clear local cache</button></div>' +
      '<p class="tiny" style="margin-top:12px;text-align:center">MATCHDAY · static build · data by TheSportsDB</p></div>');
  }

  window.Pages = { home: home, matches: matches, insights: insights, matchDetail: matchDetail, leagueDetail: leagueDetail, favorites: favorites, profile: profile };
})();