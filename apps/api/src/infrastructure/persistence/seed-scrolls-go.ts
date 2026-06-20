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

const LESSON_0_ID = seedUuid('go-l0-context')
const LESSON_1_ID = seedUuid('go-l1-errors')
const LESSON_2_ID = seedUuid('go-l2-interfaces')

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

// ── Lesson 0 — Go in context ─────────────────────────────────────────────────

const LESSON_0 = {
  id: LESSON_0_ID,
  scrollId: COURSE_ID,
  order: 0,
  title: 'Go in context',
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

export const GO_LESSONS = [LESSON_0, LESSON_1, LESSON_2]

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
]
