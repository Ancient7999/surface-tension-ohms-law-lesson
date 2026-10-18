/* Lab 9 · the Ohm's law bench: wiring with validation, meters, table, I–V graph, calculation and tutorial */
(function (L) {
  'use strict';
  const { el, txt, $, clamp, parseNum, near, C, F_HEAD, F_BODY, defs, NUM, setWork, tween, tut } = L;
  const svg = $('ohm-rig'); defs(svg, 'or');
  const R_TRUE = 100, R_INT = 2, R_A = 1, R_V = 1e6, RT = 100;
  const T = (g, x, y, s, o) => txt(g, x, y, s, Object.assign({ 'font-family': F_BODY, 'font-size': 14, fill: C.ink2 }, o || {}));
  const TERMS = {
    'P+': { x: 110, y: 470, col: '#c0392b', nm: 'supply +' }, 'P-': { x: 210, y: 470, col: '#1c2230', nm: 'supply −' },
    'A+': { x: 380, y: 222, col: '#c0392b', nm: 'ammeter +' }, 'A-': { x: 510, y: 222, col: '#1c2230', nm: 'ammeter −' },
    'V+': { x: 680, y: 222, col: '#c0392b', nm: 'voltmeter +' }, 'V-': { x: 810, y: 222, col: '#1c2230', nm: 'voltmeter −' },
    'R1': { x: 520, y: 440, col: C.copper, nm: 'resistor end 1' }, 'R2': { x: 800, y: 440, col: C.copper, nm: 'resistor end 2' }
  };
  const KEYS = Object.keys(TERMS);
  const WCOL = ['#c0392b', '#2b6fb3', '#23806a', '#1c2230', '#b06d3b', '#7a4bb3', '#d4880f'];
  const st = { vset: 2, on: false, wires: [], rows: [], order: [], rng: Math.random, scatter: {}, ok: false, read: null, pending: null, busy: false };
  const r2 = v => Math.round(v * 100) / 100, r4 = v => Math.round(v * 1e4) / 1e4;

  /* ---------- drawing the bench ---------- */
  el('rect', { x: 0, y: 545, width: 1000, height: 55, fill: 'url(#or-bench)' }, svg);
  el('line', { x1: 0, y1: 545, x2: 1000, y2: 545, stroke: C.line2 }, svg);
  // power supply
  const psu = el('g', null, svg);
  el('rect', { x: 40, y: 270, width: 240, height: 250, rx: 14, fill: 'url(#or-case)', stroke: C.slate2, 'stroke-width': 1.6, filter: 'url(#or-sh)' }, psu);
  T(psu, 160, 296, 'DC SUPPLY · 0–10 V', { 'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 700, fill: C.slate2, 'letter-spacing': '.08em' });
  el('rect', { x: 62, y: 308, width: 128, height: 56, rx: 6, fill: '#1f2633' }, psu);
  const lcd = T(psu, 126, 346, '', { 'text-anchor': 'middle', 'font-size': 30, 'font-weight': 600, fill: '#7ee0b5', 'font-family': F_HEAD });
  const led = el('circle', { cx: 228, cy: 318, r: 7, fill: '#5b6574', stroke: C.slate2 }, psu);
  T(psu, 228, 346, 'ON', { 'text-anchor': 'middle', 'font-size': 11, fill: C.muted, 'font-weight': 700 });
  const sw = el('g', { class: 'live kfocus', tabindex: 0, role: 'switch', 'aria-label': 'Supply switch', 'aria-checked': 'false' }, psu);
  el('rect', { x: 200, y: 360, width: 58, height: 30, rx: 15, fill: '#d6dbe1', stroke: C.slate2 }, sw);
  const swK = el('circle', { cx: 216, cy: 375, r: 11, fill: '#fff', stroke: C.slate2 }, sw);
  el('rect', { class: 'focus-ring', x: 195, y: 355, width: 68, height: 40, rx: 20, fill: 'none', stroke: C.acc, 'stroke-width': 2 }, sw);
  const mkBtn = (x, lab, dir) => { const b = el('g', { class: 'live sbtn kfocus', tabindex: 0, role: 'button', 'aria-label': dir > 0 ? 'Raise the supply voltage' : 'Lower the supply voltage' }, psu); el('rect', { class: 'sbtn-face', x, y: 378, width: 46, height: 30, rx: 6, fill: '#fff', stroke: C.slate2 }, b); T(b, x + 23, 398, lab, { 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700 }); el('rect', { class: 'focus-ring', x: x - 4, y: 374, width: 54, height: 38, rx: 8, fill: 'none', stroke: C.acc, 'stroke-width': 2 }, b); return b; };
  const bDn = mkBtn(66, '▼', -1), bUp = mkBtn(124, '▲', 1);
  T(psu, 160, 436, 'output', { 'text-anchor': 'middle', 'font-size': 12, fill: C.muted });
  // meters
  function meter(x, y, unit, max, step, minor, lab) {
    const g = el('g', null, svg), cx = x + 125, cy = y + 150, R = 108;
    el('rect', { x, y, width: 250, height: 210, rx: 14, fill: 'url(#or-case)', stroke: C.slate2, 'stroke-width': 1.6, filter: 'url(#or-sh)' }, g);
    el('path', { d: `M${x + 14} ${y + 14} H${x + 236} V${y + 166} H${x + 14} Z`, fill: '#fffdf7', stroke: '#d9d2bd' }, g);
    for (let k = 0; k <= max / minor + 1e-9; k++) {
      const v = k * minor, a = (-50 + 100 * v / max) * Math.PI / 180, major = Math.abs(v / step - Math.round(v / step)) < 1e-6;
      const r1 = R - (major ? 14 : (k % 5 === 0 ? 10 : 6));
      el('line', { x1: cx + Math.sin(a) * r1, y1: cy - Math.cos(a) * r1, x2: cx + Math.sin(a) * R, y2: cy - Math.cos(a) * R, stroke: C.ink, 'stroke-width': major ? 1.4 : .8 }, g);
      if (major) T(g, cx + Math.sin(a) * (R - 26), cy - Math.cos(a) * (R - 26) + 5, String(+v.toFixed(2)), { 'text-anchor': 'middle', 'font-size': 12.5, fill: C.ink, 'font-weight': 600 });
    }
    el('path', { d: `M${cx + Math.sin(-50 * Math.PI / 180) * R} ${cy - Math.cos(-50 * Math.PI / 180) * R} A ${R} ${R} 0 0 1 ${cx + Math.sin(50 * Math.PI / 180) * R} ${cy - Math.cos(50 * Math.PI / 180) * R}`, fill: 'none', stroke: C.ink, 'stroke-width': 1.2 }, g);
    T(g, cx, cy - 34, unit, { 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 700, fill: lab === 'A' ? C.acc2 : C.aqua2, 'font-family': F_HEAD });
    const needle = el('line', { x1: cx, y1: cy, x2: cx, y2: cy - R + 4, stroke: C.acc, 'stroke-width': 2, 'stroke-linecap': 'round', transform: `rotate(-50 ${cx} ${cy})` }, g);
    el('circle', { cx, cy, r: 7, fill: C.slate2 }, g);
    T(g, x + 125, y + 200, lab === 'A' ? 'AMMETER' : 'VOLTMETER', { 'text-anchor': 'middle', 'font-size': 11.5, 'font-weight': 700, fill: C.slate2, 'letter-spacing': '.08em' });
    return { g, cx, cy, needle, max, cur: 0, target: 0, box: [x - 6, y - 6, 262, 222], dial: [x + 10, y + 10, 230, 160] };
  }
  const AM = meter(320, 30, 'mA', 100, 20, 2, 'A'), VM = meter(620, 30, 'V', 10, 2, .2, 'V');
  // breadboard and resistor
  const bb = el('g', null, svg);
  el('rect', { x: 380, y: 330, width: 560, height: 205, rx: 10, fill: 'url(#or-board)', stroke: '#d8d6cb', filter: 'url(#or-sh)' }, bb);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 34; c++) el('rect', { x: 398 + c * 16, y: 352 + r * 16 + (r > 2 ? 72 : 0), width: 5, height: 5, rx: 1, fill: '#cfccbf' }, bb);
  el('line', { x1: 520, y1: 440, x2: 800, y2: 440, stroke: '#9aa3b0', 'stroke-width': 2.4 }, bb);
  el('rect', { x: 610, y: 426, width: 100, height: 28, rx: 11, fill: 'url(#or-res)', stroke: '#b89a6a' }, bb);
  [[628, '#7a4b26'], [644, '#1c2230'], [660, '#7a4b26'], [690, '#c8a24a']].forEach(([x, c]) => el('rect', { x, y: 426, width: 7, height: 28, fill: c }, bb));
  const rLabG = el('g', null, bb);
  el('rect', { x: 586, y: 380, width: 148, height: 28, rx: 5, fill: '#fff', stroke: C.line2 }, rLabG);
  const rLab = T(rLabG, 660, 399, 'labelled 100 Ω', { 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: C.ink });
  el('rect', { x: 516, y: 464, width: 288, height: 24, rx: 4, fill: '#fbfbf8' }, bb);
  T(bb, 660, 481, 'brown · black · brown · gold = 10 × 10¹ Ω ± 5 %', { 'text-anchor': 'middle', 'font-size': 12, fill: C.muted });
  T(bb, 400, 522, 'BREADBOARD', { 'font-size': 11.5, 'font-weight': 700, fill: C.slate3, 'letter-spacing': '.08em' });
  // wires and terminals
  const wireG = el('g', null, svg), tmp = el('path', { d: '', fill: 'none', stroke: C.acc, 'stroke-width': 4, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round', 'pointer-events': 'none' }, svg);
  const termG = el('g', null, svg);
  KEYS.forEach(k => {
    const t = TERMS[k], g = el('g', { class: 'term-pt live kfocus', 'data-t': k, tabindex: 0, role: 'button', 'aria-label': `Terminal: ${t.nm}` }, termG);
    el('circle', { cx: t.x, cy: t.y, r: 15, fill: 'transparent' }, g);
    el('circle', { cx: t.x, cy: t.y, r: 11, fill: t.col, stroke: '#fff', 'stroke-width': 2.5 }, g);
    el('circle', { cx: t.x, cy: t.y, r: 4, fill: '#e9edf1' }, g);
    t.ring = el('circle', { cx: t.x, cy: t.y, r: 17, fill: 'none', stroke: C.acc, 'stroke-width': 2.5, opacity: 0 }, g);
    el('circle', { class: 'focus-ring', cx: t.x, cy: t.y, r: 20, fill: 'none', stroke: C.acc, 'stroke-width': 2 }, g);
    const lab = k[1] === '+' ? '+' : k[1] === '-' ? '−' : '';
    if (lab) T(g, t.x, t.y + (t.y < 300 ? -18 : 32), lab, { 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 800, fill: t.col });
    t.g = g;
  });

  function wirePath(a, b) {
    const A = TERMS[a], B = TERMS[b], d = Math.hypot(B.x - A.x, B.y - A.y), sag = 40 + d * .18;
    return `M${A.x} ${A.y} C${A.x} ${A.y + sag} ${B.x} ${B.y + sag} ${B.x} ${B.y}`;
  }
  function drawWires() {
    wireG.innerHTML = '';
    st.wires.forEach((w, i) => {
      const g = el('g', { class: 'live wire', 'data-i': i }, wireG), d = wirePath(w.a, w.b);
      el('path', { d, fill: 'none', stroke: 'transparent', 'stroke-width': 16 }, g);
      el('path', { d, fill: 'none', stroke: w.col, 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
      el('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': 1.2, 'stroke-linecap': 'round', opacity: .35 }, g);
      w.el = g;
    });
  }

  /* ---------- circuit solver (nodal analysis) ---------- */
  function solve() {
    const par = {}; KEYS.forEach(k => { par[k] = k; });
    const find = k => (par[k] === k ? k : (par[k] = find(par[k])));
    st.wires.forEach(w => { par[find(w.a)] = find(w.b); });
    const node = {}; KEYS.forEach(k => { node[k] = find(k); });
    const gnd = node['P-'], others = [...new Set(KEYS.map(k => node[k]))].filter(n => n !== gnd), idx = {}; others.forEach((n, i) => { idx[n] = i; });
    const n = others.length, G = Array.from({ length: n }, () => new Array(n).fill(0)), I = new Array(n).fill(0), E = st.on ? st.vset : 0;
    const stamp = (a, b, g) => { const ia = idx[a], ib = idx[b]; if (ia != null) G[ia][ia] += g; if (ib != null) G[ib][ib] += g; if (ia != null && ib != null) { G[ia][ib] -= g; G[ib][ia] -= g; } };
    if (st.on) { stamp(node['P+'], node['P-'], 1 / R_INT); if (idx[node['P+']] != null) I[idx[node['P+']]] += E / R_INT; }
    stamp(node['A+'], node['A-'], 1 / R_A); stamp(node['V+'], node['V-'], 1 / R_V); stamp(node['R1'], node['R2'], 1 / R_TRUE);
    for (let i = 0; i < n; i++) G[i][i] += 1e-9;
    for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(G[r][c]) > Math.abs(G[p][c])) p = r; [G[c], G[p]] = [G[p], G[c]]; [I[c], I[p]] = [I[p], I[c]]; for (let r = c + 1; r < n; r++) { const f = G[r][c] / G[c][c]; for (let k = c; k < n; k++) G[r][k] -= f * G[c][k]; I[r] -= f * I[c]; } }
    const x = new Array(n).fill(0); for (let r = n - 1; r >= 0; r--) { let s = I[r]; for (let k = r + 1; k < n; k++) s -= G[r][k] * x[k]; x[r] = s / G[r][r]; }
    const v = k => (node[k] === gnd ? 0 : x[idx[node[k]]]);
    const iSup = st.on ? (E - (v('P+') - v('P-'))) / R_INT : 0;
    return { node, v, E, iSup, iA: (v('A+') - v('A-')) / R_A, vV: v('V+') - v('V-'), iR: (v('R1') - v('R2')) / R_TRUE };
  }
  const same = (s, a, b) => s.node[a] === s.node[b];
  function classify() {
    const s = solve(), used = new Set(); st.wires.forEach(w => { used.add(w.a); used.add(w.b); });
    const free = KEYS.filter(k => !used.has(k));
    if (!st.on) return { s, cls: '', ok: false, t: st.wires.length ? `Supply off. ${st.wires.length} wire${st.wires.length > 1 ? 's' : ''} connected${free.length ? `; not yet wired: ${free.map(k => TERMS[k].nm).join(', ')}` : ''}. Switch ON to test the circuit.` : 'Supply off. Wire the circuit: supply + to ammeter +, ammeter − to the resistor, resistor to supply −, and the voltmeter across the resistor.' };
    if (s.iSup > 0.5) {
      let t = 'Short circuit: a very large current flows. Switch off and check the wiring.';
      const aAcrossR = (same(s, 'A+', 'R1') && same(s, 'A-', 'R2')) || (same(s, 'A+', 'R2') && same(s, 'A-', 'R1'));
      if (same(s, 'P+', 'P-') && !aAcrossR) t = 'Short circuit: a wire joins the + and − of the supply directly. Switch off and remove it.';
      else if (aAcrossR) t = 'The ammeter is in parallel with the resistor. Its tiny resistance short-circuits the resistor and a large current flows through the meter. The ammeter must be in series, in the loop with the resistor.';
      else if (same(s, 'A+', 'P+') && same(s, 'A-', 'P-') || same(s, 'A+', 'P-') && same(s, 'A-', 'P+')) t = 'Short circuit: the ammeter is connected straight across the supply. Its resistance is tiny, so a huge current flows. The ammeter belongs in series.';
      return { s, cls: 'bad', ok: false, t };
    }
    if (Math.abs(s.iR) < 1e-4) {
      const vAcrossR = (same(s, 'V+', 'R1') && same(s, 'V-', 'R2')) || (same(s, 'V+', 'R2') && same(s, 'V-', 'R1'));
      if (!vAcrossR && Math.abs(s.vV) > 0.5 * s.E) return { s, cls: 'bad', ok: false, t: 'The voltmeter is in series. Its very high resistance blocks the current, so the ammeter reads almost zero. Connect the voltmeter across the resistor instead.' };
      return { s, cls: 'warn', ok: false, t: free.length ? `The circuit is not complete: no current flows through the resistor. Not yet wired: ${free.map(k => TERMS[k].nm).join(', ')}.` : 'No current flows through the resistor: the loop supply → ammeter → resistor → supply is not closed.' };
    }
    if (Math.abs(s.iA) < 1e-4) return { s, cls: 'bad', ok: false, t: 'Current flows through the resistor but not through the ammeter: the ammeter is not in the current path. Put it in series, in the loop with the resistor.' };
    if (s.iA < 0) return { s, cls: 'bad', ok: false, t: 'The ammeter is connected the wrong way round: its needle is pushed below zero. Current must enter at its + (red) terminal, coming from the supply +.' };
    const vAcross = (same(s, 'V+', 'R1') && same(s, 'V-', 'R2')) || (same(s, 'V+', 'R2') && same(s, 'V-', 'R1'));
    if (!vAcross) return { s, cls: 'warn', ok: false, t: 'The voltmeter is not connected across the resistor. It must join the two ends of the resistor, one lead at each end, to read the V across it.' };
    if (s.vV < 0) return { s, cls: 'bad', ok: false, t: 'The voltmeter is connected the wrong way round. Its + (red) terminal goes to the end of the resistor nearer the supply +.' };
    return { s, cls: 'ok', ok: true, t: '' };
  }
  function scatter(vs) {
    if (!st.scatter[vs]) { const g = () => (st.rng() + st.rng() + st.rng() - 1.5) * 0.0024; st.scatter[vs] = { dv: g(), di: g() }; }
    return st.scatter[vs];
  }
  const msg = $('ohm-msg'), recMsg = $('ohm-recmsg');
  function say(t, cls) { msg.className = 'rig-msg' + (cls ? ' ' + cls : ''); msg.innerHTML = t; }
  function rsay(t, cls) { recMsg.className = 'rec-msg' + (cls ? ' ' + cls : ''); recMsg.innerHTML = t; }
  function evaluate() {
    const c = classify(); st.ok = c.ok;
    if (c.ok) {
      const sc = scatter(st.vset), V = r2(c.s.vV * (1 + sc.dv)), I = r4(c.s.iA * (1 + sc.di));
      st.read = { s: st.vset, v: V, i: I };
      AM.target = I * 1000; VM.target = V;
      say(`Circuit correct: ammeter in series, voltmeter across the resistor. The meters read <b>V = ${V.toFixed(2)} V</b> and <b>I = ${(I * 1000).toFixed(1)} mA = ${I.toFixed(4)} A</b>.`, 'ok');
    } else {
      st.read = null;
      AM.target = st.on ? c.s.iA * 1000 : 0; VM.target = st.on ? c.s.vV : 0;
      say(c.t, c.cls);
    }
    updStatus();
    return c;
  }
  /* needles: a damped approach on the lesson clock */
  let lastT = L.tnow();
  (function needles() {
    const now = L.tnow(), dt = Math.min(80, Math.max(0, now - lastT)); lastT = now;
    [AM, VM].forEach(m => {
      const tgt = clamp(m.target, -m.max * .04, m.max * 1.06);
      m.cur += (tgt - m.cur) * (tut.on && tut.skip ? 1 : 1 - Math.exp(-dt / 110));
      m.needle.setAttribute('transform', `rotate(${(-50 + 100 * m.cur / m.max).toFixed(2)} ${m.cx} ${m.cy})`);
    });
    requestAnimationFrame(needles);
  })();
  function updStatus() {
    lcd.textContent = st.on ? `${st.vset.toFixed(1)} V` : `${st.vset.toFixed(1)}`; lcd.setAttribute('fill', st.on ? '#7ee0b5' : '#5d7a6c');
    led.setAttribute('fill', st.on ? '#3fd08a' : '#5b6574');
    swK.setAttribute('cx', st.on ? 242 : 216); sw.setAttribute('aria-checked', st.on ? 'true' : 'false');
    $('ohm-vset').textContent = st.vset + ' V'; $('ohm-on').textContent = st.on ? 'Switch OFF' : 'Switch ON'; $('ohm-on').setAttribute('aria-pressed', st.on ? 'true' : 'false');
    $('ohm-vdn').disabled = st.vset <= 2; $('ohm-vup').disabled = st.vset >= 10;
    $('ohm-status').innerHTML = `Supply <b>${st.vset} V</b>, <b>${st.on ? 'ON' : 'OFF'}</b> · wires: <b>${st.wires.length}</b> · circuit: <b>${!st.on ? 'not tested' : st.ok ? 'correct' : 'fault'}</b> · rows recorded: <b>${st.rows.length} of 5</b>`;
    KEYS.forEach(k => TERMS[k].ring.setAttribute('opacity', st.pending === k ? 1 : 0));
  }
  function setV(v) { st.vset = clamp(v, 2, 10); evaluate(); }
  function setOn(o) { st.on = o; evaluate(); if (!o) say('Supply off.' + (st.rows.length ? ' Readings so far are in the table.' : ''), ''); }
  function addWire(a, b) {
    if (a === b) return false;
    if (st.wires.some(w => (w.a === a && w.b === b) || (w.a === b && w.b === a))) { say('Those two terminals are already joined.', 'warn'); return false; }
    st.wires.push({ a, b, col: WCOL[st.wires.length % WCOL.length] }); drawWires(); evaluate(); return true;
  }
  function removeWire(i) { st.wires.splice(i, 1); drawWires(); evaluate(); }
  const guard = f => () => { if (!tut.on) f(); };
  $('ohm-vdn').addEventListener('click', guard(() => setV(st.vset - 2))); $('ohm-vup').addEventListener('click', guard(() => setV(st.vset + 2)));
  $('ohm-on').addEventListener('click', guard(() => setOn(!st.on)));
  $('ohm-clear').addEventListener('click', guard(() => { st.wires = []; st.pending = null; drawWires(); evaluate(); }));
  [[bDn, -2], [bUp, 2]].forEach(([b, d]) => { b.addEventListener('click', guard(() => setV(st.vset + d))); b.addEventListener('keydown', e => { if (!tut.on && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setV(st.vset + d); } }); });
  sw.addEventListener('click', guard(() => setOn(!st.on))); sw.addEventListener('keydown', e => { if (!tut.on && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOn(!st.on); } });
  /* drag or tap to wire */
  let wd = null;
  termG.addEventListener('pointerdown', e => {
    const t = e.target.closest('.term-pt'); if (!t || tut.on) return; e.preventDefault();
    svg.setPointerCapture(e.pointerId); wd = { a: t.dataset.t, moved: false, x0: e.clientX, y0: e.clientY };
  });
  svg.addEventListener('pointermove', e => {
    if (!wd) return; if (Math.hypot(e.clientX - wd.x0, e.clientY - wd.y0) > 6) wd.moved = true;
    if (!wd.moved) return; const p = L.svgPoint(svg, e), A = TERMS[wd.a];
    tmp.setAttribute('d', `M${A.x} ${A.y} C${A.x} ${A.y + 60} ${p.x} ${p.y + 60} ${p.x} ${p.y}`);
  });
  svg.addEventListener('pointerup', e => {
    if (!wd) return; const d = wd; wd = null; tmp.setAttribute('d', '');
    const under = document.elementFromPoint(e.clientX, e.clientY), t = under && under.closest && under.closest('#ohm-rig .term-pt'), b = t && t.dataset.t;
    if (d.moved) { if (b && b !== d.a) addWire(d.a, b); st.pending = null; updStatus(); return; }
    if (st.pending && st.pending !== d.a) { addWire(st.pending, d.a); st.pending = null; } else st.pending = st.pending === d.a ? null : d.a;
    if (st.pending) say(`${TERMS[st.pending].nm[0].toUpperCase() + TERMS[st.pending].nm.slice(1)} selected: now tap the terminal to join it to.`);
    updStatus();
  });
  svg.addEventListener('pointercancel', () => { wd = null; tmp.setAttribute('d', ''); });
  termG.addEventListener('keydown', e => {
    const t = e.target.closest('.term-pt'); if (!t || tut.on || (e.key !== 'Enter' && e.key !== ' ')) return; e.preventDefault();
    const k = t.dataset.t; if (st.pending && st.pending !== k) { addWire(st.pending, k); st.pending = null; } else st.pending = st.pending === k ? null : k; updStatus();
  });
  wireG.addEventListener('click', e => { const w = e.target.closest('.wire'); if (!w || tut.on || wd) return; removeWire(+w.dataset.i); say('Wire removed.'); });

  /* ---------- table ---------- */
  const tbody = $('ohm-tbody');
  function rowCell(s, c) { const tr = tbody.querySelector(`tr[data-s="${s}"]`); return tr ? tr.children[c] : null; }
  function renderTable(fresh, cols) {
    if (!st.rows.length) { tbody.innerHTML = '<tr class="empty"><td colspan="4">No readings yet.</td></tr>'; drawGraph(); workRE(); return; }
    tbody.innerHTML = st.rows.map(r => `<tr data-s="${r.s}"${r.s === fresh && !cols ? ' class="fresh"' : ''}><td>${r.s}</td><td>${(cols && r.s === fresh && cols < 1) ? '' : r.v.toFixed(2)}</td><td>${(cols && r.s === fresh && cols < 2) ? '' : r.i.toFixed(4)}</td><td class="calc-c">${(cols && r.s === fresh && cols < 3) ? '' : (r.v / r.i).toFixed(2)}</td></tr>`).join('');
    drawGraph(); workRE();
  }
  function record(partial) {
    if (!st.on) { rsay('Switch the supply ON first.', 'warn'); return false; }
    if (!st.ok) { rsay('The circuit is not correct yet: see the message under the bench.', 'warn'); return false; }
    if (st.rows.some(r => r.s === st.vset)) { rsay(`The ${st.vset} V row is already in the table. Change the supply setting for a new row.`, 'warn'); return false; }
    const r = Object.assign({}, st.read); st.rows.push(r); st.order.push(r.s); st.rows.sort((a, b) => a.s - b.s);
    renderTable(r.s, partial); updStatus();
    rsay(`Supply ${r.s} V: V = ${r.v.toFixed(2)} V, I = ${r.i.toFixed(4)} A, R = V/I = ${(r.v / r.i).toFixed(2)} Ω.`, 'ok');
    return true;
  }
  function undo() { if (!st.order.length) return; const s = st.order.pop(); st.rows = st.rows.filter(r => r.s !== s); renderTable(); updStatus(); rsay('Last row deleted.'); }
  $('ohm-record').addEventListener('click', guard(() => record())); $('ohm-undo').addEventListener('click', guard(undo));

  /* ---------- graph with two draggable handles ---------- */
  const gsvg = $('ohm-graph');
  const P = L.makePlot(gsvg, { W: 760, H: 470, ml: 86, xmax: 10, ymax: 0.12, xstep: 2, ystep: 0.02, ydec: 2, xlabel: [{ i: 'V' }, ' (volt)'], ylabel: [{ i: 'I' }, ' (ampere)'] });
  const lineG = el('g', null, P.g), ptsG = el('g', null, P.g), hG = el('g', null, P.g);
  const fitLine = el('line', { class: 'fit-line', stroke: C.acc, 'stroke-width': 2.4 }, lineG);
  const tri = el('path', { fill: 'none', stroke: C.aqua2, 'stroke-dasharray': '5 4', 'stroke-width': 1.6 }, lineG);
  const lDV = T(lineG, 0, 0, 'ΔV', { 'text-anchor': 'middle', fill: C.aqua2, 'font-weight': 700 }), lDI = T(lineG, 0, 0, 'ΔI', { 'text-anchor': 'end', fill: C.aqua2, 'font-weight': 700 });
  const H = { A: { x: 1, y: 0.03 }, B: { x: 9, y: 0.07 } };
  const handles = ['A', 'B'].map((k, i) => {
    const g = el('g', { class: 'gh', 'data-h': k, tabindex: 0, role: 'slider', 'aria-label': `Handle ${i + 1} on the line` }, hG);
    el('circle', { r: 16, fill: 'transparent' }, g);
    el('rect', { x: -7, y: -7, width: 14, height: 14, fill: C.acc, stroke: '#fff', 'stroke-width': 2, transform: 'rotate(45)' }, g);
    T(g, 0, -16, String(i + 1), { 'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 700, fill: C.acc2 });
    return g;
  });
  const gread = $('ohm-gread');
  function drawGraph() {
    ptsG.innerHTML = '';
    st.rows.forEach((r, k) => el('circle', { class: 'gpt', 'data-s': r.s, cx: P.X(r.v), cy: P.Y(r.i), r: 5.5, fill: '#fff', stroke: C.ink, 'stroke-width': 2 }, ptsG));
    const A = H.A, B = H.B, m = (B.y - A.y) / (B.x - A.x || 1e-9), y = x => A.y + m * (x - A.x);
    let x1 = 0, x2 = 10; const clipY = x => clamp(y(x), 0, 0.12);
    if (Math.abs(m) > 1e-9) { if (y(0) < 0) x1 = A.x - A.y / m; if (y(10) > 0.12) x2 = A.x + (0.12 - A.y) / m; if (y(10) < 0) x2 = A.x - A.y / m; if (y(0) > .12) x1 = A.x + (.12 - A.y) / m; }
    x1 = clamp(x1, 0, 10); x2 = clamp(x2, 0, 10);
    fitLine.setAttribute('x1', P.X(x1)); fitLine.setAttribute('y1', P.Y(clipY(x1))); fitLine.setAttribute('x2', P.X(x2)); fitLine.setAttribute('y2', P.Y(clipY(x2)));
    const L1 = A.x <= B.x ? A : B, R1 = A.x <= B.x ? B : A;
    tri.setAttribute('d', `M${P.X(L1.x)} ${P.Y(L1.y)} L${P.X(R1.x)} ${P.Y(L1.y)} L${P.X(R1.x)} ${P.Y(R1.y)}`);
    lDV.setAttribute('x', P.X((L1.x + R1.x) / 2)); lDV.setAttribute('y', P.Y(L1.y) + 20); lDI.setAttribute('x', P.X(R1.x) - 8); lDI.setAttribute('y', P.Y((L1.y + R1.y) / 2) + 5);
    handles[0].setAttribute('transform', `translate(${P.X(A.x)} ${P.Y(A.y)})`); handles[1].setAttribute('transform', `translate(${P.X(B.x)} ${P.Y(B.y)})`);
    gread.innerHTML = `Handle 1: (x<sub>1</sub>, y<sub>1</sub>) = (<b>${A.x.toFixed(2)}</b>, <b>${A.y.toFixed(4)}</b>) · Handle 2: (x<sub>2</sub>, y<sub>2</sub>) = (<b>${B.x.toFixed(2)}</b>, <b>${B.y.toFixed(4)}</b>) · slope = <b>${slope().toFixed(5)}</b> A/V`;
    workS();
  }
  const slope = () => (H.B.y - H.A.y) / (H.B.x - H.A.x || 1e-9);
  let gd = null;
  hG.addEventListener('pointerdown', e => { const h = e.target.closest('.gh'); if (!h || tut.on) return; e.preventDefault(); gsvg.setPointerCapture(e.pointerId); gd = h.dataset.h; });
  gsvg.addEventListener('pointermove', e => { if (!gd) return; const p = L.svgPoint(gsvg, e); H[gd] = { x: +clamp(P.ix(p.x), 0, 10).toFixed(2), y: +clamp(P.iy(p.y), 0, 0.12).toFixed(4) }; drawGraph(); });
  const gEnd = () => { gd = null; }; gsvg.addEventListener('pointerup', gEnd); gsvg.addEventListener('pointercancel', gEnd);
  hG.addEventListener('keydown', e => { const h = e.target.closest('.gh'); if (!h || tut.on) return; const k = h.dataset.h, d = { ArrowLeft: [-.1, 0], ArrowRight: [.1, 0], ArrowUp: [0, .001], ArrowDown: [0, -.001] }[e.key]; if (!d) return; e.preventDefault(); H[k] = { x: +clamp(H[k].x + d[0], 0, 10).toFixed(2), y: +clamp(H[k].y + d[1], 0, .12).toFixed(4) }; drawGraph(); });
  $('ohm-greset').addEventListener('click', guard(() => { H.A = { x: 1, y: 0.03 }; H.B = { x: 9, y: 0.07 }; drawGraph(); }));
  const fitSlope = () => { const n = st.rows.reduce((a, r) => a + r.v * r.i, 0), d = st.rows.reduce((a, r) => a + r.v * r.v, 0); return d ? n / d : NaN; };

  /* ---------- calculation ---------- */
  const IN = { S: $('ohm-in-S'), RG: $('ohm-in-RG'), RE: $('ohm-in-RE'), RT: $('ohm-in-RT'), pe: $('ohm-in-pe') };
  const wS = $('ohm-w-S'), wRG = $('ohm-w-RG'), wRE = $('ohm-w-RE'), wPE = $('ohm-w-pe'), chk = $('ohm-chk'), res = $('ohm-result');
  function workS() { const A = H.A, B = H.B; setWork(wS, `= (${NUM('y2', B.y.toFixed(4))} − ${NUM('y1', A.y.toFixed(4))}) ÷ (${NUM('x2', B.x.toFixed(2))} − ${NUM('x1', A.x.toFixed(2))}) = ${NUM('dy', (B.y - A.y).toFixed(4))} ÷ ${NUM('dx', (B.x - A.x).toFixed(2))} = ${NUM('r-S', slope().toFixed(5))}`); }
  function workRG() { const s = parseNum(IN.S.value); setWork(wRG, isFinite(s) && s !== 0 ? `= 1 ÷ ${NUM('SGv', IN.S.value.trim())} = ${NUM('r-RG', (1 / s).toFixed(1))}` : ''); }
  function meanR() { return st.rows.length ? st.rows.reduce((a, r) => a + r.v / r.i, 0) / st.rows.length : NaN; }
  function workRE() { setWork(wRE, st.rows.length ? `= (${st.rows.map(r => NUM('R' + r.s, (r.v / r.i).toFixed(2))).join(' + ')}) ÷ ${NUM('nR', st.rows.length)} = ${NUM('r-RE', meanR().toFixed(1))}` : ''); }
  function workPE() { const g = parseNum(IN.RG.value), t = parseNum(IN.RT.value); setWork(wPE, isFinite(g) && isFinite(t) && t ? `= |${NUM('RGv', IN.RG.value.trim())} − ${NUM('RTv', IN.RT.value.trim())}| ÷ ${NUM('RTv2', IN.RT.value.trim())} × 100 = ${NUM('r-pe', (Math.abs(g - t) / t * 100).toFixed(1))}` : ''); }
  Object.values(IN).forEach(i => i.addEventListener('input', () => { i.classList.remove('flag', 'okf'); workRG(); workPE(); }));
  function check() {
    const v = { S: parseNum(IN.S.value), RG: parseNum(IN.RG.value), RE: parseNum(IN.RE.value), RT: parseNum(IN.RT.value), pe: parseNum(IN.pe.value) }, notes = [];
    Object.values(IN).forEach(i => i.classList.remove('flag', 'okf'));
    if (st.rows.length < 3) { chk.className = 'check-msg nudge'; chk.innerHTML = 'Record at least three rows (ideally all five, 2 to 10 V) before the calculation.'; res.hidden = true; return false; }
    const flag = (k, t) => { IN[k].classList.add('flag'); notes.push(t); }, ok = k => IN[k].classList.add('okf');
    const Sx = slope(), fs = fitSlope();
    if (!near(Sx, fs, 0.04)) notes.push(`The line through the two handles does not follow the points (its slope ${Sx.toFixed(5)} differs from the trend of the points, about ${fs.toFixed(5)}). Drag both handles onto the best straight line first.`);
    if (near(v.S, Sx, .01)) ok('S');
    else if (near(v.S, 1 / Sx, .02)) flag('S', 'That is ΔV ÷ ΔI, the slope with the axes swapped. With I on the y-axis, S = (y₂ − y₁) ÷ (x₂ − x₁) = ΔI ÷ ΔV, about 0.01 A/V.');
    else if (near(v.S, Sx * 1000, .02)) flag('S', 'S looks like it was worked out in mA. With I in amperes, S = ' + Sx.toFixed(5) + ' A/V.');
    else flag('S', 'S = (y₂ − y₁) ÷ (x₂ − x₁), with the two handle positions shown under the graph.');
    const Sv = near(v.S, Sx, .01) ? v.S : Sx;
    if (near(v.RG, 1 / Sv, .01)) ok('RG');
    else if (near(v.RG, Sv, .02)) flag('RG', 'R_G = 1 ÷ S, not S itself.');
    else if (near(v.RG, 1 / Sv / 1000, .02) || near(v.RG, 1 / (Sv * 1000), .02)) flag('RG', 'R_G came out a thousand times too small: the current was taken in mA as if it were A.');
    else if (near(v.RG, Sv * 1e4, .03) || near(v.RG, 1 / Sv * 100, .02)) flag('RG', 'With an inverted slope (ΔV/ΔI ≈ 100), 1 ÷ it gives 0.01, not R. S must be ΔI ÷ ΔV.');
    else flag('RG', `R_G = 1 ÷ S = 1 ÷ ${Sv.toFixed(5)}.`);
    const mR = meanR();
    if (near(v.RE, mR, .005)) ok('RE');
    else if (near(v.RE, mR * st.rows.length, .01)) flag('RE', `That is the sum of the R column. Divide it by the number of rows, ${st.rows.length}.`);
    else if (near(v.RE, mR / 1000, .02)) flag('RE', 'R_E is a thousand times too small: in R = V/I the current must be in amperes, not mA.');
    else flag('RE', 'R_E is the mean of the R = V/I column of the table.');
    if (near(v.RT, RT, .001)) ok('RT'); else flag('RT', 'R_T is the labelled value of the resistor on the breadboard: 100 Ω.');
    const pe = isFinite(v.RG) && isFinite(v.RT) && v.RT ? Math.abs(v.RG - v.RT) / v.RT * 100 : NaN;
    if (isFinite(pe) && Math.abs(v.pe - pe) <= .15) ok('pe');
    else if (isFinite(pe) && Math.abs(v.pe - pe / 100) <= .002 && pe > .5) flag('pe', 'That is the fraction |R_G − R_T| ÷ R_T. Multiply by 100 for a percentage.');
    else flag('pe', '% error = |R_G − R_T| ÷ R_T × 100, with the R_G and R_T values above.');
    if (!notes.length) {
      chk.className = 'check-msg ok'; chk.innerHTML = `All values check out. The points lie on a straight line through the origin, so Ohm's law is verified for this resistor.`;
      const peE = Math.abs(v.RE - v.RT) / v.RT * 100;
      res.hidden = false;
      res.innerHTML = `<h3>Result</h3><table class="res-t"><thead><tr><th></th><th>Value</th><th>% error against R<sub>T</sub></th></tr></thead><tbody><tr><td>Theoretical R<sub>T</sub></td><td>${NUM('resT', v.RT.toFixed(0))} Ω</td><td>—</td></tr><tr><td>Experimental R<sub>E</sub></td><td>${NUM('resE', v.RE.toFixed(1))} Ω</td><td>${NUM('resEp', peE.toFixed(1))} %</td></tr><tr><td>Graphical R<sub>G</sub></td><td>${NUM('resG', v.RG.toFixed(1))} Ω</td><td>${NUM('resGp', v.pe.toFixed(1))} %</td></tr></tbody></table>`;
      return true;
    }
    chk.className = 'check-msg nudge'; chk.innerHTML = 'Not yet:<ul>' + notes.map(n => `<li>${n}</li>`).join('') + '</ul>'; res.hidden = true;
    return false;
  }
  $('ohm-check').addEventListener('click', guard(check));

  /* ---------- traceable calculation ---------- */
  const lSym = (row, k) => document.querySelector(`#${row} label .sym[data-sym="${k}"]`);
  const wNum = (w, ref) => w.querySelector(`.num[data-ref="${ref}"]`);
  const hEl = k => handles[k === 'A' ? 0 : 1];
  const firstR = () => { const r = st.rows[0]; return r ? rowCell(r.s, 3) : null; };
  function INFO(k) {
    const A = H.A, B = H.B, m = /^R(\d+)$/.exec(k);
    if (m) { const s = +m[1], r = st.rows.find(q => q.s === s); return { title: '', nm: `R = V/I for the ${s} V row`, where: r ? `${r.v.toFixed(2)} V ÷ ${r.i.toFixed(4)} A. Table, row "${s} V", last column.` : 'Table, last column.', src: () => rowCell(s, 3) }; }
    switch (k) {
      case 'S': return { title: '<i>S</i>: slope of the I–V line, in A/V', nm: 'S', where: 'Rise over run between the two handles on the best-fit line in the graph. Worked out in the line below.', src: () => fitLine };
      case 'y1': return { title: '<i>y</i><sub>1</sub>: current at handle 1, in A', nm: `y<sub>1</sub>, the current at handle 1 (V = ${A.x.toFixed(2)} V) on the line`, where: 'Read on the I-axis, level with handle 1 on the best-fit line.', src: () => hEl('A') };
      case 'y2': return { title: '<i>y</i><sub>2</sub>: current at handle 2, in A', nm: `y<sub>2</sub>, the current at handle 2 (V = ${B.x.toFixed(2)} V) on the line`, where: 'Read on the I-axis, level with handle 2 on the best-fit line.', src: () => hEl('B') };
      case 'x1': return { title: '<i>x</i><sub>1</sub>: voltage at handle 1, in V', nm: 'x<sub>1</sub>, the voltage at handle 1', where: 'Read on the V-axis, straight below handle 1.', src: () => hEl('A') };
      case 'x2': return { title: '<i>x</i><sub>2</sub>: voltage at handle 2, in V', nm: 'x<sub>2</sub>, the voltage at handle 2', where: 'Read on the V-axis, straight below handle 2.', src: () => hEl('B') };
      case 'dy': return { title: '', nm: 'ΔI = y₂ − y₁, the rise in A', where: 'The vertical side of the dashed triangle on the graph.', src: () => tri };
      case 'dx': return { title: '', nm: 'ΔV = x₂ − x₁, the run in V', where: 'The horizontal side of the dashed triangle on the graph.', src: () => tri };
      case 'r-S': return { title: '', nm: 'S, the slope in A/V', where: 'The result of this line. It goes into the answer box and is used next in R_G = 1 ÷ S.', src: () => wNum(wRG, 'SGv') || lSym('ohm-cr-RG', 'SG') };
      case 'RG': return { title: '<i>R</i><sub>G</sub>: resistance from the graph, in Ω', nm: 'R_G', where: 'One divided by the slope, worked out in the line below.', src: () => wNum(wRG, 'r-RG') || IN.RG };
      case 'SG': case 'SGv': return { title: '<i>S</i>: the slope found above', nm: 'S, the slope in A/V', where: 'From the answer box of the slope line above.', src: () => IN.S };
      case 'r-RG': return { title: '', nm: 'R_G, the graphical resistance in Ω', where: 'The result of this line. It goes into the answer box and the percentage error below.', src: () => wNum(wPE, 'RGv') || lSym('ohm-cr-pe', 'RGp') };
      case 'RE': return { title: '<i>R</i><sub>E</sub>: experimental resistance, in Ω', nm: 'R_E', where: 'The average of the R = V/I values in the last column of the table.', src: () => wNum(wRE, 'r-RE') || IN.RE };
      case 'VI': return { title: '<i>V</i>/<i>I</i>: resistance from each row', nm: 'V/I', where: 'Each row of the table: the voltmeter reading divided by the ammeter reading in A. Table, last column.', src: firstR };
      case 'nR': return { title: '', nm: 'the number of rows', where: 'How many rows of readings are in the table.', src: () => tbody };
      case 'r-RE': return { title: '', nm: 'R_E, the mean of V/I in Ω', where: 'The result of this line. It goes into the answer box and the Result.', src: () => IN.RE.value.trim() ? IN.RE : null };
      case 'RT': return { title: '<i>R</i><sub>T</sub>: theoretical (labelled) resistance, in Ω', nm: 'R_T', where: 'The value marked on the resistor: the label and the colour bands on the breadboard, 100 Ω.', src: () => rLab };
      case 'pe': return { title: 'Percentage error of R<sub>G</sub>', nm: '% error', where: 'How far the graphical value is from the labelled value, as a percentage of the labelled value.', src: () => wNum(wPE, 'r-pe') || IN.pe };
      case 'RGp': case 'RGv': return { title: '<i>R</i><sub>G</sub>: the graphical resistance found above', nm: 'R_G, in Ω', where: 'From the answer box of the R_G line above.', src: () => IN.RG };
      case 'RTp': case 'RTp2': case 'RTv': case 'RTv2': return { title: '<i>R</i><sub>T</sub>: the labelled resistance entered above', nm: 'R_T, in Ω', where: 'From the answer box of the R_T line above.', src: () => IN.RT };
      case 'r-pe': return { title: '', nm: 'the percentage error of R_G', where: 'The result of this line. It goes into the answer box and the Result.', src: () => IN.pe.value.trim() ? IN.pe : null };
      case 'resT': return { title: '', nm: 'R_T in Ω', where: 'From the R_T answer box.', src: () => IN.RT };
      case 'resE': return { title: '', nm: 'R_E in Ω', where: 'From the R_E answer box.', src: () => IN.RE };
      case 'resG': return { title: '', nm: 'R_G in Ω', where: 'From the R_G answer box.', src: () => IN.RG };
      case 'resEp': return { title: '', nm: 'the percentage error of R_E', where: '|R_E − R_T| ÷ R_T × 100.', src: () => IN.RE };
      case 'resGp': return { title: '', nm: 'the percentage error of R_G', where: 'From the % error answer box.', src: () => IN.pe };
    }
    return null;
  }
  L.registerTrace($('ohm-calc'), INFO);

  /* ---------- start over ---------- */
  function reset() {
    Object.assign(st, { vset: 2, on: false, wires: [], rows: [], order: [], scatter: {}, ok: false, read: null, pending: null, busy: false });
    H.A = { x: 1, y: 0.03 }; H.B = { x: 9, y: 0.07 }; AM.cur = AM.target = 0; VM.cur = VM.target = 0;
    Object.values(IN).forEach(i => { i.value = ''; i.classList.remove('flag', 'okf'); });
    L.traceHide(); [wRG, wPE].forEach(w => setWork(w, '')); chk.className = 'check-msg'; chk.innerHTML = ''; res.hidden = true; res.innerHTML = '';
    drawWires(); renderTable(); evaluate(); rsay('');
  }
  $('ohm-reset').addEventListener('click', guard(reset));
  L.onLeave['ohm-practical'] = () => L.tutStop();

  /* ---------- tutorial ---------- */
  const B = (b) => ({ svg, box: b });
  const tBox = k => B([TERMS[k].x - 20, TERMS[k].y - 20, 40, 40]);
  async function wire(Tt, a, b, title, text) {
    await Tt.teach(title, text, { box: B([Math.min(TERMS[a].x, TERMS[b].x) - 24, Math.min(TERMS[a].y, TERMS[b].y) - 24, Math.abs(TERMS[a].x - TERMS[b].x) + 48, Math.abs(TERMS[a].y - TERMS[b].y) + 110]), label: `${TERMS[a].nm} → ${TERMS[b].nm}` });
    const A = TERMS[a], Bt = TERMS[b];
    await tween(1100, k => { const x = A.x + (Bt.x - A.x) * k, y = A.y + (Bt.y - A.y) * k; tmp.setAttribute('d', `M${A.x} ${A.y} C${A.x} ${A.y + 60} ${x} ${y + 60} ${x} ${y}`); });
    tmp.setAttribute('d', ''); addWire(a, b);
  }
  async function reading(Tt, full) {
    const r = st.read, mA = (r.i * 1000).toFixed(1);
    if (full) {
      await Tt.teach('Voltmeter reading', `The voltmeter scale runs 0 to 10 V with a small division of 0.2 V. The needle stops at ${r.v.toFixed(2)} V: the potential difference across the resistor.`, { box: B(VM.dial), label: `V = ${r.v.toFixed(2)} V`, f: `V = ${r.v.toFixed(2)} V` });
      await Tt.teach('Ammeter reading', `The ammeter scale runs 0 to 100 mA with a small division of 2 mA. The needle stops at ${mA} mA. In amperes: ${mA} ÷ 1000 = ${r.i.toFixed(4)} A.`, { box: B(AM.dial), label: `I = ${mA} mA`, f: `I = ${mA} mA = ${r.i.toFixed(4)} A` });
      await Tt.teach('Supply setting vs V', `The supply is set to ${st.vset} V but the voltmeter reads ${r.v.toFixed(2)} V: a little is lost across the supply's internal resistance and the ammeter. The voltmeter value is the one used.`, { box: B([60, 300, 140, 70]), label: `set ${st.vset} V` });
      await Tt.teach('Record', 'Record copies both meter readings into a new row of the table.', { el: $('ohm-record'), label: 'Record', ms: 2400 });
      record(1);
      await Tt.teach('Row: V', `V = ${r.v.toFixed(2)} goes into the V column of the ${r.s} V row.`, { el: rowCell(r.s, 1), label: `V = ${r.v.toFixed(2)}` });
      renderTable(r.s, 2);
      await Tt.teach('Row: I', `I = ${r.i.toFixed(4)} A goes into the I column, in amperes.`, { el: rowCell(r.s, 2), label: `I = ${r.i.toFixed(4)}` });
      renderTable(r.s, 3);
      await Tt.teach('Row: R = V/I', 'The last column divides the voltage by the current.', { el: rowCell(r.s, 3), label: 'R = V/I', f: `R = ${r.v.toFixed(2)} ÷ ${r.i.toFixed(4)} = ${(r.v / r.i).toFixed(2)} Ω` });
      renderTable();
      await Tt.teach('Point on the graph', `The same row is plotted on the I–V graph: ${r.v.toFixed(2)} V across, ${r.i.toFixed(4)} A up.`, { el: ptsG.querySelector(`.gpt[data-s="${r.s}"]`), label: `(${r.v.toFixed(2)}, ${r.i.toFixed(4)})` });
    } else {
      Tt.step(`Supply ${st.vset} V`, `Both needles move up. The voltmeter reads ${r.v.toFixed(2)} V and the ammeter ${mA} mA = ${r.i.toFixed(4)} A. Record adds the row.`, `V = ${r.v.toFixed(2)} V · I = ${r.i.toFixed(4)} A`);
      await Tt.bringIn(Tt.rectOf($('ohm-rig-frame'))); Tt.spot(B([320, 20, 560, 232]), `V = ${r.v.toFixed(2)} V · I = ${mA} mA`);
      await Tt.wait(Tt.rt(`Both needles move up. The voltmeter reads ${r.v.toFixed(2)} V and the ammeter ${mA} mA. Record adds the row.`));
      record();
      await Tt.teach(`Row ${st.vset} V`, 'V, I and R = V/I fill the new row; its point appears on the graph.', { el: tbody.querySelector(`tr[data-s="${r.s}"]`), label: `${r.s} V row`, f: `R = ${r.v.toFixed(2)} ÷ ${r.i.toFixed(4)} = ${(r.v / r.i).toFixed(2)} Ω` });
    }
  }
  async function run(Tt) {
    const rig = $('ohm-rig-frame');
    await Tt.teach('The bench', 'A DC supply, an ammeter, a voltmeter and the unknown resistor on a breadboard. Each part is shown in turn.', { el: rig });
    await Tt.teach('DC supply', 'The supply gives 2 to 10 V in 2 V steps. The display shows the setting; the switch turns it ON and OFF.', { box: B([34, 264, 252, 262]), label: 'DC supply' });
    await Tt.teach('Supply terminals', 'Current leaves the supply at + (red) and returns at − (black).', { box: B([88, 446, 146, 60]), label: '+  and  −' });
    await Tt.teach('Ammeter', 'Measures the current in milliamperes, 0 to 100 mA. It has a very low resistance and goes in series.', { box: B(AM.box), label: 'ammeter' });
    await Tt.teach('Voltmeter', 'Measures the potential difference in volts, 0 to 10 V. It has a very high resistance and goes across the resistor.', { box: B(VM.box), label: 'voltmeter' });
    await Tt.teach('The resistor', 'The resistor under test sits on the breadboard between two terminals. Its label and colour bands (brown, black, brown, gold) give 100 Ω: R_T, the theoretical value.', { box: B([500, 370, 320, 120]), label: 'R_T = 100 Ω' });
    await Tt.teach('Wiring plan', 'The circuit is one loop, supply → ammeter → resistor → supply, plus the voltmeter joined across the resistor. Five wires in all.', { el: rig });
    await wire(Tt, 'P+', 'A+', 'Wire 1', 'Supply + to ammeter +: current enters the ammeter at its red terminal.');
    await wire(Tt, 'A-', 'R1', 'Wire 2', 'Ammeter − to the first end of the resistor: now the ammeter is in series.');
    await wire(Tt, 'R2', 'P-', 'Wire 3', 'The other end of the resistor back to supply −: the loop is closed.');
    await wire(Tt, 'V+', 'R1', 'Wire 4', 'Voltmeter + to the end of the resistor nearer the supply +.');
    await wire(Tt, 'V-', 'R2', 'Wire 5', 'Voltmeter − to the other end: the voltmeter is now across (in parallel with) the resistor.');
    await Tt.teach('Wiring checked on switch-on', 'The bench checks the circuit as soon as the supply is on. A meter in the wrong place, such as an ammeter across the resistor, gives a warning that explains the fault.', { el: msg });
    await Tt.teach('Switch ON at 2 V', 'The supply starts at its lowest setting, 2 V, and is switched on.', { box: B([195, 355, 68, 40]), label: 'ON', ms: 2600 });
    setOn(true);
    await Tt.teach('Circuit correct', 'The message confirms: ammeter in series, voltmeter across the resistor. Both needles move.', { el: msg, ms: 3400 });
    await reading(Tt, true);
    for (const v of [4, 6, 8, 10]) {
      await Tt.teach(`Supply to ${v} V`, `▲ raises the supply by 2 V, to ${v} V.`, { box: B([120, 374, 54, 38]), label: `${v} V`, ms: 2000 });
      setV(v); await Tt.wait(900);
      await reading(Tt, false);
    }
    await Tt.teach('Switch OFF', 'All five rows are recorded, so the supply is switched off and the resistor does not warm up.', { box: B([195, 355, 68, 40]), label: 'OFF', ms: 2600 });
    setOn(false);
    /* graph */
    const gp = $('ohm-graph-panel');
    await Tt.teach('The I–V graph', 'Current I (A) runs up the y-axis and voltage V (V) along the x-axis. Each row of the table is one point.', { el: gsvg, label: 'I against V' });
    for (const r of st.rows) {
      const info = { title: `Point (${r.v.toFixed(2)}, ${r.i.toFixed(4)})`, where: `From the ${r.s} V row: V = ${r.v.toFixed(2)} V across, I = ${r.i.toFixed(4)} A up.`, src: () => ptsG.querySelector(`.gpt[data-s="${r.s}"]`) };
      await Tt.teach(info.title, info.where, { trace: rowCell(r.s, 2), info, keepText: true, ms: 3200 });
    }
    const m = fitSlope(), A1 = { x: 2, y: +(2 * m).toFixed(4) }, B1 = { x: 10, y: +(10 * m).toFixed(4) };
    await Tt.teach('Best-fit line', 'The points lie on a straight line through the origin, so Ohm\'s law holds. The two handles are dragged onto the line, far apart, to read its slope.', { el: gsvg, label: 'best-fit line', ms: 4200 });
    const A0 = { ...H.A }, B0 = { ...H.B };
    await tween(2400, k => { const e = L.ease(k); H.A = { x: +(A0.x + (A1.x - A0.x) * e).toFixed(2), y: +(A0.y + (A1.y - A0.y) * e).toFixed(4) }; H.B = { x: +(B0.x + (B1.x - B0.x) * e).toFixed(2), y: +(B0.y + (B1.y - B0.y) * e).toFixed(4) }; drawGraph(); });
    H.A = A1; H.B = B1; drawGraph();
    await Tt.teach('Handle 1', `On the line at x₁ = ${A1.x.toFixed(2)} V, y₁ = ${A1.y.toFixed(4)} A.`, { el: handles[0], label: '(x₁, y₁)', f: `(x₁, y₁) = (${A1.x.toFixed(2)}, ${A1.y.toFixed(4)})` });
    await Tt.teach('Handle 2', `Far from handle 1 for accuracy: x₂ = ${B1.x.toFixed(2)} V, y₂ = ${B1.y.toFixed(4)} A.`, { el: handles[1], label: '(x₂, y₂)', f: `(x₂, y₂) = (${B1.x.toFixed(2)}, ${B1.y.toFixed(4)})` });
    await Tt.teach('Slope triangle', 'The dashed triangle shows the run ΔV and the rise ΔI between the handles.', { el: tri, label: 'ΔV and ΔI' });
    /* calculation */
    const calc = $('ohm-calc'), S = slope(), RG = 1 / S, RE = meanR();
    await Tt.teach('Calculation', 'Slope, then R_G = 1/S, then R_E from the table, R_T from the label and the percentage error. A dotted line runs from each symbol or number to its source.', { el: calc });
    for (const k of ['S', 'y2', 'y1', 'x2', 'x1']) await Tt.teach('', '', { trace: lSym('ohm-cr-S', k) });
    await Tt.traceLine(wS);
    await Tt.teach('Slope S', 'The result goes into the answer box, in A/V.', { el: IN.S, ms: 1400 }); await Tt.typeInto(IN.S, S.toFixed(5)); await Tt.wait(500);
    await Tt.teach('', '', { trace: lSym('ohm-cr-RG', 'RG') });
    await Tt.traceLine(wRG);
    await Tt.teach('R_G', 'Rounded to one decimal place.', { el: IN.RG, ms: 1400, f: `R<sub>G</sub> = 1 ÷ ${S.toFixed(5)} = ${RG.toFixed(1)} Ω` }); await Tt.typeInto(IN.RG, RG.toFixed(1)); await Tt.wait(500);
    await Tt.teach('', '', { trace: lSym('ohm-cr-RE', 'RE') });
    await Tt.teach('', '', { trace: lSym('ohm-cr-RE', 'VI') });
    await Tt.traceLine(wRE);
    await Tt.teach('R_E', 'The mean of the R column.', { el: IN.RE, ms: 1400 }); await Tt.typeInto(IN.RE, RE.toFixed(1)); await Tt.wait(500);
    await Tt.teach('', '', { trace: lSym('ohm-cr-RT', 'RT') });
    await Tt.teach('R_T', 'The labelled value: 100 Ω.', { el: IN.RT, ms: 1400 }); await Tt.typeInto(IN.RT, '100'); await Tt.wait(500);
    await Tt.teach('', '', { trace: lSym('ohm-cr-pe', 'pe') });
    await Tt.traceLine(wPE);
    const pe = Math.abs(+RG.toFixed(1) - 100);
    await Tt.teach('% error', 'The result goes into the answer box.', { el: IN.pe, ms: 1400 }); await Tt.typeInto(IN.pe, pe.toFixed(1)); await Tt.wait(500);
    await Tt.teach('Check', 'Check compares each answer with the graph and the table, and catches the usual slips: an inverted slope, mA read as A, R = S instead of 1/S.', { el: $('ohm-check'), label: 'Check', ms: 3200 });
    check();
    await Tt.teach('Result', 'R_T, R_E and R_G side by side, with the percentage errors.', { el: res, label: 'Result' });
    for (const k of ['resT', 'resE', 'resG', 'resGp']) { const n = res.querySelector(`.num[data-ref="${k}"]`); if (n) await Tt.teach('', '', { trace: n }); }
    await Tt.teach('Done', `R_E ≈ ${RE.toFixed(1)} Ω and R_G ≈ ${RG.toFixed(1)} Ω, both close to the labelled 100 Ω. Hovering (or tapping) any symbol or number in the Calculation shows its meaning and source. Start over to wire the circuit by hand.`, { el: chk });
    void gp;
  }
  L.registerLab('ohm', {
    btn: $('ohm-tut'), scope: $('view-ohm-practical'), reset,
    seed: () => { st.rng = L.mulberry32(20261019); },
    run, cleanup: () => { st.rng = Math.random; tmp.setAttribute('d', ''); drawGraph(); updStatus(); }
  });
  L.OHMB = { st, check, record, reset, addWire, removeWire, setOn, setV, H, drawGraph, slope, fitSlope, meanR, IN, classify, evaluate };
  reset();
})(window.SOL);
