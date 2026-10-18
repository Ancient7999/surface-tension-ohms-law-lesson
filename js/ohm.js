/* Lab 9 · Ohm's law: figures, worked example and MCQs */
(function (L) {
  'use strict';
  const { el, txt, tsub, $, C, F_HEAD, F_BODY, defs } = L;
  const T = (g, x, y, s, o) => txt(g, x, y, s, Object.assign({ 'font-family': F_BODY, 'font-size': 14, fill: C.ink2 }, o || {}));
  const W = (g, d, o) => el('path', Object.assign({ d, fill: 'none', stroke: C.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, o || {}), g);
  /* schematic symbols */
  const SY = {
    cell(g, x, y, vert) { if (vert) { W(g, `M${x - 16} ${y - 5} L${x + 16} ${y - 5}`); W(g, `M${x - 8} ${y + 5} L${x + 8} ${y + 5}`, { 'stroke-width': 4 }); T(g, x + 20, y - 8, '+', { 'font-size': 14, fill: C.bad, 'font-weight': 700 }); } else { W(g, `M${x - 5} ${y - 16} L${x - 5} ${y + 16}`); W(g, `M${x + 5} ${y - 8} L${x + 5} ${y + 8}`, { 'stroke-width': 4 }); T(g, x - 16, y - 18, '+', { 'font-size': 14, fill: C.bad, 'font-weight': 700 }); } },
    meter(g, x, y, ch, col) { el('circle', { cx: x, cy: y, r: 16, fill: '#fff', stroke: C.ink, 'stroke-width': 2.2 }, g); T(g, x, y + 6, ch, { 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 700, fill: col || C.ink, 'font-family': F_HEAD }); },
    res(g, x, y, vert) { const p = []; for (let k = 0; k <= 6; k++) p.push(vert ? `${x + (k === 0 || k === 6 ? 0 : k % 2 ? 9 : -9)} ${y - 21 + k * 7}` : `${x - 21 + k * 7} ${y + (k === 0 || k === 6 ? 0 : k % 2 ? -9 : 9)}`); W(g, 'M' + p.join(' L')); }
  };
  function circuit(g, x0, y0, w, h, lab) {
    const xl = x0, xr = x0 + w, yt = y0, yb = y0 + h, xm = (xl + xr) / 2;
    W(g, `M${xl} ${yb} L${xl} ${(yt + yb) / 2 + 5} M${xl} ${(yt + yb) / 2 - 5} L${xl} ${yt} L${xm - 16} ${yt} M${xm + 16} ${yt} L${xr} ${yt} L${xr} ${(yt + yb) / 2 - 21} M${xr} ${(yt + yb) / 2 + 21} L${xr} ${yb} L${xl} ${yb}`);
    SY.cell(g, xl, (yt + yb) / 2, true); SY.meter(g, xm, yt, 'A', C.acc2); SY.res(g, xr, (yt + yb) / 2, true);
    const xv = xr + 70; W(g, `M${xr} ${yt + 18} L${xv} ${yt + 18} L${xv} ${(yt + yb) / 2 - 16} M${xv} ${(yt + yb) / 2 + 16} L${xv} ${yb - 18} L${xr} ${yb - 18}`);
    SY.meter(g, xv, (yt + yb) / 2, 'V', C.aqua2);
    [[xr, yt + 18], [xr, yb - 18]].forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 3.5, fill: C.ink }, g));
    if (lab) { T(g, xr - 14, (yt + yb) / 2 + 4, 'R', { 'text-anchor': 'end', 'font-style': 'italic', 'font-weight': 700, 'font-size': 16 }); T(g, xl - 24, (yt + yb) / 2 + 4, 'E', { 'text-anchor': 'end', 'font-style': 'italic', 'font-weight': 700, 'font-size': 16 }); }
  }
  L.OHMFIG = { SY, circuit, T, W };

  /* example data (labelled 100 Ω; supply internal resistance makes V a little lower than the setting) */
  const EX = [[2, 1.94, 0.0194], [4, 3.89, 0.0388], [6, 5.82, 0.0583], [8, 7.77, 0.0776], [10, 9.70, 0.0972]].map(([s, v, i]) => ({ s, v, i, R: v / i }));
  const exM = EX.reduce((a, r) => a + r.v * r.i, 0) / EX.reduce((a, r) => a + r.v * r.v, 0);
  L.OHM_EX = EX;

  (function aimFig() {
    const s = $('ohm-aim-fig'), g = el('g', null, s);
    circuit(g, 70, 60, 230, 180, true);
    T(g, 230, 286, 'ammeter in series · voltmeter across R', { 'text-anchor': 'middle', 'font-size': 13.5, fill: C.muted });
    const P = L.makePlot(el('svg', { x: 440, y: 10, width: 350, height: 280 }, s), { W: 350, H: 280, ml: 54, mt: 36, mb: 46, mr: 16, xmax: 10, ymax: 0.1, xstep: 2, ystep: 0.02, ydec: 2, xlabel: [{ i: 'V' }, ' (V)'], ylabel: [{ i: 'I' }, ' (A)'] });
    el('line', { x1: P.X(0), y1: P.Y(0), x2: P.X(10), y2: P.Y(0.1), stroke: C.acc, 'stroke-width': 2.4 }, P.g);
    EX.forEach(r => el('circle', { cx: P.X(r.v), cy: P.Y(r.i), r: 4.5, fill: '#fff', stroke: C.ink, 'stroke-width': 1.8 }, P.g));
    T(P.g, P.X(5.4), P.Y(0.074), 'slope S = 1/R', { 'font-size': 13.5, fill: C.acc2, 'font-weight': 700 });
  })();

  (function devices() {
    const s = $('ohm-dev-fig'), cap = $('ohm-dev-cap'), seg = $('dev-seg');
    const CAP = [
      'A pacemaker sends small electrical pulses down a lead to the heart muscle. It checks the lead impedance from V = IR on each pulse: a sudden rise suggests a broken lead, a sudden fall an insulation fault.',
      'An implantable cardioverter-defibrillator (ICD) watches the heart rhythm and, in ventricular fibrillation, delivers a high-energy shock between its coil electrodes. The current it drives depends on the resistance of the heart tissue in the path.',
      'A pulmonary artery pressure sensor sits in a branch of the pulmonary artery and is read wirelessly from outside the body. It helps doctors adjust treatment in heart failure by tracking the pressure in the lung circulation.'
    ];
    function draw(k) {
      s.innerHTML = ''; const g = el('g', null, s);
      el('path', { d: 'M250 330 C 230 250 230 160 280 100 C 330 50 530 50 580 100 C 630 160 630 250 610 330', fill: '#f8f1ec', stroke: '#d8c4b6', 'stroke-width': 2 }, g);
      el('path', { d: 'M430 70 L430 330', stroke: '#eadbd0', 'stroke-width': 2 }, g);
      el('path', { d: 'M300 140 C 330 120 360 130 380 150 M560 140 C 530 120 500 130 480 150', fill: 'none', stroke: '#e3cdbf', 'stroke-width': 2 }, g);
      el('path', { d: 'M410 200 C 380 170 400 140 430 160 C 460 140 490 170 460 210 L 435 245 Z', fill: '#f2c4cf', stroke: C.acc, 'stroke-width': 2 }, g);
      T(g, 470, 240, 'heart', { 'font-size': 13, fill: C.acc2 });
      el('path', { d: 'M430 158 C 420 120 380 110 340 120', fill: 'none', stroke: '#9cc7d8', 'stroke-width': 9, 'stroke-linecap': 'round' }, g);
      T(g, 300, 114, 'pulmonary artery', { 'font-size': 12.5, fill: C.aqua2, 'text-anchor': 'middle' });
      const on = (i, f) => f(i === k ? 1 : .28);
      on(0, o => { el('rect', { x: 330, y: 130, width: 42, height: 32, rx: 12, fill: '#cfd5dc', stroke: C.slate2, 'stroke-width': 2, opacity: o }, g); el('path', { d: 'M372 146 C 400 150 410 175 425 205', fill: 'none', stroke: C.slate2, 'stroke-width': 2.4, opacity: o }, g); T(g, 351, 186, 'pacemaker', { 'font-size': 12.5, 'text-anchor': 'middle', opacity: o }); });
      on(1, o => { el('rect', { x: 498, y: 124, width: 56, height: 40, rx: 14, fill: '#cfd5dc', stroke: C.slate2, 'stroke-width': 2, opacity: o }, g); el('path', { d: 'M500 150 C 470 160 455 185 448 222', fill: 'none', stroke: C.slate2, 'stroke-width': 2.4, opacity: o }, g); el('path', { d: 'M452 200 L446 226', stroke: C.acc, 'stroke-width': 5, opacity: o }, g); T(g, 526, 182, 'ICD', { 'font-size': 12.5, 'text-anchor': 'middle', opacity: o }); });
      on(2, o => { el('rect', { x: 352, y: 112, width: 22, height: 9, rx: 3, fill: C.aqua2, opacity: o }, g); el('path', { d: 'M348 116 l-8 -6 M348 116 l-8 6 M378 116 l8 -6 M378 116 l8 6', stroke: C.aqua2, 'stroke-width': 1.5, opacity: o }, g); [16, 28].forEach(r => el('path', { d: `M${363 - r} ${70} A ${r} ${r} 0 0 1 ${363 + r} 70`, fill: 'none', stroke: C.aqua, 'stroke-width': 1.5, 'stroke-dasharray': '3 3', opacity: o }, g)); T(g, 363, 44, 'sensor, read wirelessly', { 'font-size': 12.5, 'text-anchor': 'middle', opacity: o }); });
      el('rect', { x: 650, y: 60, width: 190, height: 210, rx: 6, fill: '#fff', stroke: C.line2 }, g);
      T(g, 745, 90, ['Pacemaker', 'ICD', 'PA sensor'][k], { 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700, fill: C.ink, 'font-family': F_HEAD });
      [['lead impedance', 'typically 300–1500 Ω'], ['shock path', 'roughly 30–100 Ω'], ['measures', 'pressure, mmHg']][k].forEach((t, i) => T(g, 745, 130 + i * 30, t, { 'text-anchor': 'middle', 'font-size': 13.5, fill: i ? C.acc2 : C.muted, 'font-weight': i ? 700 : 400 }));
      T(g, 745, 230, k < 2 ? 'R = V / I' : 'Ohm\u2019s law in its electronics', { 'text-anchor': 'middle', 'font-size': 13, fill: C.slate });
      cap.textContent = CAP[k];
    }
    seg.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); draw(+b.dataset.d); });
    draw(0);
  })();

  (function ivExplorer() {
    const s = $('ohm-ex-svg'), seg = $('ohm-ex-seg'), vIn = $('ohm-ex-v'), out = $('ohm-ex-out');
    const F = { res: v => v / 100, lamp: v => 0.06 * Math.sqrt(v / 10) * (v > 0 ? 1 : 0) * 1.0 + 0, diode: v => v < 0.6 ? 0 : Math.min(0.1, 0.0005 * (Math.exp((v - 0.6) / 0.06) - 1)) };
    F.lamp = v => 0.1 * Math.pow(v / 10, 0.55);
    const NAME = { res: 'Resistor', lamp: 'Filament lamp', diode: 'Diode' };
    let c = 'res';
    function draw() {
      const v = +vIn.value; $('ohm-ex-vv').textContent = v.toFixed(1) + ' V';
      s.innerHTML = '';
      const P = L.makePlot(s, { W: 520, H: 340, ml: 66, mt: 42, xmax: 10, ymax: 0.1, xstep: 2, ystep: 0.02, ydec: 2, xlabel: [{ i: 'V' }, ' (V)'], ylabel: [{ i: 'I' }, ' (A)'] });
      Object.keys(F).forEach(k => { const pts = []; for (let x = 0; x <= 10.001; x += 0.05) pts.push(`${P.X(x).toFixed(1)} ${P.Y(Math.min(0.1, F[k](x))).toFixed(1)}`); el('path', { d: 'M' + pts.join(' L'), fill: 'none', stroke: k === c ? C.acc : C.slate3, 'stroke-width': k === c ? 3 : 1.4, opacity: k === c ? 1 : .6 }, P.g); });
      const i = Math.min(0.1, F[c](v));
      el('line', { x1: P.X(v), y1: P.Y(0), x2: P.X(v), y2: P.Y(i), stroke: C.acc, 'stroke-dasharray': '3 3' }, P.g);
      el('line', { x1: P.X(0), y1: P.Y(i), x2: P.X(v), y2: P.Y(i), stroke: C.acc, 'stroke-dasharray': '3 3' }, P.g);
      el('circle', { cx: P.X(v), cy: P.Y(i), r: 6, fill: C.acc, stroke: '#fff', 'stroke-width': 2 }, P.g);
      const R = i > 1e-6 ? v / i : Infinity;
      out.innerHTML = `<b>${NAME[c]}</b> at V = ${v.toFixed(1)} V: I = ${(i * 1000).toFixed(1)} mA, so V/I = <b>${isFinite(R) ? R.toFixed(0) + ' Ω' : 'very large'}</b><br>` + (c === 'res' ? '<span class="tag good">ohmic: V/I is the same at every voltage</span>' : c === 'lamp' ? '<span class="tag acc">non-ohmic: V/I grows as the filament heats</span>' : '<span class="tag bad">non-ohmic: almost no current below about 0.6 V</span>');
    }
    seg.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; c = b.dataset.c; seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); draw(); });
    vIn.addEventListener('input', draw); draw();
  })();

  (function internal() {
    const s = $('ohm-th-int'), g = el('g', null, s);
    el('rect', { x: 40, y: 40, width: 220, height: 170, rx: 8, fill: '#fbecf2', stroke: C.acc3, 'stroke-dasharray': '6 4' }, g);
    T(g, 150, 32, 'real supply', { 'text-anchor': 'middle', 'font-size': 13.5, fill: C.acc2, 'font-weight': 600 });
    W(g, 'M90 125 L90 100 M90 150 L90 180 L150 180 M150 70 L90 70 L90 100');
    SY.cell(g, 90, 125, true); T(g, 56, 130, 'E', { 'font-style': 'italic', 'font-weight': 700, 'font-size': 17, 'text-anchor': 'middle' });
    W(g, 'M150 70 L180 70'); SY.res(g, 201, 70, false); W(g, 'M222 70 L300 70'); T(g, 201, 56, 'r', { 'font-style': 'italic', 'font-weight': 700, 'font-size': 16, 'text-anchor': 'middle' });
    W(g, 'M150 180 L300 180');
    W(g, 'M300 70 L420 70 L420 104 M420 146 L420 180 L300 180'); SY.res(g, 420, 125, true); T(g, 444, 130, 'R', { 'font-style': 'italic', 'font-weight': 700, 'font-size': 16 });
    [[300, 70], [300, 180]].forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 4.5, fill: '#fff', stroke: C.ink, 'stroke-width': 2 }, g));
    W(g, 'M300 84 L300 166', { stroke: C.aqua2, 'stroke-dasharray': '4 4', 'stroke-width': 1.6 });
    T(g, 310, 130, 'V = E − I r', { 'font-size': 14.5, fill: C.aqua2, 'font-weight': 700 });
    el('path', { d: 'M330 60 L380 60 M372 54 L382 60 L372 66', fill: 'none', stroke: C.acc, 'stroke-width': 2 }, g); T(g, 355, 50, 'I', { 'font-style': 'italic', 'font-weight': 700, fill: C.acc2, 'text-anchor': 'middle' });
  })();

  (function symbols() {
    const eq = [
      g => { el('rect', { x: 22, y: 8, width: 76, height: 44, rx: 5, fill: 'url(#x)', stroke: C.slate2, 'stroke-width': 1.6, style: 'fill:#e9ecf0' }, g); el('rect', { x: 30, y: 15, width: 34, height: 14, rx: 2, fill: '#cfe0d3' }, g); T(g, 47, 26, '6.0', { 'font-size': 10, 'text-anchor': 'middle', fill: C.ink }); el('circle', { cx: 80, cy: 22, r: 7, fill: C.slate2 }, g); el('circle', { cx: 40, cy: 42, r: 4, fill: C.bad }, g); el('circle', { cx: 58, cy: 42, r: 4, fill: C.ink }, g); },
      g => { el('rect', { x: 26, y: 4, width: 68, height: 52, rx: 6, fill: '#f4f6f8', stroke: C.slate2, 'stroke-width': 1.6 }, g); el('path', { d: 'M36 34 A 26 26 0 0 1 84 34', fill: 'none', stroke: C.ink2 }, g); el('line', { x1: 60, y1: 40, x2: 74, y2: 18, stroke: C.acc, 'stroke-width': 1.6 }, g); T(g, 60, 52, 'V', { 'font-size': 10, 'text-anchor': 'middle', 'font-weight': 700 }); },
      g => { el('rect', { x: 26, y: 4, width: 68, height: 52, rx: 6, fill: '#f4f6f8', stroke: C.slate2, 'stroke-width': 1.6 }, g); el('path', { d: 'M36 34 A 26 26 0 0 1 84 34', fill: 'none', stroke: C.ink2 }, g); el('line', { x1: 60, y1: 40, x2: 50, y2: 17, stroke: C.acc, 'stroke-width': 1.6 }, g); T(g, 60, 52, 'mA', { 'font-size': 10, 'text-anchor': 'middle', 'font-weight': 700 }); },
      g => { el('line', { x1: 10, y1: 30, x2: 110, y2: 30, stroke: '#9aa3b0', 'stroke-width': 2 }, g); el('rect', { x: 36, y: 20, width: 48, height: 20, rx: 8, fill: '#ecd9b8', stroke: '#b89a6a' }, g); [44, 52, 60].forEach((x, i) => el('rect', { x, y: 20, width: 4, height: 20, fill: ['#7a4b26', '#1c2230', '#7a4b26'][i] }, g)); el('rect', { x: 72, y: 20, width: 4, height: 20, fill: '#c8a24a' }, g); }
    ];
    const sy = [g => { W(g, 'M10 30 L54 30 M66 30 L110 30'); SY.cell(g, 60, 30, false); }, g => { W(g, 'M10 30 L44 30 M76 30 L110 30'); SY.meter(g, 60, 30, 'V', C.aqua2); }, g => { W(g, 'M10 30 L44 30 M76 30 L110 30'); SY.meter(g, 60, 30, 'A', C.acc2); }, g => { W(g, 'M10 30 L39 30 M81 30 L110 30'); SY.res(g, 60, 30, false); }];
    eq.forEach((f, i) => f(el('g', null, $('ohm-eq-' + i)))); sy.forEach((f, i) => f(el('g', null, $('ohm-sy-' + i))));
  })();

  (function stepFig() {
    const s = $('ohm-step-svg');
    const caps = ['Supply, ammeter and resistor in one loop; the voltmeter joins the two ends of the resistor.', 'Switched on, both needles move: the ammeter gives I, the voltmeter the V across the resistor.', 'Each new supply setting gives a new pair of readings: one row of the table each time.', 'The points of I against V fall on a straight line through the origin: Ohm\u2019s law holds.', 'Two points far apart on the line give the slope S = ΔI ÷ ΔV.', 'R = 1 ÷ S: about 100 Ω for the example values.'];
    function draw(i) {
      s.innerHTML = ''; const g = el('g', null, s);
      if (i <= 2) {
        circuit(g, 100, 70, 230, 200, true);
        if (i >= 1) { T(g, 215, 46, i === 1 ? 'I = 19.4 mA' : 'I = 19.4 → 38.8 → … mA', { 'text-anchor': 'middle', 'font-size': 15, fill: C.acc2, 'font-weight': 700 }); T(g, 400, 180, i === 1 ? 'V = 1.94 V' : 'V = 1.94 → 3.89 → … V', { 'font-size': 15, fill: C.aqua2, 'font-weight': 700 }); }
        if (i === 2) T(g, 60, 310, 'supply: 2 → 4 → 6 → 8 → 10 V', { 'font-size': 15, fill: C.ink, 'font-weight': 600 });
      } else {
        const P = L.makePlot(s, { W: 520, H: 360, ml: 70, mt: 44, xmax: 10, ymax: 0.1, xstep: 2, ystep: 0.02, ydec: 2, xlabel: [{ i: 'V' }, ' (V)'], ylabel: [{ i: 'I' }, ' (A)'] });
        if (i >= 3) el('line', { x1: P.X(0), y1: P.Y(0), x2: P.X(10), y2: P.Y(10 * exM), stroke: C.acc, 'stroke-width': 2.4 }, P.g);
        EX.forEach(r => el('circle', { cx: P.X(r.v), cy: P.Y(r.i), r: 5, fill: '#fff', stroke: C.ink, 'stroke-width': 2 }, P.g));
        if (i >= 4) { const a = { x: 2, y: 2 * exM }, b = { x: 10, y: 10 * exM }; el('path', { d: `M${P.X(a.x)} ${P.Y(a.y)} L${P.X(b.x)} ${P.Y(a.y)} L${P.X(b.x)} ${P.Y(b.y)}`, fill: 'none', stroke: C.aqua2, 'stroke-dasharray': '5 4', 'stroke-width': 1.8 }, P.g); T(P.g, P.X(6), P.Y(a.y) + 20, 'ΔV', { 'text-anchor': 'middle', fill: C.aqua2, 'font-weight': 700 }); T(P.g, P.X(10) - 8, P.Y((a.y + b.y) / 2), 'ΔI', { 'text-anchor': 'end', fill: C.aqua2, 'font-weight': 700 }); }
        if (i === 5) T(P.g, P.X(1), P.Y(0.09), `R = 1 ÷ ${exM.toFixed(4)} ≈ ${(1 / exM).toFixed(0)} Ω`, { 'font-size': 17, fill: C.acc2, 'font-weight': 700 });
      }
    }
    L.methodSteps($('ohm-steps'), $('ohm-step-cap'), draw, caps);
  })();

  (function example() {
    const tb = document.querySelector('#ohm-ex-table tbody');
    tb.innerHTML = EX.map(r => `<tr><td>${r.s}</td><td>${r.v.toFixed(2)}</td><td>${r.i.toFixed(4)}</td><td class="calc-c">${r.R.toFixed(2)}</td></tr>`).join('');
    const RE = EX.reduce((a, r) => a + r.R, 0) / EX.length;
    const a = { x: 2, y: +(2 * exM).toFixed(4) }, b = { x: 10, y: +(10 * exM).toFixed(4) }, S = (b.y - a.y) / (b.x - a.x), RG = 1 / S, RT = 100;
    const P = L.makePlot($('ohm-ex-graph'), { W: 760, H: 470, ml: 84, xmax: 10, ymax: 0.12, xstep: 2, ystep: 0.02, ydec: 2, xlabel: [{ i: 'V' }, ' (volt)'], ylabel: [{ i: 'I' }, ' (ampere)'] });
    el('line', { x1: P.X(0), y1: P.Y(0), x2: P.X(10.3), y2: P.Y(10.3 * exM), stroke: C.acc, 'stroke-width': 2.4 }, P.g);
    el('path', { d: `M${P.X(a.x)} ${P.Y(a.y)} L${P.X(b.x)} ${P.Y(a.y)} L${P.X(b.x)} ${P.Y(b.y)}`, fill: 'none', stroke: C.aqua2, 'stroke-dasharray': '5 4', 'stroke-width': 1.8 }, P.g);
    EX.forEach(r => el('circle', { cx: P.X(r.v), cy: P.Y(r.i), r: 5.5, fill: '#fff', stroke: C.ink, 'stroke-width': 2 }, P.g));
    [a, b].forEach((p, k) => { el('rect', { x: P.X(p.x) - 6, y: P.Y(p.y) - 6, width: 12, height: 12, fill: C.acc, transform: `rotate(45 ${P.X(p.x)} ${P.Y(p.y)})` }, P.g); T(P.g, P.X(p.x) + (k ? -12 : 12), P.Y(p.y) + (k ? -12 : -12), `(${p.x.toFixed(2)}, ${p.y.toFixed(4)})`, { 'text-anchor': k ? 'end' : 'start', 'font-size': 14, fill: C.acc2, 'font-weight': 600 }); });
    $('ohm-ex-calc').innerHTML = `
      <div class="calc-step"><span class="cs-n">1</span><span class="sub">R = V/I for each row, then the mean</span><span class="eq-line">R<sub>E</sub> = (${EX.map(r => r.R.toFixed(2)).join(' + ')}) ÷ 5 = <b>${RE.toFixed(2)} Ω</b></span></div>
      <div class="calc-step"><span class="cs-n">2</span><span class="sub">Two points far apart on the best-fit line</span><span class="eq-line">(x<sub>1</sub>, y<sub>1</sub>) = (${a.x.toFixed(2)}, ${a.y.toFixed(4)}) &nbsp;·&nbsp; (x<sub>2</sub>, y<sub>2</sub>) = (${b.x.toFixed(2)}, ${b.y.toFixed(4)})</span></div>
      <div class="calc-step"><span class="cs-n">3</span><span class="sub">Slope</span><span class="eq-line">S = (${b.y.toFixed(4)} − ${a.y.toFixed(4)}) ÷ (${b.x.toFixed(2)} − ${a.x.toFixed(2)}) = ${(b.y - a.y).toFixed(4)} ÷ ${(b.x - a.x).toFixed(2)} = <b>${S.toFixed(5)} A/V</b></span></div>
      <div class="calc-step"><span class="cs-n">4</span><span class="sub">Resistance from the graph</span><span class="eq-line">R<sub>G</sub> = 1 ÷ S = 1 ÷ ${S.toFixed(5)} = <b>${RG.toFixed(1)} Ω</b></span></div>
      <div class="calc-step result"><span class="cs-n">✓</span><span class="sub">Percentage error against the labelled value</span><span class="eq-line">|R<sub>G</sub> − R<sub>T</sub>| ÷ R<sub>T</sub> × 100 = |${RG.toFixed(1)} − ${RT}| ÷ ${RT} × 100 = <b>${(Math.abs(RG - RT) / RT * 100).toFixed(1)} %</b></span></div>`;
    $('ohm-ex-res').innerHTML = `<thead><tr><th>Result</th><th>Value</th><th>From</th></tr></thead><tbody><tr><td>Theoretical R<sub>T</sub></td><td>${RT} Ω</td><td>label on the resistor</td></tr><tr><td>Experimental R<sub>E</sub></td><td>${RE.toFixed(1)} Ω</td><td>mean of V/I</td></tr><tr><td>Graphical R<sub>G</sub></td><td>${RG.toFixed(1)} Ω</td><td>1 ÷ slope</td></tr></tbody>`;
  })();
  L.mcq($('ohm-mcq-list'), L.MCQ.ohm, $('ohm-mcq-score'), $('ohm-mcq-reset'));
})(window.SOL);
