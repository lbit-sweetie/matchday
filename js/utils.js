/* Storage, dates, caching, favorites, settings */
(function () {
  var mem = {};
  var store = {
    get: function (k) {
      try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : null; }
      catch (e) { return mem[k] || null; }
    },
    set: function (k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { mem[k] = v; }
    },
    del: function (k) {
      try { localStorage.removeItem(k); } catch (e) { delete mem[k]; }
    },
    clearPrefix: function (p) {
      try {
        Object.keys(localStorage).forEach(function (k) { if (k.indexOf(p) === 0) localStorage.removeItem(k); });
      } catch (e) { mem = {}; }
    }
  };

  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function today() { return new Date(); }
  function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseISO(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function fmtTime(ts) { var d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function fmtDayMonth(ts) { var d = new Date(ts); return MON[d.getMonth()] + ' ' + d.getDate(); }
  function fmtLong(d) { return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
  function relDay(iso) {
    if (iso === isoDate(today())) return 'Today';
    if (iso === isoDate(addDays(today(), 1))) return 'Tomorrow';
    if (iso === isoDate(addDays(today(), -1))) return 'Yesterday';
    return DOW[parseISO(iso).getDay()];
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function initials(name) {
    var w = String(name).replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean);
    return (w.length > 1 ? w[0][0] + w[1][0] : String(name).slice(0, 2)).toUpperCase();
  }
  function abbr(name) {
    var w = String(name).replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean);
    var s = w.length > 1 ? (w[0][0] + w[1][0] + (w[1][1] || '')) : String(name).slice(0, 3);
    return s.toUpperCase();
  }

  /* TTL cache on top of storage */
  function cached(key, ttl, loader) {
    var c = store.get('md:c:' + key);
    if (c && (Date.now() - c.t) < ttl) return Promise.resolve(c.v);
    return Promise.resolve(loader()).then(function (v) {
      store.set('md:c:' + key, { t: Date.now(), v: v });
      return v;
    });
  }
  function cacheHas(key) { return !!store.get('md:c:' + key); }
  
    function cacheGet(key, ttl) {
    var c = store.get('md:c:' + key);
    return (c && (Date.now() - c.t) < ttl) ? c.v : null;
  }
  function countdownText(ts) {
    var d = ts - Date.now();
    if (d <= 0) return 'now';
    var m = Math.floor(d / 60000);
    if (m >= 1440) return Math.floor(m / 1440) + 'd ' + Math.floor((m % 1440) / 60) + 'h';
    if (m >= 60) return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
    return m + 'm';
  }

  /* Settings */
    function settings() {
    var s = store.get('md:settings') || {};
    return { pollMs: s.pollMs != null ? s.pollMs : CONFIG.livePollMs };
  }
  function setSettings(patch) {
    var s = settings();
    for (var k in patch) s[k] = patch[k];
    store.set('md:settings', s);
    return s;
  }

  /* Favorites (local profile) */
  function favAll() { return store.get('md:favs') || {}; }
  function favHas(id) { return !!favAll()[id]; }
  function favToggle(match) {
    var f = favAll();
    if (f[match.id]) { delete f[match.id]; store.set('md:favs', f); return false; }
    f[match.id] = match; store.set('md:favs', f); return true;
  }
  /* Saved predictions */
  function predAll() { return store.get('md:preds') || {}; }
  function predHas(id) { return !!predAll()[id]; }
  function predSave(match, pred) {
    var p = predAll();
    p[match.id] = { match: match, topLabel: pred.top.label, topProb: pred.top.pct, savedAt: Date.now() };
    store.set('md:preds', p);
    return p[match.id];
  }
  function predRemove(id) {
    var p = predAll();
    if (p[id]) { delete p[id]; store.set('md:preds', p); return true; }
    return false;
  }
  function debounce(fn, ms) {
    var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); };
  }

  window.U = {
    store: store, DOW: DOW, pad: pad, today: today, isoDate: isoDate, parseISO: parseISO,
    addDays: addDays, fmtTime: fmtTime, fmtDayMonth: fmtDayMonth, fmtLong: fmtLong, relDay: relDay,
    esc: esc, hashStr: hashStr, rng: rng, initials: initials, abbr: abbr,
    cached: cached, cacheHas: cacheHas, settings: settings, setSettings: setSettings,
    favAll: favAll, favHas: favHas, favToggle: favToggle,
    predAll: predAll, predHas: predHas, predSave: predSave, predRemove: predRemove, debounce: debounce,
    cacheGet: cacheGet, countdownText: countdownText
  };
})();