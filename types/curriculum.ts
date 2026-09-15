/**
 * Curriculum schema.
 *
 * Every lesson walks the same six beats:
 *   story -> video -> mental model -> code -> game -> progression
 *
 * The shape below is the contract between the content authors and the
 * rendering components. Nothing in the UI invents content; if a field is
 * absent, the corresponding stage simply doesn't render.
 */

export type SubjectId = 'ml' | 'dl' | 'rl';

/** Concept animations available to stage 2. See components/lesson/scenes.tsx. */
export type SceneId =
  | 'line-fitting'
  | 'gradient-descent'
  | 'logistic-boundary'
  | 'decision-tree'
  | 'ensemble-vote'
  | 'kmeans'
  | 'pca-projection'
  | 'holdout-folds'
  | 'perceptron'
  | 'attention'
  | 'q-table'
  | 'overfitting';

/**
 * A caption pinned to a moment in the animation.
 *
 * Beats are what tie stage 2 back to stage 1: each one is written in the
 * language of that lesson's story, so scrubbing the scene walks the same
 * arc the learner just read rather than narrating a generic diagram.
 */
export interface SceneBeat {
  /** Position in the 0–1 timeline where this beat takes over. */
  at: number;
  text: string;
}

export type Tier = 'Novice' | 'Adept' | 'Master';

/* ------------------------------------------------------------------ *
 * Stage 3 — Mental model
 * ------------------------------------------------------------------ */

/** A draggable token the learner arranges on the sandbox canvas. */
export interface MentalModelPiece {
  id: string;
  /** Short text shown on the token. Keep to a few words. */
  label: string;
  /** Emoji or short glyph rendered above the label. */
  glyph?: string;
  /** Starting position as a 0–1 fraction of the canvas box. */
  origin: { x: number; y: number };
  /**
   * Optional target zone. When present the sandbox can tell the learner
   * whether a piece landed somewhere sensible — but it never blocks them.
   */
  target?: { x: number; y: number; radius: number; hint: string };
}

export interface MentalModel {
  /** One-line framing of the analogy, e.g. "A model is a recipe writer." */
  premise: string;
  /** Evocative words that give the concept a shape in the mind. */
  keywords: string[];
  /** Longer analogy prose, rendered beside the canvas. */
  analogy: string;
  /** Optional illustration. Either a URL or a Framer Motion asset id. */
  imageUrl?: string;
  assetId?: string;
  /** Tokens the learner drags to map the idea out before coding. */
  pieces: MentalModelPiece[];
  /** Label for the canvas region, e.g. "Drop the data on the left." */
  canvasCaption?: string;
}

/* ------------------------------------------------------------------ *
 * Stage 4 — Code ground
 * ------------------------------------------------------------------ */

export interface CodeGroundCheck {
  id: string;
  /** What the learner sees in the checklist. */
  label: string;
  /**
   * Python expression evaluated after the learner's code runs, in the same
   * namespace. Must evaluate truthy to pass. Keep it to one expression.
   */
  expression: string;
  /** Shown when the check fails. Say what to do, not just what broke. */
  hint: string;
}

export interface CodeGround {
  /** The real-world problem, in plain language. */
  scenario: string;
  /** Optional dataset preview rendered above the editor. */
  dataPreview?: string;
  starterCode: string;
  /** Python run before the learner's code — fixtures, imports, data. */
  setupCode?: string;
  /** Reference solution, revealed only on request. */
  solutionCode?: string;
  validationLogic: CodeGroundCheck[];
}

/* ------------------------------------------------------------------ *
 * Stage 5 — Gamified assessment
 * ------------------------------------------------------------------ */

export type AssessmentKind = 'match' | 'order' | 'predict';

/** Drag a term onto the definition it belongs to. */
export interface MatchPair {
  id: string;
  term: string;
  definition: string;
}

/** Put the steps of a process into the right sequence. */
export interface OrderStep {
  id: string;
  label: string;
  /** Zero-based correct index. */
  position: number;
}

/** Read a situation, choose what happens next. */
export interface PredictOption {
  id: string;
  label: string;
  correct: boolean;
  /** Why this option is right or wrong, shown after answering. */
  feedback: string;
}

export interface AssessmentGame {
  kind: AssessmentKind;
  /** The challenge prompt, in the lesson's narrative voice. */
  question: string;
  /** Shown on success, before the mind-map node unlocks. */
  successMessage: string;
  pairs?: MatchPair[];
  steps?: OrderStep[];
  options?: PredictOption[];
}

/* ------------------------------------------------------------------ *
 * The lesson
 * ------------------------------------------------------------------ */

export interface Lesson {
  slug: string;
  title: string;
  /** One-line hook shown on cards and the mind map. */
  hook: string;
  /** Minutes, for the learner's own planning. */
  minutes: number;
  /** True when the lesson carries a runnable code ground. */
  interactive: boolean;

  /** Stage 1 — Markdown. The lesson told as a story, in plain language. */
  narrativeText: string;

  /**
   * Stage 2 — conceptual visualization.
   *
   * Prefer `scene`: an animated SVG rendered in-browser, themed and
   * scrubbable. `videoUrl` remains for lessons that genuinely need footage;
   * if both are set, the scene wins.
   */
  scene?: SceneId;
  sceneCaption?: string;
  /** Narration synced to the scene, in the story's own words. */
  sceneBeats?: SceneBeat[];
  videoUrl?: string;
  videoPoster?: string;
  videoCaption?: string;

  /** Stage 3 */
  mentalModel?: MentalModel;

  /** Stage 4 */
  codeGround?: CodeGround;

  /** Stage 5 */
  assessmentGame?: AssessmentGame;

  /** Slugs that must be completed first. Empty means "open from the start". */
  requires?: string[];
}

export interface Subject {
  id: SubjectId;
  href: `/${SubjectId}`;
  name: string;
  codename: string;
  tagline: string;
  icon: string;
  tier: Tier;
  lessons: Lesson[];
}
