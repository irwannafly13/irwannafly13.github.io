# Company logos

Drop one square image per company here, then point the matching `logo:` field
in `src/data/profile.ts` at it.

| Company                              | Expected file                     |
| ------------------------------------ | --------------------------------- |
| IBM Indonesia                        | `ibm.png`                         |
| Neural Technologies Indonesia        | `neural-technologies.png`         |
| Tarsus Indonesia (Infrastructure Asia) | `tarsus.png`                    |

Guidelines:

- **Square**, 128x128 or larger. The tile renders at 56px (112px on retina).
- **PNG with a transparent background** looks best; JPG works but shows its
  own white box inside the tile.
- Filenames are just a convention — any name works as long as `profile.ts`
  matches. Paths there start from `public/`, so `public/logos/ibm.png` is
  written as `/logos/ibm.png`.

Until a file exists, the tile falls back to the company's first letter, so a
missing logo never shows a broken image.
