/* The Watcher — static demo backend.
 *
 * The real app is a FastAPI service reading a Postgres DB that an Airflow poller and an
 * OpenLineage endpoint fill. This file replaces all of it inside the browser so the page can
 * live on a static host: it answers every `api/...` fetch and the `api/stream` EventSource
 * from an in-memory store, with the same response shapes as app/main.py.
 *
 * Everything here is invented: the "acme_shop" dbt project, its tables, the DAGs, the hosts,
 * the row counts and the failures. A small simulator runs the same walk as the PoC DAG —
 * raw → silver → integration → gold → snapshot, dependency order, four threads — so the view
 * keeps moving, and 30 days of nightly history are generated up front for the dashboards.
 */
(() => {
  "use strict";

  // ── deterministic randomness, so the topology is the same on every visit ──────────────────
  let seed = 20261015;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const live = Math.random;                         // the simulator itself may differ per visit
  const pick = (a, r = rand) => a[Math.floor(r() * a.length)];
  const between = (lo, hi, r = rand) => lo + (hi - lo) * r();
  const uuid = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const v = (live() * 16) | 0; return (c === "x" ? v : (v & 3) | 8).toString(16); });

  const PROJECT = "acme_shop";
  const TIERS = ["raw", "silver", "integration", "gold_dim", "gold_fact", "gold_mart", "snapshot"];
  const STALE_HOURS = 26;
  const TRINO_NS = "trino://trino.demo.internal:8080";

  // ── topology: an invented e-commerce lakehouse ────────────────────────────────────────────
  const SOURCES = {
    shop_db: ["orders", "order_items", "customers", "addresses", "products", "product_categories",
              "product_prices", "inventory_levels", "carts", "cart_items", "wishlists", "coupons",
              "promotions", "gift_cards", "subscriptions", "reviews", "returns", "refunds"],
    payments: ["transactions", "payment_methods", "chargebacks", "payouts", "fx_rates"],
    logistics: ["shipments", "shipment_events", "carriers", "warehouses", "stock_transfers", "suppliers",
                "purchase_orders"],
    web_events: ["sessions", "page_views", "search_queries", "add_to_cart_events", "checkout_events"],
    marketing: ["campaigns", "ad_spend", "ad_clicks", "email_sends", "email_events", "affiliates"],
    support: ["tickets", "ticket_messages", "agents", "csat_responses"],
    stores: ["stores", "pos_transactions", "pos_items", "staff_shifts"],
    loyalty: ["members", "points_ledger", "tiers"],
  };
  const nodes = [], edges = [], byName = {};
  const add = (n) => { nodes.push(n); byName[n.name] = n; return n; };
  const link = (src, dst) => { if (byName[src] && byName[dst] && src !== dst) edges.push({ src: byName[src].id, dst: byName[dst].id }); };

  for (const [src, tables] of Object.entries(SOURCES))
    for (const t of tables)
      add({ id: `source.${PROJECT}.${src}.${t}`, name: `${src}.${t}`, kind: "source", tier: "raw",
            schema_name: `raw_${src}`, materialized: null, tests: Math.floor(rand() * 3) });

  // silver: one standardised model per source table, plus a few combined ones
  const model = (name, tier, schema, mat, ups, tests) => {
    const n = add({ id: `model.${PROJECT}.${name}`, name, kind: "model", tier, schema_name: schema,
                    materialized: mat, tests: tests ?? Math.floor(rand() * 6) });
    ups.forEach(u => link(u, name)); return n;
  };
  for (const [src, tables] of Object.entries(SOURCES))
    for (const t of tables)
      model(`stg_${src}__${t}`, "silver", "silver", rand() < .65 ? "incremental" : "table", [`${src}.${t}`]);
  model("stg_web_events__sessionized", "silver", "silver", "incremental",
        ["stg_web_events__sessions", "stg_web_events__page_views"]);
  model("stg_payments__transactions_fx", "silver", "silver", "incremental",
        ["stg_payments__transactions", "stg_payments__fx_rates"]);

  // integration: the cross-system joins
  model("int_order_lifecycle", "integration", "silver", "incremental",
        ["stg_shop_db__orders", "stg_shop_db__order_items", "stg_payments__transactions_fx",
         "stg_logistics__shipments", "stg_shop_db__returns", "stg_shop_db__refunds"], 9);
  model("int_customer_identity", "integration", "silver", "table",
        ["stg_shop_db__customers", "stg_shop_db__addresses", "stg_loyalty__members",
         "stg_web_events__sessionized", "stg_support__tickets"], 7);
  model("int_inventory_movements", "integration", "silver", "incremental",
        ["stg_shop_db__inventory_levels", "stg_logistics__stock_transfers",
         "stg_logistics__purchase_orders", "stg_stores__pos_items"], 5);
  model("int_marketing_touches", "integration", "silver", "table",
        ["stg_marketing__ad_clicks", "stg_marketing__email_events", "stg_marketing__affiliates",
         "stg_web_events__sessionized"], 4);

  const DIMS = {
    dim_customer: ["int_customer_identity"], dim_address: ["stg_shop_db__addresses"],
    dim_product: ["stg_shop_db__products", "stg_shop_db__product_categories", "stg_shop_db__product_prices"],
    dim_category: ["stg_shop_db__product_categories"], dim_store: ["stg_stores__stores"],
    dim_warehouse: ["stg_logistics__warehouses"], dim_carrier: ["stg_logistics__carriers"],
    dim_supplier: ["stg_logistics__suppliers"], dim_campaign: ["stg_marketing__campaigns"],
    dim_channel: ["int_marketing_touches"], dim_payment_method: ["stg_payments__payment_methods"],
    dim_promotion: ["stg_shop_db__promotions", "stg_shop_db__coupons"],
    dim_support_agent: ["stg_support__agents"], dim_loyalty_tier: ["stg_loyalty__tiers"],
    dim_date: [], dim_currency: ["stg_payments__fx_rates"],
  };
  for (const [d, ups] of Object.entries(DIMS)) model(d, "gold_dim", "gold", rand() < .75 ? "table" : "view", ups);

  const FACTS = {
    fct_orders: ["int_order_lifecycle", "dim_customer", "dim_product", "dim_promotion", "dim_date"],
    fct_payments: ["stg_payments__transactions_fx", "dim_payment_method", "dim_currency"],
    fct_shipments: ["int_order_lifecycle", "dim_carrier", "dim_warehouse", "stg_logistics__shipment_events"],
    fct_inventory_daily: ["int_inventory_movements", "dim_product", "dim_warehouse", "dim_store"],
    fct_web_sessions: ["stg_web_events__sessionized", "stg_web_events__checkout_events", "dim_channel"],
    fct_marketing_spend: ["stg_marketing__ad_spend", "dim_campaign", "dim_channel"],
    fct_support_tickets: ["stg_support__tickets", "stg_support__csat_responses", "dim_support_agent"],
  };
  for (const [f, ups] of Object.entries(FACTS)) model(f, "gold_fact", "gold", "incremental", ups, 6 + Math.floor(rand() * 10));

  model("mart_daily_revenue", "gold_mart", "marts", "table", ["fct_orders", "fct_payments", "dim_store"], 12);
  model("mart_customer_ltv", "gold_mart", "marts", "table", ["fct_orders", "dim_customer", "dim_loyalty_tier"], 8);
  model("mart_marketing_roas", "gold_mart", "marts", "table", ["fct_marketing_spend", "fct_orders", "fct_web_sessions"], 6);
  model("mart_fulfilment_sla", "gold_mart", "marts", "view", ["fct_shipments", "fct_inventory_daily"], 5);
  model("mart_support_health", "gold_mart", "marts", "table", ["fct_support_tickets", "dim_customer"], 3);

  const snap = (name, ups) => { const n = add({ id: `snapshot.${PROJECT}.${name}`, name, kind: "snapshot", tier: "snapshot",
    schema_name: "snapshots", materialized: "snapshot", tests: 0 }); ups.forEach(u => link(u, name)); return n; };
  snap("snap_customers", ["dim_customer"]); snap("snap_products", ["dim_product"]);
  snap("snap_product_prices", ["stg_shop_db__product_prices"]); snap("snap_inventory_levels", ["stg_shop_db__inventory_levels"]);
  snap("snap_loyalty_members", ["stg_loyalty__members"]); snap("snap_suppliers", ["dim_supplier"]);

  const nodeById = new Map(nodes.map(n => [n.id, n]));
  const ups = new Map(nodes.map(n => [n.id, []])), downs = new Map(nodes.map(n => [n.id, []]));
  for (const e of edges) { ups.get(e.dst).push(e.src); downs.get(e.src).push(e.dst); }
  const downstreamCount = id => { const seen = new Set(), st = [id]; while (st.length) for (const d of downs.get(st.pop())) if (!seen.has(d)) { seen.add(d); st.push(d); } return seen.size; };

  // A couple of tables were switched off upstream a few days ago: they show as stale.
  const RETIRED = new Set(["model.acme_shop.stg_stores__staff_shifts", "model.acme_shop.stg_marketing__affiliates",
                           "source.acme_shop.stores.staff_shifts"]);

  // ── the store: the tables the collector would have filled ─────────────────────────────────
  const db = { node_run: [], dag_run: [], task: [], event: [], alert: [] };
  let eventId = 0, alertId = 0, version = 0;
  const bump = () => { version++; };
  const iso = ms => ms == null ? null : new Date(ms).toISOString();
  const now = () => Date.now();
  const H = 3600e3;

  const LAYERS = { raw_freshness: ["raw"], silver_standardize: ["silver"], silver_integration: ["integration"],
                   gold: ["gold_dim", "gold_fact", "gold_mart"], snapshot: ["snapshot"] };
  const ERRORS = [
    n => `TrinoUserError: line 42:9: Column 'discount_amt' cannot be resolved (building ${n})`,
    n => `TrinoExternalError: Query exceeded per-node memory limit of 4GB while building ${n}`,
    n => `dbt test failure: unique_${n}_id — 3 duplicate keys found`,
    n => `TrinoQueryError: Iceberg commit conflict on ${n}, retry budget exhausted`,
    n => `TrinoExternalError: Failed to read source file for ${n}: object not found (s3a://demo-lake/…)`,
  ];
  const dataset = n => n.kind === "source" ? `hive.${n.schema_name}.${n.name.split(".").slice(1).join(".")}` : `iceberg.${n.schema_name}.${n.name}`;
  const baseSeconds = n => n.kind === "source" ? between(1, 6) : (8 + 6 * Math.sqrt(n.tests || 0)) * (n.materialized === "view" ? .3 : 1);
  const rowsFor = n => n.materialized === "view" ? 0 : Math.round(between(10e3, n.tier === "gold_fact" ? 9e6 : 3e6, live));

  function event(type, run, n, at, extra = {}) {
    db.event.push({ id: ++eventId, event_time: iso(at), event_type: type, run_id: run.run_id, job_name: n.id,
                    node_id: n.id, error: extra.error || null });
  }
  function startNodeRun(n, ctx, at) {
    const r = { run_id: uuid(), node_id: n.id, job_name: n.id, state: "running", started_at: at, ended_at: null,
                duration_s: null, rows_affected: null, error: null, airflow_dag_id: ctx.dag_id,
                airflow_run_id: ctx.run_id, airflow_task_id: ctx.task_id, output_namespace: TRINO_NS,
                output_name: dataset(n), updated_at: at };
    db.node_run.push(r); event("START", r, n, at); return r;
  }
  function finishNodeRun(r, state, at, error) {
    const n = nodeById.get(r.node_id);
    r.state = state; r.ended_at = at; r.duration_s = (at - r.started_at) / 1000; r.updated_at = at;
    if (state === "success") r.rows_affected = rowsFor(n);
    if (error) r.error = error;
    event(state === "success" ? "COMPLETE" : state === "failed" ? "FAIL" : "ABORT", r, n, at, { error });
  }
  function abortNode(n, ctx, at) {
    const r = startNodeRun(n, ctx, at); db.event.pop(); eventId--;    // an ABORT has no START
    r.started_at = null; finishNodeRun(r, "aborted", at, "skipped: an upstream model failed");
  }

  // Order of a layer: Kahn's algorithm over the edges inside the layer.
  function layerOrder(layer) {
    const tiers = new Set(LAYERS[layer]);
    const ids = nodes.filter(n => tiers.has(n.tier)).map(n => n.id);
    const inLayer = new Set(ids);
    return { ids, deps: new Map(ids.map(id => [id, ups.get(id).filter(u => inLayer.has(u))])) };
  }

  // ── history: one nightly run per day for 30 days, computed in one pass ────────────────────
  const DAILY = "acme_lakehouse_daily";
  function synthRun(dagId, runId, startMs, failRate, runType = "scheduled") {
    const dr = { dag_id: dagId, run_id: runId, state: "running", run_type: runType, logical_date: startMs,
                 start_date: startMs, end_date: null, synced_at: startMs };
    db.dag_run.push(dr);
    let t = startMs, dagFailed = false;
    for (const layer of Object.keys(LAYERS)) {
      const task = { dag_id: dagId, run_id: runId, task_id: layer, map_index: -1, state: "running",
                     operator: "@task", try_number: 1, start_date: t, end_date: null, duration_s: null, synced_at: t };
      db.task.push(task);
      if (dagFailed) { Object.assign(task, { state: "upstream_failed", start_date: null, end_date: null }); continue; }
      const { ids, deps } = layerOrder(layer);
      const ctx = { dag_id: dagId, run_id: runId, task_id: layer };
      const end = new Map(), bad = new Set(); let lanes = [t, t, t, t], failed = 0;
      for (const id of ids) {                                       // ids are in insertion order, which is topological
        const n = nodeById.get(id);
        if (RETIRED.has(id) && startMs > now() - 4 * 24 * H) continue;
        const ready = Math.max(t, ...deps.get(id).map(d => end.get(d) ?? t));
        if (deps.get(id).some(d => bad.has(d))) { abortNode(n, ctx, ready); bad.add(id); end.set(id, ready); continue; }
        lanes.sort((a, b) => a - b);
        const s = Math.max(lanes[0], ready), dur = baseSeconds(n) * between(.7, 1.6) * 1000;
        const r = startNodeRun(n, ctx, s);
        const fail = n.kind !== "source" && rand() < failRate;
        finishNodeRun(r, fail ? "failed" : "success", s + dur, fail ? pick(ERRORS)(n.name) : null);
        if (fail) { bad.add(id); failed++; }
        lanes[0] = s + dur; end.set(id, s + dur);
      }
      const layerEnd = Math.max(t + 2000, ...lanes);
      Object.assign(task, { state: failed ? "failed" : "success", end_date: layerEnd, duration_s: (layerEnd - t) / 1000, synced_at: layerEnd });
      if (failed) dagFailed = true;
      t = layerEnd + 3000;
    }
    Object.assign(dr, { state: dagFailed ? "failed" : "success", end_date: t, synced_at: t });
  }
  const today = new Date(); today.setUTCHours(18, 0, 0, 0);              // 01:00 in UTC+7, the nightly slot
  if (today.getTime() > now()) today.setUTCDate(today.getUTCDate() - 1);
  for (let d = 29; d >= 0; d--) {
    const start = today.getTime() - d * 24 * H + rand() * 120e3;
    // mostly clean nights, a bad one about once a week, and last night was fine
    synthRun(DAILY, `scheduled__${iso(start).slice(0, 19)}+00:00`, start, d === 0 ? 0 : d % 7 === 3 ? .025 : .001);
  }

  // Two DAGs without dbt lineage, so the Runs tab looks like a real Airflow: they show up as
  // runs with tasks but no planets, exactly like unlinked production DAGs do.
  const OTHER = [
    { dag_id: "acme_reverse_etl_crm", every: 6 * H, tasks: ["extract_segments", "push_to_crm", "notify"], dur: 240 },
    { dag_id: "acme_ml_feature_refresh", every: 12 * H, tasks: ["build_features", "train", "evaluate", "publish"], dur: 900 },
  ];
  for (const o of OTHER) {
    for (let t = now() - 30 * 24 * H + rand() * o.every; t < now() - 20 * 60e3; t += o.every) {
      const runId = `scheduled__${iso(t).slice(0, 19)}+00:00`, failed = rand() < .04;
      let tt = t; const dr = { dag_id: o.dag_id, run_id: runId, state: failed ? "failed" : "success", run_type: "scheduled",
                               logical_date: t, start_date: t, end_date: null, synced_at: t };
      o.tasks.forEach((task, i) => {
        const last = i === o.tasks.length - 1, d = o.dur / o.tasks.length * between(.6, 1.5) * 1000;
        const st = failed && last ? "failed" : "success";
        db.task.push({ dag_id: o.dag_id, run_id: runId, task_id: task, map_index: -1, state: st, operator: "PythonOperator",
                       try_number: 1, start_date: tt, end_date: tt + d, duration_s: d / 1000, synced_at: tt + d });
        tt += d + 2000;
      });
      dr.end_date = tt; dr.synced_at = tt; db.dag_run.push(dr);
    }
  }

  // ── the live simulator: a manual run of the same DAG, over and over ───────────────────────
  const SPEED = 0.18;                                // a ~25 min nightly build replays in ~4–5 min
  let liveRun = null;
  function startLiveRun() {
    const t = now(), runId = `manual__${iso(t).slice(0, 19)}+00:00`;
    const dr = { dag_id: DAILY, run_id: runId, state: "running", run_type: "manual", logical_date: t, start_date: t,
                 end_date: null, synced_at: t };
    db.dag_run.push(dr);
    liveRun = { dr, layers: Object.keys(LAYERS), li: -1, failRate: .035 };
    nextLayer(); bump();
  }
  function nextLayer() {
    const L = liveRun; L.li++;
    if (L.li >= L.layers.length || L.dagFailed) {
      if (L.dagFailed) for (const name of L.layers.slice(L.li))
        db.task.push({ dag_id: DAILY, run_id: L.dr.run_id, task_id: name, map_index: -1, state: "upstream_failed",
                       operator: "@task", try_number: 1, start_date: null, end_date: null, duration_s: null, synced_at: now() });
      Object.assign(L.dr, { state: L.dagFailed ? "failed" : "success", end_date: now(), synced_at: now() });
      liveRun = null; bump(); setTimeout(startLiveRun, 25e3); return;
    }
    const layer = L.layers[L.li], { ids, deps } = layerOrder(layer);
    L.task = { dag_id: DAILY, run_id: L.dr.run_id, task_id: layer, map_index: -1, state: "running", operator: "@task",
               try_number: 1, start_date: now(), end_date: null, duration_s: null, synced_at: now() };
    db.task.push(L.task);
    L.pending = new Map(ids.filter(id => !RETIRED.has(id)).map(id => [id, deps.get(id).filter(d => !RETIRED.has(d))]));
    L.done = new Set(); L.bad = new Set(); L.running = 0; L.failed = 0;
    L.ctx = { dag_id: DAILY, run_id: L.dr.run_id, task_id: layer };
    pump();
  }
  function pump() {
    const L = liveRun; if (!L) return;
    let progressed = true;
    while (progressed) {
      progressed = false;
      for (const [id, d] of L.pending) {
        if (!d.every(x => L.done.has(x) || L.bad.has(x))) continue;
        if (d.some(x => L.bad.has(x))) { abortNode(nodeById.get(id), L.ctx, now()); L.bad.add(id); }
        else if (L.running < 4) {
          const n = nodeById.get(id), r = startNodeRun(n, L.ctx, now()); L.running++;
          setTimeout(() => {
            const fail = n.kind !== "source" && live() < L.failRate;
            finishNodeRun(r, fail ? "failed" : "success", now(), fail ? pick(ERRORS, live)(n.name) : null);
            (fail ? L.bad : L.done).add(id); if (fail) L.failed++;
            L.running--; bump(); pump();
          }, baseSeconds(n) * between(.7, 1.6, live) * SPEED * 1000);
        } else continue;
        L.pending.delete(id); progressed = true;
      }
    }
    if (!L.pending.size && !L.running) {
      Object.assign(L.task, { state: L.failed ? "failed" : "success", end_date: now(), duration_s: (now() - L.task.start_date) / 1000, synced_at: now() });
      if (L.failed) L.dagFailed = true;
      bump(); setTimeout(nextLayer, 2500);
    }
  }

  // ── read model (read_state and friends, ported from app/main.py) ──────────────────────────
  const when = r => r.started_at ?? r.ended_at;
  function nodeStatus() {
    const out = new Map();
    for (const r of db.node_run) {
      const cur = out.get(r.node_id);
      if (!cur || (when(r) ?? -1) > (when(cur) ?? -1)) out.set(r.node_id, r);
    }
    return out;
  }
  const runOut = r => ({ run_id: r.run_id, state: r.state, started_at: iso(r.started_at), ended_at: iso(r.ended_at),
    duration_s: r.duration_s, rows_affected: r.rows_affected, error: r.error, airflow_dag_id: r.airflow_dag_id,
    airflow_run_id: r.airflow_run_id, airflow_task_id: r.airflow_task_id, output_namespace: r.output_namespace,
    output_name: r.output_name });
  const drOut = d => ({ dag_id: d.dag_id, run_id: d.run_id, state: d.state, run_type: d.run_type,
    logical_date: iso(d.logical_date), start_date: iso(d.start_date), end_date: iso(d.end_date) });
  const tiOut = t => ({ ...t, start_date: iso(t.start_date), end_date: iso(t.end_date), synced_at: iso(t.synced_at) });

  function readState() {
    const st = nodeStatus(), nodesOut = {};
    for (const [id, r] of st) nodesOut[id] = runOut(r);
    const runs = [...db.dag_run].sort((a, b) => (b.start_date ?? Infinity) - (a.start_date ?? Infinity)).slice(0, 40);
    const dag_runs = runs.map(d => {
      const ts = db.task.filter(t => t.dag_id === d.dag_id && t.run_id === d.run_id);
      return { ...drOut(d), tasks: ts.length, tasks_success: ts.filter(t => t.state === "success").length,
        tasks_running: ts.filter(t => t.state === "running").length,
        tasks_failed: ts.filter(t => t.state === "failed" || t.state === "upstream_failed").length,
        node_runs: db.node_run.filter(n => n.airflow_dag_id === d.dag_id && n.airflow_run_id === d.run_id).length };
    });
    const activity = [...db.node_run].sort((a, b) => b.updated_at - a.updated_at).slice(0, 40)
      .map(r => ({ ...runOut(r), node_id: r.node_id, updated_at: iso(r.updated_at) }));
    const t = now(), recent = db.node_run.filter(r => r.updated_at > t - 24 * H || r.state === "running");
    const in1h = r => r.ended_at && r.ended_at > t - H;
    const totals = {
      dag_runs_active: db.dag_run.filter(d => d.state === "running" || d.state === "queued").length,
      tasks_running: db.task.filter(x => x.state === "running").length,
      models_running: recent.filter(r => r.state === "running").length,
      models_done_1h: recent.filter(r => r.state === "success" && in1h(r)).length,
      models_failed_1h: recent.filter(r => r.state === "failed" && in1h(r)).length,
      rows_1h: recent.filter(in1h).reduce((s, r) => s + (r.rows_affected || 0), 0),
    };
    return { version: String(version), nodes: nodesOut, dag_runs, activity, totals, now: iso(t), stale_hours: STALE_HOURS };
  }

  const pct = (xs, p) => { const a = xs.filter(x => x != null).sort((x, y) => x - y); if (!a.length) return null;
    const i = (a.length - 1) * p, lo = Math.floor(i); return a[lo] + (a[Math.min(lo + 1, a.length - 1)] - a[lo]) * (i - lo); };
  const avg = xs => { const a = xs.filter(x => x != null); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; };
  const windowRuns = (h, offset = 0) => { const t = now(); return db.node_run.filter(r => { const w = when(r); return w > t - (offset + h) * H && w <= t - offset * H; }); };
  function kpis(h, offset = 0) {
    const rs = windowRuns(h, offset);
    return { runs: rs.length, ok: rs.filter(r => r.state === "success").length, failed: rs.filter(r => r.state === "failed").length,
      running: rs.filter(r => r.state === "running").length, avg_s: avg(rs.map(r => r.duration_s)),
      p95_s: pct(rs.map(r => r.duration_s), .95), rows: rs.reduce((s, r) => s + (r.rows_affected || 0), 0),
      models: new Set(rs.map(r => r.node_id)).size };
  }
  function tiersNow() {
    const st = nodeStatus(), t = now();
    return TIERS.map(tier => {
      const ns = nodes.filter(n => n.tier === tier), s = ns.map(n => st.get(n.id));
      return { tier, tables: ns.length,
        ok: s.filter(r => r?.state === "success" && r.ended_at >= t - STALE_HOURS * H).length,
        stale: s.filter(r => r?.state === "success" && r.ended_at < t - STALE_HOURS * H).length,
        failed: s.filter(r => r?.state === "failed").length, running: s.filter(r => r?.state === "running").length,
        idle: s.filter(r => !r || r.state === "aborted").length };
    });
  }
  const WINDOWS = { "24h": 24, "7d": 168, "30d": 720 };
  function dashboard(win) {
    const h = WINDOWS[win] ?? 24, unit = h <= 24 ? "hour" : "day", step = unit === "hour" ? H : 24 * H;
    const trunc = ms => { const d = new Date(ms); if (unit === "hour") d.setUTCMinutes(0, 0, 0); else d.setUTCHours(0, 0, 0, 0); return d.getTime(); };
    const series = [];
    for (let b = trunc(now() - h * H) + step; b <= trunc(now()); b += step) {
      const rs = db.node_run.filter(r => when(r) != null && trunc(when(r)) === b);
      series.push({ t: iso(b), ok: rs.filter(r => r.state === "success").length, failed: rs.filter(r => r.state === "failed").length,
        other: rs.filter(r => r.state !== "success" && r.state !== "failed").length, avg_s: avg(rs.map(r => r.duration_s)) });
    }
    const groups = {};
    for (const r of windowRuns(h)) if (r.duration_s != null) (groups[r.node_id] ??= []).push(r.duration_s);
    const slowest = Object.entries(groups).map(([id, ds]) => ({ name: nodeById.get(id).name, tier: nodeById.get(id).tier,
      runs: ds.length, avg_s: avg(ds), max_s: Math.max(...ds) })).sort((a, b) => b.avg_s - a.avg_s).slice(0, 8);
    const dag_runs = {};
    for (const d of db.dag_run) if ((d.start_date ?? d.logical_date) > now() - h * H) dag_runs[d.state || "none"] = (dag_runs[d.state || "none"] || 0) + 1;
    return { window: win, unit, kpi: kpis(h), prev: kpis(h, h), series, tiers: tiersNow(), slowest, dag_runs, collector: heartbeat() };
  }
  const heartbeat = () => ({ last_ok: iso(now() - 3000), last_error: null, updated_at: iso(now() - 3000) });
  function report(win) {
    const h = WINDOWS[win] ?? 24, rs = windowRuns(h), st = nodeStatus();
    const tiers = TIERS.map(tier => { const x = rs.filter(r => nodeById.get(r.node_id).tier === tier); return x.length ? {
      tier, runs: x.length, ok: x.filter(r => r.state === "success").length, failed: x.filter(r => r.state === "failed").length,
      avg_s: avg(x.map(r => r.duration_s)), p95_s: pct(x.map(r => r.duration_s), .95), rows: x.reduce((s, r) => s + (r.rows_affected || 0), 0) } : null; }).filter(Boolean);
    const f = {};
    for (const r of rs) if (r.state === "failed") { const g = (f[r.node_id] ??= { failures: 0, last: 0, err: null }); g.failures++; if (when(r) > g.last) { g.last = when(r); g.err = r.error; } }
    const failing = Object.entries(f).sort((a, b) => b[1].failures - a[1].failures || b[1].last - a[1].last).slice(0, 15)
      .map(([id, g]) => ({ name: nodeById.get(id).name, tier: nodeById.get(id).tier, failures: g.failures, last_failed: iso(g.last),
        last_error: g.err, current_state: st.get(id)?.state ?? null, downstream: downstreamCount(id) }));
    const dg = {};
    for (const d of db.dag_run) if ((d.start_date ?? d.logical_date) > now() - h * H) (dg[d.dag_id] ??= []).push(d);
    const dags = Object.entries(dg).map(([dag_id, ds]) => ({ dag_id, runs: ds.length, ok: ds.filter(d => d.state === "success").length,
      failed: ds.filter(d => d.state === "failed").length, avg_s: avg(ds.map(d => d.end_date && d.start_date ? (d.end_date - d.start_date) / 1000 : null)),
      last_start: iso(Math.max(...ds.map(d => d.start_date || 0))) })).sort((a, b) => b.runs - a.runs);
    return { window: win, generated_at: iso(now()), kpi: kpis(h), prev: kpis(h, h), tiers, failing, dags, current: tiersNow() };
  }
  function reportCsv(win) {
    const d = report(win), q = v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
    const rows = [["The Watcher report", `window ${win}`, d.generated_at], [],
      ["Layer", "Runs", "Success", "Failed", "Avg duration s", "p95 duration s", "Rows written"],
      ...d.tiers.map(t => [t.tier, t.runs, t.ok, t.failed, (t.avg_s || 0).toFixed(2), (t.p95_s || 0).toFixed(2), t.rows]), [],
      ["Failing table", "Layer", "Failures", "Last failed", "Downstream tables", "Now", "Last error"],
      ...d.failing.map(f => [f.name, f.tier, f.failures, f.last_failed, f.downstream, f.current_state || "", (f.last_error || "").slice(0, 300)]), [],
      ["DAG", "Runs", "Success", "Failed", "Avg duration s", "Last start"],
      ...d.dags.map(g => [g.dag_id, g.runs, g.ok, g.failed, (g.avg_s || 0).toFixed(1), g.last_start])];
    return rows.map(r => r.map(q).join(",")).join("\r\n") + "\r\n";
  }
  const KINDS = { all: null, errors: ["FAIL", "ABORT"], start: ["START", "RUNNING"], complete: ["COMPLETE"] };
  function logs(p) {
    const types = KINDS[p.get("kind") || "all"], q = (p.get("q") || "").toLowerCase(), before = +p.get("before") || Infinity;
    const limit = Math.max(1, Math.min(+p.get("limit") || 150, 500)), runs = new Map(db.node_run.map(r => [r.run_id, r]));
    const out = [];
    for (let i = db.event.length - 1; i >= 0 && out.length < limit; i--) {
      const e = db.event[i], n = nodeById.get(e.node_id);
      if (e.id >= before || (types && !types.includes(e.event_type))) continue;
      if (q && !(e.job_name.toLowerCase().includes(q) || n.name.toLowerCase().includes(q) || (e.error || "").toLowerCase().includes(q))) continue;
      const r = runs.get(e.run_id);
      out.push({ id: e.id, event_time: e.event_time, event_type: e.event_type, job_name: e.job_name, run_id: e.run_id,
        node_name: n.name, tier: n.tier, error: e.error, airflow_dag_id: r?.airflow_dag_id, airflow_run_id: r?.airflow_run_id,
        airflow_task_id: r?.airflow_task_id, duration_s: r?.duration_s, rows_affected: r?.rows_affected, output_name: r?.output_name });
    }
    const counts = {}, t = now();
    for (const e of db.event) if (Date.parse(e.event_time) > t - 24 * H) counts[e.event_type] = (counts[e.event_type] || 0) + 1;
    return { events: out, counts_24h: counts, airflow_public_url: "" };
  }
  function taskLog(p) {
    const dag = p.get("dag_id"), run = p.get("run_id"), task = p.get("task_id");
    const nrs = db.node_run.filter(r => r.airflow_dag_id === dag && r.airflow_run_id === run && r.airflow_task_id === task)
      .sort((a, b) => (when(a) || 0) - (when(b) || 0));
    const ti = db.task.find(t => t.dag_id === dag && t.run_id === run && t.task_id === task);
    const L = [`${iso(ti?.start_date || now())} INFO Task ${dag}.${task} started (try 1)`,
               `${iso(ti?.start_date || now())} INFO dbt build --select tag:${task} --threads 4 --target demo`];
    for (const r of nrs) {
      const n = nodeById.get(r.node_id);
      if (r.state === "running") L.push(`${iso(r.started_at)} INFO START ${n.kind} ${n.schema_name}.${n.name.split(".").pop()}`);
      else if (r.state === "success") L.push(`${iso(r.ended_at)} INFO OK ${n.schema_name}.${n.name.split(".").pop()} [${(r.rows_affected ?? 0).toLocaleString("en")} rows in ${r.duration_s.toFixed(1)}s]`);
      else if (r.state === "failed") L.push(`${iso(r.ended_at)} ERROR FAIL ${n.schema_name}.${n.name.split(".").pop()}: ${r.error}`);
      else L.push(`${iso(r.ended_at)} WARNING SKIP ${n.schema_name}.${n.name.split(".").pop()} (upstream failed)`);
    }
    if (ti?.end_date) L.push(`${iso(ti.end_date)} INFO Task finished: ${ti.state}`);
    L.push("— demo log: generated in your browser, no Airflow behind this page —");
    return { try_number: 1, lines: L.slice(-500), truncated: L.length > 500, airflow_url: null };
  }

  // ── stations ──────────────────────────────────────────────────────────────────────────────
  const fmtNum = n => n == null ? "—" : n >= 1e9 ? (n / 1e9).toFixed(1) + "B" : n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : String(Math.round(n));
  const ago = ms => { if (!ms) return "never"; const s = (now() - ms) / 1000; return s < 90 ? `${s.toFixed(0)}s ago` : s < 5400 ? `${(s / 60).toFixed(0)}m ago` : `${(s / 3600).toFixed(1)}h ago`; };
  const check = (label, state, detail = "") => ({ label, state, detail });
  const overall = cs => { const s = new Set(cs.map(c => c.state)); return s.has("fail") ? "down" : s.has("warn") ? "degraded" : s.has("unknown") ? "unknown" : "healthy"; };
  function runStats(filter) {
    const rs = db.node_run.filter(r => (r.ended_at ?? r.started_at) > now() - 24 * H && filter(r));
    return { runs: rs.length, failed: rs.filter(r => r.state === "failed").length, avg_s: avg(rs.map(r => r.duration_s)),
      p95_s: pct(rs.map(r => r.duration_s), .95), rows: rs.reduce((s, r) => s + (r.rows_affected || 0), 0),
      last_at: Math.max(0, ...rs.map(r => r.ended_at ?? r.started_at)) || null };
  }
  const SOURCE_NOTE = "Demo data, generated in your browser";
  function station(key) {
    const jit = () => Math.round(between(6, 30, live));
    let d;
    if (key === "airflow") {
      const runs24 = db.dag_run.filter(x => x.end_date > now() - 24 * H);
      d = { key, title: "Apache Airflow", subtitle: "Orchestrator · schedules DAGs and dispatches dbt tasks", version: "3.1.0",
        checks: [check("API server", "ok", `${jit()} ms`), check("Metadata DB", "ok", `heartbeat ${ago(now() - 4000)}`),
          check("Scheduler", "ok", `heartbeat ${ago(now() - 2000)}`), check("Triggerer", "ok", `heartbeat ${ago(now() - 6000)}`),
          check("DAG processor", "ok", `heartbeat ${ago(now() - 9000)}`), check("Orbit poller", "ok", `last sync ${ago(now() - 3000)}`),
          check("DAG imports", "ok", "0 import errors")],
        specs: [["Host / IP", "airflow-api-server (ClusterIP)"], ["API endpoint", "http://airflow-api-server.demo:8080"],
          ["Version", "3.1.0"], ["Executor", "KubernetesExecutor"], ["Helm chart", "apache-airflow/airflow 1.18.0"],
          ["Namespace", "data-platform"], ["Total nodes", "3 (worker-a, worker-b, worker-c)"], ["Pods running", "7"],
          ["CPU used", "1.24 cores of 6.00 cores limit"], ["Memory used", "3.8 GiB of 12.0 GiB limit"], ["DAGs", "3"], ["Paused DAGs", "0"]],
        stats: [{ label: "Active runs", value: String(db.dag_run.filter(x => x.state === "running").length) },
          { label: "Tasks running", value: String(db.task.filter(x => x.state === "running").length) },
          { label: "Runs OK (24h)", value: String(runs24.filter(x => x.state === "success").length) },
          { label: "Runs failed (24h)", value: String(runs24.filter(x => x.state === "failed").length) }],
        links: [], source: SOURCE_NOTE };
    } else if (key === "dbt") {
      const st = runStats(r => !r.node_id.startsWith("source.")), last = Math.max(...db.event.slice(-1).map(e => Date.parse(e.event_time)));
      const nm = nodes.filter(n => n.kind === "model").length;
      d = { key, title: "dbt", subtitle: "Transformation · builds silver and gold models on Trino", version: "1.10.4",
        checks: [check("Model graph", "ok", `${nm} models loaded`), check("Lineage events", "ok", `last event ${ago(last)}`),
          check("Failures (24h)", st.failed ? "warn" : "ok", `${st.failed} failed model runs`)],
        specs: [["Project", PROJECT], ["Adapter", "trino"], ["Target host", "trino.demo.internal"], ["Runtime image", "ghcr.io/example/dbt-trino:1.10"],
          ["Runtime version", "1.10.4"], ["Graph parsed with", "dbt 1.10.4"],
          ["Models / snapshots", `${nm} / ${nodes.filter(n => n.kind === "snapshot").length}`],
          ["Sources / tests", `${nodes.filter(n => n.kind === "source").length} / ${nodes.reduce((s, n) => s + n.tests, 0)}`],
          ["Pods running", liveRun ? "1" : "0"]],
        stats: [{ label: "Model runs (24h)", value: String(st.runs) }, { label: "Failed (24h)", value: String(st.failed) },
          { label: "Avg duration", value: st.avg_s ? `${st.avg_s.toFixed(1)}s` : "—" }, { label: "p95 duration", value: st.p95_s ? `${st.p95_s.toFixed(1)}s` : "—" },
          { label: "Rows written (24h)", value: fmtNum(st.rows) }, { label: "Last run", value: ago(st.last_at) }],
        links: [{ label: "Model graph (JSON)", url: "api/topology" }, { label: "Station JSON", url: "api/stations/dbt" }], source: SOURCE_NOTE };
    } else if (key === "trino") {
      const st = runStats(() => true), tables = new Set(db.node_run.filter(r => r.ended_at > now() - 24 * H && r.output_name.startsWith("iceberg.")).map(r => r.output_name)).size;
      const q = liveRun ? Math.min(4, db.node_run.filter(r => r.state === "running").length) : 0;
      d = { key, title: "Trino", subtitle: "Query engine · runs dbt SQL and writes the Iceberg tables", version: "476",
        checks: [check("Coordinator", "ok", `${jit()} ms · up 6.2d`), check("Workers", "ok", "4 active"), check("Blocked queries", "ok", "0"),
          check("Writes seen (24h)", st.runs ? "ok" : "warn", `${st.runs} table writes`)],
        specs: [["Host / IP", "trino.demo.internal:8080 · 10.0.0.10"], ["Version", "476"], ["Environment", "demo"],
          ["Total nodes", "5 (1 coordinator + 4 workers)"], ["CPU", "64 cores available"], ["Memory used", `${(q * 1.6 + .4).toFixed(1)} GiB reserved by queries`],
          ["Catalogs", "iceberg (tables) · hive (raw)"]],
        stats: [{ label: "Running queries", value: String(q) }, { label: "Queued", value: "0" }, { label: "Running drivers", value: fmtNum(q * 37) },
          { label: "Rows written (24h)", value: fmtNum(st.rows) }, { label: "Tables written (24h)", value: String(tables) }, { label: "Last write", value: ago(st.last_at) }],
        links: [{ label: "Station JSON", url: "api/stations/trino" }], setup: null, source: SOURCE_NOTE };
    } else return null;
    d.status = overall(d.checks); d.checked_at = iso(now()); return d;
  }

  // ── alerts (find_alerts / evaluate_alerts, run on a timer like the evaluator thread) ──────
  const RULES = [
    { key: "table_failed", title: "Table build failed", when: "the latest run of a table failed",
      severity: "critical for gold facts / marts or 10+ downstream tables, else warning", resolves: "when the table's next run succeeds" },
    { key: "layer_stale", title: "Layer has stale tables", when: `tables in a layer last succeeded more than ${STALE_HOURS} h ago (one alert per layer)`,
      severity: "critical for marts, else warning", resolves: "when every table in the layer is fresh" },
    { key: "dag_failed", title: "Airflow DAG run failed", when: "the latest run (last 48 h) of a DAG failed", severity: "warning",
      resolves: "when the DAG's next run succeeds" },
    { key: "collector_down", title: "Collector stopped", when: "the Airflow collector has not completed a poll for 5 min",
      severity: "critical", resolves: "when polling succeeds again" },
    { key: "airflow_down", title: "Airflow unhealthy", when: "the Airflow station's health checks report down", severity: "critical",
      resolves: "when every check passes again" },
  ];
  const CHANNELS = [
    { key: "google_chat", title: "Google Chat", env: "GCHAT_WEBHOOK_URL", purpose: "post every new and resolved alert into a team space",
      setup: ["In the Google Chat space: Apps & integrations → Webhooks → add a webhook, copy its URL", "store it as GCHAT_WEBHOOK_URL in the app's secret", "restart the app"], configured: false },
    { key: "pagerduty", title: "PagerDuty", env: "PAGERDUTY_ROUTING_KEY", purpose: "page the on-call for critical alerts; resolve the incident when the alert clears",
      setup: ["In PagerDuty: Service → Integrations → add 'Events API v2', copy the routing key", "store it as PAGERDUTY_ROUTING_KEY in the app's secret", "restart the app"], configured: false },
  ];
  let evaluatedAt = null;
  function evaluate() {
    const st = nodeStatus(), t = now(), found = [];
    for (const [id, r] of st) if (r.state === "failed") {
      const n = nodeById.get(id), ds = downstreamCount(id), crit = n.tier === "gold_fact" || n.tier === "gold_mart" || ds >= 10;
      found.push({ rule: "table_failed", subject: id, severity: crit ? "critical" : "warning", title: `${n.name} failed`,
        detail: `${ds} downstream tables affected` + (r.airflow_task_id ? ` · task ${r.airflow_task_id}` : "") + (r.error ? ` · ${r.error.slice(0, 400)}` : ""),
        node_id: id, dag_id: r.airflow_dag_id });
    }
    const stale = {};
    for (const [id, r] of st) if (r.state === "success" && r.ended_at < t - STALE_HOURS * H) (stale[nodeById.get(id).tier] ??= []).push([r.ended_at, nodeById.get(id).name]);
    for (const [tier, xs] of Object.entries(stale)) { xs.sort((a, b) => a[0] - b[0]);
      found.push({ rule: "layer_stale", subject: tier, severity: tier === "gold_mart" ? "critical" : "warning",
        title: `${xs.length} stale table${xs.length > 1 ? "s" : ""} in ${tier}`, detail: `oldest success ${ago(xs[0][0])}: ${xs.slice(0, 5).map(x => x[1]).join(", ")}${xs.length > 5 ? " …" : ""}`,
        node_id: null, dag_id: null }); }
    const latest = {};
    for (const d of db.dag_run) { const w = d.start_date ?? d.logical_date; if (w > t - 48 * H && (!latest[d.dag_id] || w > (latest[d.dag_id].start_date ?? latest[d.dag_id].logical_date))) latest[d.dag_id] = d; }
    for (const d of Object.values(latest)) if (d.state === "failed")
      found.push({ rule: "dag_failed", subject: d.dag_id, severity: "warning", title: `DAG ${d.dag_id} failed`,
        detail: `latest run ${d.run_id} (${ago(d.start_date)})`, node_id: null, dag_id: d.dag_id });
    const keys = new Set(found.map(a => a.rule + "\x1f" + a.subject));
    for (const a of found) {
      const open = db.alert.find(x => x.state === "firing" && x.rule === a.rule && x.subject === a.subject);
      if (open) Object.assign(open, { last_seen: t, severity: a.severity, title: a.title, detail: a.detail, dag_id: a.dag_id });
      else db.alert.push({ id: ++alertId, ...a, state: "firing", first_seen: t, last_seen: t, resolved_at: null, acked_at: null, notified: {} });
    }
    for (const x of db.alert) if (x.state === "firing" && !keys.has(x.rule + "\x1f" + x.subject)) Object.assign(x, { state: "resolved", resolved_at: t });
    evaluatedAt = t;
  }
  // a little history, so the History tab is not empty on first load
  (() => { const t = now();
    const past = [["table_failed", "model.acme_shop.fct_orders", "critical", "fct_orders failed", "4 downstream tables affected · task gold · TrinoExternalError: Query exceeded per-node memory limit of 4GB while building fct_orders", 30, 29.2],
                  ["dag_failed", "acme_ml_feature_refresh", "warning", "DAG acme_ml_feature_refresh failed", "latest run scheduled__… (3.1h ago)", 52, 40],
                  ["table_failed", "model.acme_shop.stg_payments__chargebacks", "warning", "stg_payments__chargebacks failed", "0 downstream tables affected · task silver_standardize · dbt test failure: unique_stg_payments__chargebacks_id — 3 duplicate keys found", 75, 52]];
    for (const [rule, subject, severity, title, detail, h0, h1] of past)
      db.alert.push({ id: ++alertId, rule, subject, severity, state: "resolved", title, detail, node_id: subject.includes(".") ? subject : null,
        dag_id: rule === "dag_failed" ? subject : DAILY, first_seen: t - h0 * H, last_seen: t - h1 * H, resolved_at: t - h1 * H, acked_at: null, notified: {} });
  })();
  function readAlerts(state, limit) {
    const tl = db.alert.filter(a => state === "all" || a.state === state)
      .sort((a, b) => (b.state === "firing") - (a.state === "firing") || (b.severity === "critical") - (a.severity === "critical") || b.last_seen - a.last_seen)
      .slice(0, Math.max(1, Math.min(limit, 500)))
      .map(a => ({ ...a, first_seen: iso(a.first_seen), last_seen: iso(a.last_seen), resolved_at: iso(a.resolved_at), acked_at: iso(a.acked_at),
                   node_name: a.node_id ? nodeById.get(a.node_id)?.name ?? null : null, tier: a.node_id ? nodeById.get(a.node_id)?.tier ?? null : null }));
    const f = db.alert.filter(a => a.state === "firing"), t = now();
    return { alerts: tl, counts: { firing: f.length, critical: f.filter(a => a.severity === "critical").length, warning: f.filter(a => a.severity === "warning").length,
      acked: f.filter(a => a.acked_at).length, resolved_24h: db.alert.filter(a => a.state === "resolved" && a.resolved_at > t - 24 * H).length,
      fired_24h: db.alert.filter(a => a.first_seen > t - 24 * H).length },
      rules: RULES, channels: CHANNELS, evaluator: { here: true, every_s: 30, last_run: iso(evaluatedAt) } };
  }

  // ── routing ───────────────────────────────────────────────────────────────────────────────
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  function route(method, url) {
    const p = url.searchParams, path = url.pathname.replace(/^.*?\/api\//, "");
    let m;
    if (path === "config") return json({ airflow_public_url: "", tiers: TIERS, stale_hours: STALE_HOURS, dags: [], demo: true });
    if (path === "topology") return json({ nodes, edges });
    if (path === "state") return json(readState());
    if ((m = path.match(/^stations\/(\w+)$/))) { const s = station(m[1]); return s ? json(s) : json({ detail: "unknown station" }, 404); }
    if (path === "ops/dashboard") return json(dashboard(p.get("window") || "24h"));
    if (path === "ops/report") return p.get("format") === "csv"
      ? new Response(reportCsv(p.get("window") || "24h"), { headers: { "Content-Type": "text/csv" } }) : json(report(p.get("window") || "24h"));
    if (path === "ops/logs") return json(logs(p));
    if (path === "ops/tasklog") return json(taskLog(p));
    if (path === "alerts") return json(readAlerts(p.get("state") || "firing", +p.get("limit") || 100));
    if ((m = path.match(/^alerts\/(\d+)\/ack$/)) && method === "POST") {
      const a = db.alert.find(x => x.id === +m[1]); if (!a) return json({ detail: "unknown alert" }, 404);
      a.acked_at = a.acked_at ? null : now(); return json({ id: a.id, acked_at: iso(a.acked_at) });
    }
    if ((m = path.match(/^nodes\/(.+)$/))) {
      const id = decodeURIComponent(m[1]), n = nodeById.get(id); if (!n) return json({ detail: "unknown node" }, 404);
      const runs = db.node_run.filter(r => r.node_id === id).sort((a, b) => (when(b) ?? -Infinity) - (when(a) ?? -Infinity)).slice(0, 30)
        .map(r => { const o = runOut(r); delete o.output_namespace; delete o.output_name; return o; });
      return json({ node: { ...n, updated_at: iso(now() - 2 * 24 * H) }, runs, upstream: ups.get(id), downstream: downs.get(id) });
    }
    if ((m = path.match(/^dag_runs\/([^/]+)\/(.+)$/))) {
      const dag = decodeURIComponent(m[1]), run = decodeURIComponent(m[2]);
      const tasks = db.task.filter(t => t.dag_id === dag && t.run_id === run).sort((a, b) => (a.start_date ?? Infinity) - (b.start_date ?? Infinity)).map(tiOut);
      const node_runs = db.node_run.filter(r => r.airflow_dag_id === dag && r.airflow_run_id === run).sort((a, b) => (when(a) || 0) - (when(b) || 0))
        .map(r => ({ node_id: r.node_id, state: r.state, started_at: iso(r.started_at), ended_at: iso(r.ended_at), duration_s: r.duration_s, airflow_task_id: r.airflow_task_id }));
      return json({ tasks, node_runs });
    }
    if (path === "v1/lineage" || path === "dbt/run_results") return json({ detail: "read-only demo" }, 405);
    return json({ detail: "Not Found" }, 404);
  }

  const realFetch = window.fetch.bind(window);
  const isApi = u => /(^|\/)api\//.test(u.pathname) && u.origin === location.origin && u.pathname.startsWith(new URL(".", location.href).pathname);
  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === "string" ? input : input.url, location.href);
    if (!isApi(url)) return realFetch(input, init);
    await new Promise(r => setTimeout(r, 40 + live() * 80));          // a network-ish pause, so spinners behave
    return route((init.method || (input.method ?? "GET")).toUpperCase(), url);
  };

  // api/stream: push the state whenever the store changed, like the SSE loop in main.py
  class DemoEventSource extends EventTarget {
    constructor(u) {
      super(); this.url = String(u); this.readyState = 0; this.onopen = this.onerror = this.onmessage = null;
      if (!isApi(new URL(this.url, location.href))) throw new Error("demo: only api/stream is available");
      let last = -1;
      setTimeout(() => { this.readyState = 1; this.dispatchEvent(new Event("open")); this.onopen?.(new Event("open")); }, 120);
      this._t = setInterval(() => { if (version === last) return; last = version;
        this.dispatchEvent(new MessageEvent("state", { data: JSON.stringify(readState()) })); }, 1500);
    }
    close() { clearInterval(this._t); this.readyState = 2; }
  }
  window.EventSource = DemoEventSource;

  // Links that point at the API (the CSV download, "Station JSON") open the generated body.
  document.addEventListener("click", async e => {
    const a = e.target.closest?.("a[href]"); if (!a) return;
    const url = new URL(a.getAttribute("href"), location.href); if (!isApi(url)) return;
    e.preventDefault();
    const res = route("GET", url), blob = new Blob([await res.text()], { type: res.headers.get("Content-Type") });
    const href = URL.createObjectURL(blob);
    if (a.hasAttribute("download")) { const d = document.createElement("a"); d.href = href; d.download = `watcher-report-${url.searchParams.get("window") || "24h"}.csv`; d.click(); }
    else window.open(href, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(href), 30e3);
  }, true);

  evaluate(); setInterval(() => { evaluate(); }, 10e3);
  startLiveRun();
  window.__watcherDemo = { nodes, edges, db, readState };
})();
