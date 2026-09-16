/* Implied-probability model.
   Demo odds are generated deterministically per match; probabilities are then
   recovered the honest market way: P(outcome) = (1/K) / Sum(1/K), with margin. */
(function () {
  function calc(m) {
    var r = U.rng(U.hashStr(m.id + m.home.name + m.away.name));
    var soccer = m.sport === 'Soccer';
    var mgn = 0.03 + r() * 0.03;
    var ps;
    if (soccer) {
      var h = .34 + r() * .28, d = .18 + r() * .12, a = 1 - h - d;
      if (a < .10) { var k = (h + d) / .90; h /= k; d /= k; a = 1 - h - d; }
      ps = [h, d, a];
    } else {
      var h2 = .42 + r() * .30;
      ps = [h2, 1 - h2];
    }
    var names = soccer
      ? [m.home.name, 'Draw', m.away.name]
      : [m.home.name, m.away.name];
    var ab = soccer
      ? [U.abbr(m.home.name), 'DRW', U.abbr(m.away.name)]
      : [U.abbr(m.home.name), U.abbr(m.away.name)];

    /* bookmaker-style odds with overround */
    var odds = ps.map(function (p) { return Math.round(100 / (p * (1 + mgn))) / 100; });
    /* implied probabilities: (1/K) normalized */
    var inv = odds.map(function (k) { return 1 / k; });
    var sum = inv.reduce(function (x, y) { return x + y; }, 0);
    var pcts = inv.map(function (v) { return Math.round((v / sum) * 100); });
    var diff = 100 - pcts.reduce(function (x, y) { return x + y; }, 0);
    var maxI = 0; pcts.forEach(function (p, i) { if (p > pcts[maxI]) maxI = i; });
    pcts[maxI] += diff;

    var cls = ['', 'alt', 'alt2'];
    var outcomes = pcts.map(function (p, i) {
      return { label: names[i], abbr: ab[i], pct: p, odds: odds[i], cls: cls[i] || '' };
    }).sort(function (x, y) { return y.pct - x.pct; });

    return {
      outcomes: outcomes,
      margin: Math.round(mgn * 100),
      top: { label: outcomes[0].label, pct: outcomes[0].pct },
      demo: !!(m.demo || !m.tids)
    };
  }
  window.Predict = { calc: calc };
})();