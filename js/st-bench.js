/* Lab 8 · the capillary rise bench, observation table, calculation and tutorial */
(function (L) {
  'use strict';
  const { el, txt, $, clamp, parseNum, near, C, F_HEAD, F_BODY, defs, NUM, setWork, tween, tut } = L;
  const { LIQ, riseOf, T } = L.ST;
  const svg = $('st-rig'); defs(svg, 'sr');
  const G = 980;
  const SURF = 380, PX = 34, TX = 330, TLEN = 300, UP = 318, DOWN = 432, Z = 6, LX = 760, LY = 262, LR = 150, CX = 341;
  const FILL = { water: C.aqua, soap: '#5aa9c9', ethanol: '#8fc6dc' };
  const DEFAULT_MSG = 'First rinse the capillary with the liquid, then dip it: drag it down into the beaker or press Dip.';
  const st = { liq: 'water', r: 0.05, rinsed: false, bottom: UP, dipped: false, settled: false, col: 0, hDip: NaN, fresh: false, reads: [], rng: Math.random, forced: null, busy: false, dips: 0 };
  const lq = () => LIQ[st.liq];
  const h0 = () => +riseOf(lq(), st.r).toFixed(2);
  const bw = () => Math.max(1.1, st.r * PX);
  const r2 = v => Math.round(v * 100) / 100;

  /* ---------- drawing ---------- */
  el('rect', { x: 0, y: 560, width: 1000, height: 60, fill: 'url(#sr-bench)' }, svg);
  el('line', { x1: 0, y1: 560, x2: 1000, y2: 560, stroke: C.line2 }, svg);
  el('rect', { x: 36, y: 544, width: 170, height: 16, rx: 3, fill: C.slate2 }, svg);
  el('rect', { x: 66, y: 70, width: 9, height: 476, rx: 3, fill: 'url(#sr-steel)', stroke: '#8f98a3', 'stroke-width': .8 }, svg);
  const scene = el('g', { id: 'sr-scene' }, svg);
  const bk = { x: 180, y: 300, w: 300, h: 250 };
  el('path', { d: `M${bk.x} ${bk.y} L${bk.x} ${bk.y + bk.h - 12} Q${bk.x} ${bk.y + bk.h} ${bk.x + 12} ${bk.y + bk.h} L${bk.x + bk.w - 12} ${bk.y + bk.h} Q${bk.x + bk.w} ${bk.y + bk.h} ${bk.x + bk.w} ${bk.y + bk.h - 12} L${bk.x + bk.w} ${bk.y}`, fill: 'rgba(230,242,247,.35)', stroke: 'none' }, scene);
  const water = el('rect', { x: bk.x + 2, y: SURF, width: bk.w - 4, height: bk.y + bk.h - SURF - 2, rx: 10, fill: FILL.water, opacity: .55 }, scene);
  el('line', { x1: bk.x + 2, y1: SURF, x2: bk.x + bk.w - 2, y2: SURF, stroke: C.aqua2, 'stroke-width': 1.2, opacity: .8 }, scene);
  /* centimetre scale beside the tube, zero level with the liquid surface */
  const ruler = el('g', null, scene);
  el('rect', { x: CX - 4, y: SURF - 7.3 * PX, width: 24, height: 7.3 * PX + 12, fill: '#fffdf6', stroke: '#c9c1a8', 'stroke-width': .6 }, ruler);
  for (let k = 0; k <= 140; k++) {
    const y = SURF - k * 0.05 * PX, len = k % 20 === 0 ? 9 : k % 10 === 0 ? 7 : k % 2 === 0 ? 4.5 : 2.6;
    el('line', { x1: CX - 4, y1: y, x2: CX - 4 + len, y2: y, stroke: '#2a2f3a', 'stroke-width': k % 2 === 0 ? .42 : .3 }, ruler);
    if (k % 20 === 0) txt(ruler, CX + 13, y + 2.2, String(k / 20), { 'font-size': 6.4, 'font-family': F_BODY, fill: '#2a2f3a', 'text-anchor': 'middle', 'font-weight': 600 });
  }
  txt(ruler, CX + 8, SURF - 7.3 * PX - 4, 'cm', { 'font-size': 7, 'font-family': F_BODY, fill: C.muted, 'text-anchor': 'middle' });
  const colPath = el('path', { d: '', fill: FILL.water, opacity: .85 }, scene);
  const menPath = el('path', { d: '', fill: 'none', stroke: C.aqua2, 'stroke-width': .5 }, scene);
  const tubeG = el('g', { class: 'drag kfocus', tabindex: 0, role: 'slider', 'aria-label': 'Capillary tube: arrow down dips it, arrow up lifts it out', 'aria-valuemin': 0, 'aria-valuemax': 1, 'aria-valuenow': 0 }, scene);
  const tubeRect = el('rect', { x: 0, y: 0, width: 0, height: TLEN, rx: 1.5, fill: 'url(#sr-glass)', stroke: '#8fb4c4', 'stroke-width': .8 }, tubeG);
  const boreL = el('line', { stroke: '#a9cbd8', 'stroke-width': .5 }, tubeG), boreR = el('line', { stroke: '#a9cbd8', 'stroke-width': .5 }, tubeG);
  const rinseDrops = el('g', null, tubeG);
  const ringT = el('rect', { x: 0, y: 0, width: 0, height: TLEN + 8, rx: 5, fill: 'none', stroke: C.acc, 'stroke-width': 2, opacity: 0 }, tubeG);
  tubeG.addEventListener('focus', () => { if (tubeG.matches(':focus-visible')) ringT.setAttribute('opacity', 1); }); tubeG.addEventListener('blur', () => ringT.setAttribute('opacity', 0));
  const clamp_ = el('g', null, tubeG);
  const arm = el('rect', { x: 75, y: 0, width: 0, height: 9, rx: 2, fill: C.slate }, clamp_);
  const boss = el('rect', { x: 58, y: 0, width: 26, height: 22, rx: 4, fill: C.slate2 }, clamp_);
  const jaw = el('rect', { x: 0, y: 0, width: 0, height: 26, rx: 4, fill: C.acc }, clamp_);
  el('path', { d: `M${bk.x} ${bk.y} L${bk.x} ${bk.y + bk.h - 12} Q${bk.x} ${bk.y + bk.h} ${bk.x + 12} ${bk.y + bk.h} L${bk.x + bk.w - 12} ${bk.y + bk.h} Q${bk.x + bk.w} ${bk.y + bk.h} ${bk.x + bk.w} ${bk.y + bk.h - 12} L${bk.x + bk.w} ${bk.y}`, fill: 'none', stroke: '#8fb4c4', 'stroke-width': 3.5, 'stroke-linejoin': 'round' }, scene);
  el('rect', { x: bk.x + 10, y: bk.y + 16, width: 7, height: bk.h - 50, rx: 3.5, fill: '#fff', opacity: .6 }, scene);
  const liqLab = T(svg, bk.x + bk.w / 2 + 70, 520, 'water', { 'text-anchor': 'middle', 'font-size': 16, fill: C.aqua2, 'font-weight': 600 });
  /* labels */
  const rTag = el('g', null, svg);
  el('rect', { x: 150, y: 196, width: 150, height: 30, rx: 5, fill: '#fff', stroke: C.line2 }, rTag);
  const rLab = T(rTag, 225, 216, 'bore r = 0.05 cm', { 'text-anchor': 'middle', 'font-size': 14.5, fill: C.ink, 'font-weight': 600 });
  el('line', { x1: 300, y1: 211, x2: 322, y2: 211, stroke: C.slate3, 'stroke-dasharray': '3 3' }, rTag);
  const zeroLab = T(svg, 400, SURF + 4, '0 at the surface', { 'font-size': 12.5, fill: C.muted });
  /* magnifier */
  const lensView = el('circle', { cx: CX, cy: SURF, r: LR / Z, fill: 'none', stroke: C.slate, 'stroke-width': 1.2, 'stroke-dasharray': '3 2' }, svg);
  const lensLink = el('line', { x1: CX, y1: SURF, x2: LX - LR, y2: LY, stroke: C.slate3, 'stroke-width': 1, 'stroke-dasharray': '4 4' }, svg);
  const cp = el('clipPath', { id: 'sr-lens', clipPathUnits: 'userSpaceOnUse' }, svg.querySelector('defs')); el('circle', { cx: LX, cy: LY, r: LR - 3 }, cp);
  const lens = el('g', null, svg);
  el('circle', { cx: LX, cy: LY, r: LR, fill: '#fbfcfd' }, lens);
  const lensClip = el('g', { 'clip-path': 'url(#sr-lens)' }, lens);
  const use = el('use', { href: '#sr-scene' }, lensClip);
  const lensFrame = el('circle', { cx: LX, cy: LY, r: LR, fill: 'none', stroke: C.ink2, 'stroke-width': 7 }, lens);
  el('circle', { cx: LX, cy: LY, r: LR + 4, fill: 'none', stroke: C.slate3, 'stroke-width': 1.5 }, lens);
  el('line', { x1: LX + LR * .72, y1: LY + LR * .72, x2: LX + LR * .72 + 70, y2: LY + LR * .72 + 70, stroke: C.slate2, 'stroke-width': 18, 'stroke-linecap': 'round' }, lens);
  T(lens, LX, LY - LR - 14, 'magnifier ×6', { 'text-anchor': 'middle', 'font-size': 14, fill: C.muted, 'font-weight': 600 });
  const lensNote = T(lens, LX, LY + LR + 30, '', { 'text-anchor': 'middle', 'font-size': 13.5, fill: C.acc2, 'font-weight': 600 });

  function draw() {
    const b = bw(), ow = b + 3.2, top = st.bottom - TLEN;
    tubeRect.setAttribute('x', TX - ow); tubeRect.setAttribute('y', top); tubeRect.setAttribute('width', 2 * ow);
    [[boreL, TX - b], [boreR, TX + b]].forEach(([l, x]) => { l.setAttribute('x1', x); l.setAttribute('x2', x); l.setAttribute('y1', top + 1); l.setAttribute('y2', st.bottom - 1); });
    ringT.setAttribute('x', TX - ow - 4); ringT.setAttribute('y', top - 4); ringT.setAttribute('width', 2 * ow + 8);
    const ay = top + 34;
    arm.setAttribute('y', ay + 2); arm.setAttribute('width', TX - ow - 75);
    boss.setAttribute('y', ay - 4.5);
    jaw.setAttribute('x', TX - ow - 3); jaw.setAttribute('y', ay - 7); jaw.setAttribute('width', 2 * ow + 6);
    const fill = FILL[st.liq]; water.setAttribute('fill', fill); colPath.setAttribute('fill', fill);
    if (st.col > 0 && st.bottom > SURF) {
      const yM = SURF - st.col * PX, bot = st.bottom - .5;
      colPath.setAttribute('d', `M${TX - b} ${bot} L${TX - b} ${yM - b} Q${TX} ${yM + b} ${TX + b} ${yM - b} L${TX + b} ${bot} Z`);
      menPath.setAttribute('d', `M${TX - b} ${yM - b} Q${TX} ${yM + b} ${TX + b} ${yM - b}`);
    } else { colPath.setAttribute('d', ''); menPath.setAttribute('d', ''); }
    const yView = SURF - Math.max(0, st.col) * PX;
    use.setAttribute('transform', `translate(${LX} ${LY}) scale(${Z}) translate(${-CX} ${-yView})`);
    lensView.setAttribute('cy', yView); lensLink.setAttribute('y1', yView); lensLink.setAttribute('x1', CX + LR / Z);
    tubeG.setAttribute('aria-valuenow', st.dipped ? 1 : 0);
  }

  /* ---------- state + messages ---------- */
  const msg = $('st-msg'), recMsg = $('st-recmsg'), selLiq = $('st-liq'), selRad = $('st-rad'), inRead = $('st-read');
  function say(t, cls) { msg.className = 'rig-msg' + (cls ? ' ' + cls : ''); msg.innerHTML = t; }
  function rsay(t, cls) { recMsg.className = 'rec-msg' + (cls ? ' ' + cls : ''); recMsg.innerHTML = t; }
  function updStatus() {
    const l = lq();
    $('st-status').innerHTML = `${l.label}: density <b id="st-rho">ρ = ${l.rho.toFixed(l.rho < 1 ? 3 : 2)} g/cm³</b> · bore radius <b>r = ${st.r} cm</b> (diameter ${+(2 * st.r).toFixed(3)} cm)<br>Capillary: <b>${st.dipped ? 'in the liquid' : 'lifted out'}</b> · rinsed: <b>${st.rinsed ? 'yes' : 'not yet'}</b>`;
    rLab.textContent = `bore r = ${st.r} cm`; liqLab.textContent = l.name;
    const lock = st.reads.length > 0; selLiq.disabled = lock; selRad.disabled = lock;
    $('st-dip').disabled = st.dipped; $('st-lift').disabled = !st.dipped; $('st-rinse').disabled = st.dipped;
  }
  function cell(i) { return $(i === 'avg' ? 'st-cav' : 'st-c' + i); }
  function avg() { return st.reads.length === 3 ? r2((st.reads[0] + st.reads[1] + st.reads[2]) / 3) : NaN; }
  function renderTable(fresh) {
    for (let i = 0; i < 3; i++) { const c = cell(i); c.textContent = st.reads[i] != null ? st.reads[i].toFixed(2) : '—'; c.classList.toggle('fresh', fresh === i); }
    const a = avg(); cell('avg').textContent = isFinite(a) ? a.toFixed(2) : '—'; cell('avg').classList.toggle('fresh', fresh === 'avg');
    workH();
  }

  /* ---------- actions ---------- */
  async function rinse() {
    if (st.busy) return; if (st.dipped) { say('Lift the capillary out of the beaker before rinsing it.', 'warn'); return; }
    st.busy = true; say(`Drawing ${lq().name} up through the bore and letting it drain…`);
    rinseDrops.innerHTML = '';
    const top = st.bottom - TLEN, drops = [0, 1, 2, 3, 4].map(k => el('circle', { cx: TX, cy: top, r: Math.max(1.2, bw() * .8), fill: FILL[st.liq] }, rinseDrops));
    await tween(1800, k => drops.forEach((d, i) => { const f = clamp(k * 1.6 - i * .15, 0, 1); d.setAttribute('cy', top + f * (TLEN + 14)); d.setAttribute('opacity', f >= 1 ? 0 : 1); }));
    rinseDrops.innerHTML = ''; st.rinsed = true; st.busy = false; updStatus();
    say('Rinsed: the bore is clean and wetted by the liquid. Now dip the capillary.', 'ok');
  }
  function nextOffset() {
    if (st.forced && st.forced.length) return st.forced.shift();
    const u = st.rng(), w = [[-.02, 1], [-.01, 3], [0, 4], [.01, 3], [.02, 1]]; let a = 0;
    for (const [v, p] of w) { a += p / 12; if (u < a) return v; }
    return 0;
  }
  async function dip() {
    if (st.busy || st.dipped) return;
    if (!st.rinsed) { await moveTube(UP); say('Rinse the capillary with the liquid first, so the bore is clean and wetted.', 'warn'); return; }
    st.busy = true; await moveTube(DOWN, 420);
    st.dipped = true; st.dips++; st.hDip = r2(h0() + nextOffset()); st.settled = false; updStatus();
    say('The liquid climbs the bore…');
    await tween(1700, k => { st.col = st.hDip * (1 - Math.pow(1 - k, 3)); draw(); });
    st.col = st.hDip; draw(); st.settled = true; st.fresh = true; st.busy = false;
    lensNote.textContent = 'read at the bottom of the meniscus';
    say('The column has settled. Read h in the magnifier at the bottom of the curved meniscus, then type it in and Record.', 'ok');
  }
  async function lift() {
    if (st.busy || !st.dipped) return;
    st.busy = true; const c0 = st.col;
    await tween(500, k => { st.col = c0 * (1 - k); draw(); });
    st.col = 0; st.dipped = false; st.settled = false; st.fresh = false; await moveTube(UP, 380); st.busy = false; updStatus();
    lensNote.textContent = '';
    say(st.reads.length < 3 ? 'Lifted out. Dip again for a fresh reading.' : 'Lifted out. All three readings are in the table.');
  }
  function moveTube(y, ms) { const y0 = st.bottom; return tween(ms || 300, k => { st.bottom = y0 + (y - y0) * k; draw(); }); }
  function record() {
    const v = parseNum(inRead.value), h = st.hDip, r = st.r;
    if (st.reads.length >= 3) { rsay('All three readings are recorded. Delete last to redo one, or Start over.', 'warn'); return false; }
    if (!st.dipped || !st.settled) { rsay('Dip the capillary first and let the column settle.', 'warn'); return false; }
    if (!st.fresh) { rsay('This dip has already been read. Lift the capillary out and dip it again for a new reading.', 'warn'); return false; }
    if (!isFinite(v)) { rsay('Type the reading in cm, for example 2.94.', 'warn'); return false; }
    if (Math.abs(v / 10 - h) <= 0.015 && Math.abs(v - h) > 0.05) { rsay(`That looks like millimetres. h is recorded in cm: ${v} mm = ${(v / 10).toFixed(2)} cm.`, 'bad'); return false; }
    if (Math.abs(v - h) > 0.015 && Math.abs(v - (h + r)) <= 0.012) { rsay('That is the edge where the liquid meets the glass. Read the scale level with the bottom of the curve.', 'bad'); return false; }
    if (Math.abs(v - h) > 0.015) { rsay('Not quite. Read the scale level with the bottom of the meniscus in the magnifier: long lines are cm, medium lines 0.5 cm, short lines 1 mm and the shortest 0.5 mm.', 'bad'); return false; }
    st.reads.push(r2(v)); st.fresh = false; inRead.value = '';
    const n = st.reads.length; renderTable(n - 1); updStatus();
    rsay(n < 3 ? `h<sub>${n}</sub> = ${v.toFixed(2)} cm recorded. Lift the capillary out and dip it again.` : `h<sub>3</sub> recorded. Average(h) = ${avg().toFixed(2)} cm.`, 'ok');
    if (n === 3) renderTable('avg');
    return true;
  }
  function undo() { if (!st.reads.length) return; st.reads.pop(); renderTable(); updStatus(); rsay('Last reading deleted.'); }
  const bind = (id, f) => $(id).addEventListener('click', () => { if (!tut.on) f(); });
  bind('st-rinse', rinse); bind('st-dip', dip); bind('st-lift', lift); bind('st-record', record); bind('st-undo', undo);
  inRead.addEventListener('keydown', e => { if (e.key === 'Enter' && !tut.on) record(); });
  selLiq.addEventListener('change', () => { st.liq = selLiq.value; st.rinsed = false; updStatus(); draw(); say(`Liquid changed to ${lq().name}. Rinse the capillary with it before dipping.`); });
  selRad.addEventListener('change', () => { st.r = +selRad.value; st.rinsed = false; updStatus(); draw(); say(`Capillary changed: bore radius ${st.r} cm. Rinse it with the liquid before dipping.`); });
  /* drag the tube */
  let drag = null;
  tubeG.addEventListener('pointerdown', e => { if (tut.on || st.busy) return; e.preventDefault(); tubeG.setPointerCapture(e.pointerId); drag = { y0: L.svgPoint(svg, e).y, b0: st.bottom, was: st.dipped }; if (st.dipped) { st.col = 0; st.dipped = false; st.settled = false; st.fresh = false; draw(); } });
  tubeG.addEventListener('pointermove', e => { if (!drag) return; st.bottom = clamp(drag.b0 + L.svgPoint(svg, e).y - drag.y0, UP - 30, DOWN + 10); draw(); });
  const endDrag = () => { if (!drag) return; drag = null; if (st.bottom > SURF + 12) dip(); else { moveTube(UP).then(() => { updStatus(); }); } };
  tubeG.addEventListener('pointerup', endDrag); tubeG.addEventListener('pointercancel', endDrag);
  tubeG.addEventListener('keydown', e => { if (tut.on) return; if (e.key === 'ArrowDown') { e.preventDefault(); dip(); } else if (e.key === 'ArrowUp') { e.preventDefault(); lift(); } });

  /* ---------- calculation ---------- */
  const IN = { h: $('st-in-h'), r: $('st-in-r'), rho: $('st-in-rho'), g: $('st-in-g'), th: $('st-in-th'), gam: $('st-in-gam') };
  const wH = $('st-w-h'), wG = $('st-w-gam'), chk = $('st-chk'), res = $('st-result');
  function workH() {
    if (st.reads.length < 3) { setWork(wH, ''); return; }
    const [a, b, c] = st.reads, s = a + b + c;
    setWork(wH, `= (${NUM('h1v', a.toFixed(2))} + ${NUM('h2v', b.toFixed(2))} + ${NUM('h3v', c.toFixed(2))}) ÷ 3 = ${NUM('sum', s.toFixed(2))} ÷ 3 = ${NUM('r-h', avg().toFixed(2))}`);
  }
  const vals = () => ({ h: parseNum(IN.h.value), r: parseNum(IN.r.value), rho: parseNum(IN.rho.value), g: parseNum(IN.g.value), th: parseNum(IN.th.value), gam: parseNum(IN.gam.value) });
  function workG() {
    const v = vals();
    if (![v.h, v.r, v.rho, v.g, v.th].every(isFinite)) { setWork(wG, ''); return; }
    const num = v.h * v.r * v.rho * v.g, den = 2 * Math.cos(v.th * Math.PI / 180), cosT = Math.cos(v.th * Math.PI / 180);
    const g = num / den;
    setWork(wG, `= (${NUM('hG', IN.h.value.trim())} × ${NUM('rG', IN.r.value.trim())} × ${NUM('rhoG', IN.rho.value.trim())} × ${NUM('gG', IN.g.value.trim())}) ÷ (2 × cos ${NUM('thG', IN.th.value.trim())}°) = ${NUM('num', num.toFixed(2))} ÷ ${NUM('den', (2 * cosT).toFixed(2))} = ${NUM('r-gam', isFinite(g) && Math.abs(g) < 1e9 ? g.toFixed(1) : '∞')}`);
  }
  Object.values(IN).forEach(i => i.addEventListener('input', () => { i.classList.remove('flag', 'okf'); workG(); }));
  function check() {
    const v = vals(), notes = [], a = avg(), l = lq(), gx = a * st.r * l.rho * G / 2;
    Object.values(IN).forEach(i => i.classList.remove('flag', 'okf'));
    if (!isFinite(a)) { chk.className = 'check-msg nudge'; chk.innerHTML = 'Record three readings of h first: the calculation starts from their average.'; res.hidden = true; return false; }
    const flag = (k, t) => { IN[k].classList.add('flag'); notes.push(t); }, ok = k => IN[k].classList.add('okf');
    if (near(v.h, a, .004)) ok('h'); else if (near(v.h, a * 10, .01)) flag('h', 'h looks like millimetres. Every length goes in cm here: ' + (a * 10).toFixed(1) + ' mm = ' + a.toFixed(2) + ' cm.'); else if (near(v.h, a * 3, .01)) flag('h', 'h is the sum of the three readings. Divide it by 3 for the average.'); else flag('h', 'h is Average(h) in the observation table: (h₁ + h₂ + h₃) ÷ 3.');
    if (near(v.r, st.r, .001)) ok('r'); else if (near(v.r, 2 * st.r, .01)) flag('r', `${v.r} cm is the diameter of the bore. The formula needs the radius: r = d ÷ 2 = ${st.r} cm.`); else if (near(v.r, st.r * 10, .01)) flag('r', `r looks like millimetres. In cm, r = ${st.r} cm.`); else flag('r', `r is the bore radius of the capillary in use, on the label beside the tube: ${st.r} cm.`);
    if (near(v.rho, l.rho, .005)) ok('rho'); else if (near(v.rho, l.rho * 1000, .01)) flag('rho', `That is the density in kg/m³. In g/cm³, ρ = ${l.rho} g/cm³.`); else flag('rho', `ρ is the density of ${l.name}, shown in the Set-up panel: ${l.rho} g/cm³.`);
    if (near(v.g, G, .005)) ok('g'); else if (near(v.g, 9.8, .02)) flag('g', 'With h and r in cm, g must be in cm/s²: g = 980 cm/s², not 9.8 m/s².'); else flag('g', 'g = 980 cm/s².');
    if (isFinite(v.th) && Math.abs(v.th) < .5) ok('th'); else flag('th', 'The liquid wets the clean glass, so θ = 0° and cos 0° = 1.');
    let gamOk = false;
    if (near(v.gam, gx, .01)) { ok('gam'); gamOk = true; }
    else if (!isFinite(v.gam)) flag('gam', 'Work out γ = h r ρ g ÷ (2 cos θ) and type the number in dyne/cm.');
    else if (near(v.gam, 2 * gx, .02)) flag('gam', near(v.r, 2 * st.r, .01) ? 'γ is twice too large because the diameter was used for r.' : 'γ is twice too large: h r ρ g still has to be divided by 2 cos θ = 2 × 1 = 2.');
    else if (near(v.gam, gx / 2, .02)) flag('gam', 'γ is half the expected value: the denominator is 2 cos 0° = 2 × 1 = 2, not 4.');
    else if (near(v.gam, 10 * gx, .02)) flag('gam', 'γ is ten times too large: h or r was entered in mm instead of cm.');
    else if (near(v.gam, gx * 9.8 / 980, .03)) flag('gam', 'γ is a hundred times too small: g must be 980 cm/s².');
    else flag('gam', `Check the arithmetic: (h × r × ρ × g) ÷ (2 × cos θ) with the values above gives about ${gx.toFixed(1)} dyne/cm.`);
    if (!notes.length && gamOk) {
      chk.className = 'check-msg ok'; chk.innerHTML = 'All values check out.';
      const diff = Math.abs(v.gam - l.g) / l.g * 100;
      res.hidden = false;
      res.innerHTML = `<h3>Result</h3>Surface tension of ${l.name} = ${NUM('gres', v.gam.toFixed(1))} dyne/cm. Compared with ${l.std.replace(/[\d.]+ dyne\/cm/, m => NUM('std', m.replace(' dyne/cm', '')) + ' dyne/cm')}, the difference is ${NUM('diff', diff.toFixed(1))} %.`;
      return true;
    }
    chk.className = 'check-msg nudge'; chk.innerHTML = 'Not yet:<ul>' + notes.map(n => `<li>${n}</li>`).join('') + '</ul>'; res.hidden = true;
    return false;
  }
  $('st-check').addEventListener('click', () => { if (!tut.on) check(); });

  /* ---------- traceable calculation ---------- */
  const lSym = (row, k) => document.querySelector(`#${row} label .sym[data-sym="${k}"]`);
  const wNum = (w, ref) => w.querySelector(`.num[data-ref="${ref}"]`);
  const NM = ['first', 'second', 'third'];
  function INFO(k, node) {
    const l = lq();
    const m = /^h([123])(v?)$/.exec(k);
    if (m) { const i = +m[1] - 1; return { title: `<i>h</i><sub>${i + 1}</sub>: the ${NM[i]} reading of the height`, nm: `<i>h</i><sub>${i + 1}</sub>, the ${NM[i]} reading of h in cm`, where: `Read in the magnifier after dip ${i + 1}. Observation table, column h<sub>${i + 1}</sub>.`, src: () => cell(i) }; }
    switch (k) {
      case 'h': return { title: '<i>h</i>: average height of the column, in cm', nm: 'h', where: 'The mean of the three readings. Observation table, column Average(h).', src: () => cell('avg') };
      case 'sum': return { title: '', nm: 'h₁ + h₂ + h₃, the sum of the three readings', where: 'The three table values added together; dividing by 3 gives the average.', src: () => null };
      case 'r-h': return { title: '', nm: 'Average(h), in cm', where: 'The result of this line. It is h in the surface-tension formula below.', src: () => wNum(wG, 'hG') || lSym('st-cr-gam', 'hG') };
      case 'r': return { title: '<i>r</i>: radius of the bore, in cm', nm: 'r', where: `Set by the capillary chosen; the label beside the tube on the bench gives r = ${st.r} cm. It is half the bore diameter.`, src: () => rLab };
      case 'rho': return { title: '<i>ρ</i>: density of the liquid, in g/cm³', nm: 'ρ', where: `For ${l.name}, ρ = ${l.rho} g/cm³, shown in the Set-up panel.`, src: () => $('st-rho') };
      case 'g': return { title: '<i>g</i>: acceleration due to gravity, in cm/s²', nm: 'g', where: 'A constant: 980 cm/s², in cm to match h and r.', src: () => null };
      case 'th': return { title: '<i>θ</i>: contact angle between liquid and glass', nm: 'θ', where: 'The liquid wets the clean glass and the meniscus meets the wall tangentially (see the magnifier), so θ = 0° and cos θ = 1.', src: () => lensFrame };
      case 'gam': return { title: '<i>γ</i>: surface tension of the liquid, in dyne/cm', nm: 'γ', where: 'Worked out in the line under this formula; the result goes into the answer box.', src: () => wNum(wG, 'r-gam') || IN.gam };
      case 'hG': return { title: '<i>h</i>: the average height found above', nm: 'h, the average height in cm', where: 'From the Average height line above.', src: () => IN.h.value.trim() ? IN.h : cell('avg') };
      case 'rG': return { title: '<i>r</i>: the bore radius entered above', nm: 'r, the bore radius in cm', where: 'From the radius line above.', src: () => IN.r };
      case 'rhoG': return { title: '<i>ρ</i>: the density entered above', nm: 'ρ, the density in g/cm³', where: 'From the density line above.', src: () => IN.rho };
      case 'gG': return { title: '<i>g</i>: the value entered above', nm: 'g, in cm/s²', where: 'From the gravity line above.', src: () => IN.g };
      case 'thG': return { title: '<i>θ</i>: the contact angle entered above', nm: 'θ, the contact angle in degrees', where: 'From the contact angle line above; cos 0° = 1.', src: () => IN.th };
      case 'num': return { title: '', nm: 'h × r × ρ × g, the top of the fraction', where: 'The four values multiplied together.', src: () => null };
      case 'den': return { title: '', nm: '2 cos θ, the bottom of the fraction', where: 'With θ = 0°, 2 × cos 0° = 2 × 1 = 2.', src: () => null };
      case 'r-gam': return { title: '', nm: 'γ, the surface tension in dyne/cm', where: 'The result of this line. It goes into the answer box and then the Result.', src: () => IN.gam.value.trim() ? IN.gam : null };
      case 'gres': return { title: '', nm: 'γ, the measured surface tension in dyne/cm', where: 'From the answer box of the surface-tension line.', src: () => IN.gam };
      case 'std': return { title: '', nm: `the reference value for ${l.name}, in dyne/cm`, where: 'A tabulated value at room temperature, used for comparison.', src: () => null };
      case 'diff': return { title: '', nm: 'the percentage difference', where: '|γ − reference| ÷ reference × 100.', src: () => null };
    }
    return null;
  }
  L.registerTrace($('st-calc'), INFO);

  /* ---------- start over ---------- */
  function reset() {
    Object.assign(st, { liq: 'water', r: 0.05, rinsed: false, bottom: UP, dipped: false, settled: false, col: 0, hDip: NaN, fresh: false, reads: [], busy: false, dips: 0 });
    selLiq.value = 'water'; selRad.value = '0.05'; inRead.value = ''; rinseDrops.innerHTML = ''; lensNote.textContent = '';
    Object.values(IN).forEach(i => { i.value = ''; i.classList.remove('flag', 'okf'); });
    L.traceHide(); setWork(wG, ''); chk.className = 'check-msg'; chk.innerHTML = ''; res.hidden = true; res.innerHTML = '';
    renderTable(); updStatus(); draw(); say(DEFAULT_MSG); rsay('');
  }
  $('st-reset').addEventListener('click', () => { if (!tut.on) reset(); });
  L.onLeave['st-practical'] = () => L.tutStop();

  /* ---------- tutorial ---------- */
  const BOX = { beaker: [bk.x - 8, bk.y - 8, bk.w + 16, bk.h + 16], ruler: [CX - 10, SURF - 7.3 * PX - 14, 40, 7.3 * PX + 30], rtag: [146, 192, 158, 38], lens: [LX - LR - 10, LY - LR - 34, 2 * LR + 20, 2 * LR + 70], stand: [30, 60, 60, 505] };
  const box = k => ({ svg, box: k === 'tube' ? () => [TX - 16, st.bottom - TLEN - 12, 32, TLEN + 24] : k === 'men' ? () => { const y = SURF - st.col * PX; return [LX - 70, LY - 40, 140, 80, y][0] !== undefined ? [LX - 70, LY - 40, 140, 80] : null; } : BOX[k] });
  async function readDip(Tt, n, full) {
    const v = st.hDip, mm = Math.round(v * 1000) / 10;
    if (full) {
      await Tt.teach('Reading the scale', `In the magnifier, the bottom of the curved meniscus sits level with the scale. The long line below it is the ${Math.floor(v)} cm mark; counting the short lines up from it gives ${mm.toFixed(1)} mm in total, so h = ${v.toFixed(2)} cm.`, { box: box('lens'), label: `h = ${v.toFixed(2)} cm`, f: `h<sub>${n}</sub> = ${mm.toFixed(1)} mm = ${v.toFixed(2)} cm` });
      await Tt.teach('Typing the reading', 'The value goes into the reading box in cm, to two decimal places.', { el: inRead, label: 'h in cm', ms: 1800 });
    } else { Tt.step(`Dip ${n}: reading`, `The meniscus settles at ${v.toFixed(2)} cm this time. It is typed in and recorded.`, `h<sub>${n}</sub> = ${v.toFixed(2)} cm`); }
    await Tt.typeInto(inRead, v.toFixed(2));
    if (full) await Tt.teach('Record', 'Record checks the reading against the magnifier and copies it into the next empty cell of the table.', { el: $('st-record'), label: 'Record', ms: 2600 });
    record();
    await Tt.teach(`Into the table: h${'₁₂₃'[n - 1]}`, `${v.toFixed(2)} goes into column h${'₁₂₃'[n - 1]} of the observation table.`, { el: cell(n - 1), label: `h${'₁₂₃'[n - 1]} = ${v.toFixed(2)}` });
  }
  async function run(Tt) {
    const rig = $('st-rig-frame'), calc = $('st-calc');
    await Tt.teach('The bench', 'A beaker of liquid, a capillary tube held on a stand, a centimetre scale beside the tube and a magnifier. Each part is shown in turn.', { el: rig });
    await Tt.teach('Beaker of water', 'A wide beaker, so the water surface stays flat. Its level is the zero for measuring h.', { box: box('beaker'), label: 'beaker of water' });
    await Tt.teach('Capillary tube', 'A glass tube with a very fine, uniform bore, held vertical by the clamp. It can be dragged down into the water or lifted out.', { box: box('tube'), label: 'capillary' });
    await Tt.teach('Bore radius', 'The label gives the radius of the bore, r = 0.05 cm. The diameter is twice that, 0.10 cm; the formula needs the radius.', { box: box('rtag'), label: 'r = 0.05 cm' });
    await Tt.teach('Centimetre scale', 'The scale stands right beside the tube. Its zero is level with the water surface in the beaker, so the scale reads h directly. Long lines are whole cm, then 0.5 cm, 1 mm and 0.5 mm.', { box: box('ruler'), label: 'scale, zero at the surface' });
    await Tt.teach('Magnifier', 'The magnifier enlarges the scale and the top of the column six times, so h can be read to 0.01 cm. The dashed circle on the bench shows where it looks.', { box: box('lens'), label: 'magnifier ×6' });
    await Tt.teach('Liquid', 'The liquid under test is water: density ρ = 1.00 g/cm³, shown in the panel below.', { el: selLiq, label: 'liquid: water' });
    await Tt.teach('Capillary in use', 'The capillary with bore radius 0.05 cm is selected.', { el: selRad, label: 'r = 0.05 cm' });
    await Tt.teach('Rinse first', 'The capillary is rinsed with the liquid itself: water is drawn through the bore and let drain. This cleans the glass and wets it, so the contact angle is 0°.', { el: $('st-rinse'), label: 'Rinse' });
    await rinse();
    await Tt.teach('Rinsed', 'The bore is clean and wet. The status line now shows rinsed: yes.', { el: $('st-status'), label: 'rinsed' });
    await Tt.teach('Dip the capillary', 'The capillary is lowered until its end is well under the water surface.', { box: box('tube'), label: 'dip', ms: 2600 });
    await dip();
    await Tt.teach('Capillary rise', `Water climbs the bore, pulled up by surface tension along the inner rim, and stops where the weight of the column balances that pull. The top of the column is curved: the meniscus.`, { box: box('tube'), label: 'column of water' });
    await readDip(Tt, 1, true);
    await Tt.teach('A fresh dip', 'Each reading comes from a new dip, so the capillary is lifted out and dipped again. The column forms afresh and may settle a little differently.', { el: $('st-lift'), label: 'Lift out', ms: 3200 });
    await lift(); await dip(); await readDip(Tt, 2, false);
    await Tt.teach('Third dip', 'Lift out and dip once more for the third reading.', { box: box('tube'), label: 'dip 3', ms: 2400 });
    await lift(); await dip(); await readDip(Tt, 3, false);
    const a = avg(), sum = st.reads[0] + st.reads[1] + st.reads[2];
    await Tt.teach('Average(h)', 'The three readings are added and divided by 3. Averaging reduces the random scatter between dips.', { el: cell('avg'), label: 'Average(h)', f: `(${st.reads.map(x => x.toFixed(2)).join(' + ')}) ÷ 3 = ${sum.toFixed(2)} ÷ 3 = ${a.toFixed(2)} cm` });
    await Tt.teach('Lift out', 'Readings done: the capillary is lifted out of the water.', { box: box('tube'), ms: 1800 });
    await lift();
    /* calculation: every symbol and number traced to its source */
    await Tt.teach('Calculation', 'The values are filled in the order of the manual: h, r, ρ, g, θ, then γ. A dotted line runs from each symbol or number to where it comes from.', { el: calc });
    await Tt.teach('', '', { trace: lSym('st-cr-h', 'h') });
    for (const k of ['h1', 'h2', 'h3']) await Tt.teach('', '', { trace: lSym('st-cr-h', k) });
    await Tt.traceLine(wH);
    await Tt.teach('Average height h', 'The result goes into the answer box.', { el: IN.h, ms: 1400 }); await Tt.typeInto(IN.h, a.toFixed(2)); await Tt.wait(500);
    await Tt.teach('', '', { trace: lSym('st-cr-r', 'r') });
    await Tt.teach('Radius r', 'The radius, 0.05 cm, not the diameter.', { el: IN.r, ms: 1400 }); await Tt.typeInto(IN.r, '0.05'); await Tt.wait(500);
    await Tt.teach('', '', { trace: lSym('st-cr-rho', 'rho') });
    await Tt.teach('Density ρ', 'Water: 1.00 g/cm³.', { el: IN.rho, ms: 1400 }); await Tt.typeInto(IN.rho, '1.00'); await Tt.wait(500);
    await Tt.teach('', '', { trace: lSym('st-cr-g', 'g') });
    await Tt.teach('Gravity g', 'In cm/s², to match h and r in cm: 980.', { el: IN.g, ms: 1400 }); await Tt.typeInto(IN.g, '980'); await Tt.wait(500);
    await Tt.teach('', '', { trace: lSym('st-cr-th', 'th') });
    await Tt.teach('Contact angle θ', 'Water on clean glass: 0°.', { el: IN.th, ms: 1400 }); await Tt.typeInto(IN.th, '0'); await Tt.wait(500);
    await Tt.teach('Surface tension γ', 'Now the formula: γ = h r ρ g ÷ (2 cos θ). The line under it substitutes the five values just entered.', { el: $('st-cr-gam'), label: 'γ line' });
    await Tt.traceLine(wG);
    const gv = a * st.r * 1 * 980 / 2;
    await Tt.teach('Surface tension γ', 'The result, rounded to one decimal place, goes into the answer box.', { el: IN.gam, ms: 1400, f: `γ = ${(a * st.r * 980).toFixed(2)} ÷ 2 = ${gv.toFixed(2)} ≈ ${gv.toFixed(1)} dyne/cm` }); await Tt.typeInto(IN.gam, gv.toFixed(1)); await Tt.wait(500);
    await Tt.teach('Check', 'Check compares every value with the bench and the table, and catches the usual slips: diameter for radius, a forgotten 2, mm for cm, g = 9.8.', { el: $('st-check'), label: 'Check', ms: 3200 });
    check();
    await Tt.teach('Result', 'The result compares γ with the standard value for water.', { el: res, label: 'Result' });
    for (const k of ['gres', 'std', 'diff']) { const n = res.querySelector(`.num[data-ref="${k}"]`); if (n) await Tt.teach('', '', { trace: n }); }
    await Tt.teach('Done', `γ ≈ ${gv.toFixed(1)} dyne/cm for water. Hovering (or tapping) any symbol or number in the Calculation shows its meaning and source. Start over to take the readings by hand.`, { el: chk });
  }
  L.registerLab('st', {
    btn: $('st-tut'), scope: $('view-st-practical'), reset,
    seed: () => { st.rng = L.mulberry32(20261018); st.forced = [-0.01, 0.01, 0]; },
    run, cleanup: () => { st.rng = Math.random; st.forced = null; st.busy = false; rinseDrops.innerHTML = ''; draw(); updStatus(); }
  });
  L.STB = { st, check, record, reset, avg, IN, dip, lift, rinse, h0 };
  reset();
})(window.SOL);
