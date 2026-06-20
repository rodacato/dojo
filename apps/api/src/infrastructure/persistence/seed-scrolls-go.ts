// =============================================================================
// Go crash scroll — seed (S031). SCAFFOLD.
//
// This file proves the Go seed → Piston pipeline end-to-end before the full
// content pass. It carries the validated harness + course data + Lesson 1's
// first kata (Divide). Lessons 0 and 2-5 land in the content-authoring pass;
// the spec is docs/courses/curricula/go/go.md.
//
// Harness validated against Piston Go 1.16.2 (S031, §5):
//   • hand-rolled JSON — NOT encoding/json (it crashes the sandbox keeper).
//   • marker-insertion entry-point merge — the testCode IS the full file
//     (package, imports, helpers, a `// __DOJO_SOLUTION__` marker, func main);
//     PistonAdapter splices the learner's code in at the marker. Imports live
//     in the testCode, so each kata's import block must pre-declare every
//     package the intended solution needs.
// =============================================================================

import { createHash } from 'node:crypto'

function seedUuid(name: string): string {
  const hash = createHash('sha256').update(`dojo-scroll-${name}`).digest('hex')
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    '8' + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-')
}

const COURSE_ID = seedUuid('go')
const LESSON_1_ID = seedUuid('go-l1-errors')
const STEP_1_3_ID = seedUuid('go-s1-3-kata-divide')

// ── Go harness (validated, Piston 1.16.2) ───────────────────────────────────
// String.raw so the JSON-escaping backslashes survive verbatim into Go source.
// The harness uses fmt + reflect + strings only — every kata import block adds
// those three plus whatever the kata itself needs.

const GO_HELPERS = String.raw`type _result struct {
	name string
	pass bool
	msg  string
}

var _results []_result

func _eq(name string, actual, expected interface{}) {
	if reflect.DeepEqual(actual, expected) {
		_results = append(_results, _result{name, true, ""})
	} else {
		_results = append(_results, _result{name, false, fmt.Sprintf("expected %v but got %v", expected, actual)})
	}
}

func _t(name string, f func()) {
	defer func() {
		if r := recover(); r != nil {
			_results = append(_results, _result{name, false, fmt.Sprintf("panicked: %v", r)})
		}
	}()
	f()
}

func _jsonEscape(s string) string {
	var b strings.Builder
	for _, c := range s {
		switch c {
		case '"':
			b.WriteString("\\\"")
		case '\\':
			b.WriteString("\\\\")
		case '\n':
			b.WriteString("\\n")
		case '\r':
			b.WriteString("\\r")
		case '\t':
			b.WriteString("\\t")
		default:
			if c < 0x20 {
				b.WriteString(fmt.Sprintf("\\u%04x", c))
			} else {
				b.WriteRune(c)
			}
		}
	}
	return b.String()
}`

const GO_FOOTER = String.raw`	ok := true
	parts := make([]string, 0, len(_results))
	for _, r := range _results {
		if !r.pass {
			ok = false
		}
		if r.pass {
			parts = append(parts, fmt.Sprintf("{\"name\":\"%s\",\"passed\":true}", _jsonEscape(r.name)))
		} else {
			parts = append(parts, fmt.Sprintf("{\"name\":\"%s\",\"passed\":false,\"message\":\"%s\"}", _jsonEscape(r.name), _jsonEscape(r.msg)))
		}
	}
	fmt.Printf("__DOJO_RESULT__ {\"ok\":%t,\"tests\":[%s]}\n", ok, strings.Join(parts, ","))`

// Assemble a kata's full testCode. `fmt`, `reflect`, `strings` are always
// imported (the helpers use them); `extraImports` adds the kata's own. An
// import the solution/tests don't use is an unused-import compile error — the
// smoke catches it. The `// __DOJO_SOLUTION__` marker is where PistonAdapter
// splices the learner's code (between the helpers and func main).
function goTest(extraImports: string[], body: string): string {
  const importBlock = ['fmt', 'reflect', 'strings', ...extraImports]
    .map((i) => `\t"${i}"`)
    .join('\n')
  return `package main

import (
${importBlock}
)

${GO_HELPERS}

// __DOJO_SOLUTION__

func main() {
${body}
${GO_FOOTER}
}
`
}

// ── Course ───────────────────────────────────────────────────────────────────

export const GO_COURSE_DATA = {
  id: COURSE_ID,
  slug: 'go',
  title: 'Go',
  description:
    "The dojo's Go crash course. For developers who already program in another language and need confidence in Go by Friday. Errors as values, structural interfaces, composition over inheritance, and just enough concurrency — taught as deltas from the model you already hold, in ~100 minutes. The sandbox runs Go 1.16.2; the prose flags where modern Go differs.",
  language: 'go',
  accentColor: '#00ADD8',
  // SCAFFOLD: draft + private until the full content pass authors L0, L2-L5.
  status: 'draft' as const,
  isPublic: false,
  estimatedMinutes: 100,
  externalReferences: [
    {
      title: 'A Tour of Go',
      url: 'https://go.dev/tour/',
      kind: 'docs' as const,
    },
    {
      title: 'Effective Go',
      url: 'https://go.dev/doc/effective_go',
      kind: 'docs' as const,
    },
    {
      title: 'The Go Programming Language (Donovan & Kernighan)',
      url: 'https://www.gopl.io/',
      kind: 'book' as const,
    },
  ],
}

const LESSON_1 = {
  id: LESSON_1_ID,
  scrollId: COURSE_ID,
  order: 1,
  title: 'Errors as values: the try/except reflex you unlearn',
}

const STEP_1_3 = {
  id: STEP_1_3_ID,
  lessonId: LESSON_1_ID,
  order: 3,
  type: 'kata' as const,
  title: 'Return a value and an error',
  instruction: `Go has no exceptions. A function that can fail returns a value **and** an \`error\`, and the caller checks \`if err != nil\`. That return shape is the language's load-bearing convention — you'll write it in almost every kata from here on.

## Your task

Implement \`Divide(a, b int) (int, error)\`:

- when \`b\` is \`0\`, return \`0\` and a non-nil error (any message — \`fmt.Errorf("division by zero")\` is fine);
- otherwise return the quotient \`a / b\` and \`nil\`.

\`fmt\` is already imported.`,
  starterCode: `func Divide(a, b int) (int, error) {
	// Your code here.
}
`,
  testCode: goTest(
    [],
    `	_t("divides evenly", func() {
		got, err := Divide(10, 2)
		_eq("no error on a valid division", err == nil, true)
		_eq("returns the quotient", got, 5)
	})
	_t("reports an error on divide by zero", func() {
		got, err := Divide(7, 0)
		_eq("error is present", err != nil, true)
		_eq("value is the zero int", got, 0)
	})
	_t("handles negative operands", func() {
		got, err := Divide(-6, 3)
		_eq("no error", err == nil, true)
		_eq("returns the quotient", got, -2)
	})`,
  ),
  hint: `Go returns two values here: the result and an error. Check \`b\` first — if it's zero there's no quotient to return, so hand back the zero value and an error you build with \`fmt\`. Otherwise return the division and \`nil\`.`,
  hints: null,
  solution: `func Divide(a, b int) (int, error) {
	if b == 0 {
		return 0, fmt.Errorf("division by zero")
	}
	return a / b, nil
}
`,
  alternativeApproach: null,
  data: null,
}

export const GO_LESSONS = [LESSON_1]

export const GO_STEPS = [STEP_1_3]
