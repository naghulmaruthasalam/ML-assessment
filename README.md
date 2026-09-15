# Anime ML/DL/RL platform — landing hub

## Install
```bash
npm i zustand framer-motion
```
Requires Next.js 14+ (App Router), TypeScript, Tailwind CSS.

## Path alias
`tsconfig.json` needs:
```json
{ "compilerOptions": { "paths": { "@/*": ["./*"] } } }
```

## Files
- `app/globals.css` — theme engine + `.anime-panel`
- `app/layout.tsx` — no-flash theme script, fonts, chrome
- `app/page.tsx` — landing hub
- `stores/useThemeStore.ts` — theme cycle
- `components/ThemePullCord.tsx` — pull-cord switcher
- `components/StatusBar.tsx` — bottom status bar
- `data/curriculum.ts` — mock lessons; counts derive from here
- `lib/themes.ts` — theme names, order, capsule copy

## Swapping in the real curriculum
Replace the three `mock*Data` arrays in `data/curriculum.ts` (or point them at
your JSON). Every count in the UI recomputes — nothing is hardcoded.

---

## The learning loop

Each lesson runs six stages top to bottom, assembled by
`components/lesson/LessonRunner.tsx`:

| # | Stage | Component | Schema field |
|---|-------|-----------|--------------|
| 1 | Read | `StoryNarrative` | `narrativeText` (Markdown) |
| 2 | Watch | `ConceptVideo` | `videoUrl` |
| 3 | Picture | `MentalModelSandbox` | `mentalModel` |
| 4 | Build | `CodeGround` | `codeGround` |
| 5 | Clear | `GamifiedAssessment` | `assessmentGame` |
| 6 | Progress | `CareerMindMap` | derived from progress store |

Stages render only when their field is present, so a partially authored
lesson degrades gracefully instead of breaking.

## Progress and unlocking

`stores/useProgressStore.ts` holds completions in a Zustand store backed by
localStorage. Clearing a lesson's stage-5 challenge fires `completeLesson`,
which opens the next node on the map. A lesson unlocks when its `requires`
slugs are complete, or — if it declares none — when the lesson above it in
the column is done.

## Python execution

`lib/pyodide.ts` lazily fetches Pyodide from jsDelivr the first time a
learner opens a code ground, then shares one runtime for the session. Checks
in `validationLogic` are Python expressions evaluated in the learner's own
namespace after their code runs, so they can inspect real variables.

Monaco is imported with `next/dynamic` and `ssr: false` — it touches `window`
on import and cannot be server-rendered.

## Authoring coverage

| Lesson | Story | Scene | Beats | Model | Code | Game |
|---|---|---|---|---|---|---|
| ml/what-is-learning | y | - | - | - | - | y |
| ml/linear-regression | y | y | y | y | y | y |
| ml/gradient-descent | y | y | y | y | y | y |
| ml/logistic-regression | y | y | y | y | y | y |
| ml/decision-trees | y | y | y | y | y | y |
| ml/ensembles | y | y | y | y | y | y |
| ml/clustering | y | y | y | y | y | y |
| ml/pca | y | y | y | y | y | y |
| ml/model-evaluation | y | y | y | y | y | y |
| ml/bias-variance | y | y | y | - | - | y |
| dl/perceptron | y | y | y | - | - | y |
| dl/backprop | y | - | - | - | - | y |
| dl/attention | y | y | y | - | - | y |
| rl/mdps | y | - | - | - | - | y |
| rl/q-learning | y | y | y | y | y | y |
| rl/policy-gradients | y | - | - | - | - | y |

The ML track is complete. DL and RL are still partly stubbed - every lesson
is playable, but most are missing the middle stages.

## Scene beats: tying the picture to the story

`sceneBeats` is a list of captions pinned to moments on the 0-1 timeline,
written in the same voice and with the same images as that lesson's
`narrativeText`. Scrubbing the scene replays the story rather than narrating
a generic diagram, and the chapter marks under the caption are clickable, so
a learner can jump straight to the moment they did not follow.

## Authoring a lesson

The first four ML lessons and all of DL/RL live in `data/curriculum.ts`; the
back half of the ML track is in `data/lessons-ml.ts`. The `stub()` and
`predict()` helpers carry a lesson that only has story plus a closing
challenge. Fill in the remaining fields and the stages appear on their own.

## Verifying the code grounds

`scripts/verify_codegrounds.py` extracts every `setupCode` + `solutionCode`
pair from the lesson data, runs it, and evaluates that lesson's
`validationLogic` expressions against the resulting namespace - the same way
Pyodide will in the browser. Run it after editing any lesson:

```bash
python3 scripts/verify_codegrounds.py
```

It catches the failure mode that matters most here: a check asserting a
number the reference solution does not actually produce, which would leave a
learner stuck on a correct answer. It found two such bugs on first run.

## Theme switcher animation

`components/theme/ThemePullCord.tsx` runs a five-phase sequence on one click,
driven by Framer Motion's `useAnimate` so each phase awaits the previous one
instead of chaining timeouts:

| Phase | What happens |
|---|---|
| pop | character appears beside the knob, overshooting slightly |
| grab | reaches in, squashes on contact |
| pull | hauls the cord down on a spring (stiffness 400, damping 25) |
| ripple | at the lowest point, the theme bursts outward from the knob |
| launch | impact stretch, then off the top at y -1000, rotateZ 720 |

### The radial ripple

A clip-path can only reveal something that already exists, so
`lib/rippleTheme.ts` takes two routes:

1. **View Transitions API** where supported. The browser snapshots the old
   and new frames, and we animate `clip-path` on
   `::view-transition-new(root)` so the real new UI expands from the knob.
2. **Veil fallback** everywhere else. A fixed layer painted in the incoming
   theme's canvas colour expands from the same point; the `data-theme` swap
   happens once it fully covers the screen, so the switch is never visible.

Origin coordinates come from `getBoundingClientRect()` on the knob at its
lowest point, and the radius is the distance to the furthest screen corner.

### Dropping in your own art

`components/theme/CharacterSprite.tsx` renders one branch per pose —
`idle`, `grabbing`, `pulling`, `flying_upside_down`. Replace the placeholder
markup in each branch with an `<img>`, inline SVG, or sprite frame. Keep the
wrapper box at `CHARACTER_W` x `CHARACTER_H`; the timeline positions against
it.

### Performance notes

Only `transform`, `opacity` and `clip-path` are animated. The cord stretches
via `scaleY` with a top transform-origin rather than an animated height, and
the character is absolutely positioned so it never affects the rig's layout.
A `running` ref guards re-entry, and the sequence resets in a `finally` block
so an interrupted run cannot strand the character off-screen.

## The gateway game

`/` is a puzzle. The player writes Python to drive a scooter to the flag;
clearing it unlocks `/dashboard`, the three-path hub. The unlock persists in
localStorage under `gateway-unlocked`, and a cleared player gets a skip
button rather than solving it twice.

### route.py opens empty

There is no starter snippet, and that is the design, not an omission. A
seeded `move(4)` turns the puzzle into editing someone else's solution: the
first hairpin is already taken and the player only has to guess the rest.
Every line that reaches the flag is written by the person at the keyboard.

The command set is not hidden, though - it lives where a driver would look
for it, inside the running machine. `help()` prints the controls, and the
header says so once. Beyond the controls there are three sensors:

| call | returns |
| --- | --- |
| `scan()` | clear squares straight ahead, `0` when the next one is a cliff |
| `at_flag()` | `True` once the scooter is standing on the flag |
| `where()` | `(x, y, heading)` right now |

Sensors are what make the pass solvable as a *program* rather than a
transcription. `while scan() > 0: move(1)`, then turn toward whichever side
still reads clear, drives the whole mountain in eleven commands without the
player ever counting a square by hand. Both routes - counted and sensed -
are verified in `scripts/verify_track.py`.

Answering a sensor mid-run means the bridge cannot only record; see below.

### Progress up the pass, and the price of a crash

Four hairpins are checkpoints. Each is a row of road narrow enough that the
flag cannot be reached without crossing it, so `GATES` names rows rather
than enumerating cells. Crossing one logs a line, lights a segment of the
climb meter, and writes `gateway-best-gate` - the furthest any attempt has
gotten, shown on the header as a badge so a player who hasn't cleared the
pass yet still sees their own progress. The current run's squares are drawn
as tyre tracks on the map for the same reason.

Hitting the treeline is not a soft failure, though. `playCrash()` sounds,
the scooter sits on the off-road tile for `RESTART_DELAY_MS` (1.3s) so the
crash actually registers, and then the run wipes: position back to `S`,
this run's climb meter and tyre tracks back to zero, and `route.py` itself
cleared - both the editor and the `gateway-route-src` draft it's saved to.
`gateway-best-gate` is the one thing that survives, because it is a record
of the best attempt, not the current one. The player's own solution never
comes back on its own; they climb again from a blank file, which is the
whole point of the gate never having had a starter snippet to begin with.

Each forward step plays a two-stroke engine "put" (`playMove()`, in
`lib/gameSounds.ts`): a low square-wave thump layered with a short burst of
filtered noise, which is what gives it a mechanical grit a plain oscillator
can't produce on its own. Every sound in this file - move, crash, and the
four-note fanfare on `playWin()` when the flag is reached - is synthesized
with Web Audio, not an audio file, so the page's "nothing is sent anywhere"
claim covers the sound too.

Reaching the flag splits the screen and names the three paths before
handing over to `/dashboard`.

### The bridge, and why it records instead of animating

`lib/gameBridge.ts` injects `move`, `turn_left`, `turn_right`, `jump` and
`say` into the Pyodide namespace. Those functions append to a JavaScript
array; they do not animate. The player's program runs to completion in
milliseconds, then `planRoute()` walks the recorded commands, validates each
step against the track, and produces frames the replay ticks through at
260ms each.

Recording alone cannot serve `scan()`, which has to answer while the
program is still running - before a single frame has played. So the bridge
also keeps a shadow pose that walks the track as commands come in, and the
sensors read that. `planRoute()` stays the authority for what is drawn; the
shadow exists only so the player's `while scan() > 0` means what it says.

The obvious alternative is to await an animation inside each call. That
poisons the player's own code: `move` becomes a coroutine, so
`for i in range(3): jump()` silently does nothing and they would have to
write `await jump()`. Recording keeps their Python ordinary, which matters
when the whole point is that a beginner's `for` loop works. What the player
sees is identical either way.

Over 500 commands raises, so a runaway `while True` cannot lock the tab.
Sensors are free of that budget - a player should be able to poll as often
as they like - which leaves one hole: `while not at_flag(): scan()` drives
nowhere and never ends. Reads get their own ceiling of 50,000 and an error
that names the likely cause.

### Verifying the track

`scripts/verify_track.py` re-implements the movement rules and searches for a
route, so an edit to `TRACK_ROWS` that walls the flag off is caught
immediately rather than by a stuck player:

```bash
python3 scripts/verify_track.py
```

It prints a reference solution - currently 16 moves and 5 turns, 11 lines.

It also proves every row in `GATES` is a genuine chokepoint, by blanking the
row and re-running the search: if the flag is still reachable, the hairpin
can be driven around and the progress badge would count a climb the player
skipped. Redraw the map and a gate that stops being unavoidable fails here
rather than quietly inflating everyone's badge.

### Editing the map

`lib/gameTrack.ts` holds the track as ASCII, one string per row: `.` is
off-road, `#` is road, `S` is the start, `F` is the flag. Redraw it and
re-run the verifier.
