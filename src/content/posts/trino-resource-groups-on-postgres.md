---
title: Trino resource groups on Postgres
date: 2026-08-31
summary: Trino's db configuration manager turns resource groups into rows a coordinator polls once a second, which is what lets an admin UI edit them live. Setting it up has two failure modes, and both crash-loop the coordinator without saying why.
tags: [Trino, PostgreSQL, Operations, EMR]
draft: false
---

Trino's `db` configuration manager turns resource groups into rows a coordinator
polls once a second — which is what lets an admin UI edit them live. Setting it
up has two failure modes, and both crash-loop the coordinator without saying why.

Everything below is verified against **Trino 422** on **Aliyun EMR** with
**PostgreSQL 17.9**, last confirmed 2026-08-27.

## Why the db manager

The `file` manager reads its JSON once, at boot. Changing a limit means editing a
file on the coordinator and restarting it.

|                      | `file`                                | `db`                                     |
| -------------------- | ------------------------------------- | ---------------------------------------- |
| **Source**           | `resource-groups.json` on the coordinator | PostgreSQL tables                    |
| **Reload**           | startup only                          | polled every `refresh-interval` (~1s)    |
| **Editable live**    | no                                    | yes                                      |

The `db` manager polls, so an edit is live on the cluster within about a second —
the entire reason an admin UI can exist at all. The UI and Trino are two clients
of one database: one writes, the other reads.

```
   admin UI                  PostgreSQL                Trino coordinator
      │                    trino_rg schema                     │
      │      writes        ├─ resource_groups                  │
      └───────────────────▶├─ selectors        ◀───────────────┘
                           └─ ...                polls every 1s
```

## Setup from nothing

### The database

> **Do not create the tables.** Trino owns this DDL. It runs Flyway at
> coordinator startup from migrations bundled in
> `trino-resource-group-managers-<version>.jar` — V1→V6 as of 422.
> Hand-creating them causes a crash loop.

Give Trino an empty schema and let it build:

```sql
CREATE SCHEMA trino_rg;
```

Trino creates `resource_groups`, `selectors`, `exact_match_source_selectors`,
`resource_groups_global_properties` and `flyway_schema_history` on first boot.
The login needs DDL rights on this schema — Flyway issues `CREATE TABLE` and
`ALTER TABLE`. Scope it to the schema; superuser is not required.

### The coordinator

`etc/resource-groups.properties`, **coordinator only** — workers never read it:

```properties
resource-groups.configuration-manager=db
resource-groups.config-db-url=jdbc:postgresql://<host>:5432/<database>?currentSchema=trino_rg
resource-groups.config-db-user=<user>
resource-groups.config-db-password=<password>
resource-groups.refresh-interval=1s
resource-groups.max-refresh-interval=1h
```

`chmod 600` — it holds a database password.

Two things that will bite you:

- **`?currentSchema=` is mandatory.** Trino's DAO and its Flyway migration both
  use unqualified table names. Without it they resolve against `public`, where
  Flyway helpfully creates a second, empty copy of the whole schema — which then
  matches no query while your real rows sit untouched.
- **`resource-groups.config-file` must not be present.** It is fatal. See the
  troubleshooting section below.

On Aliyun EMR the file the coordinator actually reads is
`/etc/taihao-apps/trino-conf/resource-groups.properties`. The console may show a
different path (`/etc/emr/trino-conf/…`); `<trino-home>/etc` is a symlink, so
follow it rather than trusting the console.

### Seed the rows

```bash
psql "$DATABASE_URL" -f trino_resource_groups_seed.postgres.sql
```

Use `psql -f`, never a shell heredoc: `${USER}` is a Trino template that must
reach the database literally, and the shell would expand it to your username.

**A group with no selector is invalid.** Trino has no way to route a query into
it and the coordinator refuses to start. Always seed both.

`environment` must match the coordinator's `node.environment` — check it with
`curl -sk https://<coordinator>:7778/v1/info`. Set it explicitly rather than
leaving it `NULL`: a root group whose environment doesn't match is silently
invisible, and "no group matched" looks exactly like "resource groups are broken"
from outside.

### Point the admin UI at the same database

Whatever writes to these tables needs the same five connection values, plus the
schema:

```
DATABASE_POSTGRES_HOST=...
DATABASE_POSTGRES_PORT=5432
DATABASE_POSTGRES_USER=...
DATABASE_POSTGRES_PASSWORD=...
DATABASE_POSTGRES_DATABASE=...
DATABASE_POSTGRES_SCHEMA=trino_rg
```

All five are required together; setting `HOST` without the rest is a startup
error. `SCHEMA` is worth validating to a bare identifier, because it is the one
value interpolated into SQL rather than bound.

## Verifying it works

"The coordinator started" is **not** the same as "resource groups are working."
Check all three.

### 1. Is Trino polling?

The only reliable proof. From any host that can reach the database:

```sql
SELECT seq_scan FROM pg_stat_user_tables
 WHERE schemaname='trino_rg' AND relname='resource_groups';
```

Run it twice, 15 seconds apart. At `refresh-interval=1s` it climbs by roughly
**2 per second**. Flat means Trino is not reading these tables, whatever its
health endpoint says.

> **Don't** look for a connection in `pg_stat_activity`. The coordinator opens
> and closes a connection per poll, so it never appears as a resident
> connection — a healthy, polling coordinator shows zero connections almost all
> the time.

### 2. Is the coordinator up?

```bash
curl -sk https://<coordinator>:7778/v1/info        # starting:false, uptime climbing
curl -sk https://<coordinator>:7778/v1/info/state  # "ACTIVE"
```

`starting:true` with a small uptime, repeatedly, is a crash loop — the process is
being restarted every ~30s, not running.

### 3. Do queries land in a group?

```bash
curl -sk "https://<coordinator>:7778/v1/query/<queryId>" \
  | grep -o '"resourceGroupId":\[[^]]*\]'
```

Expect `["<username>"]` for the `${USER}` template.

## Troubleshooting

### Read the log correctly first

This one invalidates every other check, so it comes before them.

On EMR, `server.log` is a **symlink that rotates on every boot**:
`server.log -> server.log-20260827.160554`. A crash-looping coordinator creates a
new file every ~30 seconds, so grepping `server.log` reads the boot *currently in
progress* — which hasn't failed yet. You get no output and conclude there is no
error.

Read a **completed** file — the second-newest:

```bash
F=$(ls -t /mnt/disk1/log/trino/var/log/server.log-2026* | sed -n 2p)
grep -nE '\b(ERROR|FATAL)\b|Caused by|Exception' "$F" | tail -20
tail -n 40 "$F"
```

- Use `\b(ERROR|FATAL)\b` **without** `-i`. Case-insensitive `error` matches
  ordinary INFO lines like `query.remote-task.max-error-duration`, and with
  `-m<N>` those consume the match budget before reaching the real error.
- `launcher.log` is useless here — it stops at `Disabling stderr output` on every
  boot, because logging switches to `server.log` at that point.
- Comparing rotated file **sizes** is a fast signal: all crash logs land within a
  few hundred bytes of each other, so a step change marks the moment a cause was
  fixed or introduced.

### Flyway collision on a migration

**Fatal — `column already exists`:**

```
Current version of schema "trino_rg": 4
Migrating schema "trino_rg" to version "5 - add user group to selectors"
ERROR: column "user_group_regex" of relation "selectors" already exists
  at FlywayMigration.migrate(FlywayMigration.java:56)
  at DbResourceGroupConfigurationManagerFactory.create(...:44)
```

**Cause.** The tables were created by hand with the *latest* column set, but
`flyway_schema_history` was stamped at an older version. On boot Flyway replays
the migrations it thinks are missing and collides with columns already there. Two
sources of truth for one schema.

**Fix.** Let Trino rebuild. Next boot, Flyway applies V1→V6 cleanly; then
re-seed.

```sql
DROP SCHEMA trino_rg CASCADE;   -- destroys groups and selectors
CREATE SCHEMA trino_rg;
```

**Don't** patch `flyway_schema_history` to skip the migration. Hand-written
columns are subtly wrong in ways that then freeze permanently — ours had
`user_group_regex VARCHAR(512)` where V5 declares `VARCHAR(2048)`.

> **Why this is invisible.** On PostgreSQL, DDL is transactional, so a failed
> migration rolls back and leaves no history row. Nothing in
> `flyway_schema_history` records the failure — `max(version)` sitting one below
> the jar's highest migration is the only hint.

### Unused configuration property

**Fatal — `resource-groups.config-file was not used`:**

```
1) Error: Configuration property 'resource-groups.config-file' was not used
  at io.airlift.bootstrap.Bootstrap.initialize(Bootstrap.java:232)
  at DbResourceGroupConfigurationManagerFactory.create(...:57)
```

**Cause.** `config-file` belongs to the `file` manager. The loader strips
`resource-groups.configuration-manager` and hands every remaining property to the
chosen factory; Airlift's Bootstrap treats any unclaimed property as fatal. The
two managers are mutually exclusive.

**Fix.** Delete the whole line. Blanking the value is **not** enough — an
empty-valued key is still a key and fails identically.

```bash
F=/etc/taihao-apps/trino-conf/resource-groups.properties
sudo cp "$F" "$F.bak"
sudo sed -i '/^[[:space:]]*resource-groups\.config-file/d' "$F"
```

On EMR this is a locked console default with no delete action. The file edit
works but is undone by the next console config push. Either re-apply it after
every push, or find the console's raw-file editor.

### No selectors are configured

**Fatal — `environment` is NULL:**

```
FAILED: Query failed (#2026...): No selectors are configured
```

**Cause.** Trino resolves selectors by joining through the group and filtering on
the coordinator's `node.environment`:

```sql
SELECT s.* FROM selectors s
  JOIN resource_groups r ON s.resource_group_id = r.resource_group_id
 WHERE r.environment = :environment      -- NULL does NOT match
```

`NULL` is **not a wildcard**. A group with no environment is invisible to every
coordinator, its selectors are dropped with it, and Trino sees an empty
configuration — hence "no selectors", even with rows plainly sitting in the
table.

**Fix.** Set `environment` on every group to the coordinator's
`node.environment`, from `/v1/info`.

```sql
UPDATE trino_rg.resource_groups SET environment = 'production'
 WHERE environment IS NULL;
```

**Diagnose.** Run Trino's own join. Zero rows returned, while `selectors` plainly
has rows, is this bug exactly.

```sql
SELECT s.id, s.priority, s.user_regex, r.name, r.environment
  FROM trino_rg.selectors s
  JOIN trino_rg.resource_groups r ON s.resource_group_id = r.resource_group_id
 WHERE r.environment = 'production';
```

### A specific selector never matches

Trino walks selectors in **descending priority** and takes the **first match,
then stops**. A catch-all — every predicate NULL — matches everything, so it must
always hold the **lowest** priority in the table. Two selectors at equal priority
break the tie by insertion order, which is not something to rely on.

```
priority 10   admin     user_regex=alice     <- specific, checked first
priority  1   ${USER}   (no predicates)      <- fallback, checked last
```

> **`user_regex` is a full match, not a substring.** `admin` does *not* match
> `admin_user`, and `.*admin.*` matches far more than intended. Prefer an
> explicit alternation: `(alice|bob|carol)`.

### Coordinator starts, but nothing is grouped

Check in this order:

1. `seq_scan` flat → Trino is not polling. Config problem, not data.
2. `SELECT * FROM trino_rg.selectors` empty → nothing routes queries. The
   coordinator usually refuses to start at all in this state.
3. `environment` mismatch → compare the column against `/v1/info`. A non-matching
   root group is silently invisible.
4. A second copy in `public` →
   `SELECT table_schema FROM information_schema.tables WHERE table_name='resource_groups';`
   Two rows means a boot ran without `?currentSchema=`.

### Symptom index

| Symptom                                  | Likely cause                          |
| ---------------------------------------- | ------------------------------------- |
| Coordinator crash-loops, port closed     | config or migration failure           |
| `grep` on `server.log` finds nothing     | reading the in-progress boot          |
| `already exists` on a migration          | hand-created tables                   |
| `… was not used`                         | leftover `file` manager property      |
| Up, but `seq_scan` flat                  | not actually using the `db` manager   |
| `No selectors are configured`            | group has `environment` NULL          |
| A specific selector never fires          | catch-all at equal/higher priority    |
| Up, polling, queries ungrouped           | no selector / environment mismatch    |
| Empty `public.resource_groups` appears   | missing `?currentSchema=`             |

## Operating notes

### One database per cluster

`environment` is the **only** mechanism scoping a group to a cluster. Two
coordinators sharing a `node.environment` value *and* a schema share one
configuration — an edit meant for dev takes effect on prod within a second.

If your clusters report the same `node.environment` (EMR defaults everything to
`production`), give each its own schema:

```
dev  → ?currentSchema=trino_rg_dev    DATABASE_POSTGRES_SCHEMA=trino_rg_dev
prod → ?currentSchema=trino_rg_prod   DATABASE_POSTGRES_SCHEMA=trino_rg_prod
```

Trino builds each one itself. This is cheaper and less invasive than changing a
coordinator's `node.environment`.

### Trino upgrades

Do nothing. New migrations in the new jar apply themselves at startup — but only
while nothing else creates or alters these tables. That is the whole reason your
own SQL should create nothing.

### Blast radius

`max-refresh-interval` (default 1h) is how long the coordinator keeps serving the
last good config when the database is unreachable. Past it, queries are rejected
rather than scheduled under stale limits. A bad row written through the admin UI
reaches the cluster in about a second and there is no staging step — an audit log
is the only record of who changed what.
