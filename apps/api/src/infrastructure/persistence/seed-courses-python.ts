// =============================================================================
// Python for the Practiced — course seed (PRD 025 Option A skeleton)
//
// L1: Modern Python Idioms. Targeted at devs who wrote Python five years ago
// and want to see what changed — no hello-world, no if __name__ walkthrough.
//
// Status: draft. Ships with 1 read + 1 exercise (dataclass) in this sprint;
// `match` + `Enum` exercises land in S021. Flipping to `published` is a
// one-line change to the seed once the remaining L1 content is authored.
//
// Test harness:
//   _t(name, fn) records (name, passed, message). Tests use the `eq` helper
//   for equality assertions — Python `assert` can't appear in a lambda
//   (statement vs expression), so helpers are unavoidable. Footer emits the
//   `__DOJO_RESULT__` line Piston output harness accumulators look for.
// =============================================================================

import { createHash } from 'node:crypto'

function seedUuid(name: string): string {
  const hash = createHash('sha256').update(`dojo-course-${name}`).digest('hex')
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    '8' + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-')
}

const COURSE_ID = seedUuid('python-practiced')
const LESSON_1_ID = seedUuid('py-lesson-1-idioms')

const STEP_1_1_ID = seedUuid('py-step-1-1-intro')
const STEP_1_2_ID = seedUuid('py-step-1-2-dataclass')

const PY_HARNESS_HEADER = `# ── dojo harness ──────────────────────────────────
_tests = []

def _t(name, fn):
    try:
        fn()
        _tests.append({'name': name, 'passed': True})
    except Exception as e:
        _tests.append({'name': name, 'passed': False, 'message': str(e)})

def eq(a, b):
    if a != b:
        raise AssertionError(f"expected {b!r} but got {a!r}")

def is_instance(a, cls):
    if not isinstance(a, cls):
        raise AssertionError(f"expected instance of {cls.__name__} but got {type(a).__name__}")
# ──────────────────────────────────────────────────
`

const PY_HARNESS_FOOTER = `
# ── dojo harness footer ───────────────────────────
import json
for r in _tests:
    if r['passed']:
        print('\\u2713 ' + r['name'])
    else:
        print('\\u2717 ' + r['name'] + ': ' + r.get('message', ''))
_ok = all(r['passed'] for r in _tests)
print('__DOJO_RESULT__ ' + json.dumps({'ok': _ok, 'tests': _tests}))
`

export const PYTHON_COURSE_DATA = {
  id: COURSE_ID,
  slug: 'python-for-the-practiced',
  title: 'Python for the Practiced',
  description:
    'The Python you thought you knew. Dataclasses, pattern matching, typing — the idioms that have actually shipped in the last five years.',
  language: 'python',
  accentColor: '#3776AB',
  status: 'draft' as const,
  isPublic: false,
  externalReferences: [
    {
      title: 'What\u2019s New in Python 3.12',
      url: 'https://docs.python.org/3/whatsnew/3.12.html',
      kind: 'docs' as const,
    },
    {
      title: 'PEP 557 \u2014 Data Classes',
      url: 'https://peps.python.org/pep-0557/',
      kind: 'docs' as const,
    },
    {
      title: 'Fluent Python (Ramalho, 2nd ed)',
      url: 'https://www.fluentpython.com/',
      kind: 'book' as const,
    },
  ],
}

export const PYTHON_LESSONS = [
  { id: LESSON_1_ID, courseId: COURSE_ID, order: 1, title: 'Modern Idioms' },
]

const STEP_1_1 = {
  id: STEP_1_1_ID,
  lessonId: LESSON_1_ID,
  order: 1,
  type: 'read' as const,
  title: 'What changed while you were away',
  instruction: `## Why this matters

You know Python. You wrote it five years ago. A lot happened.

Three idioms dominate modern Python and replace code you\u2019re probably still writing by hand:

- **\`@dataclass\`** \u2014 auto-generates \`__init__\`, \`__repr__\`, \`__eq__\`, \`__hash__\`. Less boilerplate, same semantics. Python 3.7+.
- **\`match\` statement** \u2014 structural pattern matching. Cleaner than long \`if/elif\` chains when you\u2019re branching on shape, not just equality. Python 3.10+.
- **\`Enum\`** \u2014 a small thing that kills "magic string" bugs at module load time instead of in a 3am pager.

The next steps take one idiom at a time and rewrite code you would have written five years ago into code you\u2019d write today.

## Ground rules

- Every step runs against real \`python3\` in a sandbox. You get stdout/stderr back, not just a pass/fail.
- The reference solution unlocks after you pass. Peek once you\u2019re sure \u2014 part of the point is seeing a second idiomatic approach after you\u2019ve committed to yours.
- The framework assumes Python 3.10+.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

const STEP_1_2 = {
  id: STEP_1_2_ID,
  lessonId: LESSON_1_ID,
  order: 2,
  type: 'exercise' as const,
  title: 'Replace boilerplate with @dataclass',
  instruction: `## Why this matters

Before 3.7 you wrote \`__init__\`, \`__repr__\`, and \`__eq__\` by hand. Every field appeared four times. \`@dataclass\` generates all three from type-annotated fields.

## Your task

Define a class \`Invoice\` with three fields and \`@dataclass\` semantics:

- \`id: str\`
- \`amount_cents: int\`
- \`paid: bool\` \u2014 defaults to \`False\`

Two \`Invoice\` values with equal fields must compare equal (\`==\`). Calling \`repr()\` on an \`Invoice\` should include the class name and the field values.

## Examples

\`\`\`python
a = Invoice(id="INV-1", amount_cents=1000)
b = Invoice(id="INV-1", amount_cents=1000)
a == b              # True
a.paid              # False (default)
repr(a)             # Invoice(id='INV-1', amount_cents=1000, paid=False)
\`\`\``,
  starterCode: `from dataclasses import dataclass

# TODO: declare Invoice as a dataclass with id: str, amount_cents: int, paid: bool = False
`,
  testCode: `${PY_HARNESS_HEADER}
# === learner code runs above this line ===

def _t_equals():
    a = Invoice(id='INV-1', amount_cents=1000)
    b = Invoice(id='INV-1', amount_cents=1000)
    eq(a, b)

def _t_default_paid():
    a = Invoice(id='INV-2', amount_cents=500)
    eq(a.paid, False)

def _t_paid_override():
    a = Invoice(id='INV-3', amount_cents=200, paid=True)
    eq(a.paid, True)

def _t_repr():
    a = Invoice(id='INV-4', amount_cents=75, paid=False)
    r = repr(a)
    if 'Invoice' not in r:
        raise AssertionError(f"repr missing class name: {r}")
    if 'INV-4' not in r:
        raise AssertionError(f"repr missing id value: {r}")

def _t_inequality():
    a = Invoice(id='INV-5', amount_cents=100)
    b = Invoice(id='INV-6', amount_cents=100)
    if a == b:
        raise AssertionError('invoices with different ids should not be equal')

_t('two invoices with the same fields are ==', _t_equals)
_t('paid defaults to False', _t_default_paid)
_t('paid can be set to True', _t_paid_override)
_t('repr includes class name and field values', _t_repr)
_t('different ids are not equal', _t_inequality)
${PY_HARNESS_FOOTER}`,
  hint: "The `@dataclass` decorator goes on the line above `class Invoice:`. Declare each field as a type-annotated class attribute; defaults (like `paid: bool = False`) go on the field declaration itself.",
  solution: `from dataclasses import dataclass

@dataclass
class Invoice:
    id: str
    amount_cents: int
    paid: bool = False`,
  alternativeApproach: `For an immutable invoice \u2014 reasonable once billing is computed \u2014 add \`frozen=True\` to the decorator: \`@dataclass(frozen=True)\`. The class then raises \`FrozenInstanceError\` on assignment and becomes hashable, which makes \`Invoice\` values safe as dict keys or set members. Combine with \`slots=True\` (3.10+) for the memory win on large collections.`,
}

export const PYTHON_STEPS = [STEP_1_1, STEP_1_2]
