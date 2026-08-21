---
title: Trino is not a database, and that is the point
date: 2026-08-12
summary: A federated query engine gives you one SQL dialect over many systems. The trap is treating it as a warehouse and pushing work into it that belongs somewhere else.
tags: [Trino, Data Platform, SQL]
draft: false
---

The pitch for a federated query engine is easy to like. Point it at object
storage, at PostgreSQL, at the reporting warehouse, and analysts write one
dialect of SQL instead of three. Nobody moves data first. Nobody waits for a
pipeline to be built before answering a question.

That pitch is true. What it leaves out is that the engine has no storage, no
statistics of its own, and no say in how the systems underneath it are laid out.
Every good property it has is borrowed.

## Where the work actually happens

A federated query is planned centrally and executed remotely, and the difference
between a fast one and a slow one is almost entirely how much of it the
connector managed to push down:

```sql
-- Pushed down: the filter and the aggregate reach PostgreSQL,
-- and a handful of rows come back.
SELECT region, count(*)
FROM postgres.sales.orders
WHERE created_at >= DATE '2026-01-01'
GROUP BY region;

-- Not pushed down: the join key is wrapped in a function the
-- connector cannot translate, so the whole table crosses the wire
-- and the coordinator does the work.
SELECT o.region, count(*)
FROM postgres.sales.orders o
JOIN lake.ref.regions r ON lower(o.region) = lower(r.name)
GROUP BY o.region;
```

Both queries are correct. One reads a few thousand rows over the network and one
reads all of them, and nothing in the SQL tells you which is which. `EXPLAIN` does.
Reading it is the single highest-leverage habit for anybody working on a
federated platform.

## The failure mode

The trap is that it works well enough, early enough, that nobody revisits it.
A dashboard gets pointed at a federated view. The view is convenient, so a second
one is built on top. Six months later the "warehouse" is a stack of views over a
transactional database, and the first time the finance team runs their month-end
report, the application it sits on gets slow.

The engine did nothing wrong. It was asked to be a warehouse, and it is not one.

## Where the line sits

The rule that has held up for me:

- **Federate to explore.** Joining across systems to answer a question once,
  or to find out whether a pipeline is worth building, is exactly the job.
- **Materialise to serve.** Anything on a dashboard, anything with an SLA,
  anything a person refreshes twice a day, gets its own table in the lakehouse
  and a scheduled job that builds it.

The useful reframing is that a federated engine is not a place to put data. It is
a way to reach data you have not decided to move yet. Once you have decided,
move it.
