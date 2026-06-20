// =============================================================================
// Go crash scroll — seed (S031). The fifth and final language scroll.
//
// 20 steps across 6 lessons (L0 context, L1 errors, L2 interfaces, L3 structs,
// L4 concurrency, L5 capstone); all 10 katas smoke green vs Piston Go 1.16.2.
// Spec: docs/courses/curricula/go/go.md.
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

const LESSON_0_ID = seedUuid('go-l0-context')
const LESSON_1_ID = seedUuid('go-l1-errors')
const LESSON_2_ID = seedUuid('go-l2-interfaces')
const LESSON_3_ID = seedUuid('go-l3-structs')
const LESSON_4_ID = seedUuid('go-l4-concurrency')
const LESSON_5_ID = seedUuid('go-l5-integration')

const STEP_0_1_ID = seedUuid('go-s0-1-context-and-toolchain')
const STEP_0_2_ID = seedUuid('go-s0-2-predict-first-command')
const STEP_1_1_ID = seedUuid('go-s1-1-errors-are-values')
const STEP_1_2_ID = seedUuid('go-s1-2-predict-typed-nil')
const STEP_1_3_ID = seedUuid('go-s1-3-kata-divide')
const STEP_1_4_ID = seedUuid('go-s1-4-kata-parse-age-wrap')
const STEP_2_1_ID = seedUuid('go-s2-1-interfaces')
const STEP_2_2_ID = seedUuid('go-s2-2-kata-write-hello')
const STEP_2_3_ID = seedUuid('go-s2-3-kata-count-lines')
const STEP_2_4_ID = seedUuid('go-s2-4-challenge-notifier')
const STEP_3_1_ID = seedUuid('go-s3-1-structs-methods-embedding')
const STEP_3_2_ID = seedUuid('go-s3-2-predict-value-receiver')
const STEP_3_3_ID = seedUuid('go-s3-3-kata-counter-pointer')
const STEP_3_4_ID = seedUuid('go-s3-4-kata-embedding')
const STEP_4_1_ID = seedUuid('go-s4-1-goroutines-channels-select')
const STEP_4_2_ID = seedUuid('go-s4-2-predict-loop-capture')
const STEP_4_3_ID = seedUuid('go-s4-3-kata-fan-out')
const STEP_4_4_ID = seedUuid('go-s4-4-kata-with-timeout')
const STEP_5_1_ID = seedUuid('go-s5-1-testing-and-deferral-map')
const STEP_5_2_ID = seedUuid('go-s5-2-capstone-log-triage')

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
function goTest(extraImports: string[], body: string, prelude = ''): string {
  const importBlock = ['fmt', 'reflect', 'strings', ...extraImports]
    .map((i) => `\t"${i}"`)
    .join('\n')
  const preludeBlock = prelude ? `\n${prelude}\n` : ''
  return `package main

import (
${importBlock}
)

${GO_HELPERS}
${preludeBlock}
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
  status: 'published' as const,
  isPublic: true,
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
  outcome:
    'You check errors as ordinary return values instead of reaching for try, and you wrap them so the original cause survives.',
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

// ── Lesson 0 — Go in context ─────────────────────────────────────────────────

const LESSON_0 = {
  id: LESSON_0_ID,
  scrollId: COURSE_ID,
  order: 0,
  title: 'Go in context',
  outcome:
    'You can judge whether Go fits a problem before you start, and you know which toolchain command does what.',
}

const STEP_0_1 = {
  id: STEP_0_1_ID,
  lessonId: LESSON_0_ID,
  order: 1,
  type: 'read' as const,
  title: 'What Go is for, how it runs, and the sandbox contract',
  instruction: `Go earns its place in a specific shape of work — worth knowing whether that's yours before you spend ninety minutes on its idioms.

### Where Go fits

Go is built for services and tools: HTTP and gRPC backends with no JVM to babysit, and command-line + infrastructure tooling — \`kubectl\`, \`terraform\`, \`docker\`, and \`hugo\` are all written in Go. The common thread is a single static binary that starts fast. Where it doesn't fit: heavy numerics (reach for Python or Julia), embedded work (C or Rust), desktop GUIs (no canonical toolkit), one-off scripts (the binary is deploy-friendly but script-hostile). Design choices, not slights.

### The toolchain, one breath each

- \`go build\` — compile to a static binary.
- \`go run\` — compile and run in one step; your inner loop while learning.
- \`go test\` — discovers \`func TestXxx\` by signature, no external runner.
- \`go mod\` — modules. \`go.mod\` + \`go.sum\` ≈ \`package.json\` + a lockfile (or \`pyproject.toml\` + its lock).
- \`go get\` — add a dependency. *Not available in this sandbox.*

### \`gofmt\` ends the debate

Formatting in Go is not a matter of taste. \`gofmt -w .\` and the Prettier-vs-StandardJS argument doesn't exist; editors run it on save.

### What this sandbox runs

This scroll runs **Go 1.16.2**, standard library only, single-file \`go run\` — no \`go get\`, no third-party packages (\`gin\`, \`echo\`, \`testify\` are named only to be excluded), and no \`go test\` (the katas use a small manual harness; real Go testing is a deep-dive). **1.16 is pre-generics:** no type parameters, no \`slices\`/\`maps\` packages, no \`any\` keyword — that is a 1.18 alias, so you write \`interface{}\`. Where modern Go has something newer — generics (1.18), \`errors.Join\` (1.20), the 1.22 loop-variable change — the prose marks it *newer Go* and won't ask you to run it. On your own machine, install current Go; nothing here breaks on it, but a couple of behaviors (loop-variable capture, in Lesson 4) *differ*, and the prose flags exactly where.

You have the map. Next: which command do you actually run first on a project you just cloned?`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: null,
}

const STEP_0_2 = {
  id: STEP_0_2_ID,
  lessonId: LESSON_0_ID,
  order: 2,
  type: 'predict' as const,
  title: 'Predict: what do you run first?',
  instruction: `One check on the toolchain model before the idioms start.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    question:
      'You cloned a Go project and the README says to run its tests. Which command goes first?',
    snippet: `$ git clone https://github.com/example/log-triage.git
$ cd log-triage
$ ls
go.mod  go.sum  main.go  internal/
$ cat README.md
# log-triage — Go 1.21+. Run the tests before sending a PR.
$ ???`,
    options: [
      { id: 'a', text: '\`go build\`' },
      { id: 'b', text: '\`go run main.go\`' },
      { id: 'c', text: '\`go test ./...\`' },
      { id: 'd', text: '\`go get\`' },
    ],
    correct: 'c',
    feedback: {
      a: "The compile-first reflex from C/Java. \`go build\` produces a binary and stops — it never runs anything, and it runs no tests. Handy to check the project compiles; not what 'run the tests' asks for.",
      b: "The just-run-it reflex. \`go run main.go\` compiles and runs that file's \`main\` — the program, not the tests. (On a real project you'd write \`go run .\` to build the whole package, not a lone file.)",
      c: 'Correct. \`go test ./...\` discovers every \`func TestXxx\` across all packages — \`./...\` means "this module, recursively" — and runs them, fetching pinned dependencies on demand. No separate runner, no config. In *this* sandbox you run single-file \`go run\` instead, but \`go test ./...\` is the muscle you want on a real project.',
      d: "The \`npm install\` reflex. \`go get\` adds or updates a dependency and edits \`go.mod\` — it changes the project, it doesn't test it. Go fetches what \`go.sum\` already pins on demand, so you rarely need it just to build or test.",
    },
  },
}

// ── Lesson 1 — Errors as values ──────────────────────────────────────────────

const STEP_1_1 = {
  id: STEP_1_1_ID,
  lessonId: LESSON_1_ID,
  order: 1,
  type: 'read' as const,
  title: 'Errors are values',
  instruction: `Your hand is reaching for \`try\`. Stop — Go does not have it, and that absence is the lesson.

A function that can fail returns its result **and** an \`error\`, and the caller decides what to do, right there in the code:

\`\`\`go
f, err := os.Open(name)
if err != nil {
    return err
}
\`\`\`

No \`throw\`, no \`try\`, no \`catch\`. The \`if err != nil { return ..., err }\` line is the language's load-bearing convention, and yes — you will write it constantly. That repetition is the point: every place something can fail is visible in the source, not hidden two stack frames up.

### The pieces

- **\`error\` is an interface** — the smallest useful one: \`type error interface { Error() string }\`. Lesson 2 makes that model explicit; for now, notice it is a value like any other.
- **Sentinels** — a known error you can match: \`var ErrNotFound = errors.New("not found")\`. Compare with \`errors.Is\`, never \`==\`: wrapping breaks identity, and \`errors.Is\` walks the chain.
- **Typed errors** — a struct with an \`Error() string\` method, when the error must carry data; pull it back out with \`errors.As\`.
- **Wrapping** — add context without losing the original: \`fmt.Errorf("load config: %w", err)\`. The \`%w\` verb keeps the chain so a caller's \`errors.Is\` still finds the root cause. \`%v\` formats it to a plain string and *loses* that — **use \`%w\` by default.** It is the single most common Go error mistake.

\`panic\`/\`recover\` exist, but they are for unrecoverable invariants, not control flow — reaching for \`panic\` as a \`throw\` substitute is a footgun the errors deep-dive covers.

One surprise bites everyone exactly once: what does a function print when it returns a *typed* nil pointer as its \`error\`? Predict it next.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: null,
}

const STEP_1_2 = {
  id: STEP_1_2_ID,
  lessonId: LESSON_1_ID,
  order: 2,
  type: 'predict' as const,
  title: 'Predict: typed nil vs interface nil',
  instruction: `The surprise the read just set up. Read the program, commit to an answer, then reveal.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    question: 'What does this program print?',
    snippet: `type MyError struct{ msg string }

func (e *MyError) Error() string { return e.msg }

func doSomething() error {
	var err *MyError = nil
	return err
}

func main() {
	if doSomething() != nil {
		fmt.Println("got an error")
	} else {
		fmt.Println("no error")
	}
}`,
    options: [
      { id: 'a', text: '\`got an error\`' },
      { id: 'b', text: '\`no error\`' },
      { id: 'c', text: 'Compile error' },
      { id: 'd', text: 'Runtime panic (nil dereference)' },
    ],
    correct: 'a',
    feedback: {
      a: `Correct, and it surprises everyone once. An interface value is a pair: a *type* and a *value*. \`doSomething\` returns a \`*MyError\` that is nil — so the value half is nil, but the type half is \`*MyError\`, which is **not** nil. The \`error\` interface therefore is not nil, and \`!= nil\` is true. The fix: return a bare \`nil\`, not a typed nil pointer — \`return nil\`, not \`return err\` when \`err\` is a nil \`*MyError\`. Lesson 2 names the model you just met: interfaces are method sets over a (type, value) pair.`,
      b: `The Python \`is None\` reflex — "the pointer is nil, so the error is nil". In Go an interface holds (type, value); the type half is \`*MyError\` even when the value is nil, so the interface is non-nil. \`!= nil\` is true, and the error branch runs.`,
      c: `The Java instinct that the type system should catch this. It compiles cleanly — a \`*MyError\` satisfies \`error\` (it has \`Error() string\`), and returning one where an \`error\` is expected is legal. The trap is at runtime, not compile time.`,
      d: `The defensive-C reflex — expecting a nil dereference. Nothing is dereferenced here: \`Error()\` is never called, the code only compares the interface to nil. No panic; it prints the error branch.`,
    },
  },
}

const STEP_1_4 = {
  id: STEP_1_4_ID,
  lessonId: LESSON_1_ID,
  order: 4,
  type: 'kata' as const,
  title: 'Parse an age, and wrap the failure',
  instruction: `\`strconv.Atoi\` turns \`"25"\` into \`25\` — and returns an \`error\` when the string is not a number. Your job is to use that error *without throwing away* what it already knows.

## Your task

Implement \`ParseAge(s string) (int, error)\`:

- parse \`s\` with \`strconv.Atoi\`;
- if parsing fails, **wrap** the error with context so the original survives: \`fmt.Errorf("parse age %q: %w", s, err)\`;
- if the number is outside \`0..150\` (inclusive), return your own error — \`fmt.Errorf("age %d out of range", n)\` — with no inner cause to preserve;
- otherwise return the number and \`nil\`.

The test for a non-numeric string calls \`errors.Is(err, strconv.ErrSyntax)\`. That only passes if you wrapped with \`%w\` — \`%v\` formats the error to text and breaks the chain. \`fmt\`, \`strconv\`, and \`errors\` are imported.`,
  starterCode: `func ParseAge(s string) (int, error) {
	// Parse s, then validate the range. Wrap on a parse failure.
}
`,
  testCode: goTest(
    ['errors', 'strconv'],
    `	_t("parses a valid age", func() {
		got, err := ParseAge("25")
		_eq("no error", err == nil, true)
		_eq("the parsed number", got, 25)
	})
	_t("wraps the parse error so errors.Is reaches strconv.ErrSyntax", func() {
		_, err := ParseAge("abc")
		_eq("error is present", err != nil, true)
		_eq("the wrap chain is intact", errors.Is(err, strconv.ErrSyntax), true)
	})
	_t("rejects an age above the range", func() {
		_, err := ParseAge("200")
		_eq("error is present", err != nil, true)
	})
	_t("rejects a negative age", func() {
		_, err := ParseAge("-1")
		_eq("error is present", err != nil, true)
	})`,
  ),
  hint: null,
  hints: [
    `Two failure shapes, two treatments. A bad parse already carries an error from \`strconv.Atoi\` worth keeping; an out-of-range number is entirely your own complaint. For the first, there is a \`fmt.Errorf\` verb that preserves the underlying error rather than flattening it to text.`,
    `\`fmt.Errorf\` has two verbs for an error: \`%v\` formats it as a string (the chain is lost) and \`%w\` wraps it (the chain is kept). The test's \`errors.Is(err, strconv.ErrSyntax)\` only succeeds through a \`%w\` wrap.`,
  ],
  solution: `func ParseAge(s string) (int, error) {
	n, err := strconv.Atoi(s)
	if err != nil {
		return 0, fmt.Errorf("parse age %q: %w", s, err)
	}
	if n < 0 || n > 150 {
		return 0, fmt.Errorf("age %d out of range", n)
	}
	return n, nil
}
`,
  alternativeApproach: null,
  data: null,
}

// ── Lesson 2 — Structural interfaces ─────────────────────────────────────────

const LESSON_2 = {
  id: LESSON_2_ID,
  scrollId: COURSE_ID,
  order: 2,
  title: 'Structural interfaces',
  outcome:
    'You accept small interfaces and return concrete structs — and you stopped hunting for an implements keyword that does not exist.',
}

const STEP_2_1 = {
  id: STEP_2_1_ID,
  lessonId: LESSON_2_ID,
  order: 1,
  type: 'read' as const,
  title: 'Interfaces are sets of methods',
  instruction: `In Go you never write \`implements\`. A type satisfies an interface by *having the methods* — nothing is declared, the compiler infers it. You already did this in Lesson 1: your \`*MyError\` had an \`Error() string\` method, so it *was* an \`error\`, no ceremony.

### Small is the point

Go's interfaces are small on purpose. The proverb (Rob Pike) is *the bigger the interface, the weaker the abstraction* — a one-method interface composes everywhere; a twenty-method one fits almost nothing. The canonical examples are \`io.Writer\` and \`io.Reader\`, one method each:

\`\`\`go
type Writer interface {
    Write(p []byte) (n int, err error)
}
\`\`\`

Anything that can be written to — a file, a network connection, a \`bytes.Buffer\`, \`os.Stdout\` — satisfies \`io.Writer\`. Anything that can be read from satisfies \`io.Reader\`. Write a function that takes an \`io.Reader\` and it works against all of them.

### Accept interfaces, return structs

The default shape of a Go function: take the *interface* (the abstraction — the caller passes anything that fits) and return the *concrete struct* (so the caller keeps the full API, not a narrowed view). The next two katas make you feel it.

### Where is \`implements\`?

Coming from Java or C#, your hand reaches for it — and there is nowhere to put it. Satisfaction is structural, checked where the type is used. The trade: you lose the explicit "this type promises that interface" line, you gain the freedom to satisfy an interface that didn't exist when you wrote the type.

One escape hatch to name and set aside: \`interface{}\` (the empty interface — written \`any\` in newer Go, a 1.18 alias) accepts *anything* and so tells you *nothing* callable. It is the boundary tool (\`fmt.Println\` takes it), not a default — reaching for it in your own code usually means you threw away a real interface. The deep-dive covers when it earns its place.

Next: write a function that accepts an \`io.Writer\`, and feel the abstraction land.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: null,
}

const STEP_2_2 = {
  id: STEP_2_2_ID,
  lessonId: LESSON_2_ID,
  order: 2,
  type: 'kata' as const,
  title: 'Write to any writer',
  instruction: `Implement \`WriteHello(w io.Writer) error\` that writes exactly \`"hello, world\\n"\` to \`w\`.

The point is the parameter type. The same function will work for \`os.Stdout\`, a file, a network connection, or — as the test does — a \`*bytes.Buffer\`, because each of those satisfies \`io.Writer\`. You accept the abstraction; the caller brings the concrete thing.

\`io\` is imported. Return whatever error the write reports (or \`nil\`).`,
  starterCode: `func WriteHello(w io.Writer) error {
	// Your code here.
}
`,
  testCode: goTest(
    ['io', 'bytes'],
    `	_t("writes the greeting to the writer", func() {
		var buf bytes.Buffer
		err := WriteHello(&buf)
		_eq("no error", err == nil, true)
		_eq("captured bytes", buf.String(), "hello, world\\n")
	})`,
  ),
  hint: `\`io.Writer\` has exactly one method — look up its signature. The simplest path: hand \`w\` and your string to a helper from \`fmt\` that writes to a writer, and return the error it gives back.`,
  hints: null,
  solution: `func WriteHello(w io.Writer) error {
	_, err := fmt.Fprint(w, "hello, world\\n")
	return err
}
`,
  alternativeApproach: null,
  data: null,
}

const STEP_2_3 = {
  id: STEP_2_3_ID,
  lessonId: LESSON_2_ID,
  order: 3,
  type: 'kata' as const,
  title: 'Count lines from any reader',
  instruction: `Implement \`CountLines(r io.Reader) (int, error)\` that returns the number of lines in \`r\`.

Mirror of the last kata: by accepting \`io.Reader\` you handle a file, a socket, or — as the test does — a string, without caring which. Don't read the whole thing into memory and split; reach for the buffered scanner whose default mode is line-by-line.

\`io\` and \`bufio\` are imported.`,
  starterCode: `func CountLines(r io.Reader) (int, error) {
	// Your code here.
}
`,
  testCode: goTest(
    ['io', 'bufio'],
    `	_t("counts the lines in the reader", func() {
		n, err := CountLines(strings.NewReader("alpha\\nbeta\\ngamma\\n"))
		_eq("no error", err == nil, true)
		_eq("line count", n, 3)
	})
	_t("an empty reader has zero lines", func() {
		n, err := CountLines(strings.NewReader(""))
		_eq("no error", err == nil, true)
		_eq("line count", n, 0)
	})`,
  ),
  hint: `Reading line by line by hand is fiddly; \`bufio\` has a buffered scanner built for it, and its default split is lines. Create one over \`r\`, advance it in a loop counting each step, and check its error once the loop ends.`,
  hints: null,
  solution: `func CountLines(r io.Reader) (int, error) {
	scanner := bufio.NewScanner(r)
	count := 0
	for scanner.Scan() {
		count++
	}
	return count, scanner.Err()
}
`,
  alternativeApproach: null,
  data: null,
}

const STEP_2_4 = {
  id: STEP_2_4_ID,
  lessonId: LESSON_2_ID,
  order: 4,
  type: 'challenge' as const,
  title: 'Notify every channel, and report the first failure',
  instruction: `A real one — design an interface, give it two implementations, and fan a message out across them. Budget about twice a normal kata; there is no hint.

## Build

- \`type Notifier interface { Notify(msg string) error }\`.
- \`NewEmailNotifier(w io.Writer) Notifier\` — its \`Notify\` writes \`"EMAIL: <msg>"\` to the writer.
- \`NewLogNotifier(w io.Writer) Notifier\` — its \`Notify\` writes \`"LOG: <msg>"\`.
- \`SendAll(notifiers []Notifier, msg string) error\` — call each in order; on the first failure, return that error **wrapped with the notifier's index**: \`fmt.Errorf("notifier %d: %w", i, err)\`. If all succeed, return \`nil\`.

This pulls together everything so far: a structural interface, two structs satisfying it, iteration, and the Lesson 1 \`%w\` wrap. \`io\` is imported.`,
  starterCode: `type Notifier interface {
	Notify(msg string) error
}

// Define the two notifiers (each over an io.Writer), their constructors,
// and SendAll.
`,
  testCode: goTest(
    ['io', 'bytes'],
    `	_t("delivers to each notifier with its prefix", func() {
		var email, log bytes.Buffer
		err := SendAll([]Notifier{NewEmailNotifier(&email), NewLogNotifier(&log)}, "deploy done")
		_eq("no error", err == nil, true)
		_eq("email body", email.String(), "EMAIL: deploy done")
		_eq("log body", log.String(), "LOG: deploy done")
	})
	_t("wraps the first failing notifier's error", func() {
		err := SendAll([]Notifier{NewLogNotifier(failWriter{})}, "x")
		_eq("error present", err != nil, true)
	})`,
    `type failWriter struct{}

func (failWriter) Write(p []byte) (int, error) {
	return 0, fmt.Errorf("write failed")
}`,
  ),
  hint: null,
  hints: null,
  solution: `type Notifier interface {
	Notify(msg string) error
}

type emailNotifier struct{ w io.Writer }

func (e emailNotifier) Notify(msg string) error {
	_, err := fmt.Fprintf(e.w, "EMAIL: %s", msg)
	return err
}

func NewEmailNotifier(w io.Writer) Notifier { return emailNotifier{w} }

type logNotifier struct{ w io.Writer }

func (l logNotifier) Notify(msg string) error {
	_, err := fmt.Fprintf(l.w, "LOG: %s", msg)
	return err
}

func NewLogNotifier(w io.Writer) Notifier { return logNotifier{w} }

func SendAll(notifiers []Notifier, msg string) error {
	for i, n := range notifiers {
		if err := n.Notify(msg); err != nil {
			return fmt.Errorf("notifier %d: %w", i, err)
		}
	}
	return nil
}
`,
  alternativeApproach: null,
  data: null,
}

// ── Lesson 3 — Structs, methods, composition ─────────────────────────────────

const LESSON_3 = {
  id: LESSON_3_ID,
  scrollId: COURSE_ID,
  order: 3,
  title: 'Structs, methods, and composition over inheritance',
  outcome:
    'You choose value vs pointer receivers on purpose, and compose behavior with embedding instead of an inheritance hierarchy.',
}

const STEP_3_1 = {
  id: STEP_3_1_ID,
  lessonId: LESSON_3_ID,
  order: 1,
  type: 'read' as const,
  title: 'Structs, methods, receivers, embedding, zero values',
  instruction: `Go has structs and methods but no classes, and no inheritance. What it offers instead is worth the swap.

### Structs and methods

A struct bundles fields; a method is a function with a *receiver*:

\`\`\`go
type Counter struct{ n int }

func (c *Counter) Inc()      { c.n++ }       // pointer receiver — mutates
func (c Counter) Value() int { return c.n }  // value receiver — reads a copy
\`\`\`

The receiver type is a real decision, not noise. **Mutate → pointer receiver** (\`*Counter\`); the method changes the original. **Small and read-only → value receiver**; the method works on a copy. Large struct → pointer regardless, to skip the copy. And **don't mix the two within one type** — if any method needs a pointer, give them all pointer receivers. Mixed receivers are a smell you are about to trip over.

### Embedding, not inheritance

There is no \`extends\`. To reuse behavior, you *embed*:

\`\`\`go
type Server struct {
    Logger      // embedded — its methods are promoted onto Server
    addr string
}
\`\`\`

\`server.Log(...)\` now works, forwarded to the embedded \`Logger\`. It *looks* like inheritance and is not: no virtual dispatch, no \`super\`, no polymorphic override of a base method. It is composition with promoted methods — the class hierarchy you would reach for in Java or Python is not here, and you will not miss it.

### Zero values

Every type has a **zero value**, handed to you for free: \`0\` for numbers, \`""\` for strings, \`nil\` for pointers, slices, maps, interfaces, channels, funcs. The useful part: a \`nil\` slice is ready to \`append\` to, and a \`bytes.Buffer{}\` is ready to write to — no constructor needed. The trap: a \`nil\` map **panics on write** — you must \`make\` it first. Design your types so the zero value is the one you want.

Next, a prediction — and it is the receiver decision that bites.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: null,
}

const STEP_3_2 = {
  id: STEP_3_2_ID,
  lessonId: LESSON_3_ID,
  order: 2,
  type: 'predict' as const,
  title: 'Predict: a value receiver behind an interface',
  instruction: `The receiver decision from the read, now with a twist. Read it, commit, reveal.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    question: 'What does this program print?',
    snippet: `type Counter struct{ n int }

func (c Counter) Inc() { c.n++ }

type Incrementer interface {
	Inc()
}

func main() {
	c := &Counter{}
	var inc Incrementer = c
	inc.Inc()
	inc.Inc()
	inc.Inc()
	fmt.Println(c.n)
}`,
    options: [
      { id: 'a', text: '\`0\`' },
      { id: 'b', text: '\`3\`' },
      { id: 'c', text: 'Compile error — a \`*Counter\` cannot satisfy a value-receiver interface' },
      { id: 'd', text: 'Runtime panic' },
    ],
    correct: 'a',
    feedback: {
      a: `Correct. \`Inc\` has a *value* receiver, so each call copies the \`Counter\`, increments the copy, and throws it away — \`c.n\` never moves off \`0\`. The interface holding a pointer changes nothing: the method set of \`*Counter\` includes the value-receiver \`Inc\`, so it compiles, but the body still operates on a copy. The fix, and the next kata: give \`Inc\` a pointer receiver.`,
      b: `The Java/C# instinct that a method called through an object mutates that object. In Go the *receiver type* decides: \`Inc\` takes \`Counter\` by value, so it mutates a copy. The pointer in the interface lets it compile and run; it does not make a value receiver mutate the original.`,
      c: `A reasonable guess about method sets — but it compiles. A \`*Counter\`'s method set includes every value-receiver method (you can always copy through a pointer), so \`*Counter\` satisfies \`Incrementer\`. The trap is at runtime: the copy, not a type error.`,
      d: `Nothing is nil and nothing is dereferenced unsafely — \`c\` is a valid \`*Counter\`. It runs cleanly and prints a number; the surprise is *which* number.`,
    },
  },
}

const STEP_3_3 = {
  id: STEP_3_3_ID,
  lessonId: LESSON_3_ID,
  order: 3,
  type: 'kata' as const,
  title: 'Make the counter actually count',
  instruction: `**This starter compiles and runs — and returns the wrong answer, on purpose.** Run it: \`Value()\` reports \`0\` after three \`Inc()\` calls. That \`0\` is the brief, and the bug is exactly the one the prediction just surfaced.

## Your task

Fix \`Counter\` so that three \`Inc()\` calls leave \`Value()\` returning \`3\`. The change is to the *receivers*, not the method bodies.`,
  starterCode: `type Counter struct {
	n int
}

func (c Counter) Inc() {
	c.n++
}

func (c Counter) Value() int {
	return c.n
}
`,
  testCode: goTest(
    [],
    `	_t("counts three increments", func() {
		var c Counter
		c.Inc()
		c.Inc()
		c.Inc()
		_eq("value after three Inc calls", c.Value(), 3)
	})`,
  ),
  hint: null,
  hints: [
    `The prediction you just made *is* the bug. When \`Inc\` runs, where does the \`+1\` land — on the counter you called it on, or on a copy the method received?`,
    `Both methods take the counter by value, so each works on a throwaway copy. Switch the receivers to \`*Counter\` (pointer) so they touch the real one.`,
  ],
  solution: `type Counter struct {
	n int
}

func (c *Counter) Inc() {
	c.n++
}

func (c *Counter) Value() int {
	return c.n
}
`,
  alternativeApproach: null,
  data: null,
}

const STEP_3_4 = {
  id: STEP_3_4_ID,
  lessonId: LESSON_3_ID,
  order: 4,
  type: 'kata' as const,
  title: 'Compose with embedding',
  instruction: `Embedding is Go's answer to "I want this behavior without an inheritance hierarchy." Build a small one.

## Your task

- \`Logger\` holds an \`io.Writer\` and has \`func (l *Logger) Log(msg string)\` that writes \`"[LOG] <msg>\\n"\` to it.
- \`Server\` **embeds** \`Logger\` and adds an \`addr string\` field.
- \`NewServer(w io.Writer, addr string) *Server\` builds one.

The test calls \`s.Log("...")\` directly on the \`Server\` — that only works if \`Log\` is promoted from the embedded \`Logger\`. \`io\` is imported.`,
  starterCode: `type Logger struct {
	w io.Writer
}

// Give Logger a Log method, embed it in Server, and write NewServer.
`,
  testCode: goTest(
    ['io', 'bytes'],
    `	_t("the server logs through the embedded Logger", func() {
		var buf bytes.Buffer
		s := NewServer(&buf, ":8080")
		s.Log("listening")
		_eq("promoted Log writes the line", buf.String(), "[LOG] listening\\n")
	})`,
  ),
  hint: `Embedding is writing the type name with no field name: \`type Server struct { Logger; addr string }\`. Once \`Logger\` is embedded, its \`Log\` method is callable directly on a \`Server\`. \`NewServer\` just fills in the \`Logger\` (with its writer) and the \`addr\`.`,
  hints: null,
  solution: `type Logger struct {
	w io.Writer
}

func (l *Logger) Log(msg string) {
	fmt.Fprintf(l.w, "[LOG] %s\\n", msg)
}

type Server struct {
	Logger
	addr string
}

func NewServer(w io.Writer, addr string) *Server {
	return &Server{Logger: Logger{w: w}, addr: addr}
}
`,
  alternativeApproach: null,
  data: null,
}

// ── Lesson 4 — Concurrency ────────────────────────────────────────────────────

const LESSON_4 = {
  id: LESSON_4_ID,
  scrollId: COURSE_ID,
  order: 4,
  title: 'Concurrency: goroutines, channels, select',
  outcome:
    'You coordinate goroutines through channels and select, and you spot the shared-loop-variable trap on sight.',
}

const STEP_4_1 = {
  id: STEP_4_1_ID,
  lessonId: LESSON_4_ID,
  order: 1,
  type: 'read' as const,
  title: 'go func(), channels, select',
  instruction: `Most Go is sequential. Concurrency is a tool you reach for, not the default — which is why it comes after three lessons of sequential muscle. Here is the crash version.

### \`go f()\` schedules

\`go f()\` runs \`f\` on Go's scheduler — no thread to manage, ~2KB of initial stack, cheap but not free. It returns immediately; \`f\` runs whenever the scheduler gets to it. *No value comes back* — to get a result, you coordinate through a channel.

### Channels are typed pipes

\`make(chan int)\` is an *unbuffered* channel: a send blocks until a receive is ready, and vice versa — a synchronous handoff. \`make(chan int, 4)\` is *buffered* — a bounded queue; sends block only when it is full. Send with \`ch <- v\`, receive with \`v := <-ch\`.

Close discipline: **only the sender closes.** Receiving from a closed channel yields the zero value, with \`v, ok := <-ch\` reporting \`ok == false\`. **Sending on a closed channel panics** — a real footgun.

### \`select\` chooses

\`select\` waits on several channel operations and proceeds with whichever is ready first; a \`default\` case makes it non-blocking. It is what makes channels useful for timeouts and cancellation — you will use it in a kata.

The proverb (Rob Pike): *don't communicate by sharing memory; share memory by communicating.* Channels are the higher-level tool; it is not that mutexes are wrong.

### The delta from what you hold

\`go f()\` is **not** \`await\` — no Promise resolves; you coordinate via a channel, and a channel is not a Promise. From a Java background, a goroutine is lighter than a thread and you may not need \`synchronized\` when a channel does the job. \`sync.Mutex\` and \`context\` are real and deferred to the concurrency deep-dive; \`sync.WaitGroup\` (wait for a batch of goroutines to finish) you will see used to join, no deeper.

One trap is live on this Go version and bites everyone. Predict it next.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: null,
}

const STEP_4_2 = {
  id: STEP_4_2_ID,
  lessonId: LESSON_4_ID,
  order: 2,
  type: 'predict' as const,
  title: 'Predict: the loop-variable trap',
  instruction: `The live trap. The \`WaitGroup\` just makes sure all three goroutines finish before \`main\` ends. Read it on **Go 1.16** (this sandbox), commit, reveal.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    question: 'On the sandbox (Go 1.16), what does this print?',
    snippet: `var wg sync.WaitGroup
for i := 0; i < 3; i++ {
	wg.Add(1)
	go func() {
		defer wg.Done()
		fmt.Print(i, " ")
	}()
}
wg.Wait()`,
    options: [
      { id: 'a', text: '\`0 1 2\` (in some order)' },
      { id: 'b', text: '\`3 3 3\` (in some order)' },
      { id: 'c', text: '\`0 0 0\`' },
      { id: 'd', text: 'Compile error' },
    ],
    correct: 'b',
    feedback: {
      a: `The JavaScript \`let\` reflex — one binding per iteration. That is exactly right on **Go 1.22+** (Feb 2024 made the loop variable per-iteration), but **wrong on this sandbox's 1.16**: there is one \`i\`, shared by all three closures, and they read it after the loop ends. The *why* — a shared closure variable — is the transferable lesson, and most Go code you will read still predates the 1.22 fix.`,
      b: `Correct on Go 1.16. There is a single \`i\`; all three goroutines close over the *same* variable, and by the time the scheduler runs them (after \`wg.Wait\` is reached) \`i\` has already counted up to \`3\`. So each prints \`3\`. **Version contract:** Go 1.22 changed loop-variable scoping so the same code prints \`0 1 2\` on current Go — one of the language's few backwards-incompatible changes. The transferable lesson is the shared-closure-variable cause; the next kata makes you fix it.`,
      c: `This would mean the goroutines ran *before* any increment — but \`wg.Wait\` proves they all ran, and the loop completes long before the scheduler gets to them. The shared \`i\` has reached its final value, not its initial one.`,
      d: `It is syntactically valid Go — the bug is semantic, not a compile error. It runs and prints; the surprise is the value.`,
    },
  },
}

const STEP_4_3 = {
  id: STEP_4_3_ID,
  lessonId: LESSON_4_ID,
  order: 3,
  type: 'kata' as const,
  title: 'Fan out, and gather in order',
  instruction: `**This starter compiles and runs — and returns wrong results, on purpose.** It spawns a goroutine per input but falls into the trap you just predicted: every goroutine closes over the *same* loop variables, so most results land in the wrong slot (or never get written). That garbage is the brief.

## Your task

Fix \`FanOut\` so it runs \`fn\` on each input concurrently and returns the results **in input order** — \`out[i]\` is \`fn(inputs[i])\`. The fix is to give each goroutine its *own* copy of the loop values, not a shared reference.`,
  starterCode: `func FanOut(inputs []int, fn func(int) int) []int {
	out := make([]int, len(inputs))
	var wg sync.WaitGroup
	for i, v := range inputs {
		wg.Add(1)
		go func() {
			defer wg.Done()
			out[i] = fn(v)
		}()
	}
	wg.Wait()
	return out
}
`,
  testCode: goTest(
    ['sync'],
    `	_t("runs fn on every input, results in input order", func() {
		out := FanOut([]int{1, 2, 3, 4}, func(n int) int { return n * n })
		_eq("squares in order", out, []int{1, 4, 9, 16})
	})
	_t("handles an empty input", func() {
		out := FanOut([]int{}, func(n int) int { return n })
		_eq("empty result", out, []int{})
	})`,
  ),
  hint: null,
  hints: [
    `The prediction you just made is the bug: all the goroutines share the same \`i\` and \`v\`. By the time they run, those have reached their last values, so they all write to the same slot.`,
    `Give each goroutine its own copy by passing the loop values in as arguments: \`go func(i, v int) { ... }(i, v)\`. Now each closure has its own \`i\` and \`v\`.`,
  ],
  solution: `func FanOut(inputs []int, fn func(int) int) []int {
	out := make([]int, len(inputs))
	var wg sync.WaitGroup
	for i, v := range inputs {
		wg.Add(1)
		go func(i, v int) {
			defer wg.Done()
			out[i] = fn(v)
		}(i, v)
	}
	wg.Wait()
	return out
}
`,
  alternativeApproach: null,
  data: null,
}

const STEP_4_4 = {
  id: STEP_4_4_ID,
  lessonId: LESSON_4_ID,
  order: 4,
  type: 'kata' as const,
  title: 'Race work against a timeout',
  instruction: `\`select\` exists for exactly this: wait on two things and take whichever happens first.

## Your task

Implement \`WithTimeout(work func() int, d time.Duration) (int, bool)\`:

- run \`work\` in a goroutine;
- if it finishes before \`d\` elapses, return its result and \`true\`;
- if \`d\` elapses first, return \`(0, false)\`.

Use a \`select\` over the result channel and \`time.After(d)\`. Give the result channel a buffer of 1 so the worker can finish even after a timeout, instead of leaking. \`time\` is imported.`,
  starterCode: `func WithTimeout(work func() int, d time.Duration) (int, bool) {
	// Your code here.
}
`,
  testCode: goTest(
    ['time'],
    `	_t("returns the result when work beats the timeout", func() {
		got, ok := WithTimeout(func() int { return 42 }, 200*time.Millisecond)
		_eq("ok is true", ok, true)
		_eq("the result", got, 42)
	})
	_t("times out when work is too slow", func() {
		got, ok := WithTimeout(func() int {
			time.Sleep(80 * time.Millisecond)
			return 99
		}, 5*time.Millisecond)
		_eq("ok is false", ok, false)
		_eq("zero result", got, 0)
	})`,
  ),
  hint: null,
  hints: [
    `You are racing two events: the work finishing, and time running out. What Go construct waits on several channel operations and proceeds with whichever is ready first?`,
    `Run \`work\` in a goroutine that sends its result to a buffered channel, then \`select\` over two cases: a receive from that channel, and a receive from \`time.After(d)\`. Whichever fires first decides the return.`,
  ],
  solution: `func WithTimeout(work func() int, d time.Duration) (int, bool) {
	done := make(chan int, 1)
	go func() {
		done <- work()
	}()
	select {
	case r := <-done:
		return r, true
	case <-time.After(d):
		return 0, false
	}
}
`,
  alternativeApproach: null,
  data: null,
}

// ── Lesson 5 — Integration: the capstone ─────────────────────────────────────

const LESSON_5 = {
  id: LESSON_5_ID,
  scrollId: COURSE_ID,
  order: 5,
  title: 'Integration: the capstone',
  outcome:
    'You wired errors, interfaces, and structs into one working program — and you know what the scroll left for the deep-dives.',
}

const STEP_5_1 = {
  id: STEP_5_1_ID,
  lessonId: LESSON_5_ID,
  order: 1,
  type: 'read' as const,
  title: 'Testing as design, and what we deliberately skipped',
  instruction: `You have written ten-odd functions. In real Go, the next thing you would write is their tests — and tests are design pressure, not an afterthought.

### Testing as design (in real Go)

A Go test is \`func TestXxx(t *testing.T)\`, discovered by name. The idiomatic shape is *table-driven*: a slice of cases — \`[]struct{ name string; in, want T }\` — looped with \`t.Run(c.name, ...)\` so each reports separately. \`t.Errorf\` records a failure and continues; \`t.Fatalf\` stops the test. There are no fluent matchers — \`if got != want { t.Errorf("got %v, want %v", got, want) }\` is the whole vocabulary, boring on purpose. The heuristic you can actually use: *if a test is painful to write, the design is wrong.*

**This sandbox runs \`go run\`, not \`go test\`**, so these katas used a small manual harness instead. Real Go testing — table tests, \`t.Helper\`, \`httptest\`, fuzzing — is its own deep-dive.

### What this scroll deliberately skipped

Each is real, and named only so you know where the edge is:

- **\`panic\`/\`recover\`** — for unrecoverable invariants, not control flow.
- **\`sync.Mutex\` / \`context\`** — shared-state coordination and cancellation.
- **Generics** — they do not exist on 1.16; reaching for them writes Java-in-Go.
- **\`interface{}\` / \`any\`** — the escape hatch, fine at library boundaries, never the default.
- **\`init()\`, \`reflect\`, \`cgo\`** — action at a distance, runtime introspection, the FFI edge; not year-one code.
- **\`gin\` / \`gorm\` / \`testify\`** — the standard library *is* the framework here.

One step left: a capstone that needs Lessons 1, 2, and 3 at once.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: null,
}

const STEP_5_2 = {
  id: STEP_5_2_ID,
  lessonId: LESSON_5_ID,
  order: 2,
  type: 'challenge' as const,
  title: 'Capstone: summarize a log',
  instruction: `The scroll's promise, made real. Budget about twice a kata; one hint if you want it.

You are handed an \`io.Reader\` over a log — one entry per line, each starting with a level token:

\`\`\`
INFO starting up
WARN disk at 91%
ERROR connection refused
\`\`\`

The scaffold gives you the types. Implement two functions:

- \`Summarize(r io.Reader) (Summary, error)\` — read the reader line by line with \`bufio.Scanner\`, skip blank lines, and count each entry by level into a \`Summary\`. An unrecognised token returns \`&ErrUnknownLevel{Token: tok}\`. A log with no non-blank lines returns \`ErrEmpty\`.
- \`(s Summary) String() string\` — render it as \`"2 info, 1 warn, 1 error"\`.

This pulls the whole scroll together: **Lesson 1** (a sentinel \`ErrEmpty\` matched with \`errors.Is\`, a typed \`ErrUnknownLevel\` extracted with \`errors.As\`, the \`(T, error)\` return), **Lesson 2** (the input is an \`io.Reader\` — accept the interface and scan it), and **Lesson 3** (a \`Summary\` struct with a \`String()\` method). \`io\`, \`bufio\`, and \`errors\` are imported.`,
  starterCode: `type Level int

const (
	Info Level = iota
	Warn
	Error
)

type Summary struct {
	Infos, Warns, Errors int
}

var ErrEmpty = errors.New("empty log")

type ErrUnknownLevel struct {
	Token string
}

func (e *ErrUnknownLevel) Error() string {
	return fmt.Sprintf("unknown level %q", e.Token)
}

func (s Summary) String() string {
	// "2 info, 1 warn, 1 error"
}

func Summarize(r io.Reader) (Summary, error) {
	// Scan r line by line; skip blanks; count by level token.
	// Unknown token -> &ErrUnknownLevel{Token: tok}. No entries -> ErrEmpty.
}
`,
  testCode: goTest(
    ['io', 'bufio', 'errors'],
    `	_t("counts each level and renders the summary", func() {
		log := "INFO starting\\nWARN disk at 91%\\nERROR crashed\\nINFO done\\n"
		s, err := Summarize(strings.NewReader(log))
		_eq("no error", err == nil, true)
		_eq("the counts", s, Summary{Infos: 2, Warns: 1, Errors: 1})
		_eq("the string form", s.String(), "2 info, 1 warn, 1 error")
	})
	_t("skips blank lines", func() {
		s, err := Summarize(strings.NewReader("\\nINFO a\\n\\n\\nWARN b\\n"))
		_eq("no error", err == nil, true)
		_eq("blanks ignored", s, Summary{Infos: 1, Warns: 1, Errors: 0})
	})
	_t("reports an unknown level as a typed error via errors.As", func() {
		_, err := Summarize(strings.NewReader("TRACE noisy\\n"))
		var unknown *ErrUnknownLevel
		_eq("errors.As finds it", errors.As(err, &unknown), true)
		_eq("the offending token", unknown.Token, "TRACE")
	})
	_t("an all-blank log is ErrEmpty", func() {
		_, err := Summarize(strings.NewReader("\\n\\n"))
		_eq("errors.Is matches ErrEmpty", errors.Is(err, ErrEmpty), true)
	})`,
  ),
  hint: `Three sub-problems. Scan the reader into candidate lines (\`bufio.Scanner\`, skipping blanks). Turn a line's first token into a \`Level\` — a small fallible helper returning \`(Level, error)\` keeps \`Summarize\` clean. Accumulate counts into the \`Summary\`, and decide at the end whether you saw any entry at all.`,
  hints: null,
  solution: `type Level int

const (
	Info Level = iota
	Warn
	Error
)

type Summary struct {
	Infos, Warns, Errors int
}

func (s Summary) String() string {
	return fmt.Sprintf("%d info, %d warn, %d error", s.Infos, s.Warns, s.Errors)
}

var ErrEmpty = errors.New("empty log")

type ErrUnknownLevel struct {
	Token string
}

func (e *ErrUnknownLevel) Error() string {
	return fmt.Sprintf("unknown level %q", e.Token)
}

func parseLevel(tok string) (Level, error) {
	switch tok {
	case "INFO":
		return Info, nil
	case "WARN":
		return Warn, nil
	case "ERROR":
		return Error, nil
	default:
		return 0, &ErrUnknownLevel{Token: tok}
	}
}

func Summarize(r io.Reader) (Summary, error) {
	var s Summary
	scanner := bufio.NewScanner(r)
	seen := false
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		seen = true
		level, err := parseLevel(strings.Fields(line)[0])
		if err != nil {
			return Summary{}, err
		}
		switch level {
		case Info:
			s.Infos++
		case Warn:
			s.Warns++
		case Error:
			s.Errors++
		}
	}
	if err := scanner.Err(); err != nil {
		return Summary{}, err
	}
	if !seen {
		return Summary{}, ErrEmpty
	}
	return s, nil
}
`,
  alternativeApproach: null,
  data: null,
}

export const GO_LESSONS = [LESSON_0, LESSON_1, LESSON_2, LESSON_3, LESSON_4, LESSON_5]

export const GO_STEPS = [
  STEP_0_1,
  STEP_0_2,
  STEP_1_1,
  STEP_1_2,
  STEP_1_3,
  STEP_1_4,
  STEP_2_1,
  STEP_2_2,
  STEP_2_3,
  STEP_2_4,
  STEP_3_1,
  STEP_3_2,
  STEP_3_3,
  STEP_3_4,
  STEP_4_1,
  STEP_4_2,
  STEP_4_3,
  STEP_4_4,
  STEP_5_1,
  STEP_5_2,
]
