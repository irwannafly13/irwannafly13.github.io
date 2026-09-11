---
title: A template is a palette, not a page
date: 2026-09-11
summary: Undangan Kita renders one invitation as any of ten templates for any of eight kinds of event, and switching never loses a word. That only works because a template is a handful of colours and two fonts — the page is written exactly once.
tags: [Node.js, Express, SQLite, Templates, Design]
coverAlt: The same wedding invitation rendered in three templates side by side — ivory, midnight gold and emerald.
draft: false
---

**Undangan Kita** makes digital invitations. You pick the kind of event — a
wedding, an engagement, a birthday, an aqiqah, a circumcision, a graduation, an
anniversary, a company gathering — pick a look, fill in the names and dates, and
share one link over WhatsApp. The link opens on a cover addressed to the guest
by name; behind it are the hosts, a countdown, the venues with a map button, the
story, a gallery, the digital envelope, an RSVP form and a guest book.

Eight kinds of event, ten templates, and every template must work for every
kind. The arithmetic says eighty pages. The application has one.

<style>
.uk-shots-track{display:flex;gap:1rem;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;padding-bottom:.85rem;scrollbar-width:thin;scrollbar-color:rgba(125,125,125,.45) transparent}
.uk-shots-track>figure{flex:0 0 100%;scroll-snap-align:center;margin:0}
.uk-shots-track img{display:block;width:100%;margin:0;border-radius:.75rem;border:1px solid rgba(0,0,0,.08)}
.uk-shots-track figcaption{margin-top:.65rem;font-size:.85rem;line-height:1.55;color:#6b7280}
.uk-shots-track figcaption b{font-weight:600;color:#374151}
.prose .uk-hint{margin-top:.5rem;font-size:.75rem;letter-spacing:.04em;text-transform:uppercase;color:#9ca3af}
:where(.dark) .uk-shots-track img{border-color:rgba(255,255,255,.12)}
:where(.dark) .uk-shots-track figcaption{color:#9ca3af}
:where(.dark) .uk-shots-track figcaption b{color:#e5e7eb}
:where(.dark) .prose .uk-hint{color:#6b7280}
</style>

<div class="uk-shots-track">
<figure>
<img src="/blog/a-template-is-a-palette-not-a-page/01-templates.webp" alt="The same wedding cover, addressed to Budi Santoso, in Ivory Rose, Midnight Gold and Emerald Lattice.">
<figcaption><b>1 / 4 — One invitation, three templates.</b> Same rows in the database, same guest link. The only thing that changed between these is which object the renderer was handed.</figcaption>
</figure>
<figure>
<img src="/blog/a-template-is-a-palette-not-a-page/02-opened.webp" alt="Three phone screens of the opened invitation: the hosts, the countdown and event cards, and the RSVP form.">
<figcaption><b>2 / 4 — Behind the cover.</b> Hosts, countdown, the events with a map button, and the RSVP form. Every section is a function that returns an empty string when it has nothing to say.</figcaption>
</figure>
<figure>
<img src="/blog/a-template-is-a-palette-not-a-page/03-editor.webp" alt="The dashboard's Tampilan tab: a grid of ten template cards with a live preview of the invitation on the right.">
<figcaption><b>3 / 4 — The switch.</b> "Mengganti template tidak menghapus isi undangan" — changing the template does not delete the content. That sentence is only true because of how templates are stored.</figcaption>
</figure>
<figure>
<img src="/blog/a-template-is-a-palette-not-a-page/04-guests.webp" alt="The guest list: three guests, one marked Dibuka, each with copy link, WhatsApp and QR buttons.">
<figcaption><b>4 / 4 — The guest list.</b> Each guest gets a token, so a link is a named link, the cover greets them, and the moment they open it the row says <i>Dibuka</i>.</figcaption>
</figure>
</div>
<p class="uk-hint">Drag or swipe to move through the four screens →</p>

## Two axes, not one grid

The mistake would be to think of a template as a page: `wedding-ivory.html`,
`wedding-gold.html`, `birthday-confetti.html`. Eighty files, each a copy of the
others with the colours changed, and every new section — say, a dress code line
on the event card — is eighty edits. It is the same trap as one `if` per
endpoint: the rule lives in too many places to be kept.

So the two questions are answered by two different objects that never meet.

**What the event is** lives in `TYPES`. A type knows how many hosts there are
and what to call them — *Mempelai Wanita* and *Mempelai Pria* for a wedding,
*Yang Berulang Tahun* for a birthday — what the default programme looks like,
and the opening and closing sentences a family would expect to read.

**How it looks** lives in `TEMPLATES`, and this is the whole of one:

```js
{
  id: 'midnight-gold',
  name: 'Midnight Gold',
  tagline: 'Gelap, elegan, formal',
  for: ['wedding', 'graduation', 'anniversary', 'corporate'],
  motif: 'deco',
  dark: true,
  fonts: { display: 'Cormorant Garamond', body: 'Jost' },
  colors: { bg: '#12131a', surface: '#1c1e28', text: '#efe9df', muted: '#9c9689',
            accent: '#c9a227', accent2: '#7d6a2e', line: '#2c2f3c', onAccent: '#12131a' },
}
```

Eight colours, two fonts, the name of an ornament. No markup. It cannot contain
markup, because it is never given the chance to: the only thing the renderer
does with a template is turn it into custom properties.

```js
function themeCss(tpl) {
  const c = tpl.colors;
  return `:root{
  --bg:${c.bg}; --surface:${c.surface}; --text:${c.text}; --muted:${c.muted};
  --accent:${c.accent}; --accent2:${c.accent2}; --line:${c.line}; --on-accent:${c.onAccent};
  --display:'${tpl.fonts.display}', Georgia, serif;
  --body:'${tpl.fonts.body}', system-ui, sans-serif;
}`;
}
```

One stylesheet, `invite.css`, reads those eight variables and nothing else. The
page itself is a single function, `renderInvitation`, assembled from section
functions — `hostsSection`, `countdownSection`, `giftSection` — each of which
takes the content and returns HTML or, when there is nothing to show, `''`.

Now the sentence in the editor is true for free. Switching templates writes one
column, `invitations.template`. The content column is not touched, because the
content never knew which template it was wearing. And adding an eleventh
template is one object appended to an array: the landing page, the new-invitation
wizard and the *Tampilan* tab all read the same catalogue, so there is no second
place to update.

## The one page that had to be server-rendered

The rest of the application is deliberately plain: Express, SQLite, and JavaScript
files served as they are written. There is no build step. The dashboard is a
hash router and a `fetch` wrapper.

The invitation page is the exception, and the reason is WhatsApp. When someone
pastes the link into a chat, WhatsApp fetches the URL and reads the Open Graph
tags to draw the preview card. It does not run JavaScript. If the names, the date
and the cover picture arrive from an API call after the page loads, the preview
is a blank card that says *localhost*.

So `/i/:slug` is rendered on the server, and the share title is built from the
same data the page is: the hosts' names, the type's label, the day and the venue.
The card the guest sees in the chat is the cover they will see when they tap it.

## A link is a name

A digital invitation shared as one URL has a problem a paper one does not: it is
not addressed to anybody. So each guest in the list gets a short random token,
and the link the host copies is `/i/ayu-rian?t=…`.

The server resolves the token to a name and prints it on the cover under
*Kepada Yth.* When the guest taps *Buka Undangan*, the page posts once to
`/opened`, and the host's guest list flips that row to *Dibuka*. When the guest
fills in the RSVP, the same token ties the reply to the row that was invited —
so *Budi Santoso, 2 people, session 1* is not a free-text name to match by hand.

None of this needs an account for the guest, and none of it can be forged into
something useful: a token only ever maps to a name on one invitation, and an
invitation that is still a draft refuses every public write, RSVP included.

## The rule

When a thing must come in many variants, find the smallest object that actually
differs between them and store *that*. For a look, it is eight colours and two
fonts. The page is written once, and the eighty variants are a loop.
