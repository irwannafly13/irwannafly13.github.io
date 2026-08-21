# Writing a post

One Markdown file per post, in this folder. The filename is the slug and
therefore the URL — `trino-federation.md` becomes `/blog/trino-federation`.
Renaming a published file breaks its link, so pick the name once.

Every post starts with frontmatter between `---` fences:

```markdown
---
title: The one rule the layout engine follows
date: 2026-08-21
summary: One or two sentences. This is what shows on the index page.
tags: [Trino, Kafka]
draft: false
---

The body starts here, in ordinary Markdown.
```

| Field     | Required | Notes                                                        |
| --------- | -------- | ------------------------------------------------------------ |
| `title`   | yes      | Shown on the card, the article and the browser tab.           |
| `date`    | yes      | `YYYY-MM-DD`. Posts sort on this, newest first.               |
| `summary` | yes      | The index card's body text. Aim for one or two sentences.     |
| `tags`    | no       | `[A, B]`. Becomes the filter row on the index page.           |
| `draft`   | no       | `true` keeps it out of the index and off the router entirely. |

The frontmatter parser is a small YAML subset — one `key: value` per line, plus
`[a, b]` arrays. Multi-line values and nested keys are not supported, so keep
the summary on one line.

Markdown is compiled at build time by `plugins/markdown.ts`, which means
`marked` never ships to the browser: an imported `.md` is already finished HTML.
GitHub-flavoured Markdown is on, so tables, fenced code and task lists all work.
Reading time is counted from the prose, with code fences excluded.

The rendered HTML is inserted with `dangerouslySetInnerHTML`. That is safe
precisely because these files are the repository's own content — never paste a
post body in from somewhere untrusted.
