# Post pictures

One folder per post, named after the post's slug — the Markdown filename in
`src/content/posts`, minus the `.md`:

```
public/blog/trino-resource-groups-on-postgres/cover.jpg
```

The picture is picked up just by being there: it becomes the preview on `/blog`
and the picture the post itself opens with — the same file in both places. The
name does not matter while the folder holds only one picture. Once it holds
several, the one called `cover.<ext>` wins; if none is, the post needs a
`cover:` line to say which, and until it has one it shows no picture at all.
`jpg`, `jpeg`, `png`, `webp`, `avif`, `gif` and `svg` all count as pictures.

To point at a particular file, name it in the post's frontmatter:

```markdown
cover: /blog/trino-resource-groups-on-postgres/coordinator.png
coverAlt: The coordinator's resource-group tree, four levels deep.
```

`coverAlt` describes the picture for screen readers. Leave it out when the
picture is decorative and adds nothing the title does not already say.

Anything else the post body references lives in the same folder:

```markdown
![The polling loop](/blog/trino-resource-groups-on-postgres/polling.png)
```

Paths start at `/blog/…` — the site's base path is added at build time, so they
work from a subdirectory too.

Sizing: a cover is shown up to 768px wide on the post and cropped to a box on
the left of the index card — 192×144, or 224×160 on a wide screen — so roughly
1600×900 is plenty. The crop is taken from the middle of the picture, so keep
the subject centred. Keep files under a few hundred KB — they are committed to
the repo and served straight from Pages.

Vite reads these at build time; the dev server watches the folder and reloads
when a picture is added or removed.
