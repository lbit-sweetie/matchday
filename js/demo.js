/* Offline/demo dataset. Used when the API is unavailable or Demo mode is on.
   Deterministic per date, so the calendar always looks alive. */
(function () {
  var TEAMS = {
    Soccer: ['Manchester City', 'Arsenal', 'Liverpool', 'Chelsea', 'Real Madrid', 'Barcelona', 'Bayern Munich', 'Borussia Dortmund', 'Inter Milan', 'Juventus', 'Paris SG', 'Manchester United'],
    Basketball: ['Los Angeles Lakers', 'Boston Celtics', 'Golden State Warriors', 'Milwaukee Bucks', 'Denver Nuggets', 'Miami Heat', 'Phoenix Suns', 'New York Knicks'],
    Tennis: ['C. Alcaraz', 'N. Djokovic', 'J. Sinner', 'D. Medvedev', 'A. Zverev', 'H. Hurkacz'],
    Hockey: ['Boston Bruins', 'New York Rangers', 'Toronto Maple Leafs', 'Edmonton Oilers', 'Colorado Avalanche', 'Tampa Bay Lightning']
  };
  var LEAGUES = {
    Soccer: ['Premier League', 'La Liga', 'Serie A', 'Champions League'],
    Basketball: ['NBA', 'EuroLeague'],
    Tennis: ['ATP Tour', 'Grand Slam'],
    Hockey: ['NHL']
  };
  var COUNT = { Soccer: 3, Basketball: 2, Tennis: 2, Hockey: 2 };

  function score(r, sport, live) {
    function g(a, b) { return a + Math.floor(r() * (b - a + 1)); }
    if (sport === 'Soccer') return [g(0, 3), g(0, 3)];
    if (sport === 'Basketball') return [g(95, 125), g(95, 125)];
    if (sport === 'Tennis') return [g(0, 3), g(0, 3)];
    return [g(1, 6), g(1, 6)];
  }

  function eventsFor(dateISO, sport) {
    var r = U.rng(U.hashStr(dateISO + '|' + sport));
    var pool = TEAMS[sport].slice();
    var out = [], n = COUNT[sport];
    var todayISO = U.isoDate(U.today());
    var cmp = dateISO === todayISO ? 0 : (U.parseISO(dateISO) < U.today() ? -1 : 1);
    var nowH = U.today().getHours();
    for (var i = 0; i < n && pool.length >= 2; i++) {
      var a = pool.splice(Math.floor(r() * pool.length), 1)[0];
      var b = pool.splice(Math.floor(r() * pool.length), 1)[0];
      var hour = 17 + ((i * 2 + Math.floor(r() * 2)) % 5);
      var min = [0, 15, 30, 45][Math.floor(r() * 4)];
      var ts = U.parseISO(dateISO).getTime();
      ts = new Date(U.parseISO(dateISO).getFullYear(), U.parseISO(dateISO).getMonth(), U.parseISO(dateISO).getDate(), hour, min).getTime();
      var status = 'NS', sh = null, sa = null, minute = '';
      if (cmp < 0) { status = 'FT'; var s1 = score(r, sport); sh = s1[0]; sa = s1[1]; }
      else if (cmp === 0) {
        if (i === 0) { status = 'LIVE'; var s2 = score(r, sport); sh = s2[0]; sa = s2[1]; minute = (20 + Math.floor(r() * 50)) + "'"; }
        else if (hour <= nowH) { status = 'FT'; var s3 = score(r, sport); sh = s3[0]; sa = s3[1]; }
      }
      out.push({
        id: 'dm-' + sport + '-' + dateISO + '-' + i,
        sport: sport,
        league: LEAGUES[sport][Math.floor(r() * LEAGUES[sport].length)],
        lid: null, season: null,
        ts: ts, status: status, minute: minute, sh: sh, sa: sa,
        home: { name: a, badge: '' }, away: { name: b, badge: '' },
        tids: null, demo: true
      });
    }
    /* stable demo league ids so the league filter works offline */
    out.forEach(function (m) {
      m.lid = 'dm-' + m.sport + '-' + m.league.replace(/[^A-Za-z0-9]+/g, '-').toLowerCase();
      m.season = '2025-2026';
    });
    return out;
  }

  function events(dateISO, sport) {
    if (sport !== 'all') return eventsFor(dateISO, sport);
    var out = [];
    ['Soccer', 'Basketball', 'Tennis', 'Hockey'].forEach(function (s) { out = out.concat(eventsFor(dateISO, s)); });
    return out.sort(function (x, y) { return x.ts - y.ts; });
  }

  function form(name, allowDraw) {
    var r = U.rng(U.hashStr(name + '|form'));
    var out = [];
    for (var i = 0; i < 5; i++) {
      var x = r();
      if (allowDraw) out.push(x < .45 ? 'W' : x < .7 ? 'D' : 'L');
      else out.push(x < .55 ? 'W' : 'L');
    }
    return out;
  }

  function live() {
    var map = {}, t = U.isoDate(U.today());
    ['Soccer', 'Basketball', 'Tennis', 'Hockey'].forEach(function (s) {
      eventsFor(t, s).forEach(function (m) {
        if (m.status === 'LIVE') map[m.id] = { sh: m.sh, sa: m.sa, minute: m.minute, status: 'LIVE' };
      });
    });
    return map;
  }

  /* Demo standings: deterministic per league, clearly labeled as sample. */
  function table(league) {
    var r = U.rng(U.hashStr(league + '|table'));
    var names = [];
    Object.keys(TEAMS).forEach(function (s) { names = names.concat(TEAMS[s]); });
    var pool = names.slice().sort(function () { return r() - 0.5; }).slice(0, 8);
    var pts = 0;
    return pool.map(function (nm, i) {
      var w = Math.floor(r() * 6), d = Math.floor(r() * 3), l = Math.max(0, 7 - w - d);
      var gf = 8 + Math.floor(r() * 14), ga = 6 + Math.floor(r() * 12);
      return {
        intRank: String(i + 1), strTeam: nm, strBadge: '',
        intPlayed: String(w + d + l), intWin: String(w), intDraw: String(d),
        intLoss: String(l), intGoalsFor: String(gf), intGoalsAgainst: String(ga),
        intGoalDifference: String(gf - ga), intPoints: String(w * 3 + d + pts % 2)
      };
    }).sort(function (a, b) { return (+b.intPoints) - (+a.intPoints); })
      .map(function (row, i) { row.intRank = String(i + 1); return row; });
  }

  /* Demo lineup: deterministic XI per match so the card never looks empty. */
  function lineup(m) {
    var r = U.rng(U.hashStr(m.id + '|xi'));
    var first = ['J.', 'M.', 'L.', 'K.', 'D.', 'A.', 'R.', 'T.', 'S.', 'P.', 'N.'];
    var last = ['Smith', 'Garcia', 'Khan', 'Silva', 'Moreau', 'Larsen', 'Costa', 'Weber', 'Fontaine', 'Okafor', 'Lindqvist', 'Marchetti'];
    var pos = ['G', 'D', 'D', 'D', 'D', 'M', 'M', 'M', 'F', 'F', 'F'];
    function xi() {
      var x = [];
      for (var i = 0; i < 11; i++) x.push({ strPlayer: first[Math.floor(r() * first.length)] + ' ' + last[Math.floor(r() * last.length)], strPositionShort: pos[i], intSquadNumber: String(i + 1), strCutout: '' });
      return x;
    }
    var h = xi(), a = xi();
    var out = [];
    h.forEach(function (p) { p.strHome = 'Yes'; p.strSubstitute = 'No'; out.push(p); });
    a.forEach(function (p) { p.strHome = 'No'; p.strSubstitute = 'No'; out.push(p); });
    return out;
  }

  window.Demo = { events: events, form: form, live: live, table: table, lineup: lineup };
})();