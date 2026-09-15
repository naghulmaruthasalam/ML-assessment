import type { Lesson, Subject, SubjectId } from '@/types/curriculum';
import { remainingMlLessons } from './lessons-ml';

export type { Lesson, Subject, SubjectId, Tier } from '@/types/curriculum';

/**
 * Mock curriculum.
 *
 * Two lessons are authored end to end — `linear-regression` and
 * `q-learning` — to show every stage of the loop carrying real content.
 * The rest carry story, hook and a closing challenge; drop the remaining
 * stages in and they light up without any UI change.
 */

/* ------------------------------------------------------------------ *
 * Authoring helpers
 * ------------------------------------------------------------------ */

/** A lesson with only the beats that are written so far. */
function stub(
  slug: string,
  title: string,
  hook: string,
  narrative: string,
  challenge: Lesson['assessmentGame'],
  minutes = 8,
  extra: Partial<Lesson> = {},
): Lesson {
  return {
    slug,
    title,
    hook,
    minutes,
    interactive: false,
    narrativeText: narrative,
    assessmentGame: challenge,
    ...extra,
  };
}

/** The quickest challenge to author: read the situation, call the outcome. */
function predict(
  question: string,
  right: string,
  rightWhy: string,
  wrong: [string, string][],
  successMessage: string,
): Lesson['assessmentGame'] {
  return {
    kind: 'predict',
    question,
    successMessage,
    options: [
      { id: 'a', label: right, correct: true, feedback: rightWhy },
      ...wrong.map(([label, feedback], i) => ({
        id: `w${i}`,
        label,
        correct: false,
        feedback,
      })),
    ],
  };
}

/* ------------------------------------------------------------------ *
 * Machine Learning
 * ------------------------------------------------------------------ */

const mlLessons: Lesson[] = [
  stub(
    'what-is-learning',
    'What a model actually learns',
    'Nobody programs the rule. The rule falls out of the examples.',
    `A shopkeeper has never read a statistics book. But after twenty years
behind the counter, she can look at a customer walking in and guess, fairly
well, whether they are here for milk or for a birthday present.

Nobody taught her a rule. She saw thousands of people walk through that door,
noticed what they bought, and something settled in her head — a feel for the
pattern.

## The whole idea in one sentence

That is all a model is. You show it examples. It adjusts itself. Eventually it
makes decent guesses about examples it has never seen.

> A traditional program is a rule you wrote. A model is a rule the examples
> wrote for you.

The catch is that the machine has no twenty years and no intuition. It has
arithmetic. So the rest of this path is really about one question: how do you
turn "getting better with practice" into arithmetic a computer can do?`,
    predict(
      'You want software that spots spam. Rules like "block anything with the word FREE" keep failing. Why would learning from examples do better?',
      'Because spammers keep changing their wording, and a model retrained on new examples shifts with them.',
      'Exactly. The pattern moves, so a fixed rule rots. A learned rule can be re-learned.',
      [
        [
          'Because models are faster than if-statements.',
          'Speed is not the issue — a keyword check is very fast. The problem is that it stops being right.',
        ],
        [
          'Because models do not need any data.',
          'The opposite: examples are the only thing a model has to learn from.',
        ],
      ],
      'FIRST PRINCIPLE CLEARED',
    ),
    6,
  ),

  {
    slug: 'linear-regression',
    title: 'Linear regression from scratch',
    hook: 'Draw the best straight line through a mess of dots.',
    minutes: 14,
    interactive: true,
    requires: ['what-is-learning'],
    narrativeText: `A friend is selling her flat and asks you what it is worth.
You do not know. But you do know what eleven flats on her street sold for, and
you know how big each one was.

So you sketch the sales on paper — floor area along the bottom, price up the
side — and you notice the dots drift upward together. Bigger flat, bigger
price. You lay a ruler across the dots and tilt it until it looks about right.

## That ruler is the model

Your line has two knobs. How steep it is, and how high it starts. Steepness
says "every extra square metre adds this much money". The starting height soaks
up everything the size does not explain — the neighbourhood, the year, the view.

> Learning here means one thing: nudging those two knobs until the line sits as
> close to the dots as it can.

## Close by how much, exactly?

"Looks about right" is not something a computer can act on. So we measure the
miss. For each flat, take the gap between the real price and the line's guess,
and square it. Square, because a miss of 20 in either direction should count
the same, and because big misses should hurt disproportionately.

Add those squared gaps together and you get one number for how wrong the whole
line is. Learning is now a search: find the two knob settings that make that
number as small as it goes.`,
    scene: 'line-fitting',
    sceneCaption:
      'Eleven flats from the street, and a ruler you get to tilt.',
    sceneBeats: [
      {
        at: 0,
        text: 'The eleven sales, plotted. Floor area across, price up. The dots drift upward together.',
      },
      {
        at: 0.22,
        text: 'Lay a ruler across them at any angle at all. This one is badly wrong, and the whiskers show by how much.',
      },
      {
        at: 0.5,
        text: 'Tilt the ruler and slide it. Every whisker changes length, and the average miss falls.',
      },
      {
        at: 0.82,
        text: 'This is as close as a straight line gets. Not touching the most dots — closest to all of them at once.',
      },
    ],
    mentalModel: {
      premise: 'A model is a ruler you keep tilting.',
      analogy: `Picture the dots pinned to a board, and a ruler resting on top.
You cannot move the dots — those are the facts. You can only tilt the ruler and
slide it up or down. Every tilt changes how far the ruler sits from each dot.
The best line is not the one that touches the most dots; it is the one where the
total distance to all of them is smallest.`,
      keywords: [
        'slope',
        'intercept',
        'residual',
        'squared error',
        'best fit',
        'prediction',
      ],
      canvasCaption: 'PUT THE PARTS WHERE THEY BELONG',
      pieces: [
        {
          id: 'data',
          glyph: '📊',
          label: 'The dots',
          origin: { x: 0.06, y: 0.08 },
          target: {
            x: 0.25,
            y: 0.3,
            radius: 0.13,
            hint: 'Right — the data is the one thing you never get to change.',
          },
        },
        {
          id: 'slope',
          glyph: '📐',
          label: 'Slope knob',
          origin: { x: 0.06, y: 0.42 },
          target: {
            x: 0.72,
            y: 0.22,
            radius: 0.13,
            hint: 'Yes. Steepness is a knob the model turns, not a fact.',
          },
        },
        {
          id: 'intercept',
          glyph: '↕️',
          label: 'Height knob',
          origin: { x: 0.06, y: 0.72 },
          target: {
            x: 0.72,
            y: 0.52,
            radius: 0.13,
            hint: 'That one too — it slides the whole line up and down.',
          },
        },
        {
          id: 'error',
          glyph: '📏',
          label: 'The miss',
          origin: { x: 0.4, y: 0.82 },
          target: {
            x: 0.72,
            y: 0.8,
            radius: 0.13,
            hint: 'The miss is what you are trying to shrink. Everything serves this.',
          },
        },
      ],
    },
    codeGround: {
      scenario: `Here are eleven flats from your friend's street. Work out the average price per square metre, then use it to guess what a 95 m² flat should fetch. Store your guess in a variable called \`guess\`.`,
      dataPreview: `area  = [42, 55, 58, 61, 70, 74, 80, 88, 92, 101, 110]   # m2
price = [58, 71, 79, 82, 94, 96, 108, 118, 121, 133, 145]  # thousands`,
      setupCode: `area  = [42, 55, 58, 61, 70, 74, 80, 88, 92, 101, 110]
price = [58, 71, 79, 82, 94, 96, 108, 118, 121, 133, 145]`,
      starterCode: `# The data is already loaded as 'area' and 'price'.

# 1. Work out the price per square metre for each flat.
rates = []
for a, p in zip(area, price):
    pass  # replace this: append p / a to rates

# 2. Average those rates.
rate = 0  # replace this

# 3. Guess the price of a 95 m2 flat.
guess = 0  # replace this

print("rate per m2:", round(rate, 3))
print("guess for 95 m2:", round(guess, 1))`,
      solutionCode: `rates = []
for a, p in zip(area, price):
    rates.append(p / a)

rate = sum(rates) / len(rates)
guess = rate * 95

print("rate per m2:", round(rate, 3))
print("guess for 95 m2:", round(guess, 1))`,
      validationLogic: [
        {
          id: 'rates',
          label: 'You worked out a rate for all eleven flats.',
          expression: 'len(rates) == 11',
          hint: 'Inside the loop, append p / a to the rates list instead of pass.',
        },
        {
          id: 'rate',
          label: 'The average rate looks right.',
          expression: 'abs(rate - sum(rates) / len(rates)) < 1e-9 and rate > 0',
          hint: 'Average a list by dividing sum(rates) by len(rates).',
        },
        {
          id: 'guess',
          label: 'Your 95 m² guess follows from that rate.',
          expression: 'abs(guess - rate * 95) < 1e-6',
          hint: 'Multiply the average rate by 95 to scale it up to that flat.',
        },
      ],
    },
    assessmentGame: {
      kind: 'order',
      question:
        'Put one round of fitting a line back into the order it actually happens.',
      successMessage: 'THE LINE HOLDS',
      steps: [
        { id: 's1', label: 'Start with any slope and height at all', position: 0 },
        { id: 's2', label: 'Predict a price for every flat you have', position: 1 },
        { id: 's3', label: 'Measure how far off those guesses were', position: 2 },
        {
          id: 's4',
          label: 'Nudge both knobs in the direction that shrinks the miss',
          position: 3,
        },
        { id: 's5', label: 'Repeat until nudging stops helping', position: 4 },
      ],
    },
  },

  stub(
    'gradient-descent',
    'Gradient descent, stepped by hand',
    'Fog on a hillside, and one rule: always walk downhill.',
    `You are on a hill in thick fog, trying to reach the valley. You cannot see
where it is. But you can feel the ground under your feet, and you can tell which
way is downhill from exactly where you stand.

So you take a step that way. Then you feel again. Then you step again.

## That is the entire algorithm

The "miss" from the last lesson is the hill. Every setting of the knobs is a
place to stand, and the height is how wrong you are there. Feeling the slope
under your feet is the gradient.

> You never need a map of the whole hill. You only ever need to know which way
> is down from here.

The one judgement call is stride length. Tiny steps get there eventually but you
will be walking all day. Huge steps overshoot the valley and land you partway up
the far side, bouncing back and forth forever.`,
    predict(
      'Your error number jumps up and down wildly instead of settling. What is the most likely cause?',
      'The step size is too large, so each step overshoots the bottom.',
      'That is the classic signature. Shrink the step and the bouncing usually stops.',
      [
        [
          'The step size is too small.',
          'Too-small steps make progress slow and smooth, not wild. The bouncing points the other way.',
        ],
        [
          'There is not enough data.',
          'Thin data causes a different problem — an unreliable hill, not a violently bouncing one.',
        ],
      ],
      'DOWNHILL EVERY TIME',
    ),
    10,
    {
      interactive: true,
      requires: ['linear-regression'],
      scene: 'gradient-descent',
      sceneCaption: 'Fog, a hillside, and one rule.',
      sceneBeats: [
        {
          at: 0,
          text: 'You start high on the hill. You cannot see the valley — only feel the tilt under your feet.',
        },
        {
          at: 0.3,
          text: 'Feel which way is down, step that way. The error readout falls with every step.',
        },
        {
          at: 0.62,
          text: 'The ground flattens, so the steps shorten on their own. Shallow slope, small step.',
        },
        {
          at: 0.87,
          text: 'You have settled at the bottom. Nudging further stops helping — that is when you stop.',
        },
      ],
      mentalModel: {
        premise: 'You are in fog. You can only feel the ground you stand on.',
        analogy: `No map, no view of the valley — just the tilt under your feet
and a decision about how far to stride. The hill is your error; the spot you
stand on is your current settings. Walking downhill is the whole method.`,
        keywords: ['slope', 'step size', 'local minimum', 'convergence', 'overshoot'],
        canvasCaption: 'LAY OUT ONE STEP',
        pieces: [
          {
            id: 'where',
            glyph: '🥾',
            label: 'Where I stand',
            origin: { x: 0.06, y: 0.12 },
            target: { x: 0.22, y: 0.3, radius: 0.13, hint: 'Your current settings.' },
          },
          {
            id: 'feel',
            glyph: '🧭',
            label: 'Which way is down',
            origin: { x: 0.06, y: 0.5 },
            target: { x: 0.52, y: 0.3, radius: 0.13, hint: 'That is the gradient.' },
          },
          {
            id: 'stride',
            glyph: '📏',
            label: 'How far to step',
            origin: { x: 0.06, y: 0.82 },
            target: { x: 0.82, y: 0.3, radius: 0.13, hint: 'The learning rate — the one real judgement call.' },
          },
        ],
      },
      codeGround: {
        scenario: `Walk downhill on the bowl f(x) = (x - 3)² by hand. Its slope
at any point is 2 * (x - 3). Start at x = 10, take 15 steps with a step size of
0.1, and keep every position in a list called \`path\`.`,
        dataPreview: `f(x)      = (x - 3) ** 2      # the hill
slope(x)  = 2 * (x - 3)       # which way is down
start x   = 10.0,  step = 0.1,  15 steps`,
        setupCode: `def f(x):
    return (x - 3) ** 2

def slope(x):
    return 2 * (x - 3)

step = 0.1`,
        starterCode: `# f, slope and step are ready.

x = 10.0
path = [x]

for _ in range(15):
    # Move against the slope: downhill, not up.
    x = x  # replace this
    path.append(x)

print("landed at:", round(x, 3))
print("height there:", round(f(x), 3))`,
        solutionCode: `x = 10.0
path = [x]

for _ in range(15):
    x = x - step * slope(x)
    path.append(x)

print("landed at:", round(x, 3))
print("height there:", round(f(x), 3))`,
        validationLogic: [
          {
            id: 'steps',
            label: 'You took all fifteen steps.',
            expression: 'len(path) == 16',
            hint: 'The list starts with the first position, then one entry per step — sixteen in all.',
          },
          {
            id: 'downhill',
            label: 'Every step moved downhill, never up.',
            expression: 'all(f(path[i+1]) <= f(path[i]) + 1e-9 for i in range(len(path)-1))',
            hint: 'Subtract step * slope(x) rather than adding it. Adding walks you up the hill.',
          },
          {
            id: 'arrived',
            label: 'You ended up near the bottom at x = 3.',
            expression: 'abs(x - 3) < 0.6',
            hint: 'Use x = x - step * slope(x) inside the loop.',
          },
        ],
      },
    },
  ),

  remainingMlLessons[0], // logistic-regression
  remainingMlLessons[1], // decision-trees
  remainingMlLessons[2], // ensembles
  remainingMlLessons[3], // clustering
  remainingMlLessons[4], // pca
  remainingMlLessons[5], // model-evaluation

  stub(
    'bias-variance',
    'Bias, variance, and the fit you missed',
    'One student memorised the answers. The other never read the book.',
    `Two students sit the same exam. The first never opened the textbook and
answers everything with a vague gut feel. The second memorised last year's paper
word for word.

Both fail. They fail in opposite directions.

## Underfitting and overfitting

The first student is your model when it is too simple to catch the real
pattern — a straight line through something curved. It is wrong on the practice
data and wrong on the exam, consistently.

The second is your model when it has learned the training data so precisely that
it has memorised its noise. Perfect on questions it has seen, lost on anything
new.

> A model that is perfect on data it has already seen has told you nothing about
> how it will behave tomorrow.

The only honest test is data the model has never touched. That is why you hold
some back before you start.`,
    predict(
      'Your model scores 99% on training data and 61% on data it has never seen. What is going on?',
      'It has overfitted — it memorised the training set instead of learning the pattern.',
      'Right. That gap between the two scores is the tell.',
      [
        [
          'It has underfitted and needs to be more complex.',
          'An underfit model scores poorly on both sets. Here training performance is excellent, so complexity is not the shortage.',
        ],
        [
          'The two scores are normal and nothing is wrong.',
          'A 38-point gap is not normal. It says the model will disappoint you in the real world.',
        ],
      ],
      'HONEST SCORING UNLOCKED',
    ),
    9,
    {
      scene: 'overfitting',
      sceneCaption: 'The two students, drawn as one sweep.',
      sceneBeats: [
        {
          at: 0,
          text: 'The student who never opened the book: a flat line, missing the trend entirely.',
        },
        {
          at: 0.45,
          text: 'Somewhere in the middle it catches the real shape without chasing every dot.',
        },
        {
          at: 0.78,
          text: 'The student who memorised the paper: a curve bending through every single point, noise included.',
        },
      ],
    },
  ),
];

/* ------------------------------------------------------------------ *
 * Deep Learning
 * ------------------------------------------------------------------ */

const dlLessons: Lesson[] = [
  stub(
    'perceptron',
    'The perceptron, one neuron deep',
    'A single yes-or-no decision, made by weighing what matters.',
    `You are deciding whether to go outside. Three things matter: is it raining,
do you have an umbrella, how badly do you need milk.

None of them decides alone. You weigh them. Rain counts against, heavily.
Umbrella counts for, a little. Desperate need for milk can outweigh both.

## Weights, sum, threshold

Add up each factor times how much it matters. If the total clears some bar, you
go. That is a neuron: weighted inputs, a sum, a threshold.

> Everything in deep learning is this, stacked and repeated until the stack can
> represent something a single decision never could.

Learning means adjusting how much each input counts, based on how the decision
turned out.`,
    predict(
      'A single perceptron cannot learn the rule "exactly one of these two things is true". Why not?',
      'That rule cannot be separated by one straight line, and one perceptron only draws one straight line.',
      'Correct — this is the XOR problem, and it is what forced layers to be stacked.',
      [
        [
          'It has not been trained long enough.',
          'Time will not help. No setting of the weights draws that boundary with a single line.',
        ],
        [
          'The inputs are not numbers.',
          'They can be perfectly good numbers. The limit is geometric, not about data types.',
        ],
      ],
      'FIRST NEURON ONLINE',
    ),
    8,
    {
      scene: 'perceptron',
      sceneCaption: 'Deciding whether to go outside, one factor at a time.',
      sceneBeats: [
        { at: 0, text: 'Three things bear on the decision. None of them decides alone.' },
        { at: 0.28, text: 'Rain arrives first and counts heavily against — a thick line, a negative weight.' },
        { at: 0.55, text: 'The umbrella pushes back a little. The running total shifts.' },
        { at: 0.78, text: 'Needing milk outweighs both, the total clears zero, and the neuron fires.' },
      ],
    },
  ),

  stub(
    'backprop',
    'Backpropagation, traced by hand',
    'The blame for a wrong answer, passed backwards down the chain.',
    `A dish comes back to the kitchen too salty. The head chef does not throw out
the whole kitchen. She traces it: the sauce station over-salted, because the
stock was already salty, because the prep cook reduced it too far.

Blame flows backwards along the chain, and each station adjusts by its share.

## The same trick, in arithmetic

A network's answer is wrong by some amount. The last layer gets its share of the
blame. It passes what it received back to the layer before, scaled by how much
that layer influenced it. And so on to the front.

> Each weight learns one thing: how much the final error would change if it
> alone shifted slightly.

Every weight then nudges in the direction that shrinks the error, all at once.`,
    predict(
      'Gradients arriving at the earliest layers of a deep network shrink to nearly zero. What is the consequence?',
      'Those early layers barely update, so they learn very slowly or not at all.',
      'Exactly the vanishing gradient problem — and the reason for ReLU and residual connections.',
      [
        [
          'The network trains faster because there is less to compute.',
          'Nothing is skipped — the updates are computed and are simply too small to matter.',
        ],
        [
          'The last layer stops learning.',
          'The last layer is fine. It sits closest to the error and gets the strongest signal.',
        ],
      ],
      'BLAME CHAIN TRACED',
    ),
    12,
  ),

  stub(
    'attention',
    'Attention as soft lookup',
    'Reading a sentence, deciding which earlier word this one depends on.',
    `Read this: "The trophy did not fit in the suitcase because it was too big."

What is "it"? You resolved that instantly, and to do it you reached back to an
earlier word. Swap "big" for "small" and you reach for a different one.

## Looking back, weighted

Attention is that reaching-back, made numeric. For each word, the model scores
every other word for relevance, turns those scores into weights that sum to one,
and mixes the words together by those weights.

> Nothing is retrieved outright. Everything is retrieved a little, in proportion
> to how much it seems to matter.

Because every word can look at every other word directly, nothing has to survive
a long chain of hand-offs to stay available.`,
    predict(
      'Why can a transformer connect the first and last word of a long passage more reliably than a recurrent network?',
      'Attention links any two positions directly, instead of passing information along step by step.',
      'Right — no long relay, so nothing degrades along the way.',
      [
        [
          'Transformers have more parameters.',
          'They often do, but size is not what fixes long-range dependency. The direct connection is.',
        ],
        [
          'Transformers read the passage more times.',
          'A single forward pass is enough. The advantage is structural.',
        ],
      ],
      'FULL CONTEXT IN VIEW',
    ),
    13,
    {
      scene: 'attention',
      sceneCaption: 'The trophy sentence, and the word that has to reach back.',
      sceneBeats: [
        { at: 0, text: 'The sentence, with "it" highlighted. Something earlier has to resolve it.' },
        { at: 0.35, text: 'Arcs reach back to every other word at once — nothing is retrieved outright.' },
        { at: 0.7, text: '"Trophy" pulls hardest. Thicker arc, taller bar, more of it mixed in.' },
        { at: 0.9, text: 'Swap "big" for "small" and the weights shift to the suitcase instead.' },
      ],
    },
  ),
];

/* ------------------------------------------------------------------ *
 * Reinforcement Learning
 * ------------------------------------------------------------------ */

const rlLessons: Lesson[] = [
  stub(
    'mdps',
    'Markov decision processes',
    'Where you are, what you can do, and what it gets you.',
    `A board game, mid-turn. To decide your move you need three things: the
position on the board, the moves available, and some sense of what each one
leads to.

You do not need the history of how the board got this way. The board as it
stands tells you everything you need.

## State, action, reward

That is the frame for every problem in this path. A state you are in. Actions
you can take. A reward that arrives, sometimes late, telling you how that went.

> The hard part is never the reward you get immediately. It is the reward three
> moves from now that your current move quietly made possible.`,
    predict(
      'A robot gets +1 for reaching a goal and 0 everywhere else. Why is this difficult to learn from?',
      'Almost every action returns nothing, so there is no signal about which early moves helped.',
      'Yes — the sparse reward problem, and the reason discounting and shaping exist.',
      [
        [
          'Because +1 is too small a number.',
          'The scale does not matter; the same problem exists with +1000. Scarcity is the issue.',
        ],
        [
          'Because the robot cannot see the goal.',
          'Visibility is a separate concern. Even in full view, sparse reward is hard to learn from.',
        ],
      ],
      'THE FRAME IS SET',
    ),
    9,
  ),

  {
    slug: 'q-learning',
    title: 'Q-learning in a gridworld',
    hook: 'Keep a private scorecard of every move, and update it as you go.',
    minutes: 15,
    interactive: true,
    requires: ['mdps'],
    narrativeText: `You start a new job in a building with no map. On day one you
wander. Some corridors dead-end. One staircase gets you to the canteen fast.

By week three you have a scorecard in your head: from the lobby, the left
corridor is worth taking; from the second floor, the far stairs are a mistake.
Nobody handed you that scorecard. You built it by trying things.

## The table of moves

Q-learning keeps that scorecard as a table. One row per place you can be, one
column per move you can make, and in each cell a running estimate of how good
that move is from there.

> The value of a move is what it pays you now, plus the value of the best move
> available once you have made it.

That is circular, and it works anyway. Start with the table full of zeros. Move
around. Each time, adjust the cell you just used a little towards what you
actually observed. The estimates settle.

## Trying things you already think are bad

If you always take the best-known move, you will never discover the better one
you have not tried. So some fraction of the time you move at random — enough to
keep finding things, not so much that you never use what you know.`,
    scene: 'q-table',
    sceneCaption: 'The corridor, and the scorecard filling in.',
    sceneBeats: [
      {
        at: 0,
        text: 'Day one in the building. The scorecard is all zeros, because you have tried nothing.',
      },
      {
        at: 0.3,
        text: 'The square beside the goal firms up first — it pays out immediately, so its number is easy.',
      },
      {
        at: 0.6,
        text: 'Now the square before that one becomes worth something, because of where it leads.',
      },
      {
        at: 0.85,
        text: 'Value has bled all the way back. Each square is worth what the next one is, discounted a little.',
      },
    ],
    mentalModel: {
      premise: 'A scorecard you scribble on while you walk.',
      analogy: `Think of a table pinned to the wall of every room, listing each
exit and what you reckon it is worth. You walk through a door, see what happens,
and go back and amend the number. Rooms near the goal get confident numbers
first. Rooms far away only firm up once the rooms after them have.`,
      keywords: [
        'state',
        'action',
        'Q-value',
        'discount',
        'exploration',
        'greedy',
        'bootstrap',
      ],
      canvasCaption: 'ARRANGE ONE STEP OF THE LOOP',
      pieces: [
        {
          id: 'state',
          glyph: '📍',
          label: 'Where I am',
          origin: { x: 0.05, y: 0.1 },
          target: {
            x: 0.2,
            y: 0.25,
            radius: 0.13,
            hint: 'The step begins here.',
          },
        },
        {
          id: 'action',
          glyph: '🎮',
          label: 'Move I pick',
          origin: { x: 0.05, y: 0.45 },
          target: {
            x: 0.5,
            y: 0.25,
            radius: 0.13,
            hint: 'Then you commit to a move.',
          },
        },
        {
          id: 'reward',
          glyph: '🍬',
          label: 'What I got',
          origin: { x: 0.05, y: 0.78 },
          target: {
            x: 0.8,
            y: 0.25,
            radius: 0.13,
            hint: 'The world answers.',
          },
        },
        {
          id: 'update',
          glyph: '✏️',
          label: 'Fix the number',
          origin: { x: 0.45, y: 0.85 },
          target: {
            x: 0.5,
            y: 0.72,
            radius: 0.14,
            hint: 'And the scorecard gets amended.',
          },
        },
      ],
    },
    codeGround: {
      scenario: `A robot sits on a five-square corridor. Square 4 is the goal and pays 1; everything else pays 0. The Q-table is loaded as \`Q\` — five rows, two columns (0 = left, 1 = right). Apply a single Q-learning update for moving right from square 3, then store the updated cell in \`updated\`.`,
      dataPreview: `Q = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
alpha = 0.5   # how much to trust the new observation
gamma = 0.9   # how much a future reward is worth now`,
      setupCode: `Q = [[0.0, 0.0] for _ in range(5)]
alpha = 0.5
gamma = 0.9
reward = 1.0
state, action, next_state = 3, 1, 4`,
      starterCode: `# Q, alpha, gamma, reward, state, action, next_state are ready.

# The best value available from the square you land on:
best_next = 0.0  # replace: max(Q[next_state])

# The target: what you actually saw, plus what the future is worth.
target = 0.0  # replace: reward + gamma * best_next

# Move the old estimate part of the way towards the target.
Q[state][action] = 0.0  # replace this

updated = Q[state][action]
print("updated cell:", updated)`,
      solutionCode: `best_next = max(Q[next_state])
target = reward + gamma * best_next
Q[state][action] = Q[state][action] + alpha * (target - Q[state][action])

updated = Q[state][action]
print("updated cell:", updated)`,
      validationLogic: [
        {
          id: 'best',
          label: 'You took the best value from the next square.',
          expression: 'abs(best_next - max(Q[next_state])) < 1e-9',
          hint: 'Use max(Q[next_state]) — the best move available once you land.',
        },
        {
          id: 'target',
          label: 'The target combines the reward with the discounted future.',
          expression: 'abs(target - (reward + gamma * best_next)) < 1e-9',
          hint: 'target = reward + gamma * best_next',
        },
        {
          id: 'updated',
          label: 'The cell moved halfway to the target.',
          expression: 'abs(updated - 0.5) < 1e-6',
          hint: 'Add alpha * (target - old value) to the old value. With alpha 0.5 and a reward of 1, it lands on 0.5.',
        },
      ],
    },
    assessmentGame: {
      kind: 'match',
      question: 'Match each piece of the update rule to the job it does.',
      successMessage: 'SCORECARD MASTERED',
      pairs: [
        {
          id: 'p1',
          term: 'alpha',
          definition: 'How far the old estimate moves towards what you just saw',
        },
        {
          id: 'p2',
          term: 'gamma',
          definition: 'How much a reward is worth if it only arrives later',
        },
        {
          id: 'p3',
          term: 'max(Q[next])',
          definition: 'The best you could do from where you have landed',
        },
        {
          id: 'p4',
          term: 'epsilon',
          definition: 'How often you ignore your own advice and try something new',
        },
      ],
    },
  },

  stub(
    'policy-gradients',
    'REINFORCE and policy gradients',
    'Skip the scorecard. Adjust the habit itself.',
    `A scorecard works when the moves are countable. But a chef adjusting heat on
a dial has infinitely many choices, and no table has a column for each.

So stop scoring moves. Score behaviour instead.

## Nudging the habit

The agent holds a set of tendencies — how likely it is to do each thing in each
situation. It acts, watches how the whole episode went, and then makes the
actions from good episodes more likely and the ones from bad episodes less.

> You are not learning what each move is worth. You are learning to be the kind
> of agent that makes good ones more often.`,
    predict(
      'Policy gradient methods usually need many episodes and still learn noisily. Why?',
      'Credit is assigned from whole-episode outcomes, so a single lucky or unlucky run skews the update.',
      'Right — high variance, and the reason baselines and actor-critic methods exist.',
      [
        [
          'Because they cannot handle continuous actions.',
          'Continuous actions are precisely their strength — that is why you reach for them.',
        ],
        [
          'Because they need a full model of the environment.',
          'They do not. They learn from sampled experience like other model-free methods.',
        ],
      ],
      'THE DOJO IS YOURS',
    ),
    12,
  ),
];

/* ------------------------------------------------------------------ *
 * Subjects
 * ------------------------------------------------------------------ */

export const mockMLData = mlLessons;
export const mockDLData = dlLessons;
export const mockRLData = rlLessons;

export const subjects: Subject[] = [
  {
    id: 'ml',
    href: '/ml',
    name: 'Machine Learning',
    codename: 'The Pattern Alchemist',
    tagline: 'Turn raw columns into predictions you can defend.',
    icon: '⚗️',
    tier: 'Novice',
    lessons: mlLessons,
  },
  {
    id: 'dl',
    href: '/dl',
    name: 'Deep Learning',
    codename: 'Neural Forge',
    tagline: 'Stack layers, watch gradients, hammer a network into shape.',
    icon: '🔥',
    tier: 'Adept',
    lessons: dlLessons,
  },
  {
    id: 'rl',
    href: '/rl',
    name: 'Reinforcement Learning',
    codename: 'Autonomous Dojo',
    tagline: 'Train an agent that learns by getting it wrong first.',
    icon: '🥋',
    tier: 'Master',
    lessons: rlLessons,
  },
];

/* Derived counts — never hand-written. */
export const lessonsCount = (s: Subject) => s.lessons.length;
export const interactivesCount = (s: Subject) =>
  s.lessons.filter((l) => l.interactive).length;

export const totalLessons = subjects.reduce((n, s) => n + lessonsCount(s), 0);
export const totalInteractives = subjects.reduce(
  (n, s) => n + interactivesCount(s),
  0,
);

export const getSubject = (id: string) => subjects.find((s) => s.id === id);

export const getLesson = (subjectId: string, slug: string) => {
  const subject = getSubject(subjectId);
  const lesson = subject?.lessons.find((l) => l.slug === slug);
  return subject && lesson ? { subject, lesson } : null;
};

export const neighbours = (subjectId: SubjectId, slug: string) => {
  const subject = getSubject(subjectId);
  if (!subject) return { prev: null, next: null };
  const i = subject.lessons.findIndex((l) => l.slug === slug);
  return {
    prev: i > 0 ? subject.lessons[i - 1] : null,
    next:
      i >= 0 && i < subject.lessons.length - 1 ? subject.lessons[i + 1] : null,
  };
};
