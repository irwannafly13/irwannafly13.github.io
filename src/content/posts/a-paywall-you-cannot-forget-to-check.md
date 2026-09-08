---
title: A paywall you cannot forget to check
date: 2026-09-08
summary: On a marketplace where the seller's phone number is the product, one forgotten permission check leaks everything. So I made the check impossible to skip — not by remembering, but by making the alternative fail to compile.
tags: [Next.js, TypeScript, Prisma, Security, Payments]
coverAlt: The Ambil Aja landing page — a search bar over categories of unwanted goods.
draft: false
---

**Ambil Aja** is a marketplace for things people want to get rid of: used racks,
leftover building material, a broken speaker, tired furniture. Posting is free
and reading a listing is free. The seller's phone number and street address are
what you pay for — five thousand rupiah for one listing, or a monthly
subscription that opens all of them.

That pricing decision makes the whole application unusual to write. On a normal
site a permission bug shows the wrong page. Here, the sensitive columns *are* the
inventory. One forgotten check on one endpoint and the product is free forever,
for everybody, retroactively.

<style>
.aa-shots-track{display:flex;gap:1rem;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;padding-bottom:.85rem;scrollbar-width:thin;scrollbar-color:rgba(125,125,125,.45) transparent}
.aa-shots-track>figure{flex:0 0 100%;scroll-snap-align:center;margin:0}
.aa-shots-track img{display:block;width:100%;margin:0;border-radius:.75rem;border:1px solid rgba(0,0,0,.08)}
.aa-shots-track figcaption{margin-top:.65rem;font-size:.85rem;line-height:1.55;color:#6b7280}
.aa-shots-track figcaption b{font-weight:600;color:#374151}
.prose .aa-hint{margin-top:.5rem;font-size:.75rem;letter-spacing:.04em;text-transform:uppercase;color:#9ca3af}
:where(.dark) .aa-shots-track img{border-color:rgba(255,255,255,.12)}
:where(.dark) .aa-shots-track figcaption{color:#9ca3af}
:where(.dark) .aa-shots-track figcaption b{color:#e5e7eb}
:where(.dark) .prose .aa-hint{color:#6b7280}
</style>

<div class="aa-shots-track">
<figure>
<img src="/blog/a-paywall-you-cannot-forget-to-check/01-locked.webp" alt="A listing page with the phone number shown as 0812 dot dot dot 02 and the address masked.">
<figcaption><b>1 / 4 — Locked.</b> The teaser is derived server-side from the real values. The real ones were never sent.</figcaption>
</figure>
<figure>
<img src="/blog/a-paywall-you-cannot-forget-to-check/02-checkout.webp" alt="A QRIS payment page showing a QR code, Rp 5.000, and a countdown.">
<figcaption><b>2 / 4 — Checkout.</b> QRIS, and a countdown. The orange note is the mock gateway: it signs a real callback rather than shortcutting the flow.</figcaption>
</figure>
<figure>
<img src="/blog/a-paywall-you-cannot-forget-to-check/03-revealed.webp" alt="The same listing after payment, showing the poster's name, phone number, address and a note.">
<figcaption><b>3 / 4 — Open.</b> Fetched on an explicit click, never rendered into the page, and the click is what writes the audit row.</figcaption>
</figure>
<figure>
<img src="/blog/a-paywall-you-cannot-forget-to-check/04-grid.webp" alt="A grid of listing cards, each carrying a Kontak terkunci badge.">
<figcaption><b>4 / 4 — The grid.</b> Every card is served by a projection that does not contain the sensitive columns at all.</figcaption>
</figure>
</div>
<p class="aa-hint">Drag or swipe to move through the four states →</p>

## Checks you must remember are checks you will forget

The obvious implementation is an `if` at every place the data is read. It works
on the day you write it. It fails three months later, when a new endpoint is
added for a feature that has nothing to do with payment — an export, a share
card, an admin list — and its author does not know the rule exists.

So the rule is not written down as a convention. It is written down as four
structural facts.

**One gate.** `getEntitlement(viewer, postId)` is the only function that decides
access. It returns an `Entitlement` for the post's author, an admin, a paid
unlock or an active subscription, and `null` for everybody else.

**One reader.** Exactly one function selects the sensitive columns, and it takes
the proof as its argument:

```ts
export async function getContactBlock(
  entitlement: Entitlement,
): Promise<ContactBlock | null> {
  const post = await db.post.findUnique({
    where: { id: entitlement.postId },   // the id comes from the proof
    select: { contactName: true, contactPhone: true,
              addressLine: true, addressNote: true },
  });
  return post;
}
```

Look at where the post id comes from. Not a parameter next to the entitlement —
*out of* the entitlement. You cannot hold a valid proof for one listing and read
another, and you cannot call the function at all without having been through the
gate first. Skipping the check is not a code review catch. It is a type error.

**One projection.** `PUBLIC_POST_SELECT` is the select clause behind search, the
grid and the detail page. `contactName`, `contactPhone`, `addressLine` and
`addressNote` are simply not listed in it, so no amount of carelessness
downstream can serialise them into HTML or JSON.

**One endpoint.** `GET /api/posts/[id]/contact` is the only route that ever
returns them. It is `no-store`, and the contact block is not in the page's HTML
even for someone who has paid — it is fetched on a click, and that click is what
writes the audit row.

## The leak that has nothing to do with code

Then there is the one that would have made all of that pointless.

A photo of a pile of leftover bricks is taken at the pile. Phones write GPS
coordinates into EXIF. Publish that file untouched and the exact location the
paywall exists to sell is sitting in the image the visitor already downloaded for
free — no bug, no bypass, just the camera doing its job.

Every upload is rewritten with its metadata segments dropped before it reaches
disk. It is a container rewrite, not a re-encode, so the pixels are identical:

> Drops APP1..APP15 (EXIF, XMP, IPTC) and COM segments. Keeps APP0/JFIF.

Worth stating plainly, because it is the general lesson: the paywall is not the
`if` statement. The paywall is every path by which the value can reach the
visitor, and one of those paths was a JPEG header.

## Never let the browser say it paid

The second half is the money. The browser is the last thing that should be
trusted to announce a payment, so it never does:

| Attack                          | What stops it                                                        |
| ------------------------------- | -------------------------------------------------------------------- |
| Forged settlement callback      | HMAC/SHA-512 over the **raw** body, verified before anything is read  |
| Replayed callback               | A unique `dedupeKey`; the replay returns `duplicate` and grants nothing |
| Tampered amount                 | The callback's amount is compared to our own order row                 |
| Client-set price                | The amount comes from the database, never the request                  |
| "Mark my own order paid"        | No client-facing route can write `PAID` at all                        |
| Lost webhook                    | The checkout page polls, and the poll asks the gateway directly        |

The mock gateway in development is the same shape. Its button does not settle
anything directly — it signs a callback and posts it to the same webhook
production uses, so signature verification, idempotency and settlement are
exercised on a laptop exactly as they are live. A test double that skips the
part you are worried about is a test double that tests nothing.

## The rule

If a check can be forgotten, it will be. Spend the design effort on making the
unsafe version fail to compile, then go looking for the paths that never pass
through your code at all.
