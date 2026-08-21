---
title: A DAG should explain itself at 3am
date: 2026-05-28
summary: The person debugging a failed pipeline is usually tired, usually not the author, and usually has no context. Almost every orchestration convention worth having follows from that.
tags: [Airflow, Orchestration, Operations]
draft: false
---

Pipeline code gets read in two very different situations. The first is while it
is being written, by somebody holding the whole design in their head. The second
is at 3am, by somebody who has been paged, does not know this pipeline, and wants
to go back to bed.

Almost every convention worth having falls out of optimising for the second one.

## Name tasks after what broke, not what runs

A task named `run_script` tells the person on call nothing. The alert says
`run_script` failed and they still have to open the code to learn what that
means. A task named `load_orders_to_staging` has already answered the first
three questions somebody would ask.

The test is simple: if the task name alone appeared in an alert, would a
colleague know which system to go and look at? If not, rename it.

## Make retries mean something

Retries are usually set once, at the DAG level, and forgotten. That flattens a
distinction that matters:

- A network timeout **should** retry. It is transient and the retry is free.
- A schema mismatch **should not**. Three retries turn one clear failure into
  four identical alerts and a twelve-minute delay before anybody is told.

Retrying by default is fine. Retrying a task that can only fail deterministically
is just a slower way to deliver bad news.

## Make the failure message carry its own context

The most useful thing a failing task can do is say what it was working on:

```python
if missing := expected_columns - set(df.columns):
    raise ValueError(
        f"{source_table} is missing {sorted(missing)} "
        f"for partition {execution_date:%Y-%m-%d}"
    )
```

That message is the whole investigation, in the alert, before anybody has opened
a browser. Compare it with `KeyError: 'order_id'`, which is the same failure and
tells you nothing about which table or which day.

## Let the schedule be the documentation

If a DAG runs daily but only actually matters on weekday mornings, the schedule
should say so rather than the logic silently no-op'ing on Sundays. A pipeline
that does nothing on a Sunday looks identical to a pipeline that is broken on a
Sunday, right up until you read the code.

## The underlying rule

Everything above is one idea wearing different clothes: **the pipeline should be
debuggable by somebody who does not know it.** That person is sometimes a
colleague. Given enough months, it is reliably you.
