// Lineage canvas: the whole dbt graph flattened onto a 2D canvas, one column per lifecycle layer
// (raw on the left, snapshots on the right). Click a table to light up everything that feeds it
// (blue, to the left) and everything that depends on it (amber, to the right); "Chain only" lays
// out just that chain so a long path is easy to follow. Plain Canvas 2D, no libraries.
//
//   const lin = createLineage({ host, tiers, nodes: () => nodes, byId: () => byId, up, down,
//                               statusOf, onSelect, onOpen3d });
//   lin.show(); lin.hide(); lin.setSelected(id); lin.setFilter({ query, errOnly, layer }); lin.refresh();

const BOX_W = 230, BOX_H = 20, ROW = 26, CHAIN_ROW = 34;
const SUB_W = BOX_W + 34, GAP_W = 110;   // a tall layer wraps into sub-columns SUB_W apart; layers are GAP_W apart
// rows per sub-column before a layer wraps: picked per layout so the graph fits the canvas at the largest scale

export function createLineage(api) {
  const { host, tiers } = api;
  const el = document.createElement("div");
  el.id = "lineage"; el.hidden = true;
  el.innerHTML = `
    <canvas aria-label="Lineage canvas: every table as a box, one column per layer, lines from upstream to downstream"></canvas>
    <div class="lin-bar">
      <span class="lin-title">Lineage canvas</span>
      <button data-act="fit" title="Fit everything in view (0)">⤢ Fit</button>
      <button data-act="chain" aria-pressed="false" title="Show only the selected table's upstream and downstream chain (O)">⛓ Chain only</button>
      <span class="seg lin-depth" role="group" aria-label="Lineage depth">
        <button data-depth="1" title="Direct parents and children only">1 hop</button>
        <button data-depth="2" title="Two hops each way">2</button>
        <button data-depth="0" aria-pressed="true" title="The full chain to the sources and the last consumers">All</button>
      </span>
      <button data-act="open3d" title="Close the canvas and fly to this table in the 3D orbit">◉ Show in 3D</button>
      <button data-act="close" title="Back to the 3D orbit (C / Esc)">✕ Close</button>
    </div>
    <div class="lin-info" aria-live="polite"></div>
    <div class="lin-tip" hidden></div>`;
  host.appendChild(el);
  const cv = el.querySelector("canvas"), ctx = cv.getContext("2d");
  const info = el.querySelector(".lin-info"), tip = el.querySelector(".lin-tip");
  const btn = a => el.querySelector(`[data-act=${a}]`);

  let W = 0, H = 0, dpr = 1;
  let view = { x: 0, y: 0, k: 1 }, goal = null;     // world -> screen: s = w * k + (x, y)
  let laid = [], sel = null, hover = null, chainOnly = false, depth = 0;
  let filter = { query: "", errOnly: false, layer: null };
  let upSet = new Map(), downSet = new Map();      // id -> hop count from the selection
  let dirty = true, raf = 0, colors = {}, drawMs = 0;

  // ── Layout: columns = layers, rows ordered by barycentre sweeps to cut crossings ───────────
  function layoutOf(list) {
    const ids = new Set(list.map(n => n.id));
    const cols = tiers.map(t => list.filter(n => n.tier === t.key).sort((a, b) => a.name.localeCompare(b.name)));
    const rowH = chainOnly ? CHAIN_ROW : ROW, pos = new Map();
    const place = () => cols.forEach((c, ci) => c.forEach((n, i) => pos.set(n.id, (i - (c.length - 1) / 2) * rowH)));
    place();
    const bary = (n, nbrs) => {
      const ys = nbrs.filter(i => ids.has(i) && pos.has(i)).map(i => pos.get(i));
      return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : null;
    };
    for (let it = 0; it < 6; it++) {
      const fwd = it % 2 === 0, order = fwd ? cols.map((_, i) => i) : cols.map((_, i) => cols.length - 1 - i);
      for (const ci of order) {
        const c = cols[ci]; if (c.length < 2) continue;
        const key = new Map(c.map((n, i) => {
          const b = bary(n, fwd ? api.up.get(n.id) : api.down.get(n.id));
          return [n.id, b ?? pos.get(n.id) ?? i];
        }));
        c.sort((a, b) => key.get(a.id) - key.get(b.id));
        c.forEach((n, i) => pos.set(n.id, (i - (c.length - 1) / 2) * rowH));
      }
    }
    // only the columns in use, packed together (chain mode often skips layers); a tall layer wraps
    // into side-by-side sub-columns in its sorted order so the whole graph stays roughly screen-shaped
    const used = cols.map((c, i) => [c, i]).filter(([c]) => c.length);
    const MAX_ROWS = bestRows(used.map(([c]) => c.length), rowH);
    const prev = new Map(laid.map(b => [b.n.id, b]));
    let x0 = 0;
    return used.flatMap(([c, ti], ci) => {
      const subs = Math.ceil(c.length / MAX_ROWS), per = Math.ceil(c.length / subs), left = x0;
      x0 += (subs - 1) * SUB_W + BOX_W + GAP_W;
      return c.map((n, i) => {
        const old = prev.get(n.id), rows = Math.min(per, c.length - Math.floor(i / per) * per);
        const x = left + Math.floor(i / per) * SUB_W, y = (i % per - (rows - 1) / 2) * rowH;
        return { n, ti, col: ci, x, y, px: old ? old.px : x, py: old ? old.py : y };
      });
    });
  }
  function bestRows(counts, rowH) {
    const w = Math.max(200, W - SIDE * 2), h = Math.max(200, H - TOP - BOTTOM);
    let best = Math.max(...counts, 1), bestK = 0;
    for (let r = 8; r <= Math.max(8, ...counts); r += 2) {
      const width = counts.reduce((a, n) => a + (Math.ceil(n / r) - 1) * SUB_W + BOX_W + GAP_W, -GAP_W);
      const height = Math.max(...counts.map(n => Math.ceil(n / Math.ceil(n / r)))) * rowH;
      const k = Math.min(w / width, h / height);
      if (k > bestK + 1e-9) { bestK = k; best = r; }
    }
    return best;
  }
  function relayout(fitAfter) {
    const all = api.nodes();
    let list = all;
    if (chainOnly && sel) list = all.filter(n => n.id === sel || upSet.has(n.id) || downSet.has(n.id));
    laid = layoutOf(list);
    if (fitAfter) fit(true);
    dirty = true;
  }

  // ── Selection: walk the graph both ways, breadth first so we know the hop count ────────────
  function walk(start, adj) {
    const seen = new Map(), q = [[start, 0]];
    while (q.length) {
      const [id, d] = q.shift();
      for (const nx of adj.get(id) || []) {
        if (seen.has(nx) || nx === start || (depth && d + 1 > depth)) continue;
        seen.set(nx, d + 1); q.push([nx, d + 1]);
      }
    }
    return seen;
  }
  function computeChain() {
    upSet = sel ? walk(sel, api.up) : new Map();
    downSet = sel ? walk(sel, api.down) : new Map();
  }
  function setSelected(id, { center = true } = {}) {
    sel = id && api.byId().has(id) ? id : null;
    computeChain();
    btn("chain").disabled = !sel; btn("open3d").disabled = !sel;
    if (chainOnly) relayout(true);
    else if (sel && center) centerOn(sel);
    renderInfo(); dirty = true;
  }
  function renderInfo() {
    const key = `<div class="key"><span class="k up"></span>upstream <span class="k down"></span>downstream · drag to pan · scroll to zoom · double-click = 3D</div>`;
    if (!sel) { info.innerHTML = `${api.nodes().length} tables · ${countEdges()} dependencies · click a table to trace it${key}`; return; }
    const n = api.byId().get(sel), ups = [...upSet.values()], downs = [...downSet.values()];
    const srcs = [...upSet.keys()].filter(i => !(api.up.get(i) || []).length).length;
    const leaves = [...downSet.keys()].filter(i => !(api.down.get(i) || []).length).length;
    const failing = [...upSet.keys(), ...downSet.keys()].filter(i => api.statusOf(i) === "failed").length;
    info.innerHTML = `<b>${esc(n.name)}</b> · ${esc(api.tierLabel(n.tier))}<br>
      <span class="u">◀ ${ups.length} upstream</span> (${upSet.size ? `${Math.max(...ups)} hop${Math.max(...ups) > 1 ? "s" : ""} deep, ${srcs} source${srcs === 1 ? "" : "s"}` : "none"}) ·
      <span class="d">${downs.length} downstream ▶</span> (${downSet.size ? `${Math.max(...downs)} hop${Math.max(...downs) > 1 ? "s" : ""}, ${leaves} final` : "none"})
      ${failing ? `<br><span class="f">✕ ${failing} failing in this chain</span>` : ""}${key}`;
  }
  const countEdges = () => api.nodes().reduce((a, n) => a + (api.down.get(n.id) || []).length, 0);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ── View: fit / centre with a short ease ───────────────────────────────────────────────────
  function bounds(list = laid) {
    if (!list.length) return { x0: 0, y0: 0, x1: 1, y1: 1 };
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const b of list) { x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + BOX_W); y0 = Math.min(y0, b.y - BOX_H / 2); y1 = Math.max(y1, b.y + BOX_H / 2); }
    return { x0, y0, x1, y1 };
  }
  let TOP = 92, HEAD_Y = 64; const BOTTOM = 70, SIDE = 24;   // TOP / HEAD_Y follow the toolbar height (it wraps on phones)
  function fit(animate) {
    const b = bounds(), w = W - SIDE * 2, h = H - TOP - BOTTOM;
    const k = Math.min(1.6, Math.max(0.12, Math.min(w / (b.x1 - b.x0), h / (b.y1 - b.y0))));
    const t = { k, x: SIDE + (w - (b.x1 - b.x0) * k) / 2 - b.x0 * k, y: TOP + (h - (b.y1 - b.y0) * k) / 2 - b.y0 * k };
    if (animate) goal = t; else { view = t; goal = null; }
    dirty = true;
  }
  function centerOn(id) {
    const b = laid.find(q => q.n.id === id); if (!b) return;
    const k = Math.max(view.k, 0.75);
    goal = { k, x: W / 2 - (b.x + BOX_W / 2) * k, y: (TOP + H - BOTTOM) / 2 - b.y * k };
  }

  // ── Drawing ──────────────────────────────────────────────────────────────────────────────
  function readColors() {
    const c = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    colors = { bg: c("--bg"), panel: c("--panel"), panel2: c("--panel-2"), line: c("--line"), text: c("--text-primary"),
      muted: c("--text-muted"), sec: c("--text-secondary"), up: c("--accent"), down: c("--edge-down") || c("--st-stale"),
      st: Object.fromEntries(["success", "running", "failed", "stale", "skipped", "idle"].map(s => [s, c(`--st-${s}`)])),
      dark: document.documentElement.dataset.theme !== "light" };
  }
  const matchQ = n => filter.query && n.name.toLowerCase().includes(filter.query.toLowerCase());
  function lit(n) {   // does this box stand out (vs faded)?
    if (sel) return n.id === sel || upSet.has(n.id) || downSet.has(n.id);
    if (filter.errOnly && api.statusOf(n.id) !== "failed") return false;
    if (filter.layer && n.tier !== filter.layer) return false;
    if (filter.query && !matchQ(n)) return false;
    return true;
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  const fitCache = new Map();
  function fitText(s, max) {
    const key = `${max}|${s}`, hit = fitCache.get(key); if (hit != null) return hit;
    const out = fitTextRaw(s, max); fitCache.set(key, out); return out;
  }
  function fitTextRaw(s, max) {
    if (ctx.measureText(s).width <= max) return s;
    let lo = 0, hi = s.length;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; ctx.measureText("…" + s.slice(s.length - m)).width <= max ? lo = m : hi = m - 1; }
    return "…" + s.slice(s.length - lo);   // keep the end: table names differ at the end, schema prefixes repeat
  }
  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H);
    const k = view.k;
    ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * view.x, dpr * view.y);
    const at = new Map(laid.map(b => [b.n.id, b]));
    const anyLit = sel || filter.errOnly || filter.layer || filter.query;

    // layer bands (one per layer, spanning its sub-columns)
    const colInfo = new Map();
    for (const b of laid) {
      const c = colInfo.get(b.col);
      if (c) { c.n++; c.x0 = Math.min(c.x0, b.x); c.x1 = Math.max(c.x1, b.x + BOX_W); }
      else colInfo.set(b.col, { ti: b.ti, n: 1, x0: b.x, x1: b.x + BOX_W });
    }
    const cols = [...colInfo.keys()].sort((a, b) => a - b);
    const bb = bounds();
    for (const ci of cols) {
      const c = colInfo.get(ci);
      ctx.fillStyle = ci % 2 ? "rgba(127,127,127,.035)" : "rgba(127,127,127,.07)";
      ctx.fillRect(c.x0 - 18, bb.y0 - 30, c.x1 - c.x0 + 36, bb.y1 - bb.y0 + 60);
    }

    // edges: faded first, then the lit chain on top
    const edgePath = (a, b) => {
      const x0 = a.px + BOX_W, y0 = a.py, x1 = b.px, y1 = b.py;
      ctx.moveTo(x0, y0);
      if (x1 > x0) { const m = (x1 - x0) * .5; ctx.bezierCurveTo(x0 + m, y0, x1 - m, y1, x1, y1); }
      else { const m = 60 + Math.abs(y1 - y0) * .2; ctx.bezierCurveTo(x0 + m, y0, x1 - m, y1, x1, y1); }   // same column: loop out
    };
    const hot = [], hoverEdges = [];
    ctx.lineWidth = 1 / Math.max(k, .5);
    ctx.strokeStyle = colors.muted; ctx.globalAlpha = anyLit ? .07 : .22;
    ctx.beginPath();
    for (const b of laid) for (const d of api.down.get(b.n.id) || []) {
      const t = at.get(d); if (!t) continue;
      const kind = sel ? (d === sel || upSet.has(d)) && (b.n.id === sel || upSet.has(b.n.id)) ? "up"
                       : (b.n.id === sel || downSet.has(b.n.id)) && downSet.has(d) ? "down" : null : null;
      if (kind) { hot.push([b, t, kind]); continue; }
      if (hover && (b.n.id === hover || d === hover)) { hoverEdges.push([b, t, b.n.id === hover ? "down" : "up"]); continue; }
      edgePath(b, t);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    for (const [list, w, a] of [[hoverEdges, 1.4, .7], [hot, 2, .95]]) for (const kind of ["up", "down"]) {
      ctx.strokeStyle = colors[kind]; ctx.lineWidth = w / Math.max(k, .5); ctx.globalAlpha = a;
      ctx.beginPath(); for (const [b, t, kd] of list) if (kd === kind) edgePath(b, t); ctx.stroke();
    }
    // flowing dashes along the selected chain show the direction of data
    if (hot.length) {
      ctx.setLineDash([6, 14]); ctx.lineDashOffset = -(now / 40) % 20; ctx.lineWidth = 2.2 / Math.max(k, .5);
      ctx.strokeStyle = colors.dark ? "rgba(255,255,255,.75)" : "rgba(255,255,255,.95)"; ctx.globalAlpha = .55;
      ctx.beginPath(); for (const [b, t] of hot) edgePath(b, t); ctx.stroke();
      ctx.setLineDash([]); dirty = true;
    }
    ctx.globalAlpha = 1;

    // boxes
    const showText = k > .32;
    ctx.font = `500 11.5px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.textBaseline = "middle";
    for (const b of laid) {
      const n = b.n, s = api.statusOf(n.id), on = lit(n), isSel = n.id === sel, isHov = n.id === hover;
      const rel = upSet.has(n.id) ? "up" : downSet.has(n.id) ? "down" : null;
      ctx.globalAlpha = on ? 1 : .22;
      roundRect(b.px, b.py - BOX_H / 2, BOX_W, BOX_H, 5);
      ctx.fillStyle = isSel ? (colors.dark ? "#1d3550" : "#dbe9fb") : colors.panel; ctx.fill();
      ctx.lineWidth = (isSel ? 2.4 : rel || isHov || matchQ(n) ? 1.6 : 1) / Math.max(k, .6);
      ctx.strokeStyle = isSel ? colors.text : rel ? colors[rel] : isHov || matchQ(n) ? colors.text : s === "failed" ? colors.st.failed : colors.line;
      ctx.stroke();
      // status strip on the left edge
      ctx.fillStyle = colors.st[s] || colors.muted;
      roundRect(b.px, b.py - BOX_H / 2, 5, BOX_H, 2); ctx.fill();
      if (s === "running") { ctx.globalAlpha *= .5 + .5 * Math.sin(now / 250); ctx.fillRect(b.px, b.py - BOX_H / 2, 5, BOX_H); dirty = true; }
      ctx.globalAlpha = on ? 1 : .3;
      if (showText) {
        ctx.fillStyle = on ? colors.text : colors.muted;
        const hopTag = rel ? (rel === "up" ? upSet : downSet).get(n.id) : null;
        const tagW = hopTag != null ? 22 : 0;
        ctx.fillText(fitText(n.name, BOX_W - 16 - tagW), b.px + 10, b.py + .5);
        if (hopTag != null) {
          ctx.fillStyle = colors[rel]; ctx.font = `600 10px ui-sans-serif, system-ui, sans-serif`;
          ctx.fillText(`${rel === "up" ? "−" : "+"}${hopTag}`, b.px + BOX_W - tagW, b.py + .5);
          ctx.font = `500 11.5px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
        }
      }
    }
    ctx.globalAlpha = 1;

    // sticky column headers (screen space)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = colors.bg; ctx.globalAlpha = .9; ctx.fillRect(0, 0, W, HEAD_Y + 14); ctx.globalAlpha = 1;
    ctx.font = `650 11px ui-sans-serif, system-ui, sans-serif`; ctx.textBaseline = "middle";
    cols.forEach((ci, j) => {
      const c = colInfo.get(ci), t = tiers[c.ti], x = c.x0 * k + view.x, x1 = c.x1 * k + view.x;
      if (x > W || x1 < 0) return;
      const full = `${t.label.toUpperCase()}  ${c.n}`, short = `${t.label.split(/[\s/]/)[0].toUpperCase()} ${c.n}`;
      const room = (j + 1 < cols.length ? colInfo.get(cols[j + 1]).x0 * k + view.x : W) - Math.max(8, x) - 10;
      const label = ctx.measureText(full).width <= room ? full : ctx.measureText(short).width <= room ? short : room > 18 ? String(c.n) : "";
      ctx.fillStyle = filter.layer === t.key ? colors.up : colors.sec;
      ctx.fillText(label, Math.min(Math.max(8, x), x1 - ctx.measureText(label).width), HEAD_Y);
    });
  }
  function loop(now) {
    raf = 0;
    if (el.hidden) return;
    if (goal) {
      const e = .2;
      view = { k: view.k + (goal.k - view.k) * e, x: view.x + (goal.x - view.x) * e, y: view.y + (goal.y - view.y) * e };
      if (Math.abs(goal.k - view.k) < .001 && Math.abs(goal.x - view.x) < .5 && Math.abs(goal.y - view.y) < .5) { view = goal; goal = null; }
      dirty = true;
    }
    for (const b of laid) {   // slide boxes to their new rows after a relayout
      if (b.px !== b.x || b.py !== b.y) {
        b.px += (b.x - b.px) * .22; b.py += (b.y - b.py) * .22;
        if (Math.abs(b.x - b.px) < .3 && Math.abs(b.y - b.py) < .3) { b.px = b.x; b.py = b.y; }
        dirty = true;
      }
    }
    if (dirty) { dirty = false; const t0 = performance.now(); draw(now); drawMs = performance.now() - t0; }
    raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (!raf && !el.hidden) raf = requestAnimationFrame(loop); };

  function resize() {
    const r = el.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const barB = el.querySelector(".lin-bar").getBoundingClientRect().bottom - r.top;
    HEAD_Y = Math.round(barB + 20); TOP = HEAD_Y + 28;
    dirty = true;
  }
  new ResizeObserver(() => { if (!el.hidden) { resize(); relayout(false); kick(); } }).observe(el);

  // ── Interaction ──────────────────────────────────────────────────────────────────────────
  const toWorld = (sx, sy) => ({ x: (sx - view.x) / view.k, y: (sy - view.y) / view.k });
  function hit(ev) {
    const r = cv.getBoundingClientRect(), w = toWorld(ev.clientX - r.left, ev.clientY - r.top);
    for (let i = laid.length - 1; i >= 0; i--) {
      const b = laid[i];
      if (w.x >= b.px && w.x <= b.px + BOX_W && Math.abs(w.y - b.py) <= BOX_H / 2) return b.n;
    }
    return null;
  }
  let drag = null;
  cv.addEventListener("pointerdown", ev => { drag = { x: ev.clientX, y: ev.clientY, vx: view.x, vy: view.y, moved: false }; cv.setPointerCapture(ev.pointerId); goal = null; });
  cv.addEventListener("pointermove", ev => {
    if (drag) {
      const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
      if (drag.moved) { view.x = drag.vx + dx; view.y = drag.vy + dy; dirty = true; kick(); tip.hidden = true; return; }
    }
    const n = hit(ev), id = n?.id ?? null;
    if (id !== hover) { hover = id; dirty = true; kick(); }
    cv.style.cursor = n ? "pointer" : drag ? "grabbing" : "grab";
    if (!n) { tip.hidden = true; return; }
    const s = api.statusOf(n.id), u = (api.up.get(n.id) || []).length, d = (api.down.get(n.id) || []).length;
    tip.innerHTML = `<b>${esc(n.name)}</b><br>${esc(api.tierLabel(n.tier))} · ${esc(api.statusLabel(s))}<br>${u} direct upstream · ${d} direct downstream`;
    const r = el.getBoundingClientRect();
    tip.hidden = false;
    tip.style.left = `${Math.min(ev.clientX - r.left + 14, W - tip.offsetWidth - 8)}px`;
    tip.style.top = `${Math.min(ev.clientY - r.top + 14, H - tip.offsetHeight - 8)}px`;
  });
  cv.addEventListener("pointerup", ev => {
    const d = drag; drag = null;
    if (d && !d.moved) {
      const n = hit(ev);
      if (n) { if (n.id !== sel) { setSelected(n.id, { center: false }); api.onSelect(n.id); } }
      else if (sel) { setSelected(null); }
    }
  });
  cv.addEventListener("pointerleave", () => { if (hover) { hover = null; dirty = true; kick(); } tip.hidden = true; });
  cv.addEventListener("dblclick", ev => { const n = hit(ev); if (n) api.onOpen3d(n.id); });
  cv.addEventListener("wheel", ev => {
    ev.preventDefault(); goal = null;
    const r = cv.getBoundingClientRect(), sx = ev.clientX - r.left, sy = ev.clientY - r.top;
    const k = Math.min(3, Math.max(.08, view.k * Math.exp(-ev.deltaY * (ev.ctrlKey ? .01 : .0015))));
    view = { k, x: sx - (sx - view.x) * k / view.k, y: sy - (sy - view.y) * k / view.k };
    dirty = true; kick();
  }, { passive: false });

  el.querySelector(".lin-bar").addEventListener("click", ev => {
    const b = ev.target.closest("button"); if (!b) return;
    if (b.dataset.depth != null) {
      depth = +b.dataset.depth;
      el.querySelectorAll("[data-depth]").forEach(x => x.setAttribute("aria-pressed", x === b));
      computeChain(); if (chainOnly) relayout(true); renderInfo(); dirty = true; kick(); return;
    }
    if (b.dataset.act === "fit") fit(true);
    if (b.dataset.act === "chain") toggleChain();
    if (b.dataset.act === "open3d" && sel) api.onOpen3d(sel);
    if (b.dataset.act === "close") api.onClose();
    kick();
  });
  function toggleChain(on = !chainOnly) {
    chainOnly = on && !!sel;
    btn("chain").setAttribute("aria-pressed", chainOnly);
    relayout(true); kick();
  }

  return {
    get visible() { return !el.hidden; },
    get selected() { return sel; },
    show() {
      if (!el.hidden) return;
      el.hidden = false; readColors(); resize(); computeChain();
      btn("chain").disabled = !sel; btn("open3d").disabled = !sel;
      relayout(false); if (sel) { fit(false); centerOn(sel); } else fit(false);
      renderInfo(); kick();
    },
    hide() { el.hidden = true; tip.hidden = true; if (raf) cancelAnimationFrame(raf); raf = 0; },
    setSelected(id) { if (id !== sel) { setSelected(id); kick(); } },
    clearSelection() { if (chainOnly) toggleChain(false); setSelected(null); kick(); },
    setFilter(f) { filter = { ...filter, ...f }; dirty = true; kick(); },
    refresh() { readColors(); renderInfo(); dirty = true; kick(); },   // live status / theme changed
    fit() { fit(true); kick(); },
    toggleChain() { toggleChain(); },
    // debug / tests
    _state: () => ({ drawMs: +drawMs.toFixed(1), sel, chainOnly, depth, up: upSet.size, down: downSet.size, boxes: laid.length, view: { ...view } }),
    _screenOf(id) { const b = laid.find(q => q.n.id === id); return b && { x: (b.x + BOX_W / 2) * view.k + view.x, y: b.y * view.k + view.y }; },
  };
}
