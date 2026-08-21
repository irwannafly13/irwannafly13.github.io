---
title: Ask what the question's deadline is, not whether the data is streaming
date: 2026-07-03
summary: Most streaming projects are justified by the shape of the source system. That is the wrong end to start from — begin with when somebody needs the answer.
tags: [Kafka, Flink, Streaming, Architecture]
draft: false
---

Streaming architectures usually get justified from the source end. The events
arrive continuously, therefore the pipeline should be continuous. It sounds
obvious, and it is the wrong end of the problem to start from.

Data being continuous is a fact about the source. It says nothing about when
anybody needs an answer. Those are separate questions, and only the second one
should decide what you build.

## The question I ask first

> When somebody looks at this number and it is wrong, how long do they have
> before that costs something?

The answers cluster more sharply than you would expect:

| Deadline           | What it justifies                                    |
| ------------------ | ---------------------------------------------------- |
| Seconds            | Streaming, genuinely. Fraud checks, limits, alerting. |
| Within the day     | Streaming or micro-batch. Usually streaming wins.     |
| Tomorrow morning   | Batch. A nightly job is the right answer.             |
| Nobody has checked | Batch, and go find out who reads it.                  |

That last row is not a joke. A meaningful share of "we need this in real time"
requests come from reports where nobody could name the person who reads them.

## What streaming actually costs

The transformation logic is the cheap part. What you take on with a streaming
pipeline is everything around it:

- **State that outlives a restart.** A windowed aggregate has to survive
  deployment, and now checkpoint storage is a production dependency.
- **Time that is not wall-clock.** Event time, watermarks, and a decision about
  what to do with the record that arrives forty minutes late.
- **Replay as a first-class operation.** A batch job is re-run. A streaming job
  is reset to an offset, and everything downstream must tolerate seeing those
  records twice.
- **Debugging without a table to query.** The intermediate state is inside the
  job, not sitting in a schema you can `SELECT` from at 2am.

None of these are reasons to avoid streaming. They are the actual scope of the
work, and they belong in the estimate rather than arriving as a surprise in
month three.

## Where it earns its keep

Once the deadline genuinely is seconds, the shape settles down quickly. Sources
publish to Kafka. Flink handles transformation and enrichment in flight, holding
whatever state the joins need. Results land somewhere the reporting layer can
query directly, and the batch pipelines keep doing the things they are honestly
better at — wide historical joins, full reprocessing, anything where correctness
matters more than latency.

The two paths coexist without much friction. What causes friction is running the
streaming path for questions whose deadline was always tomorrow morning.
