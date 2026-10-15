---
title: A song is a Python file
date: 2026-10-15
summary: PyBeat Studio is one HTML page where every track is a complete numpy script. Play it in the browser and watch each line fire, or run it with Python and get a WAV. The trick is that the player never runs the Python — it only reads it.
tags: [Python, NumPy, Web Audio, JavaScript, Music]
coverAlt: PyBeat Studio — a track library on the left, the Python source of a 128 BPM track in the middle, and the step patterns for kick, clap, hat, bass, lead and pad on the right.
draft: false
---

**PyBeat Studio** is a small music editor where the song *is* the code. A track
is a single Python file that uses nothing but `numpy` and the standard `wave`
module: a kick is a sine wave whose pitch falls fast, a hi-hat is filtered
noise, a pad is a few detuned saws through a moving average. Run the file and it
writes a WAV. Open it in the studio, press play, and the lines light up as they
sound.

<style>
.pb-open{display:inline-flex;align-items:center;gap:.5rem;margin:.25rem 0 .5rem;padding:.7rem 1.1rem;border-radius:.6rem;background:#f3e600;color:#15101f !important;font-weight:600;text-decoration:none !important}
.pb-open:hover{background:#fff35a}
.prose .pb-note{margin-top:.25rem;font-size:.8rem;color:#9ca3af}
</style>

<a class="pb-open" href="/blog/a-song-is-a-python-file/pybeat-studio.html" target="_blank" rel="noopener">▶ Open PyBeat Studio</a>
<p class="pb-note">Runs entirely in your browser. Tracks you save stay in this browser's storage. Best on a laptop screen.</p>

## The shape of a track

Everything the music needs is four plain values near the top of the file:

```python
BPM = 128

PATTERNS = {
    "kick": "x...x...x...x...",
    "clap": "....x.......x...",
    "hat":  "..x...x...x...x.",
}
CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G

ARRANGEMENT = [
    ("intro", 4, ["pad", "hat"]),
    ("drop",  8, ["pad", "kick", "clap", "hat", "bass", "lead"]),
]
```

A pattern is sixteen steps of `x` and `.`. An arrangement is a list of sections,
each with a length in bars and the parts that play in it. Below that, a loop walks
the sections, bars and steps, and for every part asks `hits(part, parts, step)` —
if the answer is yes, it `add()`s that instrument's samples into one big numpy
array at the right offset. A soft clip with `tanh`, a scale to 16-bit, and it is
written to disk.

## The player reads, it does not run

Running real Python in a browser means shipping an interpreter, and numpy on
top of it, to play a drum loop. So the studio does not run the file. It parses
it: it reads `BPM`, `PATTERNS`, `CHORDS`, `ARRANGEMENT` and which
`if hits("…")` lines exist, and plays those with Web Audio versions of the same
instruments — an oscillator with a falling pitch for the kick, a band-passed
noise burst for the clap, a low-passed saw for the bass.

That split is what makes the editor feel live. Edit a pattern while it plays and
the change lands on the next sixteenth. Because the parser knows which line
holds each pattern and each `hits` call, it can highlight the loop variables
with their current values, flash the line of every instrument the moment it
fires, and dim the patterns that are not in the current section.

It also means the parser can say what Python will say, before you run it. A part
in the arrangement with no pattern is a `KeyError`; indexing
`CHORDS[bar % 4]` with only three chords is an `IndexError`; a pattern with
fifteen steps is a silent bug. Each of those shows up in *Problems* with the line
number, and while there is an error the player keeps playing the last version
that was valid.

The honest limit is written into the page: change the body of `def kick()` and
the browser's kick stays the same. The structure of the song is shared; the
exact sound is Python's.

## Run it for real

Every track downloads as a `.py` file that needs nothing but numpy:

```bash
pip install numpy
python neon_drop.py      # -> neon_drop.wav
```

## The rule

When two runtimes have to agree on something, keep the thing they agree on as
plain data that both can read — here, four constants — and let each side own
the part only it can do. The browser owns *when*; Python owns *what it sounds
like*.
