import type { ArrayTrackData } from '../ArrayTrack'
import type { BeforeAfterData } from '../BeforeAfter'
import type { DisambiguationData } from '../Disambiguation'
import type { TabbedCardData } from '../TabbedCard'
import type { FigureData } from './ruby-figures'

const compVsFilterVsGen: ArrayTrackData = {
  type: 'array-track',
  id: 'comp-vs-filter-vs-gen',
  input: [1, 2, 3, 4, 5],
  tracks: [
    {
      label: '[x*2 for x in xs]',
      states: ['done', 'done', 'done', 'done', 'done'],
      output: '[2, 4, 6, 8, 10]',
    },
    {
      label: '[x for x in xs if x>2]',
      states: ['out', 'out', 'done', 'done', 'done'],
      output: '[3, 4, 5]',
    },
    {
      label: '(x*2 for x in xs) → list()',
      states: ['done', 'done', 'done', 'done', 'done'],
      output: '[2, 4, 6, 8, 10] (lazy)',
    },
  ],
  caption:
    'Same input, three shapes. The list comprehension materialises each cell eagerly. The filter version drops cells the predicate rejects (✕). The generator expression produces the same logical output as the list, but lazily — list(...) is what materialises it, and only once.',
}

const eafpVsLbyl: DisambiguationData = {
  type: 'disambiguation',
  id: 'eafp-vs-lbyl',
  sharedSkeletonLabel: 'Read d[key] when the key may be missing · two reflexes',
  attributes: [
    'Shape on the page',
    'Intent',
    'Cultural reflex',
    'Race-safety',
    'Common-case cost',
    'Reads as',
  ],
  entries: [
    {
      title: 'LBYL (Look Before You Leap)',
      values: {
        'Shape on the page': 'if key in d: d[key] else: default',
        Intent: 'Prove the operation is safe, then perform it',
        'Cultural reflex': 'C, Java, Go — "check first"',
        'Race-safety': 'Unsafe — window between check and act',
        'Common-case cost': 'Check + operation (both run)',
        'Reads as': '"I do not trust this dict"',
      },
    },
    {
      title: 'EAFP (Easier to Ask Forgiveness than Permission)',
      values: {
        'Shape on the page': 'try: d[key] except KeyError: default',
        Intent: 'Perform the operation; recover if it fails',
        'Cultural reflex': 'Python — "try the work"',
        'Race-safety': 'Safe — no window',
        'Common-case cost': 'Operation only (~50ns when no raise)',
        'Reads as': '"I trust the dict; I handle the miss"',
      },
    },
  ],
  highlightAttribute: 'Intent',
  caption:
    'Same skeleton on the page, opposite intent. Every other difference — race-safety, common-case cost, what the reader infers — cascades from that one decision. The Pythonic reflex is the right column.',
}

const tryFinallyVsWith: BeforeAfterData = {
  type: 'before-after',
  id: 'try-finally-vs-with',
  language: 'python',
  left: {
    title: 'pre-with reflex',
    code: 'f = open(path)\ntry:\n    data = f.read()\n    process(data)\nfinally:\n    f.close()',
    annotations: [
      { line: 1, mark: '✕', text: 'acquired outside the block it lives in' },
      { line: 6, mark: '✕', text: 'easy to forget; no enforced cleanup' },
    ],
  },
  right: {
    title: 'Python idiom',
    code: 'with open(path) as f:\n    data = f.read()\n    process(data)',
    annotations: [
      { line: 1, mark: '✓', text: 'lifetime visually scoped to the block' },
      { line: 3, mark: '✓', text: '__exit__ runs even on exception' },
    ],
  },
  caption:
    'Same outcome (file read, then closed), opposite discipline. The Pythonic with-block scopes the resource lifetime to the block visually and structurally — there is no "did I remember to call close()?" question to forget.',
}

const decoratorsAndFriends: TabbedCardData = {
  type: 'tabbed-card',
  id: 'decorators-and-friends',
  tabs: [
    {
      label: '@property',
      body:
        'Takes a **method**, returns a **descriptor** that makes the method accessible as an attribute.\n\n' +
        '```python\nclass Box:\n    @property\n    def area(self):\n        return self.w * self.h\n\nBox(2, 3).area    # 6 — no parens\n```\n\n' +
        'Input: method. Output: attribute-like accessor.',
    },
    {
      label: '@dataclass',
      body:
        'Takes a **class**, returns a **transformed class** with `__init__` / `__repr__` / `__eq__` synthesised from the typed attributes.\n\n' +
        '```python\n@dataclass\nclass Point:\n    x: int\n    y: int\n\nPoint(1, 2) == Point(1, 2)    # True — __eq__ for free\n```\n\n' +
        'Input: class. Output: class with synthesised dunders.',
    },
    {
      label: '@cache',
      body:
        'Takes a **function**, returns a **wrapped function** that caches results keyed by the call args.\n\n' +
        '```python\nfrom functools import cache\n\n@cache\ndef fib(n):\n    return n if n < 2 else fib(n-1) + fib(n-2)\n\nfib(100)    # fast — cached subcalls\n```\n\n' +
        'Input: function. Output: memoised function.',
    },
    {
      label: '@contextmanager',
      body:
        'Takes a **generator function** (one that `yield`s exactly once), returns a **context manager** usable with `with`.\n\n' +
        '```python\n@contextmanager\ndef temp_state(d, k, v):\n    old = d.get(k)\n    d[k] = v\n    try:\n        yield\n    finally:\n        d[k] = old\n```\n\n' +
        'Input: generator function. Output: context manager.',
    },
  ],
  defaultTab: 0,
  caption:
    'Four decorators, same shape: a callable transforming another callable (or class) at definition time. The input and output kinds differ; the syntax sugar — @name — is identical. Once you see this, every @decorator in Python is one of these patterns or a small composition of them.',
}

export const PYTHON_FIGURES: Record<string, FigureData> = {
  'comp-vs-filter-vs-gen': compVsFilterVsGen,
  'eafp-vs-lbyl': eafpVsLbyl,
  'try-finally-vs-with': tryFinallyVsWith,
  'decorators-and-friends': decoratorsAndFriends,
}
