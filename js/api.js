/* Real data layer: TheSportsDB v1 (free).
   Fixtures cached 30 min · live scores cached 60 sec · form cached 24 h.
   Any network error => automatic Demo fallback. */
(function () {
  var API = { source: 'live', live: {}, calls: 0, index: {} };

  function base() { return 'https://www.thesportsdb.com/api/v1/json/' + CONFIG.thesportsdbKey + '/'; }

  function fetchJSON(url) {
    API.calls++;
    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    var to = ctrl ? setTimeout(function () { ctrl.abort(); }, 9000) : null;
    return fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) { clearTimeout(to); return j; }, function (e) { clearTimeout(to); throw e; });
  }

  function mapEvent(e) {
    if (!e || !e.idEvent) return null;
    var ts = null;
    if (e.strDate) ts = Date.parse(e.strDate + 'T' + (e.strTime || '00:00:00') + 'Z');
    if (isNaN(ts) || ts == null) ts = Date.parse((e.strTimestamp || '') + 'Z');
    if (isNaN(ts) || ts == null) ts = Date.now();
    var st = (e.strStatus || '').toUpperCase();
    var sh = (e.intHomeScore !== null && e.intHomeScore !== '') ? parseInt(e.intHomeScore, 10) : null;
    var sa = (e.intAwayScore !== null && e.intAwayScore !== '') ? parseInt(e.intAwayScore, 10) : null;
    var status = 'NS';
    if (st.indexOf('LIVE') >= 0 || st === '1H' || st === '2H' || st === 'HT') status = 'LIVE';
    else if (st.indexOf('FT') >= 0 || st.indexOf('FINISH') >= 0 || st === 'AET' || st === 'PEN' || sh != null) status = 'FT';
    else if (ts < Date.now() - 3 * 3600 * 1000) status = 'FT';
    return {
      id: e.idEvent, sport: e.strSport || 'Soccer', league: e.strLeague || '',
      ts: ts, status: status, minute: e.strProgress || '', sh: sh, sa: sa,
      home: { name: e.strHomeTeam || 'TBD', badge: e.strHomeTeamBadge || '' },
      away: { name: e.strAwayTeam || 'TBD', badge: e.strAwayTeamBadge || '' },
      tids: { h: e.idHomeTeam || null, a: e.idAwayTeam || null }, demo: false
    };
  }

  function fetchOne(dateISO, sport) {
    return fetchJSON(base() + 'eventsday.php?d=' + dateISO + '&s=' + encodeURIComponent(sport))
      .then(function (j) { return (j && j.events ? j.events : []).map(mapEvent).filter(Boolean); });
  }
  function fetchDate(dateISO, sport) {
    if (sport !== 'all') return fetchOne(dateISO, sport);
    var ids = CONFIG.sports.filter(function (s) { return s.id !== 'all'; });
    return Promise.all(ids.map(function (s) { return fetchOne(dateISO, s.id).catch(function () { return []; }); }))
      .then(function (lists) {
        var out = [];
        lists.forEach(function (l) { out = out.concat(l); });
        return out.sort(function (a, b) { return a.ts - b.ts; });
      });
  }

  function getEvents(dateISO, sport) {
    
    return U.cached('ev:' + sport + ':' + dateISO, CONFIG.cacheTTL.events, function () { return fetchDate(dateISO, sport); })
      .then(function (list) {
        API.source = 'live';
        list.forEach(function (m) { API.index[m.id] = m; });
        return list;
      })
      .catch(function () { API.source = 'demo'; return Demo.events(dateISO, sport); });
  }

  function loadLiveMap() {
    return fetchJSON(base() + 'livescore.php?s=All')
      .catch(function () { return fetchJSON(base() + 'livescore.php?s=Soccer'); })
      .then(function (j) {
        var map = {};
        (j && j.events ? j.events : []).forEach(function (e) {
          map[e.idEvent] = {
            sh: (e.intHomeScore !== '' && e.intHomeScore != null) ? parseInt(e.intHomeScore, 10) : null,
            sa: (e.intAwayScore !== '' && e.intAwayScore != null) ? parseInt(e.intAwayScore, 10) : null,
            minute: e.strProgress || '', status: 'LIVE'
          };
        });
        return map;
      });
  }
  function pollLive() {
    
    return U.cached('live', CONFIG.cacheTTL.live, loadLiveMap)
      .then(function (map) { API.live = map || {}; return API.live; })
      .catch(function () { return API.live; });
  }

  function viewMatch(m) {
    var l = API.live[m.id];
    if (!l) return m;
    var o = {}; for (var k in m) o[k] = m[k];
    o.sh = l.sh != null ? l.sh : m.sh; o.sa = l.sa != null ? l.sa : m.sa;
    o.minute = l.minute || m.minute; o.status = 'LIVE';
    return o;
  }

  function teamForm(tid, name, allowDraw) {
    if (!tid) return Promise.resolve(Demo.form(name, allowDraw));
    return U.cached('form:' + tid, CONFIG.cacheTTL.form, function () {
      return fetchJSON(base() + 'eventslast.php?id=' + tid).then(function (j) {
        var evs = (j && j.results ? j.results : []).slice(0, 5);
        if (!evs.length) throw new Error('empty');
        return evs.map(function (e) {
          var hs = parseInt(e.intHomeScore, 10), as = parseInt(e.intAwayScore, 10);
          if (isNaN(hs) || isNaN(as) || hs === as) return 'D';
          var isHome = String(e.idHomeTeam) === String(tid);
          return (isHome ? hs > as : as > hs) ? 'W' : 'L';
        });
      });
    }).catch(function () { return Demo.form(name, allowDraw); });
  }
  function getForm(m) {
    var allowDraw = m.sport === 'Soccer';
    
    return Promise.all([teamForm(m.tids.h, m.home.name, allowDraw), teamForm(m.tids.a, m.away.name, allowDraw)])
      .then(function (r) { return { h: r[0], a: r[1] }; });
  }

  API.getEvents = getEvents; API.pollLive = pollLive; API.viewMatch = viewMatch; API.getForm = getForm;
  window.API = API;
})();