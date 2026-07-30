# Company logos

Drop one square image per company **in this folder** (`public/logos/`), then
point the matching `logo:` field in `src/data/profile.ts` at it.

Do not put images in `dist/logos/`. That folder is build output — it is listed
in `.gitignore` and `npm run build` deletes and regenerates it, so anything
left there is never committed and never deployed.

| Company                                | Current `logo:` value             |
| -------------------------------------- | --------------------------------- |
| IBM Indonesia                          | `/logos/ibm.svg`                  |
| Neural Technologies Indonesia          | `/logos/neural-technologies.png`  |
| Tarsus Indonesia (Infrastructure Asia) | `/logos/tarsus.png`               |

Guidelines:

- **The extension has to match.** Saving `tarsus.svg` while `profile.ts` says
  `/logos/tarsus.png` leaves the tile on its letter fallback.
- **Square**, 128x128 or larger. The tile renders at 56px (112px on retina).
  SVG is ideal since it stays sharp at any size; PNG and JPG both work.
- **A transparent background** looks best. A logo carrying its own opaque
  background renders as a hard-edged square inside the rounded tile.
- Paths are written from `public/`, so `public/logos/ibm.svg` is `/logos/ibm.svg`.
- After adding a file, commit and push it — the site only rebuilds from what
  is in the repo.

Until a file exists, the tile falls back to the company's first letter, so a
missing logo never shows a broken image.
