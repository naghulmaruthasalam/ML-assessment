import type { Lesson } from '@/types/curriculum';

/**
 * The back half of the Machine Learning track.
 *
 * Each lesson runs the full loop. The `sceneBeats` are deliberately written
 * in the same voice and with the same images as `narrativeText` above them —
 * the animation is meant to replay the story, not narrate a generic diagram.
 */

export const logisticRegression: Lesson = {
  slug: 'logistic-regression',
  title: 'Drawing the decision boundary',
  hook: 'Not "how much" any more. Just yes or no.',
  minutes: 12,
  interactive: true,
  requires: ['gradient-descent'],
  narrativeText: `The flat problem had a number at the end of it. How many
thousands. A line through the dots was the right shape of answer.

Now a different question: is this email spam? There is no "somewhat spam, about
73 thousand". There is a folder it goes in.

## A straight line is the wrong shape

Run a straight line at this and it will happily predict 1.4, or -0.2. Neither
means anything. Worse, one loud example far off to the right drags the whole
line and ruins the answers near the middle.

What you want is something that flattens out. Confident at the edges, and
willing to change its mind quickly in the middle where the hard cases live.

> Bend the line into an S. It can never leave the range from 0 to 1, so
> whatever comes out can be read as a probability.

## Where the line in the sand goes

The S gives you a number between 0 and 1. To act on it you need a cut-off, and
the obvious one is 0.5 — above it, call it spam.

Obvious is not always right. If dumping a real email in the spam folder is much
worse than letting a spam through, move the cut-off up to 0.8 and only act when
the model is quite sure. The curve does not change. Where you draw the line
across it is a decision about consequences, not about mathematics.`,
  scene: 'logistic-boundary',
  sceneCaption:
    'Hollow dots are real mail, filled dots are spam. Watch the curve stop hedging.',
  sceneBeats: [
    {
      at: 0,
      text: 'Every email sits at 0 or 1 — real or spam. Nothing in between, because there is no in-between folder.',
    },
    {
      at: 0.25,
      text: 'The curve starts limp. It hedges everywhere, and is confident about nothing.',
    },
    {
      at: 0.55,
      text: 'As it learns, the S sharpens: near-certain at the edges, still undecided in the messy middle.',
    },
    {
      at: 0.75,
      text: 'The cut-off at 0.5 becomes the line in the sand. Right of it, the mail goes to the spam folder.',
    },
    {
      at: 0.92,
      text: 'Slide that cut-off up and you act only when very sure — fewer real emails wrongly binned.',
    },
  ],
  mentalModel: {
    premise: 'A dimmer switch that snaps, not a volume knob.',
    analogy: `A straight line is a volume knob: turn it far enough and it gives
you nonsense readings off either end. The S-curve is a dimmer that refuses to go
below off or above full. In the middle it moves fast — a small change in the
evidence swings the decision — and at the extremes it barely responds, because
once you are sure, more evidence should not matter much.`,
    keywords: [
      'probability',
      'sigmoid',
      'threshold',
      'decision boundary',
      'odds',
      'false positive',
    ],
    canvasCaption: 'SORT THE PARTS OF A YES-OR-NO MODEL',
    pieces: [
      {
        id: 'evidence',
        glyph: '📨',
        label: 'The evidence',
        origin: { x: 0.06, y: 0.1 },
        target: { x: 0.22, y: 0.3, radius: 0.13, hint: 'What you observed about the email.' },
      },
      {
        id: 'squash',
        glyph: '🎚️',
        label: 'Squash to 0–1',
        origin: { x: 0.06, y: 0.44 },
        target: { x: 0.52, y: 0.3, radius: 0.13, hint: 'The S-curve, keeping the answer readable as a chance.' },
      },
      {
        id: 'cut',
        glyph: '✂️',
        label: 'The cut-off',
        origin: { x: 0.06, y: 0.78 },
        target: { x: 0.82, y: 0.3, radius: 0.13, hint: 'Where you act — a choice about consequences.' },
      },
      {
        id: 'cost',
        glyph: '⚖️',
        label: 'Cost of being wrong',
        origin: { x: 0.45, y: 0.86 },
        target: { x: 0.82, y: 0.72, radius: 0.14, hint: 'This is what should move the cut-off, nothing else.' },
      },
    ],
  },
  codeGround: {
    scenario: `Twelve emails have been scored by a model — each score is the
chance it is spam. Turn those scores into decisions using a cut-off of 0.5, then
count how many real emails you wrongly binned. Store the decisions in
\`flagged\` and the count in \`false_positives\`.`,
    dataPreview: `scores = [0.02, 0.11, 0.34, 0.47, 0.51, 0.63, 0.72, 0.85, 0.91, 0.44, 0.68, 0.09]
truth  = [0,    0,    0,    0,    0,    1,    1,    1,    1,    1,    0,    0]
# truth: 1 means it really was spam`,
    setupCode: `scores = [0.02, 0.11, 0.34, 0.47, 0.51, 0.63, 0.72, 0.85, 0.91, 0.44, 0.68, 0.09]
truth  = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0]
cutoff = 0.5`,
    starterCode: `# scores, truth and cutoff are ready.

# 1. Decide: 1 if the score clears the cutoff, else 0.
flagged = []
for s in scores:
    pass  # replace this

# 2. A false positive is a real email you flagged as spam.
false_positives = 0  # replace this

print("flagged:", flagged)
print("real mail wrongly binned:", false_positives)`,
    solutionCode: `flagged = []
for s in scores:
    flagged.append(1 if s >= cutoff else 0)

false_positives = sum(
    1 for f, t in zip(flagged, truth) if f == 1 and t == 0
)

print("flagged:", flagged)
print("real mail wrongly binned:", false_positives)`,
    validationLogic: [
      {
        id: 'len',
        label: 'You made a decision for every email.',
        expression: 'len(flagged) == 12',
        hint: 'Append one value per loop pass — 1 if s >= cutoff, otherwise 0.',
      },
      {
        id: 'rule',
        label: 'The cut-off was applied correctly.',
        expression: 'flagged == [1 if s >= cutoff else 0 for s in scores]',
        hint: 'Anything at or above 0.5 is flagged; everything below is left alone.',
      },
      {
        id: 'fp',
        label: 'You counted the real emails you wrongly binned.',
        expression: 'false_positives == 2',
        hint: 'Count positions where flagged is 1 but truth is 0. zip(flagged, truth) pairs them up.',
      },
    ],
  },
  assessmentGame: {
    kind: 'predict',
    question:
      'A hospital screening test flags patients for a follow-up scan. Missing a sick patient is far worse than an unnecessary scan. What should you do with the cut-off?',
    successMessage: 'BOUNDARY DRAWN',
    options: [
      {
        id: 'a',
        label: 'Lower it, so the test flags more people and misses fewer sick ones.',
        correct: true,
        feedback:
          'Right. A lower cut-off catches more true cases at the cost of more false alarms — the correct trade when a miss is the expensive error.',
      },
      {
        id: 'b',
        label: 'Raise it, so only very confident predictions get flagged.',
        correct: false,
        feedback:
          'That reduces false alarms but lets more sick patients through — exactly the error you said was worst.',
      },
      {
        id: 'c',
        label: 'Leave it at 0.5, because that is the mathematically correct value.',
        correct: false,
        feedback:
          '0.5 is a default, not a law. The right cut-off depends on what each kind of mistake costs.',
      },
    ],
  },
};

export const decisionTrees: Lesson = {
  slug: 'decision-trees',
  title: 'Decision trees and impurity',
  hook: 'Twenty questions, and each one has to earn its place.',
  minutes: 11,
  interactive: true,
  requires: ['logistic-regression'],
  narrativeText: `A child playing twenty questions does not ask "is it a
badger?" first. She asks "is it an animal?" — because whichever way you answer,
half the world disappears.

A decision tree plays the same game, and the whole skill is picking the question
that clears the most off the table.

## Measuring a messy pile

Before any question, your pile is a jumble: birds, bats, fish, dogs. Call that
messy. After a question the pile splits in two, and if you chose well each half
is tidier than the pile you started with.

> A good question is one that leaves you with tidier piles than you had before.
> That is the entire rule for growing a tree.

"Tidy" gets a number — impurity. A pile that is all one thing scores zero. A
pile split evenly between two things scores highest. The tree tries every
question it can ask and keeps the one that drops the score the most.

## Knowing when to stop

Keep going and eventually every leaf holds exactly one example. The tree is now
perfect on what it has seen and useless on anything else — the student who
memorised last year's paper.

So you stop early. Do not split a pile smaller than some size. Do not go deeper
than some depth. A slightly messy leaf that generalises beats a spotless one
that does not.`,
  scene: 'decision-tree',
  sceneCaption:
    'One question, then another, until each leaf holds a single answer.',
  sceneBeats: [
    {
      at: 0,
      text: 'You start with everything in one pile: birds, bats, fish, dogs, all jumbled together.',
    },
    {
      at: 0.3,
      text: '"Wings?" splits the world roughly in half — a strong first question, like asking "is it an animal?"',
    },
    {
      at: 0.62,
      text: 'Each half gets its own question. Feathers separates bird from bat; fins separates fish from dog.',
    },
    {
      at: 0.86,
      text: 'Every leaf now holds one answer. Ask more questions than this and you start memorising instead of learning.',
    },
  ],
  mentalModel: {
    premise: 'A game of twenty questions, played well.',
    analogy: `Every question you ask costs you a turn, so it has to buy as much
information as it can. "Is it an animal?" is worth asking. "Is it a badger?" is
a guess wearing a question's clothing — it almost always comes back no, and you
have learned nearly nothing. The tree is just a machine that always asks the
first kind of question.`,
    keywords: ['split', 'impurity', 'information gain', 'leaf', 'depth', 'pruning'],
    canvasCaption: 'ARRANGE ONE SPLIT',
    pieces: [
      {
        id: 'pile',
        glyph: '🗂️',
        label: 'Messy pile',
        origin: { x: 0.06, y: 0.12 },
        target: { x: 0.2, y: 0.28, radius: 0.13, hint: 'Everything, jumbled, before you ask anything.' },
      },
      {
        id: 'question',
        glyph: '❓',
        label: 'The question',
        origin: { x: 0.06, y: 0.48 },
        target: { x: 0.5, y: 0.28, radius: 0.13, hint: 'The one that tidies the piles most.' },
      },
      {
        id: 'tidier',
        glyph: '📚',
        label: 'Two tidier piles',
        origin: { x: 0.06, y: 0.8 },
        target: { x: 0.8, y: 0.28, radius: 0.13, hint: 'The payoff, measured as a drop in impurity.' },
      },
      {
        id: 'stop',
        glyph: '🛑',
        label: 'When to stop',
        origin: { x: 0.45, y: 0.86 },
        target: { x: 0.5, y: 0.74, radius: 0.14, hint: 'Before the leaves get so small they only fit one example.' },
      },
    ],
  },
  codeGround: {
    scenario: `Measure how messy a pile is. Gini impurity is 1 minus the sum of
each label's squared share — 0 means all one thing, 0.5 means an even two-way
split. Write \`gini(labels)\`, then use it to score the split on wings and store
the result in \`gain\`.`,
    dataPreview: `pile  = [1, 1, 1, 0, 0, 0, 0, 0]   # 1 = has wings
left  = [1, 1, 1]                  # answered yes
right = [0, 0, 0, 0, 0]            # answered no`,
    setupCode: `pile  = [1, 1, 1, 0, 0, 0, 0, 0]
left  = [1, 1, 1]
right = [0, 0, 0, 0, 0]`,
    starterCode: `def gini(labels):
    if not labels:
        return 0.0
    total = len(labels)
    score = 1.0
    for value in set(labels):
        share = labels.count(value) / total
        pass  # replace this: subtract share * share from score
    return score

# How much tidier are the two halves than the pile you started with?
before = gini(pile)
after = 0.0  # replace: the size-weighted average of gini(left) and gini(right)
gain = before - after

print("before:", round(before, 3))
print("after: ", round(after, 3))
print("gain:  ", round(gain, 3))`,
    solutionCode: `def gini(labels):
    if not labels:
        return 0.0
    total = len(labels)
    score = 1.0
    for value in set(labels):
        share = labels.count(value) / total
        score -= share * share
    return score

before = gini(pile)
after = (len(left) / len(pile)) * gini(left) + (len(right) / len(pile)) * gini(right)
gain = before - after

print("before:", round(before, 3))
print("after: ", round(after, 3))
print("gain:  ", round(gain, 3))`,
    validationLogic: [
      {
        id: 'pure',
        label: 'A pile that is all one thing scores zero.',
        expression: 'abs(gini([1, 1, 1])) < 1e-9',
        hint: 'Subtract share * share from score inside the loop, instead of pass.',
      },
      {
        id: 'even',
        label: 'An even two-way split scores 0.5.',
        expression: 'abs(gini([0, 1]) - 0.5) < 1e-9',
        hint: 'With two equal shares of 0.5, the score is 1 - 0.25 - 0.25.',
      },
      {
        id: 'gain',
        label: 'The wings question makes both halves perfectly tidy.',
        expression: 'abs(after) < 1e-9 and gain > 0.4',
        hint: 'Weight each half by its size: (len(left)/len(pile)) * gini(left) + the same for right.',
      },
    ],
  },
  assessmentGame: {
    kind: 'order',
    question: 'Put the growth of one node back into the order it happens.',
    successMessage: 'THE TREE STANDS',
    steps: [
      { id: 'd1', label: 'Measure how messy the current pile is', position: 0 },
      { id: 'd2', label: 'Try every question you could ask about it', position: 1 },
      { id: 'd3', label: 'Score each one by how much it tidies the two halves', position: 2 },
      { id: 'd4', label: 'Keep the best question and split on it', position: 3 },
      { id: 'd5', label: 'Stop if the pile is now too small to split again', position: 4 },
    ],
  },
};

export const ensembles: Lesson = {
  slug: 'ensembles',
  title: 'Bagging, boosting, and forests',
  hook: 'One mediocre guesser is a problem. Five hundred is a method.',
  minutes: 11,
  interactive: true,
  requires: ['decision-trees'],
  narrativeText: `Ask one person to guess the number of sweets in a jar and they
will be wrong. Ask five hundred people and average the answers, and the average
lands startlingly close.

Nobody in the crowd was an expert. The trick is that their errors point in
different directions, so averaging cancels them out.

## Why the errors have to differ

That only works if the guesses are independent. Five hundred people who all
used the same flawed method give you five hundred copies of the same mistake,
and averaging changes nothing.

> A crowd helps only when its members are wrong in different ways.

So you deliberately make each tree different. Give each one a random sample of
the data, and let each split consider only a random handful of the available
questions. Every tree ends up mediocre and idiosyncratic — which is exactly
what you want. That is a random forest.

## The other way: learn from the last mistake

Bagging grows all the trees in parallel and lets them vote. Boosting is the
opposite temperament. Grow one tree, see what it got wrong, and grow the next
tree focused on precisely those cases. Each one patches its predecessor's
failures.

Boosting usually squeezes out more accuracy. It is also easier to push too far —
keep patching and eventually you are fitting the noise.`,
  scene: 'ensemble-vote',
  sceneCaption: 'Twelve trees, none of them clever. Watch the tally settle.',
  sceneBeats: [
    {
      at: 0,
      text: 'Twelve trees, each trained on a different random slice of the data. None is an expert.',
    },
    {
      at: 0.28,
      text: 'The first few disagree. On their own, any one of them is a coin toss you would not trust.',
    },
    {
      at: 0.6,
      text: 'As more vote, the wrong answers cancel each other out — because each tree is wrong in its own way.',
    },
    {
      at: 0.88,
      text: 'The majority settles on the right answer. No individual got smarter; the crowd just stopped being noisy.',
    },
  ],
  mentalModel: {
    premise: 'A crowd guessing sweets in a jar.',
    analogy: `The crowd beats the individual only because people overshoot and
undershoot roughly equally. If everyone in the room had been given the same
misleading hint, the average would be confidently wrong. Randomising what each
tree sees is how you keep the crowd's mistakes uncorrelated — it is the whole
reason the trick works.`,
    keywords: ['bagging', 'boosting', 'variance', 'random subset', 'majority vote', 'weak learner'],
    canvasCaption: 'BUILD A CROWD WORTH LISTENING TO',
    pieces: [
      {
        id: 'weak',
        glyph: '🌱',
        label: 'One weak tree',
        origin: { x: 0.06, y: 0.12 },
        target: { x: 0.22, y: 0.3, radius: 0.13, hint: 'Mediocre alone, and that is fine.' },
      },
      {
        id: 'random',
        glyph: '🎲',
        label: 'Different data each',
        origin: { x: 0.06, y: 0.48 },
        target: { x: 0.5, y: 0.3, radius: 0.13, hint: 'This is what keeps their errors from lining up.' },
      },
      {
        id: 'vote',
        glyph: '🗳️',
        label: 'Take the vote',
        origin: { x: 0.06, y: 0.82 },
        target: { x: 0.78, y: 0.3, radius: 0.13, hint: 'Errors cancel; the signal survives.' },
      },
      {
        id: 'trap',
        glyph: '⚠️',
        label: 'Identical mistakes',
        origin: { x: 0.45, y: 0.88 },
        target: { x: 0.5, y: 0.75, radius: 0.14, hint: 'The failure mode — a crowd that all thinks alike is one guesser.' },
      },
    ],
  },
  codeGround: {
    scenario: `Nine weak models have each guessed a label for the same example.
Take a majority vote, then work out how often the crowd beats its own average
member. Store the vote in \`verdict\` and the crowd's accuracy in \`crowd_score\`.`,
    dataPreview: `votes = [[1,1,0,1,1,0,1,0,1],   # example 1, truth 1
         [0,0,1,0,0,0,1,0,0],   # example 2, truth 0
         [1,0,1,1,0,1,1,1,0]]   # example 3, truth 1
truth = [1, 0, 1]`,
    setupCode: `votes = [[1,1,0,1,1,0,1,0,1],
         [0,0,1,0,0,0,1,0,0],
         [1,0,1,1,0,1,1,1,0]]
truth = [1, 0, 1]`,
    starterCode: `# votes and truth are ready.

def majority(row):
    # Return 1 if more than half the row voted 1, else 0.
    return 0  # replace this

verdict = [majority(row) for row in votes]

# How often does the crowd get it right?
crowd_score = 0.0  # replace this

print("verdict:", verdict)
print("crowd accuracy:", crowd_score)`,
    solutionCode: `def majority(row):
    return 1 if sum(row) > len(row) / 2 else 0

verdict = [majority(row) for row in votes]

correct = sum(1 for v, t in zip(verdict, truth) if v == t)
crowd_score = correct / len(truth)

print("verdict:", verdict)
print("crowd accuracy:", crowd_score)`,
    validationLogic: [
      {
        id: 'majority',
        label: 'The majority rule works on a simple case.',
        expression: 'majority([1, 1, 0]) == 1 and majority([0, 0, 1]) == 0',
        hint: 'Compare sum(row) against len(row) / 2 — more than half means 1.',
      },
      {
        id: 'verdict',
        label: 'The crowd agreed with the truth on all three examples.',
        expression: 'verdict == truth',
        hint: 'Each row should come out as the label most of its voters chose.',
      },
      {
        id: 'score',
        label: 'You measured the crowd against the truth.',
        expression: 'abs(crowd_score - 1.0) < 1e-9',
        hint: 'Count the matches between verdict and truth, then divide by how many examples there are.',
      },
    ],
  },
  assessmentGame: {
    kind: 'match',
    question: 'Match each idea to what it actually does for you.',
    successMessage: 'THE CROWD SPEAKS',
    pairs: [
      {
        id: 'e1',
        term: 'Bagging',
        definition: 'Grows many trees side by side and lets them vote',
      },
      {
        id: 'e2',
        term: 'Boosting',
        definition: 'Grows each tree to fix what the last one got wrong',
      },
      {
        id: 'e3',
        term: 'Random feature subsets',
        definition: 'Stops every tree from asking the same question first',
      },
      {
        id: 'e4',
        term: 'Correlated errors',
        definition: 'The thing that makes a crowd no better than one guesser',
      },
    ],
  },
};

export const clustering: Lesson = {
  slug: 'clustering',
  title: 'k-means and the elbow',
  hook: 'Nobody labelled anything. Find the groups anyway.',
  minutes: 10,
  interactive: true,
  requires: ['ensembles'],
  narrativeText: `Every lesson so far handed you the answers. Here are the flats
and here is what they sold for; here are the emails and here is which were spam.

Now nobody tells you anything. You have ten thousand customers and no labels.
Are there natural types of customer in there?

## Flags in a field

Picture your customers scattered across a field. You walk in and plant three
flags at random. Every person joins whichever flag is nearest.

Then you look at each group and move its flag to the middle of its own crowd.
Which changes who is nearest — some people switch groups. So you move the flags
again. And again.

> Assign everyone to the nearest flag; move each flag to the middle of its
> crowd. Repeat until nobody switches.

It settles surprisingly fast. And where the flags land depends on where you
threw them, which is why you run it several times and keep the tidiest result.

## How many flags?

You have to say how many groups you want before you start, which feels like
being asked the answer in advance.

The dodge is to try several. Two flags, three, four, and each time measure how
far people sit from their flag. That distance always falls as you add flags — at
ten thousand flags everyone is standing on one. What you look for is the bend,
the point after which adding another flag stops buying you much.`,
  scene: 'kmeans',
  sceneCaption: 'Squares are flags, dots are customers. Watch nobody switch.',
  sceneBeats: [
    {
      at: 0,
      text: 'Three flags land in the middle of the field, in no particular place. Everyone joins whichever is nearest.',
    },
    {
      at: 0.3,
      text: 'Each flag walks to the middle of its own crowd — and that changes who is nearest to what.',
    },
    {
      at: 0.62,
      text: 'People switch groups as the flags move past them. The lines show who currently belongs to whom.',
    },
    {
      at: 0.88,
      text: 'Nobody switches any more. The flags have found the three crowds that were always there.',
    },
  ],
  mentalModel: {
    premise: 'Planting flags in a field of people.',
    analogy: `Nothing here knows what the groups mean. The algorithm has no idea
that one cluster is students and another is retirees — it only knows who is
standing near whom. That is worth holding onto: k-means finds structure, and
naming that structure is your job, not its.`,
    keywords: ['centroid', 'unlabelled', 'nearest', 'converge', 'elbow', 'k'],
    canvasCaption: 'PUT ONE ROUND IN ORDER',
    pieces: [
      {
        id: 'flags',
        glyph: '🚩',
        label: 'Drop the flags',
        origin: { x: 0.06, y: 0.12 },
        target: { x: 0.22, y: 0.28, radius: 0.13, hint: 'Anywhere at all, to begin with.' },
      },
      {
        id: 'join',
        glyph: '🧍',
        label: 'Join the nearest',
        origin: { x: 0.06, y: 0.5 },
        target: { x: 0.52, y: 0.28, radius: 0.13, hint: 'Everyone picks a flag.' },
      },
      {
        id: 'move',
        glyph: '➡️',
        label: 'Move to the middle',
        origin: { x: 0.06, y: 0.84 },
        target: { x: 0.82, y: 0.28, radius: 0.13, hint: 'Each flag walks to the centre of its crowd.' },
      },
      {
        id: 'settle',
        glyph: '🔁',
        label: 'Until nobody moves',
        origin: { x: 0.45, y: 0.88 },
        target: { x: 0.52, y: 0.74, radius: 0.14, hint: 'That is convergence — the loop closing.' },
      },
    ],
  },
  codeGround: {
    scenario: `Run one round of k-means on a line. Assign each point to its
nearest flag, then move each flag to the average of the points that chose it.
Store the assignments in \`groups\` and the new flag positions in \`moved\`.`,
    dataPreview: `points = [1, 2, 3, 10, 11, 12, 20, 21, 22]
flags  = [0.0, 8.0, 18.0]`,
    setupCode: `points = [1, 2, 3, 10, 11, 12, 20, 21, 22]
flags = [0.0, 8.0, 18.0]`,
    starterCode: `# points and flags are ready.

# 1. Which flag is each point nearest to? Store the flag's index.
groups = []
for p in points:
    pass  # replace this

# 2. Move each flag to the average of its own points.
moved = []
for i in range(len(flags)):
    mine = [p for p, g in zip(points, groups) if g == i]
    pass  # replace this: append the average of mine, or the old flag if empty

print("groups:", groups)
print("moved: ", [round(m, 2) for m in moved])`,
    solutionCode: `groups = []
for p in points:
    distances = [abs(p - f) for f in flags]
    groups.append(distances.index(min(distances)))

moved = []
for i in range(len(flags)):
    mine = [p for p, g in zip(points, groups) if g == i]
    moved.append(sum(mine) / len(mine) if mine else flags[i])

print("groups:", groups)
print("moved: ", [round(m, 2) for m in moved])`,
    validationLogic: [
      {
        id: 'groups',
        label: 'Every point picked a flag.',
        expression: 'len(groups) == len(points) and all(0 <= g < 3 for g in groups)',
        hint: 'For each point, build a list of distances to the flags and take the index of the smallest.',
      },
      {
        id: 'nearest',
        label: 'Each point really did pick its nearest flag.',
        expression: 'groups == [min(range(3), key=lambda i: abs(p - flags[i])) for p in points]',
        hint: 'abs(p - f) is the distance on a line. The smallest one wins.',
      },
      {
        id: 'moved',
        label: 'Each flag moved to the middle of its crowd.',
        expression: 'len(moved) == 3 and abs(moved[0] - 2.0) < 1e-6',
        hint: 'Average the points that chose flag i. If none did, leave that flag where it was.',
      },
    ],
  },
  assessmentGame: {
    kind: 'predict',
    question:
      'You run k-means twice on the same customers and get two different groupings. Nothing about the data changed. What happened?',
    successMessage: 'THE GROUPS EMERGE',
    options: [
      {
        id: 'a',
        label: 'The flags started in different random places, and the algorithm settled somewhere else.',
        correct: true,
        feedback:
          'Exactly — the result depends on where you threw the flags. Run it several times and keep the tidiest.',
      },
      {
        id: 'b',
        label: 'k-means is broken and should give the same answer every time.',
        correct: false,
        feedback:
          'It is working as designed. It finds a good arrangement, not a guaranteed best one.',
      },
      {
        id: 'c',
        label: 'The number of groups changed between runs.',
        correct: false,
        feedback:
          'You fix the number of groups before starting, so it was the same both times. The starting positions were not.',
      },
    ],
  },
};

export const pca: Lesson = {
  slug: 'pca',
  title: 'Compressing features with PCA',
  hook: 'Two numbers that always move together are nearly one number.',
  minutes: 10,
  interactive: true,
  requires: ['clustering'],
  narrativeText: `You are given people's heights and weights. Two numbers each.
Plot them and the cloud leans — taller people are generally heavier.

Because they lean together, the second number is partly redundant. Tell me
someone's height and I can already make a decent stab at their weight.

## Finding the direction that matters

Look at the cloud and find the direction it stretches most. That is where the
real variation lives. Squash everyone onto that line and you are down to one
number per person, with surprisingly little lost.

> Keep the direction things vary in. Throw away the directions where everybody
> looks the same.

The line you keep is usually not height, and not weight. It is a blend of both —
something like overall size. It has no name in the dataset, which is the
uncomfortable part of this method: you gain compactness and lose the ability to
say what any column means.

## Why bother

With two columns this is a curiosity. With two thousand — every pixel in an
image, every word in a vocabulary — most directions carry almost nothing, and
dropping them makes everything downstream faster and less prone to memorising
noise.

The cost is real, though. After compression, "column 1" is no longer height. It
is a mixture, and no domain expert can tell you what it means.`,
  scene: 'pca-projection',
  sceneCaption: 'Two numbers per person, collapsing onto the one that matters.',
  sceneBeats: [
    {
      at: 0,
      text: 'Height across, weight up. Every dot is a person, and the cloud leans — the two move together.',
    },
    {
      at: 0.32,
      text: 'Here is the direction the cloud stretches most. This is where the real variation lives.',
    },
    {
      at: 0.6,
      text: 'Everyone slides onto that line. The short grey lines show exactly what is being thrown away.',
    },
    {
      at: 0.88,
      text: 'One number per person now instead of two, and the ordering barely changed. That is the trade.',
    },
  ],
  mentalModel: {
    premise: 'The shadow of a shape, cast from the best angle.',
    analogy: `Hold an object up to a light and its shadow loses a dimension. Turn
it badly and the shadow is a meaningless blob; turn it well and you can still
recognise the thing. PCA is the search for the angle that keeps the shadow
recognisable — and the shadow is genuinely less than the object, which is the
point and the price at once.`,
    keywords: ['variance', 'projection', 'component', 'redundancy', 'dimension', 'blend'],
    canvasCaption: 'ORDER THE SQUASH',
    pieces: [
      {
        id: 'cloud',
        glyph: '☁️',
        label: 'Leaning cloud',
        origin: { x: 0.06, y: 0.12 },
        target: { x: 0.22, y: 0.28, radius: 0.13, hint: 'Two numbers that move together.' },
      },
      {
        id: 'dir',
        glyph: '↗️',
        label: 'Direction of spread',
        origin: { x: 0.06, y: 0.5 },
        target: { x: 0.52, y: 0.28, radius: 0.13, hint: 'Where the variation actually is.' },
      },
      {
        id: 'squash',
        glyph: '⬇️',
        label: 'Squash onto it',
        origin: { x: 0.06, y: 0.84 },
        target: { x: 0.82, y: 0.28, radius: 0.13, hint: 'One number per person.' },
      },
      {
        id: 'cost',
        glyph: '🏷️',
        label: 'Lost the labels',
        origin: { x: 0.45, y: 0.88 },
        target: { x: 0.52, y: 0.74, radius: 0.14, hint: 'The new column is a blend, and nobody can name it.' },
      },
    ],
  },
  codeGround: {
    scenario: `Before you can find the direction of most spread, the cloud has to
be centred on zero. Centre both columns, then measure how much each one varies.
Store the centred pairs in \`centred\` and the two variances in \`spread\`.`,
    dataPreview: `people = [(160, 55), (165, 60), (170, 63), (175, 70),
          (180, 74), (185, 80), (190, 86)]
# (height in cm, weight in kg)`,
    setupCode: `people = [(160, 55), (165, 60), (170, 63), (175, 70),
          (180, 74), (185, 80), (190, 86)]`,
    starterCode: `# people is ready.

heights = [p[0] for p in people]
weights = [p[1] for p in people]

# 1. Average of each column.
mean_h = 0.0  # replace this
mean_w = 0.0  # replace this

# 2. Subtract the average so the cloud sits around zero.
centred = []
for h, w in people:
    pass  # replace this: append (h - mean_h, w - mean_w)

# 3. Average squared distance from zero, per column.
spread = [0.0, 0.0]  # replace this

print("means: ", round(mean_h, 2), round(mean_w, 2))
print("spread:", [round(s, 2) for s in spread])`,
    solutionCode: `heights = [p[0] for p in people]
weights = [p[1] for p in people]

mean_h = sum(heights) / len(heights)
mean_w = sum(weights) / len(weights)

centred = []
for h, w in people:
    centred.append((h - mean_h, w - mean_w))

spread = [
    sum(c[0] ** 2 for c in centred) / len(centred),
    sum(c[1] ** 2 for c in centred) / len(centred),
]

print("means: ", round(mean_h, 2), round(mean_w, 2))
print("spread:", [round(s, 2) for s in spread])
print("neither column is redundant on its own — but they move together")`,
    validationLogic: [
      {
        id: 'means',
        label: 'Both column averages are right.',
        expression:
          'abs(mean_h - sum(heights)/len(heights)) < 1e-9 and abs(mean_w - sum(weights)/len(weights)) < 1e-9',
        hint: 'Average a list with sum(list) / len(list).',
      },
      {
        id: 'centred',
        label: 'The centred cloud sits around zero.',
        expression: 'len(centred) == 7 and abs(sum(c[0] for c in centred)) < 1e-9',
        hint: 'Append the tuple (h - mean_h, w - mean_w) for each person.',
      },
      {
        id: 'spread',
        label: 'Both columns vary by a comparable amount.',
        expression:
          'len(spread) == 2 and min(spread) > 0 and abs(spread[0] - spread[1]) < 20',
        hint: 'For each column, average the squared centred values.',
      },
    ],
  },
  assessmentGame: {
    kind: 'predict',
    question:
      'You compress 50 columns down to 3 and your model gets faster with almost no drop in accuracy. Your manager asks which factors drive the prediction. What do you tell her?',
    successMessage: 'DIMENSIONS FOLDED',
    options: [
      {
        id: 'a',
        label: 'That the 3 new columns are blends of all 50, so they cannot be named as original factors.',
        correct: true,
        feedback:
          'Right, and this is the real cost of PCA. You traded interpretability for compactness.',
      },
      {
        id: 'b',
        label: 'That the 3 columns are the 3 most important original factors.',
        correct: false,
        feedback:
          'PCA does not select columns, it mixes them. None of the three corresponds to a single original factor.',
      },
      {
        id: 'c',
        label: 'That the other 47 columns were meaningless.',
        correct: false,
        feedback:
          'They contributed — their variation was small or duplicated, which is not the same as meaningless.',
      },
    ],
  },
};

export const modelEvaluation: Lesson = {
  slug: 'model-evaluation',
  title: 'Cross-validation and honest scores',
  hook: 'Marking your own homework, and why the grade is a lie.',
  minutes: 11,
  interactive: true,
  requires: ['pca'],
  narrativeText: `A student is given the exam paper a week early, sits it, and
scores 98%. Nobody would call that a measurement of anything.

Score your model on the data it trained on and you have done exactly this.

## Hold something back

Before you start, put some data in a drawer. Train on the rest. When you are
done, open the drawer and score against data the model has never seen.

> The only score worth reporting is one from data the model has never touched.

That number will be lower than the one you saw during training. It is also the
only one that predicts what happens next week.

## When the drawer is too small

With a few hundred examples, whichever 20% you locked away might just happen to
be the easy ones. Your honest score is now honestly unlucky.

So rotate. Split into five blocks. Hold back the first and train on the other
four; then hold back the second; and so on, five times. Every example gets a
turn being unseen, and you report the average.

## Accuracy is not the whole story

One more trap. If one in a thousand transactions is fraud, a model that says
"not fraud" every single time scores 99.9%. It is useless and its accuracy is
excellent.

So ask two sharper questions instead. Of everything you flagged, how much really
was fraud? And of all the real fraud, how much did you catch? Those two pull
against each other, and which one you favour depends on what a mistake costs.`,
  scene: 'holdout-folds',
  sceneCaption: 'One block in the drawer, then every block gets its turn.',
  sceneBeats: [
    {
      at: 0,
      text: 'Split the data into five blocks before you train on anything.',
    },
    {
      at: 0.24,
      text: 'Lock one block in the drawer. Train on the other four and score against the block you kept back.',
    },
    {
      at: 0.5,
      text: 'A small drawer might just hold the easy examples, so rotate: a different block is held back each round.',
    },
    {
      at: 0.78,
      text: 'Every example gets one turn being unseen. Five rounds, five scores.',
    },
    {
      at: 0.93,
      text: 'The number you report is the average — a score no single lucky split can flatter.',
    },
  ],
  mentalModel: {
    premise: 'A sealed exam paper, opened once.',
    analogy: `The drawer only works if it stays shut. Peek at the held-out data
to pick your settings, put it back, and peek again — and it has quietly become
training data. Everything you learned from it is baked into your choices, and
the final score is flattering you again. This is the most common way careful
people fool themselves.`,
    keywords: ['holdout', 'fold', 'leakage', 'precision', 'recall', 'baseline'],
    canvasCaption: 'ORDER AN HONEST EVALUATION',
    pieces: [
      {
        id: 'split',
        glyph: '✂️',
        label: 'Split first',
        origin: { x: 0.06, y: 0.12 },
        target: { x: 0.22, y: 0.28, radius: 0.13, hint: 'Before anything else, and only once.' },
      },
      {
        id: 'train',
        glyph: '🏋️',
        label: 'Train on the rest',
        origin: { x: 0.06, y: 0.5 },
        target: { x: 0.52, y: 0.28, radius: 0.13, hint: 'The drawer stays shut throughout.' },
      },
      {
        id: 'score',
        glyph: '📋',
        label: 'Open the drawer',
        origin: { x: 0.06, y: 0.84 },
        target: { x: 0.82, y: 0.28, radius: 0.13, hint: 'Once, at the end.' },
      },
      {
        id: 'leak',
        glyph: '🕳️',
        label: 'Peeking early',
        origin: { x: 0.45, y: 0.88 },
        target: { x: 0.52, y: 0.74, radius: 0.14, hint: 'Leakage — and the reason a good score can still be a lie.' },
      },
    ],
  },
  codeGround: {
    scenario: `A fraud detector flagged some transactions. Work out what fraction
of the flags were real fraud, and what fraction of the real fraud you caught.
Store them in \`precision\` and \`recall\`, then compare against a model that
never flags anything and store its accuracy in \`lazy_accuracy\`.`,
    dataPreview: `flagged = [1,0,0,1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0]
truth   = [1,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1]
# 1 means fraud. Four real frauds among twenty transactions.`,
    setupCode: `flagged = [1,0,0,1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0]
truth   = [1,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1]`,
    starterCode: `# flagged and truth are ready.

hits = sum(1 for f, t in zip(flagged, truth) if f == 1 and t == 1)

# Of everything you flagged, how much was really fraud?
precision = 0.0  # replace this

# Of all the real fraud, how much did you catch?
recall = 0.0  # replace this

# A model that never flags anything still scores well on accuracy.
lazy_accuracy = 0.0  # replace this

print("precision:", round(precision, 3))
print("recall:   ", round(recall, 3))
print("do-nothing accuracy:", round(lazy_accuracy, 3))`,
    solutionCode: `hits = sum(1 for f, t in zip(flagged, truth) if f == 1 and t == 1)

precision = hits / sum(flagged)
recall = hits / sum(truth)

lazy_accuracy = sum(1 for t in truth if t == 0) / len(truth)

print("precision:", round(precision, 3))
print("recall:   ", round(recall, 3))
print("do-nothing accuracy:", round(lazy_accuracy, 3))`,
    validationLogic: [
      {
        id: 'precision',
        label: 'Three of your four flags were real fraud.',
        expression: 'abs(precision - 0.75) < 1e-6',
        hint: 'Divide the hits by how many you flagged in total: sum(flagged).',
      },
      {
        id: 'recall',
        label: 'You caught three of the four real frauds.',
        expression: 'abs(recall - 0.75) < 1e-6',
        hint: 'Divide the hits by how much real fraud there was: sum(truth).',
      },
      {
        id: 'lazy',
        label: 'A model that flags nothing still scores 80%.',
        expression: 'abs(lazy_accuracy - 0.8) < 1e-6',
        hint: 'It is right on every non-fraud case. Count the zeros in truth and divide by the total.',
      },
    ],
  },
  assessmentGame: {
    kind: 'order',
    question: 'Put an honest evaluation back into the order it must happen.',
    successMessage: 'THE SCORE IS HONEST',
    steps: [
      { id: 'v1', label: 'Split the data into blocks before touching it', position: 0 },
      { id: 'v2', label: 'Lock one block away and train on the rest', position: 1 },
      { id: 'v3', label: 'Score against the block you locked away', position: 2 },
      { id: 'v4', label: 'Rotate, so every block gets a turn being unseen', position: 3 },
      { id: 'v5', label: 'Report the average, next to a do-nothing baseline', position: 4 },
    ],
  },
};

export const remainingMlLessons: Lesson[] = [
  logisticRegression,
  decisionTrees,
  ensembles,
  clustering,
  pca,
  modelEvaluation,
];
