import type { BeforeAfterData } from '../BeforeAfter'
import type { DisambiguationData } from '../Disambiguation'
import type { FigureData } from './ruby-figures'

const annotationMaximalism: BeforeAfterData = {
  type: 'before-after',
  id: 'ts-annotation-maximalism',
  language: 'typescript',
  left: {
    title: 'Annotation-maximalism — every local annotated',
    code: [
      'function totalPrice(prices: number[]): number {',
      '  const count: number = prices.length;',
      '  const subtotal: number = prices.reduce(',
      '    (sum: number, p: number): number => sum + p,',
      '    0',
      '  );',
      '  const taxed: number = subtotal * 1.08;',
      '  return taxed;',
      '}',
    ].join('\n'),
    annotations: [
      { line: 2, mark: '✕', text: 'prices.length is already number — the annotation restates the obvious' },
      { line: 4, mark: '✕', text: 'reduce already infers sum and p from prices and the initial value' },
      { line: 7, mark: '✕', text: 'subtotal * 1.08 is already number — noise, not safety' },
    ],
  },
  right: {
    title: 'Inference-led — annotate the signature, infer the rest',
    code: [
      'function totalPrice(prices: number[]): number {',
      '  const count = prices.length;',
      '  const subtotal = prices.reduce((sum, p) => sum + p, 0);',
      '  const taxed = subtotal * 1.08;',
      '  return taxed;',
      '}',
    ].join('\n'),
    annotations: [
      { line: 1, mark: '✓', text: 'the signature is the contract — parameters and return type, annotated once' },
      { line: 3, mark: '✓', text: 'sum, p, and subtotal are all inferred as number — zero annotations, fully checked' },
    ],
  },
  caption:
    'Both functions type-check identically. The left pane annotates every local — none of it adds safety the checker did not already provide; it adds noise that drifts out of sync the day the body changes. The right pane annotates only the signature (the boundary the compiler cannot read intent from) and lets inference carry the locals. The contract is the line worth writing by hand; the rest, the compiler already knows.',
}

const unionVsEnum: DisambiguationData = {
  type: 'disambiguation',
  id: 'ts-union-vs-enum',
  sharedSkeletonLabel: 'A fixed set of named string values',
  attributes: ['source', 'runtime footprint', 'typo safety', 'interop / reverse mapping'],
  entries: [
    {
      title: 'Literal union',
      values: {
        source: 'type Status = "idle" | "loading" | "ready";',
        'runtime footprint':
          '// emitted JavaScript (real tsc 5.0.3, smoked 2026-06-12):\n// (empty — the type erased; zero bytes ship)',
        'typo safety': 'A wrong value is a compile error: "laoding" does not satisfy the union.',
        'interop / reverse mapping':
          'No reverse map; you carry the string values directly — usually what you want.',
      },
    },
    {
      title: 'enum',
      values: {
        source: 'enum Status { Idle = "idle", Loading = "loading", Ready = "ready" }',
        'runtime footprint':
          '// emitted JavaScript (real tsc 5.0.3, smoked 2026-06-12):\n' +
          'var Status;\n' +
          '(function (Status) {\n' +
          '    Status["Idle"] = "idle";\n' +
          '    Status["Loading"] = "loading";\n' +
          '    Status["Ready"] = "ready";\n' +
          '})(Status || (Status = {}));',
        'typo safety': 'Also a compile error on a wrong member — same protection as the union.',
        'interop / reverse mapping':
          'Ships a runtime object; numeric enums also build a reverse map. The reason to reach for it is interop, not defaults.',
      },
    },
  ],
  highlightAttribute: 'runtime footprint',
  caption:
    'Same set of named values, one divergent attribute: the union erases to nothing, the enum emits a runtime object into your bundle. typo-safety is a tie. Default to the union; reach for enum only when interop forces it.',
}

const unknownVsAny: DisambiguationData = {
  type: 'disambiguation',
  id: 'ts-unknown-vs-any',
  sharedSkeletonLabel: 'A value from outside the program, and an attempted property access on it',
  attributes: [
    'What the compiler lets you do before narrowing',
    'Accepts on the way in',
    'Where it is the right type',
  ],
  entries: [
    {
      title: 'any',
      values: {
        'What the compiler lets you do before narrowing':
          'Everything, silently — every access compiles and stays `any`, so a wrong one surfaces at runtime',
        'Accepts on the way in': 'Any value',
        'Where it is the right type': 'A deliberate escape hatch with a TODO — never a resting state',
      },
    },
    {
      title: 'unknown',
      values: {
        'What the compiler lets you do before narrowing':
          'Nothing, loudly — every access is a compile error until a guard proves the shape',
        'Accepts on the way in': 'Any value',
        'Where it is the right type': 'The boundary: JSON.parse, catch (e), any payload from outside',
      },
    },
  ],
  highlightAttribute: 'What the compiler lets you do before narrowing',
  caption:
    'Both accept anything coming in; they diverge on exactly one thing — what you may do with the value before you have proven its shape. any says everything and says nothing; unknown says nothing until you prove something.',
}

export const TYPESCRIPT_FIGURES: Record<string, FigureData> = {
  'ts-annotation-maximalism': annotationMaximalism,
  'ts-union-vs-enum': unionVsEnum,
  'ts-unknown-vs-any': unknownVsAny,
}
