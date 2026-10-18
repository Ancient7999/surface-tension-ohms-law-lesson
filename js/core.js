/* Surface tension and Ohm's law lesson: shared engine (no dependencies) */
window.SOL = (function () {
  'use strict';
  const L = {};

  /* tutorial clock: virtual milliseconds that stop while paused and run faster at higher speed */
  const TC = { speed: 1, paused: false, base: 0, at: performance.now() };
  function tnow() { const n = performance.now(); if (!TC.paused) TC.base += (n - TC.at) * TC.speed; TC.at = n; return TC.base; }
  function tcSet(o) { tnow(); Object.assign(TC, o); }

  /* ---------- helpers ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, s, attrs) { const t = el('text', Object.assign({ x, y }, attrs || {}), parent); t.textContent = s; return t; }
  function tsub(parent, x, y, parts, attrs) {
    const t = el('text', Object.assign({ x, y }, attrs || {}), parent);
    parts.forEach(p => {
      if (typeof p === 'string') { const s = el('tspan', null, t); s.textContent = p; }
      else if (p.i) { const s = el('tspan', { 'font-style': 'italic' }, t); s.textContent = p.i; }
      else { const s = el('tspan', { 'baseline-shift': p.sup ? 'super' : 'sub', 'font-size': '72%' }, t); s.textContent = p.sub || p.sup; }
    });
    return t;
  }
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function svgPoint(svg, e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
  function parseNum(s) { if (s == null) return NaN; s = String(s).trim().replace(',', '.').replace(/\s/g, '').replace('−', '-'); if (!s) return NaN; return Number(s); }
  const near = (a, b, tol) => isFinite(a) && isFinite(b) && b !== 0 && Math.abs(a - b) / Math.abs(b) <= tol;
  const fmt = (v, d) => (Math.abs(v) < 1e-12 ? 0 : v).toFixed(d);
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const F_HEAD = 'Commissioner, system-ui, sans-serif', F_BODY = 'Fira Sans, system-ui, sans-serif';
  const C = { ink: '#1c2230', ink2: '#384152', muted: '#687284', acc: '#b8336a', acc2: '#8a2550', acc3: '#e07aa3', accPale: '#fbe9f0', aqua: '#2b8fb3', aqua2: '#1d6d8a', aquaPale: '#e3f2f8', copper: '#b06d3b', slate: '#5d6878', slate2: '#3f4856', slate3: '#9aa3b0', line: '#dfe3e8', line2: '#c9cfd7', paper: '#fcfdfe', good: '#23806a', bad: '#b23a3a', warn: '#8c5a0e' };
  function defs(svg, id) {
    const d = svg.querySelector('defs') || el('defs', null, svg);
    function lin(name, stops, x2, y2) {
      const g = el('linearGradient', { id: `${id}-${name}`, x1: 0, y1: 0, x2: x2 || 0, y2: y2 == null ? 1 : y2 }, d);
      stops.forEach(([o, c, op]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op == null ? 1 : op }, g));
    }
    lin('glass', [[0, '#cfe3ec', .55], [.18, '#ffffff', .85], [.5, '#e6f1f5', .35], [.85, '#ffffff', .6], [1, '#b9d3df', .6]], 1, 0);
    lin('water', [[0, '#7cc3dc', .75], [1, '#3f9fc2', .85]]);
    lin('waterH', [[0, '#5fb2d0'], [.5, '#a8dbec'], [1, '#4aa5c6']], 1, 0);
    lin('steel', [[0, '#f1f3f5'], [.5, '#c6ccd3'], [1, '#8f98a3']], 1, 0);
    lin('steelv', [[0, '#e9edf1'], [1, '#aab2bc']]);
    lin('case', [[0, '#f6f7f9'], [1, '#dde2e8']]);
    lin('panel', [[0, '#384152'], [1, '#262d3a']]);
    lin('lcd', [[0, '#e3ece4'], [1, '#cddbd0']]);
    lin('bench', [[0, '#e7eaee'], [1, '#d6dbe1']]);
    lin('board', [[0, '#fbfbf8'], [1, '#ecece6']]);
    lin('knob', [[0, '#5b6574'], [1, '#262d3a']]);
    lin('res', [[0, '#e9d6b4'], [.45, '#f6e7cb'], [1, '#cdb48a']]);
    lin('copper', [[0, '#d99a66'], [1, '#9c5a2b']]);
    const sh = el('filter', { id: `${id}-sh`, x: '-20%', y: '-20%', width: '140%', height: '160%' }, d);
    el('feDropShadow', { dx: 0, dy: 3, stdDeviation: 3, 'flood-color': '#1c2230', 'flood-opacity': .18 }, sh);
    return d;
  }

  /* ---------- background: faint circuit traces with flowing charge, over a rippling meniscus line ---------- */
  function background() {
    const cv = $('bg'), ctx = cv.getContext('2d');
    let W = 0, H = 0, traces = [], ripples = [], rT = 0;
    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const rnd = mulberry32(7), u = Math.max(36, Math.min(W, H) / 14);
      traces = [];
      for (let i = 0; i < 9; i++) {
        let x = Math.round(rnd() * W / u) * u, y = Math.round(rnd() * H * .75 / u) * u;
        const pts = [[x, y]]; let horiz = rnd() < .5;
        for (let k = 0; k < 5; k++) {
          const d = (1 + Math.floor(rnd() * 4)) * u * (rnd() < .5 ? -1 : 1);
          if (horiz) x += d; else y += d;
          pts.push([x, y]); horiz = !horiz;
        }
        let len = 0; const seg = [];
        for (let k = 1; k < pts.length; k++) { const l = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); seg.push(l); len += l; }
        traces.push({ pts, seg, len, dots: [0, .33, .66].map(o => o * len), sp: 26 + rnd() * 18 });
      }
    }
    function at(t, s) { let k = 0; while (k < t.seg.length && s > t.seg[k]) { s -= t.seg[k]; k++; } if (k >= t.seg.length) return t.pts[t.pts.length - 1]; const a = t.pts[k], b = t.pts[k + 1], f = s / t.seg[k]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }
    let last = performance.now(), T = 0;
    function draw(now) {
      const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1.2; ctx.lineJoin = 'round';
      traces.forEach(t => {
        ctx.strokeStyle = 'rgba(93,104,120,.10)'; ctx.beginPath(); t.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
        [t.pts[0], t.pts[t.pts.length - 1]].forEach(p => { ctx.strokeStyle = 'rgba(93,104,120,.16)'; ctx.beginPath(); ctx.arc(p[0], p[1], 3.2, 0, 6.283); ctx.stroke(); });
        t.dots = t.dots.map(s => (s + t.sp * dt) % t.len);
        t.dots.forEach(s => { const p = at(t, s); ctx.fillStyle = 'rgba(184,51,106,.32)'; ctx.beginPath(); ctx.arc(p[0], p[1], 2, 0, 6.283); ctx.fill(); });
      });
      const y0 = H * .86;
      for (let j = 0; j < 2; j++) {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 8) {
          let y = y0 + j * 14 + Math.sin(x / 90 + T * (.6 + j * .2)) * 5 + Math.sin(x / 37 - T * .9) * 1.6;
          ripples.forEach(r => { const d = Math.abs(x - r.x); if (d < r.R && d > r.R - 60) y -= Math.sin((r.R - d) / 60 * Math.PI) * 4 * (1 - r.R / 340); });
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = j ? 'rgba(43,143,179,.08)' : 'rgba(43,143,179,.16)'; ctx.lineWidth = 1.4; ctx.stroke();
      }
      rT += dt; if (rT > 3.2) { rT = 0; ripples.push({ x: W * (.15 + Math.random() * .7), R: 0 }); }
      ripples.forEach(r => { r.R += 60 * dt; ctx.strokeStyle = `rgba(43,143,179,${(.14 * (1 - r.R / 340)).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(r.x, y0 + 4, r.R, r.R * .12, 0, 0, 6.283); ctx.stroke(); });
      ripples = ripples.filter(r => r.R < 340);
    }
    function frame(n) { draw(n); requestAnimationFrame(frame); }
    window.addEventListener('resize', size); size();
    if (reduced) draw(performance.now()); else requestAnimationFrame(frame);
  }

  /* ---------- navigation: segmented lab tabs in the top bar, numbered dots for the pages of the current lab ---------- */
  const onEnter = {}, onLeave = {};
  let views = [], ids = [], items = [], current = -1, tabs = [];
  const keyOf = v => v.id.replace('view-', '').split('-')[0];
  /* section rail: Practical is always open; every other section stays locked until it is opened */
  const ICON = {
    practical: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/>',
    aim: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>',
    theory: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
    method: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.3"/><circle cx="4.5" cy="12" r="1.3"/><circle cx="4.5" cy="18" r="1.3"/>',
    obs: '<rect x="3.5" y="4" width="17" height="16" rx="1.5"/><path d="M3.5 9.5h17M3.5 15h17M10 4v16"/>',
    mcq: '<path d="M4 5h16v11H9l-5 4z"/><path d="M10 9a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.2"/><circle cx="12" cy="14" r=".6" fill="currentColor"/>'
  };
  const SHORT = { practical: 'Practical', aim: 'Aim', theory: 'Theory', method: 'Method', obs: 'Data', mcq: 'MCQs' };
  const LOCK = '<svg class="ri-lock" viewBox="0 0 16 16" aria-hidden="true"><path class="shackle" d="M5 7V5a3 3 0 0 1 6 0v2"/><rect x="3.5" y="7" width="9" height="7" rx="1.5"/></svg>';
  const secOf = v => v.id.replace('view-', '').split('-').slice(1).join('-');
  const unlockKey = k => 'sol-unlocked-' + k;
  function unlockedSet(k) { try { return new Set(JSON.parse(sessionStorage.getItem(unlockKey(k)) || '[]')); } catch (_) { return new Set(); } }
  function isOpen(v) { const s = secOf(v); return s === 'practical' || unlockedSet(keyOf(v)).has(s); }
  function unlock(v) {
    const k = keyOf(v), set = unlockedSet(k); set.add(secOf(v));
    try { sessionStorage.setItem(unlockKey(k), JSON.stringify([...set])); } catch (_) { /* storage unavailable: unlocked for this page view only */ }
    memo.add(v.id);
  }
  const memo = new Set();
  const open = v => isOpen(v) || memo.has(v.id);
  function paintLocks() { items.forEach((b, j) => { const o = open(views[j]); b.classList.toggle('locked', !o); b.setAttribute('aria-label', views[j].dataset.title + (o ? '' : ' (locked: opens on click)')); }); }
  function nav() {
    views = Array.from(document.querySelectorAll('.view')); ids = views.map(v => v.id.replace('view-', ''));
    const navEl = $('rail-nav');
    items = views.map((v, i) => {
      const sec = secOf(v), b = document.createElement('button'); b.type = 'button'; b.className = 'ri ri-' + sec; b.dataset.key = keyOf(v); b.dataset.sec = sec;
      b.innerHTML = `<span class="ri-ic"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON[sec] || ''}</svg>${sec === 'practical' ? '' : LOCK}</span><span class="ri-l">${v.dataset.title}</span><span class="ri-s">${SHORT[sec] || v.dataset.title}</span><span class="ri-tip" aria-hidden="true">${v.dataset.title}</span>`;
      b.addEventListener('click', () => {
        if (open(v)) { goTo(i, true); return; }
        if (b.classList.contains('unlocking')) return;
        unlock(v); b.classList.add('unlocking');
        setTimeout(() => { b.classList.remove('unlocking'); paintLocks(); goTo(i, true); }, reduced ? 0 : 520);
      });
      navEl.appendChild(b); return b;
    });
    tabs = Array.from(document.querySelectorAll('.lab-tab'));
    tabs.forEach(t => t.addEventListener('click', () => { const i = views.findIndex(v => keyOf(v) === t.dataset.key); if (keyOf(views[current]) !== t.dataset.key) goTo(i, true); }));
    window.addEventListener('popstate', () => goTo(fromHash(), false));
    window.addEventListener('hashchange', () => goTo(fromHash(), false));
  }
  function goTo(i, push) {
    i = clamp(i, 0, views.length - 1);
    if (i === current) return;
    if (!open(views[i])) unlock(views[i]); /* a direct link opens that one section only */
    if (current >= 0 && onLeave[ids[current]]) onLeave[ids[current]]();
    current = i;
    const k = keyOf(views[i]);
    views.forEach((v, j) => v.classList.toggle('active', j === i));
    items.forEach((b, j) => {
      b.hidden = b.dataset.key !== k;
      b.classList.toggle('current', j === i);
      if (j === i) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    paintLocks();
    tabs.forEach((t, j) => { const on = t.dataset.key === k; t.setAttribute('aria-selected', on ? 'true' : 'false'); if (on) $('lab-tabs').dataset.at = String(j); });
    $('top-crumb').innerHTML = `${views[i].dataset.lab} · <b>${views[i].dataset.title}</b>`;
    if (push && location.hash !== '#' + ids[i]) history.pushState(null, '', '#' + ids[i]);
    window.scrollTo({ top: 0 });
    document.title = views[i].dataset.title + ' · ' + views[i].dataset.lab;
    if (onEnter[ids[i]]) onEnter[ids[i]]();
  }
  function fromHash() { const k = ids.indexOf(location.hash.replace('#', '')); return k < 0 ? 0 : k; }

  /* ---------- custom cursor: a droplet, its tip is the hotspot ---------- */
  let cursorOn = false, lastTick = 0;
  function cursor() {
    const cur = $('cursor');
    if (!window.matchMedia('(pointer:fine)').matches) return;
    window.addEventListener('mousemove', e => {
      if (!cursorOn) { document.body.classList.add('has-cursor'); cursorOn = true; }
      cur.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
      cur.classList.remove('hidden');
      const t = e.target && e.target.closest ? e.target : null;
      const grab = t && t.closest('.drag, .gh, .term-pt');
      const hot = t && t.closest('button:not(:disabled), a, select, label, input[type=range], .live, .sym, .num');
      cur.classList.toggle('grab', !!grab); cur.classList.toggle('hot', !!hot && !grab);
    }, { passive: true });
    document.addEventListener('mouseleave', () => cur.classList.add('hidden'));
    window.addEventListener('blur', () => cur.classList.add('hidden'));
    document.addEventListener('pointerdown', () => cursorTick(), true);
  }
  function cursorTick() {
    if (!cursorOn) return; const n = performance.now(); if (n - lastTick < 90) return; lastTick = n;
    const cur = $('cursor'); cur.classList.remove('tick'); void cur.offsetWidth; cur.classList.add('tick');
  }

  /* ---------- plot frame: upright axis labels, unsigned ticks ---------- */
  function makePlot(svg, o) {
    const W = o.W, H = o.H, ml = o.ml || 78, mr = o.mr || 26, mt = o.mt || 46, mb = o.mb || 62;
    const x0 = o.xmin || 0, y0 = o.ymin || 0;
    const X = v => ml + (v - x0) / (o.xmax - x0) * (W - ml - mr), Y = v => H - mb - (v - y0) / (o.ymax - y0) * (H - mt - mb);
    const ix = px => x0 + (px - ml) / (W - ml - mr) * (o.xmax - x0), iy = py => y0 + (H - mb - py) / (H - mt - mb) * (o.ymax - y0);
    svg.innerHTML = ''; svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const g = el('g', null, svg);
    el('rect', { x: ml, y: mt, width: W - ml - mr, height: H - mt - mb, fill: '#fff' }, g);
    for (let v = x0; v <= o.xmax + 1e-9; v += (o.xminor || o.xstep / 2)) for (let w = y0; w <= o.ymax + 1e-9; w += (o.yminor || o.ystep / 2)) el('circle', { cx: X(v), cy: Y(w), r: 1.3, fill: '#d3d8df' }, g);
    for (let v = x0; v <= o.xmax + 1e-9; v += o.xstep) {
      el('line', { x1: X(v), y1: mt, x2: X(v), y2: H - mb, stroke: '#e6e9ee', 'stroke-width': 1, 'stroke-dasharray': '3 5' }, g);
      el('line', { x1: X(v), y1: H - mb - 6, x2: X(v), y2: H - mb, stroke: C.acc, 'stroke-width': 1.2 }, g);
      txt(g, X(v), H - mb + 24, Math.abs(v).toFixed(o.xdec || 0), { 'text-anchor': 'middle', 'font-size': 15, fill: C.ink2, 'font-family': F_BODY });
    }
    for (let v = y0; v <= o.ymax + 1e-9; v += o.ystep) {
      el('line', { x1: ml, y1: Y(v), x2: W - mr, y2: Y(v), stroke: '#e6e9ee', 'stroke-width': 1, 'stroke-dasharray': '3 5' }, g);
      el('line', { x1: ml, y1: Y(v), x2: ml + 6, y2: Y(v), stroke: C.acc, 'stroke-width': 1.2 }, g);
      txt(g, ml - 10, Y(v) + 5, Math.abs(v).toFixed(o.ydec || 0), { 'text-anchor': 'end', 'font-size': 15, fill: C.ink2, 'font-family': F_BODY });
    }
    el('line', { x1: ml, y1: H - mb, x2: W - mr + 8, y2: H - mb, stroke: C.ink, 'stroke-width': 1.6 }, g);
    el('line', { x1: ml, y1: H - mb, x2: ml, y2: mt - 10, stroke: C.ink, 'stroke-width': 1.6 }, g);
    tsub(g, (ml + W - mr) / 2, H - 14, o.xlabel, { 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 600, fill: C.ink, 'font-family': F_BODY });
    tsub(g, ml - 8, mt - 20, o.ylabel, { 'text-anchor': 'start', 'font-size': 16, 'font-weight': 600, fill: C.ink, 'font-family': F_BODY });
    const plot = el('g', null, svg);
    return { X, Y, ix, iy, g: plot, ml, mr, mt, mb, W, H };
  }

  /* ---------- MCQs: numbered, choices shuffled, hint on a wrong pick, explanation on the right one ---------- */
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function mcq(listEl, data, scoreEl, resetBtn) {
    let solved = 0, firstTry = 0;
    function render() {
      solved = 0; firstTry = 0; listEl.innerHTML = '';
      data.forEach((q, qi) => {
        const li = document.createElement('li'); li.className = 'mcq';
        li.innerHTML = `<p class="mcq-q"><span class="mcq-n">${qi + 1}.</span><span>${q.q}</span></p><div class="mcq-opts"></div><div class="mcq-fb" aria-live="polite"></div>`;
        const opts = li.querySelector('.mcq-opts'), fb = li.querySelector('.mcq-fb'); let tries = 0;
        shuffle(q.o.map((t, i) => ({ t, i }))).forEach(c => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'opt'; b.innerHTML = c.t; b.dataset.k = c.i === 0 ? 'right' : 'wrong';
          b.addEventListener('click', () => {
            tries++;
            if (c.i === 0) {
              b.classList.add('right'); opts.querySelectorAll('.opt').forEach(x => x.disabled = true);
              fb.className = 'mcq-fb show explain'; fb.innerHTML = q.e; li.classList.add('solved'); solved++; if (tries === 1) firstTry++; upd();
            } else { b.classList.add('wrong'); b.disabled = true; fb.className = 'mcq-fb show hint'; fb.innerHTML = q.h; }
          });
          opts.appendChild(b);
        });
        listEl.appendChild(li);
      });
      upd();
    }
    function upd() { scoreEl.textContent = `${solved} / ${data.length} answered · ${firstTry} on the first try`; }
    resetBtn.addEventListener('click', render); render();
  }

  /* ---------- extras: opens upward, closes about 500 ms after the pointer leaves ---------- */
  function extras() {
    document.querySelectorAll('.extras').forEach(box => {
      const btn = box.querySelector('.extras-toggle'); let t = null, openedAt = 0;
      const open = () => { clearTimeout(t); if (!box.classList.contains('open')) openedAt = Date.now(); box.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); };
      const close = () => { clearTimeout(t); box.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
      const later = () => { clearTimeout(t); t = setTimeout(close, 500); };
      box.addEventListener('mouseenter', open); box.addEventListener('mouseleave', later);
      btn.addEventListener('click', () => { if (!box.classList.contains('open')) open(); else if (Date.now() - openedAt > 350) close(); });
      box.addEventListener('focusin', open); box.addEventListener('focusout', e => { if (!box.contains(e.relatedTarget)) later(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    });
  }

  /* ---------- method steps: a list that drives a figure ---------- */
  function methodSteps(listEl, capEl, draw, caps) {
    const btns = Array.from(listEl.querySelectorAll('.step'));
    function sel(i) { btns.forEach((b, k) => b.setAttribute('aria-pressed', k === i ? 'true' : 'false')); capEl.textContent = caps[i]; draw(i); }
    btns.forEach((b, i) => b.addEventListener('click', () => sel(i)));
    sel(0);
  }

  Object.assign(L, { TC, tnow, tcSet, NS, reduced, el, txt, tsub, $, clamp, sleep, svgPoint, parseNum, near, fmt, mulberry32, F_HEAD, F_BODY, C, defs, makePlot, mcq, methodSteps, onEnter, onLeave, goTo, cursorTick, shuffle });
  L._init = [background, nav, cursor, extras];
  L.boot = () => { L._init.forEach(f => f()); goTo(fromHash(), false); };
  return L;
})();
