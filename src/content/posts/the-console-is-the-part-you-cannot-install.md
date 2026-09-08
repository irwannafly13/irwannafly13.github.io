---
title: The console is the part you cannot install
date: 2026-09-08
summary: A fully open-source, self-hosted, end-to-end data platform is a solved problem on both Docker and Kubernetes. The single pane of glass on top of it is not, and that is the half people are actually asking for.
tags: [Data Platform, Kubernetes, Docker, Open Source, Lakehouse]
draft: false
---

The question comes up every few months, usually phrased as one sentence: can I
build an end-to-end big data platform, fully open source, self-hosted, easy to
install on Docker and Kubernetes, with a console?

Everything before the last two words is a solved problem. The last two words are
not, and they are the part the person asking actually cares about.

## The two shapes that work

There are really only two credible answers, and which one you want depends on
whether you are buying a lab or a platform.

**On Kubernetes, the closest thing to an open-source distribution is Stackable.**
It ships Kubernetes operators for the usual components — Kafka, NiFi, Spark,
Trino, Airflow, Superset, HDFS, Hive, HBase, Druid, ZooKeeper — plus Open Policy
Agent for authorization, all installed through one CLI with one configuration
style. Versions are pinned as a platform release rather than per-chart, so
`stackablectl release install` gives you a set that was tested together:

```bash
stackablectl release install -i commons -i secret -i listener \
  -i zookeeper -i kafka -i trino 26.7
```

That last argument is the whole pitch. Assembling the same stack from twelve
independent Helm charts means you own every compatibility question between them.

**On a single box, the answer is a Compose lakehouse.** MinIO for object storage,
Iceberg for table format, an Iceberg REST catalog — Lakekeeper or Nessie —
Trino to query it, Airflow or Dagster to schedule it, Superset on top. One
`docker-compose.yml`, minutes to boot, and every component has a first-class
Helm chart the day you outgrow the box.

## Coming off a managed suite

If you are migrating rather than starting fresh, the substitutions are mostly
mechanical:

| Managed service        | Self-hosted equivalent                     |
| ---------------------- | ------------------------------------------ |
| Managed Kafka + CDC    | Strimzi or Redpanda, plus Debezium          |
| Serverless batch SQL   | Spark or Trino over Iceberg                 |
| Real-time serving DB   | StarRocks or Apache Doris                   |
| Cloud object storage   | MinIO                                       |
| Managed orchestration  | Airflow, Dagster or Kestra, plus dbt        |
| Catalog and lineage    | OpenMetadata or DataHub                     |
| BI and ad-hoc SQL      | Superset                                    |

The row nobody plans for is the one that is not in the table: **table
maintenance**. Iceberg needs compaction, snapshot expiry and orphan-file cleanup,
and on a managed platform somebody else was running them. Apache Amoro gives you
a console for it, or you write three Airflow DAGs and own them forever. Skip this
and the platform degrades quietly over about a quarter.

## Where it stops being one thing

Every layer above is genuinely installable, genuinely open source, and genuinely
easy on both Docker and Kubernetes. What none of it gives you is the console.

In practice you land on four user interfaces, not one:

| Question                    | Where it gets answered      |
| --------------------------- | --------------------------- |
| What does the data say?     | Superset                    |
| Did the pipeline run?       | Airflow or Dagster          |
| Where did this column come from? | OpenMetadata or DataHub |
| Is the platform healthy?    | Grafana, ArgoCD, k9s        |

A distribution narrows the *install* surface to one command and the *config*
surface to one style. It does not narrow the *screen* surface at all, because
the projects underneath are separate products with separate UIs and no shared
identity model. The vendor consoles people are comparing against — DataWorks,
Databricks, Snowsight — are the proprietary layer. That layer is the product.
It is exactly what was never open-sourced, and no amount of Helm fixes it.

## The three costs that surprise people

- **RAM, not CPU.** JVM services idle expensive: a Trino coordinator, a Kafka
  broker, a Hive metastore, a Spark driver and an Airflow scheduler each sit at
  1–4 GB before a single query runs. A useful single-node stack wants 48–64 GB.
  On 16 GB you will spend the evening watching things get OOM-killed.
- **Authorization.** Every component has its own model, and unifying them means
  Keycloak in front and OPA behind. This is real work — days, not an afternoon —
  and it is the single most common reason a promising POC never reaches
  production. Stackable pre-wiring OPA is worth more than it looks.
- **High availability.** One node has none, by construction. That is fine for a
  lab, a POC, or an internal analytics workload where a Saturday of downtime
  costs nothing. It is not fine for anything with an SLA, and the gap between
  those two sentences is where most self-hosting regret lives.

## The rule

Self-hosting the platform is the easy half and it is fully open source. Budget
for the console as a project of its own, or accept that your users will live in
two tabs.

Then pick which two. Decide up front which interface each question gets answered
in, wire single sign-on across them, and hide the rest behind an internal link
page. Four tabs a person can navigate is a platform. Four tabs nobody can tell
apart is a pile of software with a Helm chart.
