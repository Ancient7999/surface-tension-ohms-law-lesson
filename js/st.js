/* Lab 8 · Surface tension by capillary rise: figures, bench, calculation, tutorial */
(function (L) {
  'use strict';
  const { el, txt, tsub, $, clamp, parseNum, near, fmt, C, F_HEAD, F_BODY, defs, NUM, setWork } = L;
  const LIQ = {
    water: { name: 'water', label: 'Water', g: 72.0, rho: 1.00, th: 0, std: 'the standard value of 72 dyne/cm for water' },
    soap: { name: 'soap solution', label: 'Soap solution', g: 30.0, rho: 1.00, th: 0, std: 'a typical 30 dyne/cm for a soap solution' },
    ethanol: { name: 'ethanol', label: 'Ethanol', g: 22.3, rho: 0.789, th: 0, std: 'the standard value of 22.3 dyne/cm for ethanol' },
    mercury: { name: 'mercury', label: 'Mercury', g: 485, rho: 13.6, th: 140 }
  };
  const G = 980;
  const riseOf = (lq, r) => 2 * lq.g * Math.cos(lq.th * Math.PI / 180) / (r * lq.rho * G);
  const T = (g, x, y, s, o) => txt(g, x, y, s, Object.assign({ 'font-family': F_BODY, 'font-size': 14, fill: C.ink2 }, o || {}));
  function beaker(g, x, y, w, h, surf, id, fill) {
    el('path', { d: `M${x} ${y} L${x} ${y + h - 10} Q${x} ${y + h} ${x + 10} ${y + h} L${x + w - 10} ${y + h} Q${x + w} ${y + h} ${x + w} ${y + h - 10} L${x + w} ${y}`, fill: 'none', stroke: '#8fb4c4', 'stroke-width': 3, 'stroke-linejoin': 'round' }, g);
    el('rect', { x: x + 1.5, y: surf, width: w - 3, height: y + h - surf - 1.5, rx: 8, fill: fill || `url(#${id}-water)`, opacity: .85 }, g);
    el('line', { x1: x + 1.5, y1: surf, x2: x + w - 1.5, y2: surf, stroke: C.aqua2, 'stroke-width': 1.5, opacity: .7 }, g);
    el('path', { d: `M${x - 6} ${y} L${x + 6} ${y}`, stroke: '#8fb4c4', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    el('rect', { x: x + 8, y: y + 12, width: 6, height: h - 40, rx: 3, fill: '#fff', opacity: .55 }, g);
  }
  function arrowV(g, x, y1, y2, col, lab, side) {
    el('line', { x1: x, y1: y1, x2: x, y2: y2, stroke: col, 'stroke-width': 1.6 }, g);
    [[y1, 1], [y2, -1]].forEach(([y, d]) => el('path', { d: `M${x - 4} ${y + 7 * d} L${x} ${y} L${x + 4} ${y + 7 * d}`, fill: 'none', stroke: col, 'stroke-width': 1.6 }, g));
    if (lab) T(g, x + (side || 8), (y1 + y2) / 2 + 5, lab, { fill: col, 'font-weight': 700, 'font-style': 'italic', 'font-size': 16, 'text-anchor': (side || 8) < 0 ? 'end' : 'start' });
  }

  /* ---------- aim figure: rise in three bores ---------- */
  (function aimFig() {
    const s = $('st-aim-fig'); defs(s, 'af'); const g = el('g', null, s);
    const surf = 230; beaker(g, 90, 150, 360, 150, surf, 'af');
    [[170, .025], [270, .05], [370, .1]].forEach(([x, r]) => {
      const h = riseOf(LIQ.water, r) * 22, bw = Math.max(2, r * 70);
      el('rect', { x: x - bw - 3, y: 30, width: 2 * bw + 6, height: surf + 50 - 30, rx: 2, fill: 'url(#af-glass)', stroke: '#9cbccb', 'stroke-width': 1 }, g);
      el('path', { d: `M${x - bw} ${surf + 50} L${x - bw} ${surf - h - bw} Q${x} ${surf - h + bw} ${x + bw} ${surf - h - bw} L${x + bw} ${surf + 50} Z`, fill: C.aqua, opacity: .75 }, g);
      T(g, x, 20, `r = ${r} cm`, { 'text-anchor': 'middle', 'font-size': 13, fill: C.muted });
    });
    arrowV(g, 300, surf - riseOf(LIQ.water, .05) * 22, surf, C.acc, 'h');
    el('line', { x1: 255, y1: surf, x2: 320, y2: surf, stroke: C.acc, 'stroke-width': 1, 'stroke-dasharray': '3 3' }, g);
    // zoom of a meniscus
    const zx = 640, zy = 150, R = 110;
    el('circle', { cx: zx, cy: zy, r: R, fill: '#fff', stroke: C.ink2, 'stroke-width': 2 }, g);
    el('line', { x1: 285, y1: surf - 65, x2: zx - R + 6, y2: zy - 10, stroke: C.slate3, 'stroke-width': 1, 'stroke-dasharray': '4 4' }, g);
    el('circle', { cx: 270, cy: surf - 65, r: 14, fill: 'none', stroke: C.slate3, 'stroke-width': 1.2 }, g);
    const cp = el('clipPath', { id: 'af-clip' }, s.querySelector('defs')); el('circle', { cx: zx, cy: zy, r: R - 2 }, cp);
    const z = el('g', { 'clip-path': 'url(#af-clip)' }, g);
    el('rect', { x: zx - 70, y: zy - 120, width: 18, height: 260, fill: '#dbe9ef' }, z); el('rect', { x: zx + 52, y: zy - 120, width: 18, height: 260, fill: '#dbe9ef' }, z);
    el('path', { d: `M${zx - 52} ${zy + 130} L${zx - 52} ${zy - 30} Q${zx} ${zy + 74} ${zx + 52} ${zy - 30} L${zx + 52} ${zy + 130} Z`, fill: C.aqua, opacity: .6 }, z);
    el('path', { d: `M${zx - 52} ${zy - 30} Q${zx} ${zy + 74} ${zx + 52} ${zy - 30}`, fill: 'none', stroke: C.aqua2, 'stroke-width': 2 }, z);
    el('line', { x1: zx - 52, y1: zy + 22, x2: zx + 52, y2: zy + 22, stroke: C.acc, 'stroke-width': 1.4 }, z);
    T(z, zx, zy + 40, 'r', { 'text-anchor': 'middle', 'font-style': 'italic', 'font-weight': 700, fill: C.acc, 'font-size': 16 });
    el('line', { x1: zx, y1: zy + 22, x2: zx + 52, y2: zy + 22, stroke: C.acc, 'stroke-width': 3 }, z);
    T(z, zx - 42, zy - 46, 'θ ≈ 0°', { 'font-size': 14, fill: C.ink, 'font-weight': 600 });
    T(g, zx, zy + R + 24, 'concave meniscus, liquid wets the glass', { 'text-anchor': 'middle', 'font-size': 13, fill: C.muted });
  })();

  /* ---------- Laplace figure with a surfactant toggle ---------- */
  (function laplace() {
    const s = $('st-lap-fig'), cap = $('st-lap-cap'); defs(s, 'lp');
    function draw(on) {
      s.querySelectorAll('g.lp').forEach(n => n.remove());
      const g = el('g', { class: 'lp' }, s);
      const A = { x: 250, y: 140, r: 52, rc: 0.005 }, B = { x: 600, y: 130, r: 96, rc: 0.010 };
      const gA = on ? 15 : 70, gB = on ? 30 : 70;
      const pA = 2 * gA / A.rc, pB = 2 * gB / B.rc;
      el('path', { d: `M425 330 L425 270 Q425 240 ${A.x + 20} ${A.y + A.r + 6} M425 270 Q425 240 ${B.x - 30} ${B.y + B.r + 2}`, fill: 'none', stroke: '#e7c9d6', 'stroke-width': 26, 'stroke-linecap': 'round' }, g);
      [[A, gA, pA, 'small alveolus'], [B, gB, pB, 'large alveolus']].forEach(([a, gm, p, nm]) => {
        el('circle', { cx: a.x, cy: a.y, r: a.r, fill: '#fdf3f7', stroke: C.acc, 'stroke-width': 2.4 }, g);
        el('circle', { cx: a.x, cy: a.y, r: a.r - 6, fill: 'none', stroke: C.aqua, 'stroke-width': 4, opacity: .45 }, g);
        if (on) for (let k = 0; k < 18; k++) { const t = k / 18 * 6.283, x = a.x + Math.cos(t) * (a.r - 6), y = a.y + Math.sin(t) * (a.r - 6); el('circle', { cx: x, cy: y, r: 3, fill: C.acc2 }, g); el('line', { x1: x, y1: y, x2: a.x + Math.cos(t) * (a.r - 14), y2: a.y + Math.sin(t) * (a.r - 14), stroke: C.acc2, 'stroke-width': 1.4 }, g); }
        T(g, a.x, a.y - 6, nm, { 'text-anchor': 'middle', 'font-size': 13, fill: C.muted });
        T(g, a.x, a.y + 14, `γ = ${gm} dyne/cm`, { 'text-anchor': 'middle', 'font-size': 13.5, fill: C.ink, 'font-weight': 600 });
        T(g, a.x, a.y - a.r - 16, `ΔP = 2γ/r ≈ ${(p / 980).toFixed(1)} cm H₂O`, { 'text-anchor': 'middle', 'font-size': 14.5, fill: C.acc2, 'font-weight': 700 });
      });
      if (!on) {
        el('path', { d: 'M318 172 C 380 210, 450 210, 498 178', fill: 'none', stroke: C.bad, 'stroke-width': 2.4, 'stroke-dasharray': '6 5' }, g);
        el('path', { d: 'M488 172 L500 177 L491 187', fill: 'none', stroke: C.bad, 'stroke-width': 2.4 }, g);
        T(g, 410, 232, 'air flows from small to large: the small one collapses', { 'text-anchor': 'middle', 'font-size': 13.5, fill: C.bad, 'font-weight': 600 });
      } else T(g, 410, 232, 'equal pressures: both stay open', { 'text-anchor': 'middle', 'font-size': 13.5, fill: C.good, 'font-weight': 600 });
      cap.innerHTML = on
        ? 'With surfactant, γ falls most in the small alveolus (here 15 against 30 dyne/cm). 2γ/r comes out equal for both, so neither empties into the other.'
        : 'Young–Laplace law in the acinar airways: ΔP = 2γ/r. With the same γ in both, the small alveolus (r = 50 μm) needs twice the pressure of the large one (r = 100 μm), so it empties into it.';
    }
    const seg = $('lap-seg');
    seg.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); draw(b.dataset.s === '1'); });
    draw(false);
  })();

  /* ---------- theory figures ---------- */
  (function molFig() {
    const s = $('st-th-mol'), g = el('g', null, s);
    el('rect', { x: 20, y: 100, width: 480, height: 180, rx: 6, fill: C.aquaPale }, g);
    el('line', { x1: 20, y1: 100, x2: 500, y2: 100, stroke: C.aqua2, 'stroke-width': 2 }, g);
    T(g, 30, 88, 'air', { fill: C.muted }); T(g, 30, 272, 'liquid', { fill: C.aqua2 });
    const arrow = (x, y, a, len, col, w) => { const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len; el('line', { x1: x, y1: y, x2, y2, stroke: col, 'stroke-width': w || 2 }, g); el('path', { d: `M${x2 - Math.cos(a - .5) * 8} ${y2 - Math.sin(a - .5) * 8} L${x2} ${y2} L${x2 - Math.cos(a + .5) * 8} ${y2 - Math.sin(a + .5) * 8}`, fill: 'none', stroke: col, 'stroke-width': w || 2 }, g); };
    for (let k = 0; k < 8; k++) arrow(360, 200, k * Math.PI / 4, 42, C.slate);
    el('circle', { cx: 360, cy: 200, r: 13, fill: C.aqua, stroke: C.aqua2, 'stroke-width': 1.5 }, g);
    T(g, 360, 266, 'inside: pulls cancel', { 'text-anchor': 'middle', 'font-size': 13.5, fill: C.ink2 });
    [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI].forEach(a => arrow(150, 106, a, 40, C.slate));
    arrow(150, 106, Math.PI / 2, 74, C.acc, 3.4);
    el('circle', { cx: 150, cy: 106, r: 13, fill: C.aqua, stroke: C.aqua2, 'stroke-width': 1.5 }, g);
    T(g, 168, 200, 'net inward pull', { 'font-size': 13.5, fill: C.acc2, 'font-weight': 700 });
    T(g, 150, 60, 'at the surface', { 'text-anchor': 'middle', 'font-size': 13.5, fill: C.ink2 });
    [[60, 150], [240, 150], [100, 230], [230, 240], [440, 150], [450, 240], [290, 140]].forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 10, fill: '#bfe0ec' }, g));
  })();
  (function contact() {
    [[0, 'st-th-ca0'], [50, 'st-th-ca1'], [140, 'st-th-ca2']].forEach(([th, id]) => {
      const s = $(id), g = el('g', null, s), a = th * Math.PI / 180;
      const xl = 70, xr = 190, ym = 90, half = (xr - xl) / 2;
      const R = half / Math.cos(a === 0 ? 0 : Math.min(a, Math.PI - a) === a ? a : Math.PI - a);
      const dep = th === 140 ? -26 : th === 0 ? half : 22;
      el('rect', { x: xl - 14, y: 10, width: 14, height: 165, fill: '#dbe9ef' }, g); el('rect', { x: xr, y: 10, width: 14, height: 165, fill: '#dbe9ef' }, g);
      const fill = th === 140 ? '#b8bfc8' : C.aqua;
      el('path', { d: `M${xl} 175 L${xl} ${ym - dep / 2} Q${(xl + xr) / 2} ${ym + dep * 1.5} ${xr} ${ym - dep / 2} L${xr} 175 Z`, fill, opacity: .7 }, g);
      el('path', { d: `M${xl} ${ym - dep / 2} Q${(xl + xr) / 2} ${ym + dep * 1.5} ${xr} ${ym - dep / 2}`, fill: 'none', stroke: th === 140 ? C.slate2 : C.aqua2, 'stroke-width': 2 }, g);
      // angle marker at the left wall, inside the liquid
      const y0 = ym - dep / 2, tang = Math.atan2(2 * dep, half);
      const ra = 26;
      const sa = -Math.PI / 2 + Math.PI, ea = Math.PI / 2;
      el('path', { d: `M${xl} ${y0 + ra} A ${ra} ${ra} 0 0 0 ${xl + Math.cos(tang) * ra} ${y0 + Math.sin(tang) * ra}`, fill: 'none', stroke: C.acc, 'stroke-width': 1.8 }, g);
      T(g, xl + 22, y0 + 44, `θ ≈ ${th}°`, { 'font-size': 14, fill: C.acc2, 'font-weight': 700 });
      void R; void sa; void ea;
    });
  })();
  (function explorer() {
    const s = $('st-ex-svg'), rIn = $('st-ex-r'), out = $('st-ex-out'), seg = $('st-ex-liq'); defs(s, 'ex');
    let liq = 'water';
    function draw() {
      const r = +rIn.value, lq = LIQ[liq], h = riseOf(lq, r);
      $('st-ex-rv').textContent = r.toFixed(3) + ' cm';
      s.innerHTML = ''; defs(s, 'ex'); const g = el('g', null, s);
      const surf = 270, px = 30, x = 230;
      const fill = liq === 'mercury' ? '#b8bfc8' : C.aqua;
      beaker(g, 120, 200, 220, 115, surf, 'ex', fill);
      const bw = Math.max(1.6, r * 60);
      el('rect', { x: x - bw - 4, y: 20, width: 2 * bw + 8, height: 290, rx: 2, fill: 'url(#ex-glass)', stroke: '#9cbccb' }, g);
      const top = surf - h * px, dep = liq === 'mercury' ? -bw * .7 : bw;
      el('path', { d: `M${x - bw} 310 L${x - bw} ${top - dep} Q${x} ${top + dep} ${x + bw} ${top - dep} L${x + bw} 310 Z`, fill, opacity: .8 }, g);
      // scale
      el('rect', { x: 380, y: 20, width: 40, height: 290, fill: '#fff', stroke: C.line2 }, g);
      for (let c = -1; c <= 8; c++) { const y = surf - c * px; if (y < 22 || y > 308) continue; el('line', { x1: 380, y1: y, x2: 394, y2: y, stroke: C.ink2 }, g); T(g, 398, y + 5, Math.abs(c), { 'font-size': 12 }); }
      el('line', { x1: x + bw + 6, y1: surf, x2: 380, y2: surf, stroke: C.acc, 'stroke-dasharray': '3 3' }, g);
      el('line', { x1: x + bw + 6, y1: top, x2: 380, y2: top, stroke: C.acc, 'stroke-dasharray': '3 3' }, g);
      arrowV(g, 360, Math.min(top, surf), Math.max(top, surf), C.acc, '', 0);
      T(g, 430, 14, 'cm', { 'font-size': 12, fill: C.muted, 'text-anchor': 'end' });
      out.innerHTML = `<b>${lq.label}</b>: γ = ${lq.g} dyne/cm, ρ = ${lq.rho} g/cm³, θ = ${lq.th}°<br>h = 2 × ${lq.g} × cos ${lq.th}° ÷ (${r.toFixed(3)} × ${lq.rho} × 980) = <b>${h.toFixed(2)} cm</b><br>` +
        (h < 0 ? '<span class="tag bad">depressed below the outside level</span>' : '<span class="tag acc">rises above the outside level</span>');
    }
    rIn.addEventListener('input', draw);
    seg.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; liq = b.dataset.l; seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); draw(); });
    draw();
  })();

  /* ---------- method: apparatus and step figures ---------- */
  (function apparatus() {
    const d = [
      g => { el('rect', { x: 74, y: 8, width: 12, height: 94, rx: 2, fill: '#e6f1f5', stroke: '#8fb4c4', 'stroke-width': 1.5 }, g); el('rect', { x: 78.5, y: 8, width: 3, height: 94, fill: '#bfe0ec' }, g); },
      g => { el('path', { d: 'M40 20 L40 96 Q40 102 46 102 L114 102 Q120 102 120 96 L120 20', fill: 'none', stroke: '#8fb4c4', 'stroke-width': 3 }, g); el('rect', { x: 42, y: 50, width: 76, height: 50, rx: 4, fill: C.aqua, opacity: .6 }, g); },
      g => { el('rect', { x: 30, y: 96, width: 100, height: 8, rx: 2, fill: C.slate2 }, g); el('rect', { x: 48, y: 10, width: 6, height: 88, fill: '#9aa3b0' }, g); el('rect', { x: 48, y: 30, width: 60, height: 8, rx: 2, fill: C.slate }, g); el('rect', { x: 104, y: 24, width: 12, height: 20, rx: 3, fill: C.acc }, g); },
      g => { el('rect', { x: 66, y: 6, width: 28, height: 98, fill: '#fff', stroke: C.line2 }, g); for (let k = 0; k <= 20; k++) el('line', { x1: 66, y1: 10 + k * 4.5, x2: 66 + (k % 10 === 0 ? 14 : k % 2 === 0 ? 9 : 5), y2: 10 + k * 4.5, stroke: C.ink2 }, g); },
      g => { el('circle', { cx: 70, cy: 48, r: 32, fill: '#f2f8fb', stroke: C.ink2, 'stroke-width': 4 }, g); el('line', { x1: 94, y1: 72, x2: 124, y2: 102, stroke: C.slate2, 'stroke-width': 9, 'stroke-linecap': 'round' }, g); el('path', { d: 'M56 36 Q64 28 74 30', fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round' }, g); },
      g => { el('path', { d: 'M80 12 C 80 12 52 48 52 66 a28 28 0 0 0 56 0 C108 48 80 12 80 12z', fill: C.aquaPale, stroke: C.aqua, 'stroke-width': 2.5 }, g); T(g, 80, 74, 'ρ', { 'text-anchor': 'middle', 'font-size': 22, 'font-style': 'italic', fill: C.aqua2 }); }
    ];
    d.forEach((f, i) => f(el('g', null, $('st-ap-' + i))));
  })();
  (function stepFig() {
    const s = $('st-step-svg'); defs(s, 'sf');
    const caps = ['Liquid is drawn up through the capillary and let drain, cleaning and wetting the bore.', 'The capillary, clamped vertical, is lowered until its end is under the liquid surface.', 'The column settles; h runs from the beaker surface to the bottom of the meniscus.', 'Lift, dip again, read again: three values of h, then their average.', 'γ = h r ρ g ÷ (2 cos θ), with every length in cm and g = 980 cm/s².'];
    function draw(i) {
      s.innerHTML = ''; defs(s, 'sf'); const g = el('g', null, s);
      const surf = 250;
      if (i <= 2) {
        beaker(g, 120, 180, 260, 150, surf, 'sf');
        const bot = i === 0 ? 170 : 300, x = 250;
        el('rect', { x: x - 7, y: bot - 260, width: 14, height: 260, rx: 2, fill: 'url(#sf-glass)', stroke: '#8fb4c4' }, g);
        if (i === 0) { for (let k = 0; k < 5; k++) el('circle', { cx: x, cy: 40 + k * 26, r: 3, fill: C.aqua }, g); el('path', { d: `M${x} ${bot + 6} q -4 10 0 14 q 4 -4 0 -14`, fill: C.aqua }, g); T(g, x + 20, 70, 'rinse', { fill: C.acc2, 'font-weight': 700 }); }
        if (i >= 1) {
          const h = i === 2 ? 110 : 60;
          el('path', { d: `M${x - 3} ${bot} L${x - 3} ${surf - h - 3} Q${x} ${surf - h + 3} ${x + 3} ${surf - h - 3} L${x + 3} ${bot} Z`, fill: C.aqua }, g);
          if (i === 1) { el('path', { d: `M${x - 40} 60 L${x - 40} 110 M${x - 46} 100 L${x - 40} 112 L${x - 34} 100`, stroke: C.acc, 'stroke-width': 2.4, fill: 'none' }, g); T(g, x - 50, 50, 'dip', { fill: C.acc2, 'font-weight': 700, 'text-anchor': 'end' }); }
          if (i === 2) { el('rect', { x: x + 12, y: 40, width: 26, height: 214, fill: '#fff', stroke: C.line2 }, g); for (let k = 0; k <= 40; k++) el('line', { x1: x + 12, y1: surf - k * 5.25, x2: x + 12 + (k % 10 === 0 ? 12 : 6), y2: surf - k * 5.25, stroke: C.ink2 }, g); arrowV(g, x + 60, surf - h, surf, C.acc, 'h'); el('line', { x1: x + 4, y1: surf - h, x2: x + 66, y2: surf - h, stroke: C.acc, 'stroke-dasharray': '3 3' }, g); }
        }
      } else if (i === 3) {
        [[110, 2.93], [260, 2.95], [410, 2.94]].forEach(([x, v], k) => { el('rect', { x: x - 60, y: 90, width: 120, height: 120, rx: 6, fill: '#fff', stroke: C.line2 }, g); T(g, x, 130, `dip ${k + 1}`, { 'text-anchor': 'middle', fill: C.muted }); tsub(g, x, 180, [{ i: 'h' }, { sub: String(k + 1) }, ` = ${v.toFixed(2)}`], { 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 600, fill: C.ink, 'font-family': F_BODY }); });
        T(g, 260, 270, 'average h = 2.94 cm  (example values)', { 'text-anchor': 'middle', 'font-size': 18, fill: C.acc2, 'font-weight': 700 });
      } else {
        el('rect', { x: 60, y: 90, width: 400, height: 170, rx: 8, fill: '#fff', stroke: C.ink, 'stroke-width': 1.5 }, g);
        T(g, 260, 160, 'γ = h r ρ g ÷ (2 cos θ)', { 'text-anchor': 'middle', 'font-size': 28, 'font-family': F_HEAD, 'font-weight': 600, fill: C.ink });
        T(g, 260, 210, 'cm · cm · g/cm³ · cm/s²  →  dyne/cm', { 'text-anchor': 'middle', 'font-size': 16, fill: C.muted });
      }
    }
    L.methodSteps($('st-steps'), $('st-step-cap'), draw, caps);
  })();
  L.mcq($('st-mcq-list'), L.MCQ.st, $('st-mcq-score'), $('st-mcq-reset'));

  L.ST = { LIQ, riseOf, beaker, arrowV, T };
})(window.SOL);
