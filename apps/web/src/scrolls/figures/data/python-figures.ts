import type { ArrayTrackData } from '../ArrayTrack'
import type { DisambiguationData } from '../Disambiguation'
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

export const PYTHON_FIGURES: Record<string, FigureData> = {
  'comp-vs-filter-vs-gen': compVsFilterVsGen,
  'eafp-vs-lbyl': eafpVsLbyl,
}
