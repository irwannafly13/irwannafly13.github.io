---
title: The lakehouse as a solar system
date: 2026-10-15
summary: The Watcher draws every dbt model as a planet orbiting an Iceberg core, and every model run as a packet flying Airflow → dbt → Trino → table. Under the picture it is one read model pushed over SSE — and the public copy below runs on invented data, entirely in your browser.
tags: [Airflow, dbt, Trino, OpenLineage, Three.js, Observability]
coverAlt: The Watcher — tables orbiting a golden Iceberg core in rings by layer, with the Airflow, dbt and Trino stations above them and a list of DAG runs on the right.
draft: false
---

A lakehouse has a few hundred tables, and on a normal morning someone asks the
same five questions: *what is running, what failed, what is stale, which Airflow
run built this table, and what sits downstream of it.* Airflow knows the DAGs
but not the tables. dbt knows the tables but forgets everything once the run
ends. Trino knows the queries but not why they ran.

**The Watcher** puts the three in one picture. Every dbt source, model and
snapshot is a planet. The planets orbit the Iceberg lakehouse in rings, one ring
per layer: raw on the outside, then silver, integration and gold, with
snapshots closest to the core. A run of a model is a glowing packet travelling
Airflow → dbt → Trino → its planet, and its status flows back to Airflow.

<style>
.wt-shots-track{display:flex;gap:1rem;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;padding-bottom:.85rem;scrollbar-width:thin;scrollbar-color:rgba(125,125,125,.45) transparent}
.wt-shots-track>figure{flex:0 0 100%;scroll-snap-align:center;margin:0}
.wt-shots-track img{display:block;width:100%;margin:0;border-radius:.75rem;border:1px solid rgba(0,0,0,.08)}
.wt-shots-track figcaption{margin-top:.65rem;font-size:.85rem;line-height:1.55;color:#6b7280}
.wt-shots-track figcaption b{font-weight:600;color:#374151}
.prose .wt-hint{margin-top:.5rem;font-size:.75rem;letter-spacing:.04em;text-transform:uppercase;color:#9ca3af}
:where(.dark) .wt-shots-track img{border-color:rgba(255,255,255,.12)}
:where(.dark) .wt-shots-track figcaption{color:#9ca3af}
:where(.dark) .wt-shots-track figcaption b{color:#e5e7eb}
:where(.dark) .prose .wt-hint{color:#6b7280}
.wt-open{display:inline-flex;align-items:center;gap:.5rem;margin:.25rem .5rem .5rem 0;padding:.7rem 1.1rem;border-radius:.6rem;background:#36e3ff;color:#07080b !important;font-weight:600;text-decoration:none !important}
.wt-open:hover{background:#8ef0ff}
.wt-open.alt{background:transparent;border:1px solid currentColor;color:inherit !important}
.prose .wt-note{margin-top:.25rem;font-size:.8rem;color:#9ca3af}
</style>

<a class="wt-open" href="/blog/the-lakehouse-as-a-solar-system/watcher/index.html" target="_blank" rel="noopener">◉ Open the live demo (3D)</a><a class="wt-open alt" href="/blog/the-lakehouse-as-a-solar-system/watcher/2d.html" target="_blank" rel="noopener">2D view</a>
<p class="wt-note">Simulated data: an invented shop with 144 invented tables. Nothing here comes from a real pipeline. Needs WebGL and works best on a laptop.</p>

<div class="wt-shots-track">
<figure>
<img src="/blog/the-lakehouse-as-a-solar-system/01-flat.webp" alt="The 2D view: concentric rings of tables by layer around an orange core, a few marked stale or failed, four running with comets; the DAG runs list on the right.">
<figcaption><b>1 / 3 — The same orbit, flat.</b> Each ring is a layer and each dot is a table, coloured by its latest run. The blue ones are building right now, the dashed amber ones are stale, the red ones failed. The 2D view is for browsers without WebGL.</figcaption>
</figure>
<figure>
<img src="/blog/the-lakehouse-as-a-solar-system/02-ops.webp" alt="The Ops station opened: KPI tiles for the last 24 hours, a bar chart of table builds per hour, and layer health.">
<figcaption><b>2 / 3 — The Ops station.</b> Double-click the space station for a dashboard, a run report with CSV export, and the raw event log. Every number is read from the same tables the orbit is drawn from.</figcaption>
</figure>
<figure>
<img src="/blog/the-lakehouse-as-a-solar-system/03-canvas.webp" alt="The lineage canvas: every table in columns by layer with dependency curves between them.">
<figcaption><b>3 / 3 — The lineage canvas.</b> The same graph laid flat, in columns by layer. Click a table to trace what feeds it and what it feeds.</figcaption>
</figure>
</div>
<p class="wt-hint">Drag or swipe to move through the three screens →</p>

## Three inputs, one read model

The real service is a small FastAPI app with its own Postgres database, kept
apart from Airflow's metadata database so it can be wiped without touching
Airflow. Three things write into it:

- an **Airflow poller** that reads DAG runs and task instances from the
  Airflow 3 REST API every ten seconds, as a read-only user;
- an **OpenLineage endpoint** that receives one `START` and one
  `COMPLETE`, `FAIL` or `ABORT` event per model run, from `dbt-ol` or the
  Airflow OpenLineage provider;
- a **`run_results.json` endpoint** for dbt runs that do not emit lineage.

The UI reads none of these directly. One function, `read_state()`, folds them
into a single JSON document: the latest run of every table, the last forty DAG
runs, the last forty hops, and a few totals. `/api/stream` re-reads it every
1.5 seconds and pushes it over Server-Sent Events **only when its version
changed**, so a quiet lakehouse costs one cheap query and a keep-alive.

The joining key is the OpenLineage run's parent facet. It carries the Airflow
`dag_id`, `run_id` and `task_id`, and the output dataset names the Trino table,
so a single `node_run` row holds all four hops. That row is what lets you click
a planet and jump to the Airflow task that last built it.

## Status is derived, not stored

No table has a status column. A planet's status is its **latest run**:
`success`, `running`, `failed`, or `aborted` when an upstream model failed.
**Stale** is not a state any run reports. It is `success` older than 26 hours,
so a table whose pipeline was quietly switched off turns stale on its own. The
alert rules in the Death Star work the same way: a failed fact or mart table
is critical, so is any failed table with ten or more tables downstream, and an alert resolves itself the next time the table builds.

## How the public demo works

The real Watcher reads a real pipeline, so it stays on the intranet. The copy
linked above is the same page. Apart from a *demo* label and links to static file names, the
only change is one script loaded before everything else: `mock-api.js`. It replaces `fetch` and `EventSource` for
anything under `api/`, and it answers from an in-memory store with exactly the
response shapes the server returns.

The data in that store is invented end to end:

- the **topology** is a made-up e-commerce dbt project, `acme_shop`, with 52
  sources, 54 silver models, 4 integration models, 28 gold tables and 6
  snapshots;
- **30 days of nightly runs** are generated when the page loads, about one bad
  night a week, so the dashboards and the report have something to say;
- a **simulator** replays the nightly DAG on a loop, layer by layer in
  dependency order on four threads, the same walk as the proof-of-concept DAG.
  Now and then a model fails, and everything downstream of it is skipped.

Because the mock mirrors the server's shapes, the page cannot tell the
difference, and neither the 3D view nor the 2D view needed changing.

## The rule

Give the picture one input. Three systems each know part of the story; fold
them into one versioned read model, push it only when it changes, and every
view (orbit, canvas, dashboard, alerts) becomes a different drawing of the same
JSON. That is also what made the demo cheap: replace the one input and
everything else follows.
