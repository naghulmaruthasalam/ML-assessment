'use client';

/**
 * Scene drawings.
 *
 * Every scene is a pure function of a 0–1 progress value, which is what
 * makes them scrubbable: there is no internal animation state to get out of
 * sync with the scrubber. Colours are CSS variables throughout, so scenes
 * restyle with the theme pull cord.
 */

export const W = 640;
export const H = 320;

const ink = 'var(--ink)';
const muted = 'var(--ink-muted)';
const accent = 'var(--accent)';
const line = 'var(--line)';
const surface = 'var(--surface)';

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));

/** Maps global progress onto a sub-window of the timeline. */
const phase = (t: number, from: number, to: number) =>
  clamp01((t - from) / (to - from));

function Axes({ x = '→', y }: { x?: string; y?: string }) {
  return (
    <>
      <line x1={60} y1={H - 52} x2={W - 30} y2={H - 52} stroke={line} strokeWidth={3} />
      <line x1={60} y1={26} x2={60} y2={H - 52} stroke={line} strokeWidth={3} />
      <text x={W - 30} y={H - 30} textAnchor="end" fill={muted} style={{ fontSize: 11 }}>
        {x}
      </text>
      {y && (
        <text x={68} y={38} fill={muted} style={{ fontSize: 11 }}>
          {y}
        </text>
      )}
    </>
  );
}

function Readout({ children }: { children: React.ReactNode }) {
  return (
    <text x={72} y={44} fill={muted} className="font-mono" style={{ fontSize: 12 }}>
      {children}
    </text>
  );
}

/* ================================================================== *
 * ML 2 — fitting a line
 * ================================================================== */

const FLATS = [
  [42, 58], [55, 71], [58, 79], [61, 82], [70, 94], [74, 96],
  [80, 108], [88, 118], [92, 121], [101, 133], [110, 145],
];

export function LineFitting({ t }: { t: number }) {
  const px = (a: number) => 60 + ((a - 35) / 85) * (W - 110);
  const py = (p: number) => H - 52 - ((p - 45) / 115) * (H - 100);

  const slope = lerp(0.35, 1.31, t);
  const intercept = lerp(70, 2.5, t);
  const lineY = (a: number) => py(intercept + slope * a);

  const err =
    FLATS.reduce((s, [a, p]) => s + (p - (intercept + slope * a)) ** 2, 0) /
    FLATS.length;

  return (
    <g>
      <Axes x="floor area →" y="price ↑" />

      {FLATS.map(([a, p], i) => (
        <line
          key={`r${i}`}
          x1={px(a)}
          y1={py(p)}
          x2={px(a)}
          y2={lineY(a)}
          stroke={muted}
          strokeWidth={2}
          opacity={0.5}
        />
      ))}

      <line x1={px(35)} y1={lineY(35)} x2={px(120)} y2={lineY(120)} stroke={accent} strokeWidth={4} />

      {FLATS.map(([a, p], i) => (
        <circle key={i} cx={px(a)} cy={py(p)} r={6} fill={ink} stroke={line} strokeWidth={2} />
      ))}

      <Readout>average miss: {err.toFixed(0)}</Readout>
    </g>
  );
}

/* ================================================================== *
 * ML 3 — walking downhill
 * ================================================================== */

export function GradientDescent({ t }: { t: number }) {
  const bowl = (x: number) => 0.0042 * (x - 340) ** 2 + 70;
  const path = Array.from({ length: 60 }, (_, i) => {
    const x = 70 + (i / 59) * (W - 110);
    return `${i === 0 ? 'M' : 'L'} ${x} ${bowl(x)}`;
  }).join(' ');

  const steps = [80, 150, 218, 268, 302, 322, 333, 338, 340];
  const idx = Math.min(steps.length - 1, Math.floor(t * steps.length));
  const frac = t * steps.length - idx;
  const x = lerp(steps[idx], steps[Math.min(idx + 1, steps.length - 1)], frac);

  return (
    <g>
      <path d={path} fill="none" stroke={line} strokeWidth={3} />
      {steps.slice(0, idx + 1).map((sx, i) => (
        <circle key={i} cx={sx} cy={bowl(sx)} r={4} fill={muted} opacity={0.55} />
      ))}
      <circle cx={x} cy={bowl(x)} r={11} fill={accent} stroke={line} strokeWidth={3} />
      <Readout>
        step {idx + 1} of {steps.length} · error {(bowl(x) - 70).toFixed(1)}
      </Readout>
      <text x={340} y={H - 20} textAnchor="middle" fill={muted} style={{ fontSize: 11 }}>
        every setting of the knobs ↔ one spot on this hill
      </text>
    </g>
  );
}

/* ================================================================== *
 * ML 4 — the S-curve and the boundary
 * ================================================================== */

const EMAILS = [
  [0.08, 0], [0.16, 0], [0.24, 0], [0.3, 0], [0.38, 0], [0.44, 1],
  [0.52, 0], [0.58, 1], [0.66, 1], [0.74, 1], [0.84, 1], [0.92, 1],
];

export function LogisticBoundary({ t }: { t: number }) {
  const px = (u: number) => 60 + u * (W - 110);
  const py = (p: number) => H - 52 - p * (H - 110);

  // Curve sharpens from near-flat into a decisive S.
  const k = lerp(1.5, 16, t);
  const mid = 0.5;
  const sig = (u: number) => 1 / (1 + Math.exp(-k * (u - mid)));

  const curve = Array.from({ length: 90 }, (_, i) => {
    const u = i / 89;
    return `${i === 0 ? 'M' : 'L'} ${px(u)} ${py(sig(u))}`;
  }).join(' ');

  const showCut = t > 0.55;

  return (
    <g>
      <Axes x="how spammy the words look →" y="chance it is spam ↑" />

      {/* The 0.5 line: above it you call it spam */}
      <line x1={60} y1={py(0.5)} x2={W - 30} y2={py(0.5)} stroke={muted} strokeWidth={2} strokeDasharray="6 6" />
      <text x={W - 34} y={py(0.5) - 8} textAnchor="end" fill={muted} className="font-mono" style={{ fontSize: 10 }}>
        0.5
      </text>

      {showCut && (
        <line x1={px(mid)} y1={py(0)} x2={px(mid)} y2={py(1)} stroke={accent} strokeWidth={3} opacity={0.5} />
      )}

      <path d={curve} fill="none" stroke={accent} strokeWidth={4} />

      {EMAILS.map(([u, label], i) => (
        <circle
          key={i}
          cx={px(u)}
          cy={py(label)}
          r={6}
          fill={label ? accent : surface}
          stroke={line}
          strokeWidth={2}
        />
      ))}

      <Readout>
        {t < 0.4 ? 'unsure about everything' : showCut ? 'a line in the sand at 0.5' : 'getting decisive'}
      </Readout>
    </g>
  );
}

/* ================================================================== *
 * ML 5 — twenty questions
 * ================================================================== */

const TREE = [
  { id: 'root', x: 320, y: 60, label: 'wings?', depth: 0 },
  { id: 'l1', x: 180, y: 150, label: 'feathers?', depth: 1 },
  { id: 'r1', x: 460, y: 150, label: 'fins?', depth: 1 },
  { id: 'l2', x: 110, y: 250, label: 'bird', depth: 2, leaf: true },
  { id: 'l3', x: 250, y: 250, label: 'bat', depth: 2, leaf: true },
  { id: 'r2', x: 390, y: 250, label: 'fish', depth: 2, leaf: true },
  { id: 'r3', x: 530, y: 250, label: 'dog', depth: 2, leaf: true },
];

const EDGES: [string, string, string][] = [
  ['root', 'l1', 'yes'],
  ['root', 'r1', 'no'],
  ['l1', 'l2', 'yes'],
  ['l1', 'l3', 'no'],
  ['r1', 'r2', 'yes'],
  ['r1', 'r3', 'no'],
];

export function DecisionTree({ t }: { t: number }) {
  const grown = t * 3; // one depth level per beat
  const node = (id: string) => TREE.find((n) => n.id === id)!;

  return (
    <g>
      {EDGES.map(([a, b, label]) => {
        const from = node(a);
        const to = node(b);
        const on = grown > to.depth;
        return (
          <g key={`${a}${b}`} opacity={on ? 1 : 0.15}>
            <line x1={from.x} y1={from.y + 18} x2={to.x} y2={to.y - 18} stroke={line} strokeWidth={3} />
            <text
              x={(from.x + to.x) / 2 + (to.x < from.x ? -16 : 16)}
              y={(from.y + to.y) / 2}
              textAnchor="middle"
              fill={muted}
              className="font-mono"
              style={{ fontSize: 10 }}
            >
              {label}
            </text>
          </g>
        );
      })}

      {TREE.map((n) => {
        const on = grown > n.depth;
        return (
          <g key={n.id} opacity={on ? 1 : 0.15}>
            <rect
              x={n.x - 46}
              y={n.y - 18}
              width={92}
              height={36}
              fill={n.leaf ? accent : surface}
              stroke={line}
              strokeWidth={3}
            />
            <text
              x={n.x}
              y={n.y + 5}
              textAnchor="middle"
              fill={n.leaf ? 'var(--accent-ink)' : ink}
              style={{ fontSize: 12, fontWeight: n.leaf ? 700 : 400 }}
            >
              {n.label}
            </text>
          </g>
        );
      })}

      <Readout>each question splits the pile in two</Readout>
    </g>
  );
}

/* ================================================================== *
 * ML 6 — a crowd of weak guesses
 * ================================================================== */

const VOTES = [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1];

export function EnsembleVote({ t }: { t: number }) {
  const shown = Math.floor(t * (VOTES.length + 1));
  const cast = VOTES.slice(0, shown);
  const yes = cast.filter(Boolean).length;
  const verdict = shown > 0 ? (yes > cast.length / 2 ? 'bird' : 'not bird') : '—';
  const settled = shown >= VOTES.length;

  return (
    <g>
      {VOTES.map((v, i) => {
        const col = i % 6;
        const row = Math.floor(i / 6);
        const x = 80 + col * 82;
        const y = 90 + row * 74;
        const on = i < shown;
        return (
          <g key={i} opacity={on ? 1 : 0.18}>
            <rect
              x={x - 30}
              y={y - 24}
              width={60}
              height={48}
              fill={on && v ? accent : surface}
              stroke={line}
              strokeWidth={2}
            />
            <text
              x={x}
              y={y + 5}
              textAnchor="middle"
              className="font-mono"
              style={{ fontSize: 11 }}
              fill={on && v ? 'var(--accent-ink)' : muted}
            >
              {on ? (v ? 'bird' : 'no') : '?'}
            </text>
          </g>
        );
      })}

      <text
        x={W / 2}
        y={H - 34}
        textAnchor="middle"
        fill={settled ? accent : ink}
        className="font-mono"
        style={{ fontSize: 16, fontWeight: 700 }}
      >
        {yes}/{cast.length} say bird → {verdict}
      </text>

      <Readout>each tree is mediocre alone</Readout>
    </g>
  );
}

/* ================================================================== *
 * ML 7 — k-means settling
 * ================================================================== */

const BLOB: [number, number][] = [
  [0.18, 0.24], [0.24, 0.32], [0.14, 0.36], [0.26, 0.2], [0.2, 0.44],
  [0.62, 0.22], [0.72, 0.3], [0.68, 0.16], [0.78, 0.26], [0.66, 0.38],
  [0.4, 0.76], [0.48, 0.82], [0.34, 0.7], [0.46, 0.66], [0.54, 0.78],
];

const START: [number, number][] = [
  [0.5, 0.5], [0.55, 0.42], [0.45, 0.46],
];
const FINAL: [number, number][] = [
  [0.204, 0.312], [0.692, 0.264], [0.444, 0.744],
];

export function KMeans({ t }: { t: number }) {
  const px = (u: number) => 70 + u * (W - 140);
  const py = (u: number) => 40 + u * (H - 100);

  const centres = START.map(([sx, sy], i) => [
    lerp(sx, FINAL[i][0], t),
    lerp(sy, FINAL[i][1], t),
  ]);

  const nearest = (p: [number, number]) => {
    let best = 0;
    let bd = Infinity;
    centres.forEach((c, i) => {
      const d = (c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2;
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  };

  const shades = [accent, ink, muted];

  return (
    <g>
      {BLOB.map((p, i) => {
        const g = nearest(p);
        return (
          <g key={i}>
            <line
              x1={px(p[0])}
              y1={py(p[1])}
              x2={px(centres[g][0])}
              y2={py(centres[g][1])}
              stroke={muted}
              strokeWidth={1.5}
              opacity={0.35}
            />
            <circle cx={px(p[0])} cy={py(p[1])} r={7} fill={shades[g]} stroke={line} strokeWidth={2} />
          </g>
        );
      })}

      {centres.map((c, i) => (
        <g key={`c${i}`}>
          <rect
            x={px(c[0]) - 9}
            y={py(c[1]) - 9}
            width={18}
            height={18}
            fill={surface}
            stroke={shades[i]}
            strokeWidth={4}
          />
        </g>
      ))}

      <Readout>{t < 0.15 ? 'three flags, dropped at random' : t > 0.9 ? 'nobody switches groups any more' : 'flags drift to the middle of their crowd'}</Readout>
    </g>
  );
}

/* ================================================================== *
 * ML 8 — squashing a cloud onto its best line
 * ================================================================== */

const CLOUD: [number, number][] = Array.from({ length: 22 }, (_, i) => {
  const u = (i / 21) * 2 - 1;
  const jitter = Math.sin(i * 12.9898) * 0.5;
  return [u * 0.42 + 0.5, u * 0.3 + 0.5 + jitter * 0.11];
});

export function PcaProjection({ t }: { t: number }) {
  const px = (u: number) => 70 + u * (W - 140);
  const py = (u: number) => H - 50 - u * (H - 110);

  // The principal direction, drawn through the cloud.
  const dir: [number, number] = [0.812, 0.584];
  const mean: [number, number] = [0.5, 0.5];

  const project = (p: [number, number]): [number, number] => {
    const dx = p[0] - mean[0];
    const dy = p[1] - mean[1];
    const k = dx * dir[0] + dy * dir[1];
    return [mean[0] + k * dir[0], mean[1] + k * dir[1]];
  };

  const axisOn = t > 0.25;
  const slide = phase(t, 0.45, 1);

  return (
    <g>
      <Axes x="height →" y="weight ↑" />

      {axisOn && (
        <line
          x1={px(mean[0] - dir[0] * 0.55)}
          y1={py(mean[1] - dir[1] * 0.55)}
          x2={px(mean[0] + dir[0] * 0.55)}
          y2={py(mean[1] + dir[1] * 0.55)}
          stroke={accent}
          strokeWidth={4}
        />
      )}

      {CLOUD.map((p, i) => {
        const q = project(p);
        const x = lerp(p[0], q[0], slide);
        const y = lerp(p[1], q[1], slide);
        return (
          <g key={i}>
            {slide > 0 && slide < 1 && (
              <line x1={px(p[0])} y1={py(p[1])} x2={px(x)} y2={py(y)} stroke={muted} strokeWidth={1.5} opacity={0.4} />
            )}
            <circle cx={px(x)} cy={py(y)} r={6} fill={ink} stroke={line} strokeWidth={2} />
          </g>
        );
      })}

      <Readout>
        {t < 0.25 ? 'two numbers per person' : slide < 0.9 ? 'find the direction they vary most' : 'now one number, almost no loss'}
      </Readout>
    </g>
  );
}

/* ================================================================== *
 * ML 9 — holding data back, then rotating the fold
 * ================================================================== */

export function HoldoutFolds({ t }: { t: number }) {
  const folds = 5;
  const boxW = 96;
  const x0 = (W - folds * boxW) / 2;
  const y = 130;

  // First half: one held-out block. Second half: the block rotates.
  const rotating = t > 0.45;
  const active = rotating
    ? Math.min(folds - 1, Math.floor(phase(t, 0.45, 1) * folds))
    : folds - 1;

  return (
    <g>
      <text x={x0} y={90} fill={muted} className="font-mono" style={{ fontSize: 12 }}>
        {rotating ? `round ${active + 1} of ${folds} — every block gets a turn` : 'hold one block back before you start'}
      </text>

      {Array.from({ length: folds }, (_, i) => {
        const held = i === active;
        return (
          <g key={i}>
            <rect
              x={x0 + i * boxW}
              y={y}
              width={boxW - 8}
              height={70}
              fill={held ? accent : surface}
              stroke={line}
              strokeWidth={3}
            />
            <text
              x={x0 + i * boxW + (boxW - 8) / 2}
              y={y + 42}
              textAnchor="middle"
              className="font-mono"
              style={{ fontSize: 11, fontWeight: 700 }}
              fill={held ? 'var(--accent-ink)' : muted}
            >
              {held ? 'TEST' : 'train'}
            </text>
          </g>
        );
      })}

      <text x={W / 2} y={y + 120} textAnchor="middle" fill={muted} style={{ fontSize: 11 }}>
        the score you report is the average across every round
      </text>
    </g>
  );
}

/* ================================================================== *
 * ML 10 — the two ways to be wrong
 * ================================================================== */

const NOISY: [number, number][] = [
  [0.05, 0.42], [0.15, 0.3], [0.25, 0.46], [0.35, 0.34], [0.45, 0.55],
  [0.55, 0.44], [0.65, 0.66], [0.75, 0.52], [0.85, 0.74], [0.95, 0.62],
];

export function Overfitting({ t }: { t: number }) {
  const px = (u: number) => 60 + u * (W - 110);
  const py = (u: number) => H - 60 - u * (H - 120);

  const wiggle = Math.max(0, t * 2 - 1);
  const flat = Math.max(0, 1 - t * 2);

  const curve = Array.from({ length: 80 }, (_, i) => {
    const u = i / 79;
    const trend = 0.35 + u * 0.3;
    const chase = Math.sin(u * 22) * 0.12 * wiggle;
    return `${i === 0 ? 'M' : 'L'} ${px(u)} ${py(trend + chase)}`;
  }).join(' ');

  return (
    <g>
      <Axes />
      <line
        x1={px(0)}
        y1={py(0.5)}
        x2={px(1)}
        y2={py(0.5)}
        stroke={muted}
        strokeWidth={4}
        opacity={flat}
        strokeDasharray="8 6"
      />
      <path d={curve} fill="none" stroke={accent} strokeWidth={4} />
      {NOISY.map(([u, v], i) => (
        <circle key={i} cx={px(u)} cy={py(v)} r={6} fill={ink} stroke={line} strokeWidth={2} />
      ))}
      <Readout>
        {t < 0.4 ? 'too simple — misses the trend' : t > 0.75 ? 'too complex — chasing noise' : 'about right'}
      </Readout>
    </g>
  );
}

/* ================================================================== *
 * DL / RL scenes
 * ================================================================== */

const INPUTS = [
  { label: 'raining', w: -0.8, v: 1 },
  { label: 'umbrella', w: 0.4, v: 1 },
  { label: 'need milk', w: 0.9, v: 1 },
];

export function Perceptron({ t }: { t: number }) {
  const revealed = t * (INPUTS.length + 1);
  const sum = INPUTS.reduce((s, inp, i) => s + (revealed > i + 1 ? inp.w * inp.v : 0), 0);
  const fired = revealed > INPUTS.length && sum > 0;

  return (
    <g>
      {INPUTS.map((inp, i) => {
        const y = 80 + i * 80;
        const on = revealed > i + 1;
        return (
          <g key={inp.label} opacity={on ? 1 : 0.25}>
            <rect x={40} y={y - 20} width={130} height={40} fill={surface} stroke={line} strokeWidth={2} />
            <text x={105} y={y + 5} textAnchor="middle" fill={ink} style={{ fontSize: 12 }}>
              {inp.label}
            </text>
            <line x1={170} y1={y} x2={370} y2={160} stroke={inp.w > 0 ? accent : muted} strokeWidth={Math.abs(inp.w) * 6} />
            <text x={255} y={y > 160 ? y - 6 : y + 16} fill={muted} className="font-mono" style={{ fontSize: 11 }}>
              ×{inp.w}
            </text>
          </g>
        );
      })}
      <circle cx={400} cy={160} r={40} fill={fired ? accent : surface} stroke={line} strokeWidth={3} />
      <text
        x={400}
        y={166}
        textAnchor="middle"
        className="font-mono"
        style={{ fontSize: 14, fontWeight: 700 }}
        fill={fired ? 'var(--accent-ink)' : ink}
      >
        {sum.toFixed(1)}
      </text>
      <line x1={440} y1={160} x2={520} y2={160} stroke={line} strokeWidth={3} />
      <text x={585} y={166} textAnchor="end" fill={fired ? accent : muted} style={{ fontSize: 14, fontWeight: 700 }}>
        {fired ? 'go outside' : 'stay in'}
      </text>
    </g>
  );
}

const WORDS = ['the', 'trophy', 'did', 'not', 'fit', 'because', 'it', 'was', 'big'];
const FOCUS = [0.02, 0.55, 0.02, 0.03, 0.08, 0.04, 0, 0.06, 0.2];

export function Attention({ t }: { t: number }) {
  const slot = (W - 90) / WORDS.length;
  const qx = 45 + 6 * slot + slot / 2;

  return (
    <g>
      <text x={45} y={46} fill={muted} className="font-mono" style={{ fontSize: 11 }}>
        which earlier word does &quot;it&quot; depend on?
      </text>
      {WORDS.map((w, i) => {
        const x = 45 + i * slot + slot / 2;
        const weight = FOCUS[i] * t;
        const isQuery = i === 6;
        return (
          <g key={w}>
            {!isQuery && weight > 0.01 && (
              <path
                d={`M ${qx} 140 Q ${(x + qx) / 2} ${90 - weight * 90} ${x} 140`}
                fill="none"
                stroke={accent}
                strokeWidth={Math.max(1, weight * 14)}
                opacity={0.75}
              />
            )}
            <rect
              x={x - slot / 2 + 4}
              y={150}
              width={slot - 8}
              height={38}
              fill={isQuery ? accent : surface}
              stroke={line}
              strokeWidth={2}
            />
            <text x={x} y={174} textAnchor="middle" fill={isQuery ? 'var(--accent-ink)' : ink} style={{ fontSize: 12 }}>
              {w}
            </text>
            <rect x={x - slot / 2 + 4} y={200} width={slot - 8} height={Math.max(0, weight * 80)} fill={accent} opacity={0.85} />
          </g>
        );
      })}
      <text x={45} y={H - 12} fill={muted} style={{ fontSize: 11 }}>
        bar height = how much of that word gets mixed in
      </text>
    </g>
  );
}

export function QTable({ t }: { t: number }) {
  const cells = 5;
  const size = 74;
  const x0 = (W - cells * size) / 2;
  const y0 = 110;
  const reach = t * (cells + 1);

  const value = (i: number) => {
    const distance = cells - 1 - i;
    const arrived = reach - distance;
    if (arrived <= 0) return 0;
    return Math.min(1, arrived) * 0.9 ** distance;
  };

  return (
    <g>
      <text x={x0} y={70} fill={muted} className="font-mono" style={{ fontSize: 12 }}>
        value spreads backwards from the goal
      </text>
      {Array.from({ length: cells }, (_, i) => {
        const v = value(i);
        const goal = i === cells - 1;
        return (
          <g key={i}>
            <rect x={x0 + i * size} y={y0} width={size - 6} height={size - 6} fill={accent} opacity={v} />
            <rect x={x0 + i * size} y={y0} width={size - 6} height={size - 6} fill="none" stroke={line} strokeWidth={3} />
            <text
              x={x0 + i * size + (size - 6) / 2}
              y={y0 + 40}
              textAnchor="middle"
              className="font-mono"
              style={{ fontSize: 13, fontWeight: 700 }}
              fill={v > 0.5 ? 'var(--accent-ink)' : ink}
            >
              {v.toFixed(2)}
            </text>
            <text
              x={x0 + i * size + (size - 6) / 2}
              y={y0 + 58}
              textAnchor="middle"
              fill={v > 0.5 ? 'var(--accent-ink)' : muted}
              style={{ fontSize: 10 }}
            >
              {goal ? 'goal' : `sq ${i}`}
            </text>
          </g>
        );
      })}
      <text x={x0} y={y0 + size + 40} fill={muted} style={{ fontSize: 11 }}>
        each square is only worth what the next one is worth, discounted
      </text>
    </g>
  );
}
