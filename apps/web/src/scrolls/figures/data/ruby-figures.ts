import type { ArrayTrackData } from '../ArrayTrack'
import type { BeforeAfterData } from '../BeforeAfter'
import type { DisambiguationData } from '../Disambiguation'
import type { TabbedCardData } from '../TabbedCard'
import type { TwoByTwoData } from '../TwoByTwo'

export type FigureData =
  | ArrayTrackData
  | BeforeAfterData
  | DisambiguationData
  | TabbedCardData
  | TwoByTwoData

const npmVsBundle: BeforeAfterData = {
  type: 'before-after',
  id: 'npm-vs-bundle',
  language: 'shell',
  left: {
    title: 'JS reflex',
    code: 'npm install\nnode bin/app.js',
    annotations: [
      { line: 1, mark: '✓' },
      { line: 2, mark: '✕', text: 'uses global node + global packages' },
    ],
  },
  right: {
    title: 'Ruby idiom',
    code: 'bundle install\nbundle exec ruby bin/app.rb',
    annotations: [
      { line: 1, mark: '✓' },
      { line: 2, mark: '✓', text: 'project-pinned gems + ruby' },
    ],
  },
  caption:
    'Same shape (install, then run), different shell discipline. The bundle exec prefix is the per-command isolation that replaces venv activate — same outcome, different mental model.',
}

const foreachVsEachBlock: BeforeAfterData = {
  type: 'before-after',
  id: 'foreach-vs-each-block',
  language: 'mixed',
  left: {
    title: 'JS reflex',
    code: '[1, 2, 3].forEach(function (x) {\n  console.log(x);\n});',
    annotations: [
      { line: 1, mark: '✕', text: 'callback wrapped in a function expression' },
      { line: 3, mark: '✕', text: 'stranded `});` to close the call' },
    ],
  },
  right: {
    title: 'Ruby idiom',
    code: '[1, 2, 3].each { |x| puts x }',
    annotations: [
      { line: 1, mark: '✓', text: 'block is part of the call shape' },
    ],
  },
  caption:
    'Same iteration. Blocks make the per-item code feel like an argument to each, not a separate function expression that happens to be passed in.',
}

const stringVsSymbol: DisambiguationData = {
  type: 'disambiguation',
  id: 'string-vs-symbol',
  sharedSkeletonLabel: 'String vs Symbol · both are scalar literals',
  attributes: ['Syntax', 'Mutable', 'Identity', 'Typical use', 'Hash key cost'],
  entries: [
    {
      title: 'String',
      values: {
        Syntax: '"hello"',
        Mutable: 'true',
        Identity: 'new object per literal',
        'Typical use': 'data the program manipulates',
        'Hash key cost': 'allocated each lookup',
      },
    },
    {
      title: 'Symbol',
      values: {
        Syntax: ':hello',
        Mutable: 'false',
        Identity: 'one object per symbol, forever',
        'Typical use': 'identifier the program references',
        'Hash key cost': 'reused, faster lookup',
      },
    },
  ],
  highlightAttribute: 'Identity',
  caption:
    'Same look at a glance, opposite roles. Symbol identity is why :foo is a hash key and "foo" is data — every other difference cascades from this single dimension.',
}

const operatorsAsMessages: TwoByTwoData = {
  type: 'two-by-two',
  id: 'operators-as-messages',
  rowAxis: {
    label: 'How the reader thinks operators work',
    values: ['as syntax (parser-level)', 'as messages (method calls)'],
  },
  colAxis: {
    label: 'Language',
    values: ['JS / Python (prior reflex)', 'Ruby'],
  },
  cells: [
    [
      {
        eyebrow: 'correct for these',
        title: 'JS/Python · as syntax',
        body: '`5 + 2` is parser-level addition; you cannot override + for Number.',
      },
      {
        eyebrow: 'the trap',
        title: 'Ruby · as syntax',
        body: '`5 + 2` looks like syntax. That is the polyglot trap.',
      },
    ],
    [
      {
        eyebrow: 'opt-in via __add__',
        title: 'JS/Python · as messages',
        body: 'Overloading exists (`__add__`, `valueOf`) but is opt-in, not the default model.',
      },
      {
        eyebrow: 'the mental model',
        title: 'Ruby · as messages',
        body: '`5.+(2)` is the real call shape. `+` is a method on Integer; `5 + 2` is sugar for it.',
      },
    ],
  ],
  highlightCell: [1, 1],
  caption:
    'The trap is assuming Ruby works like JS or Python. The fix is one diagonal move on this grid — from "as syntax in JS/Python" to "as messages in Ruby".',
}

export const RUBY_FIGURES: Record<string, FigureData> = {
  'npm-vs-bundle': npmVsBundle,
  'foreach-vs-each-block': foreachVsEachBlock,
  'string-vs-symbol': stringVsSymbol,
  'operators-as-messages': operatorsAsMessages,
}
