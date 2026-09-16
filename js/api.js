/* Real data layer: TheSportsDB v1 (free).
   Fixtures cached 30 min · live scores cached 60 sec · form cached 24 h ·
   standings cached 12 h · lineups/timelines cached 24 h · squads cached 7 days.
   Any network error => automatic Demo fallback.
   WebView rule: detail data (lineup/table/squad) loads LAZILY, only when the
   user opens that screen, and is then cached. List screens cost 0 extra. */
(function () {
  var API = { source: 'live', live: {}, calls: 0, index: {} };
  var inflight = {};

  function base() { return 'https://www.thesportsdb.com/api/v1/json/' + CONFIG.thesportsdbKey + '/'; }

  /* Deduplicate simultaneous identical requests (re-renders in WebView). */
  function dedup(key, loader) {
    if (inflight[key]) return inflight[key];
    var p = Promise.resolve(loader()).then(function (v) { delete inflight[key]; return v; },
      function (e) { delete inflight[key]; throw e; });
    inflight[key] = p;
    return p;
  }

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
      lid: e.idLeague || null, season: e.strSeason || null,
      leagueBadge: e.strLeagueBadge || '',
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
    var failed = 0;
    return Promise.all(ids.map(function (s) {
      return fetchOne(dateISO, s.id).catch(function () { failed++; return []; });
    })).then(function (lists) {
        var out = [];
        lists.forEach(function (l) { out = out.concat(l); });
        /* total network failure (not just a quiet day) => reject into Demo fallback */
        if (!out.length && failed >= ids.length) throw new Error('all sports failed');
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
      .catch(function () {
        API.source = 'demo';
        var list = Demo.events(dateISO, sport);
        list.forEach(function (m) { API.index[m.id] = m; });
        return list;
      });
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
    var tids = m.tids || {};
    return Promise.all([teamForm(tids.h, m.home.name, allowDraw), teamForm(tids.a, m.away.name, allowDraw)])
      .then(function (r) { return { h: r[0], a: r[1] }; });
  }

  /* Single event lookup — fixes deep links (#/match/id after refresh in WebView). */
  function lookupEvent(id) {
    if (API.index[id]) return Promise.resolve(API.index[id]);
    var favs = U.favAll();
    if (favs[id]) return Promise.resolve(favs[id]);
    if (String(id).indexOf('dm-') === 0) {
      /* Demo id format: dm-{Sport}-{dateISO}-{i}. Rebuild deterministically, 0 requests. */
      var mm = String(id).match(/(\d{4}-\d{2}-\d{2})/);
      var iso = mm ? mm[1] : U.isoDate(U.today());
      var list = Demo.events(iso, 'all');
      for (var i = 0; i < list.length; i++) if (list[i].id === id) {
        API.index[id] = list[i];
        return Promise.resolve(list[i]);
      }
      return Promise.reject(new Error('not found'));
    }
    return dedup('ev:' + id, function () {
      return U.cached('evid:' + id, CONFIG.cacheTTL.events, function () {
        return fetchJSON(base() + 'lookupevent.php?id=' + encodeURIComponent(id)).then(function (j) {
          var ev = j && j.events && j.events[0] ? mapEvent(j.events[0]) : null;
          if (!ev) throw new Error('not found');
          return ev;
        });
      }).then(function (m) { API.index[m.id] = m; return m; });
    });
  }

  /* League standings — 1 request per league per 12h. null when unavailable. */
  function getTable(lid, season) {
    if (!lid) return Promise.resolve(null);
    var q = 'l=' + encodeURIComponent(lid) + (season ? '&s=' + encodeURIComponent(season) : '');
    return dedup('tbl:' + q, function () {
      return U.cached('tbl:' + q, CONFIG.cacheTTL.table, function () {
        return fetchJSON(base() + 'lookuptable.php?' + q).then(function (j) {
          var t = j && j.table ? j.table : null;
          if (!t || !t.length) throw new Error('empty table');
          return t;
        });
      });
    }).catch(function () { return null; });
  }

  /* Event lineup (starting XI + subs) — 1 request per event, cached 24h. */
  function getLineup(eventId) {
    if (!eventId || String(eventId).indexOf('dm-') === 0) return Promise.resolve(null);
    return dedup('lin:' + eventId, function () {
      return U.cached('lin:' + eventId, CONFIG.cacheTTL.lineup, function () {
        return fetchJSON(base() + 'lookuplineup.php?id=' + encodeURIComponent(eventId)).then(function (j) {
          var l = j && j.lineup ? j.lineup : null;
          if (!l || !l.length) throw new Error('empty lineup');
          return l;
        });
      });
    }).catch(function () { return null; });
  }

  /* Event timeline (goals/cards/subs) — 1 request per event, cached 24h. */
  function getTimeline(eventId) {
    if (!eventId || String(eventId).indexOf('dm-') === 0) return Promise.resolve(null);
    return dedup('tln:' + eventId, function () {
      return U.cached('tln:' + eventId, CONFIG.cacheTTL.lineup, function () {
        return fetchJSON(base() + 'lookuptimeline.php?id=' + encodeURIComponent(eventId)).then(function (j) {
          return (j && j.timeline) || null;
        });
      });
    }).catch(function () { return null; });
  }

  /* Team roster fallback (when a match has no published lineup) — cached 7 days. */
  function getSquad(tid) {
    if (!tid) return Promise.resolve(null);
    return dedup('sqd:' + tid, function () {
      return U.cached('sqd:' + tid, CONFIG.cacheTTL.squad, function () {
        return fetchJSON(base() + 'lookup_all_players.php?id=' + encodeURIComponent(tid)).then(function (j) {
          var p = j && j.player ? j.player : null;
          if (!p || !p.length) throw new Error('empty squad');
          return p;
        });
      });
    }).catch(function () { return null; });
  }

  /* Split a raw lineup into home/away starters + subs for rendering. */
  function splitLineup(rows) {
    var out = { h: [], hSub: [], a: [], aSub: [] };
    if (!rows) return out;
    rows.forEach(function (r) {
      var home = String(r.strHome) === 'Yes';
      var sub = String(r.strSubstitute) === 'Yes';
      var p = { name: r.strPlayer || '?', pos: r.strPositionShort || r.strPosition || '', num: r.intSquadNumber || '', cut: r.strCutout || '' };
      var k = (home ? 'h' : 'a') + (sub ? 'Sub' : '');
      out[k].push(p);
    });
    return out;
  }

  /* Aggregate scorers from already-cached timelines (0 requests). */
  function scorersFromCache(matches) {
    var map = {}, n = 0;
    matches.forEach(function (m) {
      var t = U.cacheGet('tln:' + m.id, CONFIG.cacheTTL.lineup);
      if (!t) return;
      n++;
      t.forEach(function (e) {
        if (String(e.strTimeline) !== 'Goal') return;
        var k = (e.strPlayer || '?') + '|' + (e.strTeam || '');
        if (!map[k]) map[k] = { name: e.strPlayer || '?', team: e.strTeam || '', goals: 0 };
        map[k].goals++;
      });
    });
    var rows = Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return b.goals - a.goals; }).slice(0, 10);
    return { rows: rows, cached: n, total: matches.length };
  }

  API.getEvents = getEvents; API.pollLive = pollLive; API.viewMatch = viewMatch; API.getForm = getForm;
  API.lookupEvent = lookupEvent; API.getTable = getTable; API.getLineup = getLineup;
  API.getTimeline = getTimeline; API.getSquad = getSquad;
  API.splitLineup = splitLineup; API.scorersFromCache = scorersFromCache;
  window.API = API;
})();