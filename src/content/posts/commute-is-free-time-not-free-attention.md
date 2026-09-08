---
title: The commute is free time, but it is not free attention
date: 2026-09-08
summary: I built two hands-free learning apps for the same 20-minute ride — one for English, one for data engineering. The same engine, the same rider, and two very different verdicts on whether it was worth it.
tags: [Flutter, Dart, Learning, Speech]
draft: false
---

Forty minutes a day disappear into a motorcycle commute. The obvious thought is
that this is dead time waiting to be reclaimed, and the obvious fix is audio:
the ears are free, so put something in them.

So I built the fix twice. **Ride English** teaches vocabulary, listening and
spoken phrases; **Ride Data** teaches data-engineering terminology, concepts and
drill questions. Same engine — a session compiles down to a flat list of `Beat`s
that the player walks as *speak → pause → listen → score* — and the second app
reused it almost verbatim. The speech service between the two differs by about
fifty lines, the progress store by seventy. Roughly 1,600 lines of Dart for the
first one, 2,000 for the second, and most of that second number is content
handling rather than machinery.

Building it twice is what produced the actual finding, because the two apps did
not work equally well.

## The channel is audio, the constraint is attention

Riding leaves the ears free. It does not leave *attention* free, and those are
not the same budget. Anything that asks you to produce a precise answer competes
with the road; anything that only asks you to receive does not.

That line cuts straight through the feature list:

| Mode                    | On the road                                    |
| ----------------------- | ---------------------------------------------- |
| Listening to a passage  | Works. Nothing is asked of you.                 |
| New vocabulary or terms | Works. Recognition, not production.             |
| Spoken recall (review)  | Works when it is quiet, degrades at speed.      |
| Multiple-choice drill   | Barely works, and I should have predicted it.   |

The drill mode is the interesting failure. Answering means saying a letter, and
a single letter is the shortest utterance a recognizer can be handed — the least
context, the most fragile. At 50 km/h, wind noise swamps a phone microphone
before the recognizer has anything to work with. Ride Data's whole question bank
is the mode least suited to the vehicle it was written for.

## What the scoring threshold admits

Both apps score a spoken answer by word overlap, and 0.6 counts as correct:

```dart
// hit / t.length — the fraction of target words that came back
return hit / t.length;
```

Six out of ten words is a generous bar. It is generous because a strict one is
unusable in a helmet: exact grading would mostly measure wind. The threshold is
not a learning-science decision, it is an acoustics decision wearing a
learning-science costume, and it caps how much the numbers on the progress
screen can honestly claim.

That is worth naming, because the streak counter and the spaced-repetition
ladder (1, 2, 4, 8, 16, 32 days) look like measurement. They are measurement of
exposure. They are not measurement of mastery.

## So was it worth it

For input, clearly yes. 389 vocabulary items at five a day is about 78 days
before anything repeats; the data-engineering bank runs 25 days of full sessions.
That is a term list I would never have sat down to review at a desk, delivered in
time that was otherwise spent looking at traffic. Priming beats nothing, and it
turns out to beat nothing by a lot — hearing *idempotency* explained on Tuesday
makes reading about it on Wednesday cheaper.

For output, no. Data engineering especially is a keyboard discipline: you do not
learn to write a windowed aggregate by saying "B" into a helmet. Ride Data works
as a vocabulary and intuition pre-loader for study that happens later, at a desk.
Selling it to myself as a replacement for that study would have been the mistake.

And one honest safety line, since I wrote the thing: the receiving modes belong
on the road, the scored ones do not. Being graded is a task, and a task you can
fail is a task that pulls your eyes off the road when it goes wrong. I run the
speaking parts stopped, or not at all.

The second build cost a fraction of the first because the engine was already
paid for. That is the part I would repeat. The part I would change is deciding
what a medium can carry *before* writing 187 questions for it.
