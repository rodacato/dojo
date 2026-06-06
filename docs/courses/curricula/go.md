# Go Course Track

> Maintainer persona: S6 Kenji Watanabe (Go educator) + S5 Dr. Elif Yıldız (curriculum architect)
> Last researched: 2026-04-14

---

## 1. Learning Philosophy for Go

Go is a small language with a large standard library, and that asymmetry is the entire pedagogical lever. Most language courses spend their first weeks teaching syntax because the syntax is where the cleverness lives. Go has very little cleverness in its syntax — no inheritance, no exceptions, no operator overloading, no pattern matching, no macros. The cleverness lives in the *idioms*: how you compose interfaces, how you treat errors as values, how you structure a package, how you use channels. A Go course that front-loads syntax and back-loads idioms produces developers who can write Go but cannot read it. We do the opposite — we teach the idioms as soon as the syntactic floor allows it.

The single most important pedagogical commitment is to teach **sequential, idiomatic Go thoroughly before introducing concurrency**. Goroutines and channels are Go's marketing pitch, but they are also the fastest way to produce a learner who writes deadlocking, race-condition-riddled, leak-prone code with confidence. By the time a learner reaches the concurrency course they should already be comfortable with errors-as-values, accept-interfaces-return-structs, table-driven tests, and `context.Context` propagation. Concurrency without those foundations is performance art, not engineering.

Idioms to reinforce early, in roughly this order: (1) errors are return values, not control flow — no panics in normal paths; (2) accept interfaces, return concrete types — keep the abstraction at the consumer; (3) zero values are useful — design types so the zero value is meaningful; (4) composition over inheritance — embedding is a tool, not a hierarchy; (5) table-driven tests as the default test shape; (6) `gofmt` and `go vet` are not optional.

Dead ends to avoid: teaching `interface{}` (or `any`) before structural typing has clicked; teaching goroutines before channels; teaching channels before `sync.Mutex` and `sync.WaitGroup` (learners need to understand shared-memory concurrency before they can appreciate why CSP is nicer); teaching generics as the default abstraction mechanism (Go's generics are deliberately constrained — they are a tool for library authors, not a replacement for interfaces in application code); and teaching `init()` functions, `panic`/`recover`, and reflection at all in introductory material.

---

## 2. Course Tree Overview

| Course | Level | Prereqs | Steps (approx) | Status |
|---|---|---|---|---|
| `go-fundamentals` | Basic | — | ~18 | proposed |
| `go-stdlib-and-io` | Intermediate | `go-fundamentals` | ~15 | proposed |
| `go-errors-and-interfaces` | Intermediate | `go-fundamentals` | ~12 | proposed |
| `go-testing-and-tdd` | Intermediate | `go-fundamentals` | ~14 | proposed |
| `go-concurrency` | Intermediate | `go-stdlib-and-io`, `go-testing-and-tdd` | ~18 | proposed |
| `go-networking-and-http` | Advanced | `go-stdlib-and-io`, `go-errors-and-interfaces` | ~15 | proposed |
| `go-generics-deep-cuts` | Specific / Advanced | `go-errors-and-interfaces`, `go-testing-and-tdd` | ~12 | proposed |

Total: ~104 steps across 7 sub-courses. The tree is intentionally biased toward foundations — five of the seven courses are basic or intermediate. Concurrency is gated behind both stdlib and testing, which is unusual but deliberate (see Section 5).

---

## 3. Sub-courses

### 3.1 Go Fundamentals — Basic

**Slug:** `go-fundamentals`
**Prereqs:** Familiarity with one other typed or dynamically-typed language (the course assumes you know what a `for` loop is)
**Learner time:** ~6 hours
**Learning outcomes:**
- Write, compile, and reason about a single-file Go program
- Use the four core composite types (array, slice, map, struct) with confidence in their value/reference semantics
- Define methods on user types and understand pointer vs. value receivers
- Return errors as values and propagate them up a call chain
- Read and write idiomatic Go: zero values, short variable declarations, multiple returns

**Lesson 1: Hello, the boring way**
- Step 1 (explanation): Go's mental model — packages, the `main` package, `func main`, why there are no semicolons but the grammar still requires them
- Step 2 (exercise): Write a function `Greet(name string) string` returning `"Hello, <name>"`. Test asserts on three cases including empty name
- Step 3 (exercise): Multiple return values — write `Divide(a, b int) (int, error)` that returns an error on division by zero. No `panic`, no exceptions

**Lesson 2: Types that you can hold in your head**
- Step 1 (explanation): The numeric tower (`int`, `int64`, `float64`, `byte`, `rune`), strings as immutable byte slices, the `bool` type. Conversion is always explicit
- Step 2 (exercise): `CountVowels(s string) int` — iterate over runes, not bytes. Test includes a string with multibyte characters to catch the rune/byte confusion
- Step 3 (challenge): `IsValidUsername(s string) (bool, string)` — return `(false, reason)` on invalid input. Forces multi-return + a real branching decision

**Lesson 3: Slices, arrays, and the great `append` confusion**
- Step 1 (explanation): Arrays are values, slices are headers over arrays. What `append` does to capacity. Why `make([]T, 0, n)` exists
- Step 2 (exercise): `Reverse(in []int) []int` — must not mutate the input. Test verifies original is untouched
- Step 3 (exercise): `RemoveAll(in []int, target int) []int` — return a new slice with all `target` removed. Tests cover empty, no-match, and all-match cases
- Step 4 (challenge): `Chunk(in []int, size int) [][]int` — split into chunks of `size`. Edge cases: size <= 0, last chunk shorter

**Lesson 4: Maps and structs**
- Step 1 (explanation): Map zero value is nil — you can read but not write. Struct literals, field access, struct comparison
- Step 2 (exercise): `WordCount(s string) map[string]int` — split on whitespace, count occurrences. Determinism note: the test iterates the returned map sorted
- Step 3 (exercise): Define a `Point` struct with `X, Y int` and a `Distance(p Point) float64` method. Test asserts on three known triangles

**Lesson 5: Methods, receivers, and the first taste of interfaces**
- Step 1 (explanation): Pointer vs. value receivers — when each is correct and why mixing is a smell. Method sets
- Step 2 (exercise): A `Counter` struct with `Inc()` and `Value() int`. Tests that `Inc` actually mutates (forces pointer receiver)
- Step 3 (challenge): Define a `Stringer`-like interface and implement it on two types. The test uses `fmt.Sprintf("%s", v)` to verify

**Piston considerations:** All exercises are pure functions or methods on small structs. Each step compiles a single file containing the user's code plus a generated `<step>_test.go`. No `go.mod` gymnastics — Piston runs `go test` in a temp directory with module mode disabled or with a generated minimal `go.mod`. Confirm during implementation whether Piston's Go image uses `GO111MODULE=off` or generates a module on the fly.

**Reference material:**
- Book: *The Go Programming Language* (Donovan & Kernighan), chapters 1–4 — the canonical sequence for this material, used as a sanity check on order
- Book: *Learning Go* (Jon Bodner), chapters 3–6 — more modern, better at explaining the "why" behind idioms; preferred over Donovan/Kernighan for the explanation steps
- Tutorial: A Tour of Go (https://go.dev/tour) — we deliberately diverge from the Tour's order; it teaches goroutines too early
- Community reference: Exercism Go track's `hello-world` through `accumulate` exercises — borrow the test shapes, not the prose

---

### 3.2 Go Stdlib & I/O — Intermediate

**Slug:** `go-stdlib-and-io`
**Prereqs:** `go-fundamentals`
**Learner time:** ~5 hours
**Learning outcomes:**
- Format and parse strings idiomatically with `fmt`, `strings`, `strconv`
- Read and write streams using the `io.Reader` / `io.Writer` interfaces without leaking implementation details
- Encode and decode JSON, including custom marshaling
- Handle time, durations, and timeouts correctly
- Recognize when reaching for a third-party library is unjustified — most of what people install is in the stdlib

**Lesson 1: `fmt`, `strings`, and `strconv`**
- Step 1 (explanation): Verbs in `fmt` — `%v`, `%+v`, `%q`, `%w`. `strings.Builder` vs. naive concatenation. `strconv` vs. `fmt.Sprintf` for number→string
- Step 2 (exercise): `Slugify(s string) string` — lowercase, replace runs of non-alphanumeric with `-`, trim. Tests cover unicode and edge cases
- Step 3 (exercise): `FormatTable(rows [][]string) string` — column-aligned output using `text/tabwriter`. Deterministic output via fixed padding char

**Lesson 2: Readers and writers**
- Step 1 (explanation): `io.Reader` is the most important interface in Go. `bufio.Scanner` for line-by-line. Why you should accept `io.Reader`, not `*os.File`
- Step 2 (exercise): `CountLines(r io.Reader) (int, error)` — uses `bufio.Scanner`. Test passes `strings.NewReader` to avoid filesystem
- Step 3 (exercise): `Tee(r io.Reader, w io.Writer) (int64, error)` — copy r→w returning bytes copied. Implement without using `io.Copy`, then compare your version to the stdlib in the explanation that follows

**Lesson 3: JSON**
- Step 1 (explanation): Struct tags, `omitempty`, the difference between `nil` slice and `[]`, custom `MarshalJSON`/`UnmarshalJSON`
- Step 2 (exercise): Decode a heterogeneous JSON document into a typed struct. Test provides input via `strings.NewReader`, asserts on field values
- Step 3 (challenge): Implement `MarshalJSON` on a `Money` type that serializes as `"$12.34"`. Reverse direction in the next step

**Lesson 4: Time, the third hardest thing in computing**
- Step 1 (explanation): `time.Time` vs. `time.Duration`. Monotonic vs. wall clock. Why `time.Now()` in a test is a code smell — inject a clock
- Step 2 (exercise): `BusinessDaysBetween(start, end time.Time) int` — skip Saturdays and Sundays. Test uses fixed dates
- Step 3 (challenge): Build a `Clock` interface and a `FakeClock` for testing a function that times out after 5 seconds. We never actually wait — the fake advances time

**Piston considerations:** Anything involving filesystem paths must use `t.TempDir()` or `bytes.Buffer`/`strings.NewReader`. Piston's no-network constraint is a *feature* here — it forces learners to depend on `io.Reader` instead of `http.Get`, which is the right lesson anyway. The `time.Sleep`-based exercises must be capped (we use the fake clock pattern from Lesson 4 to avoid real waits).

**Reference material:**
- Book: *Learning Go* (Jon Bodner), chapter 11 (stdlib) and chapter 12 (context) — strongest treatment of stdlib idioms
- Book: *100 Go Mistakes and How to Avoid Them* (Teiva Harsanyi), mistakes #75–#83 (time and concurrency primitives) — mined for the "what not to do" framing in explanations
- Docs: https://pkg.go.dev/io and https://pkg.go.dev/encoding/json
- Community reference: Go by Example (https://gobyexample.com) — the JSON, time, and reading-files examples are good starting points; rewrite their tone

---

### 3.3 Go Errors & Interfaces — Intermediate

**Slug:** `go-errors-and-interfaces`
**Prereqs:** `go-fundamentals`
**Learner time:** ~4 hours
**Learning outcomes:**
- Design and consume small interfaces; recognize when to widen vs. narrow
- Wrap and unwrap errors with `errors.Is`, `errors.As`, `%w`
- Define sentinel errors and typed errors, and choose between them
- Use embedding for composition without confusing it with inheritance
- Apply "accept interfaces, return structs" without becoming dogmatic about it

**Lesson 1: Errors as values**
- Step 1 (explanation): Why Go has no exceptions. `error` is just an interface. The shape `if err != nil { return ..., err }` is not boilerplate — it is *deliberate* friction
- Step 2 (exercise): Define `var ErrNotFound = errors.New("not found")`. Implement `Lookup(id string) (Item, error)` that returns `ErrNotFound` on miss. Test asserts via `errors.Is`
- Step 3 (exercise): Wrap an underlying parsing error with `fmt.Errorf("parse %q: %w", input, err)`. Test asserts both the wrapping message and that `errors.Is` finds the inner error

**Lesson 2: Typed errors**
- Step 1 (explanation): When sentinels are insufficient — you need to carry data (e.g., a validation error with the offending field). Define a struct type implementing `Error() string`
- Step 2 (exercise): Define `type ValidationError struct { Field, Reason string }` with an `Error()` method. Implement `ValidateUser(u User) error` returning a `*ValidationError`. Test extracts via `errors.As`
- Step 3 (challenge): Aggregate multiple validation errors into a single `errors.Join`-based error. Test asserts each component is reachable

**Lesson 3: Interfaces are sets of methods**
- Step 1 (explanation): Structural typing — anything that has the methods, satisfies the interface. The empty interface is a type-system escape hatch, not an abstraction. The smaller the interface, the more useful
- Step 2 (exercise): Define a `Notifier` interface with one method `Notify(msg string) error`. Implement two satisfiers (`EmailNotifier`, `LogNotifier`). Test passes both into a function that accepts the interface
- Step 3 (exercise): Refactor an existing function that accepts `*os.File` to accept `io.Writer` instead. Test verifies it now works with `bytes.Buffer`

**Lesson 4: Composition via embedding**
- Step 1 (explanation): Struct embedding promotes fields and methods. This is *not* inheritance — there is no virtual dispatch. The embedded type does not know it is embedded
- Step 2 (exercise): Embed a `Logger` struct in a `Server` struct; call `s.Log(...)` directly via promotion. Test asserts the log line was captured
- Step 3 (challenge): Override a promoted method on the outer type and call the inner version explicitly via `s.Logger.Log(...)`. Tests assert both behaviors

**Piston considerations:** Pure language features — no I/O, no concurrency, no time. Tests rely on `errors.Is`, `errors.As`, and `bytes.Buffer` capture. Deterministic and trivially Piston-compatible.

**Reference material:**
- Book: *100 Go Mistakes* (Harsanyi), mistakes #48–#54 (error handling) — the source of truth for the wrapping/sentinel/typed taxonomy
- Book: *The Go Programming Language* (Donovan & Kernighan), chapter 7 (interfaces) — the canonical treatment, still the clearest
- Talk: Rob Pike, "Go Proverbs" (2015) — "the bigger the interface, the weaker the abstraction" anchors Lesson 3
- Docs: https://pkg.go.dev/errors and https://go.dev/blog/error-handling-and-go

---

### 3.4 Go Testing & TDD — Intermediate

**Slug:** `go-testing-and-tdd`
**Prereqs:** `go-fundamentals`
**Learner time:** ~5 hours
**Learning outcomes:**
- Write idiomatic table-driven tests with `t.Run` subtests
- Use `t.Helper()`, `t.Cleanup()`, `t.TempDir()` correctly
- Test using `httptest`, `bytes.Buffer`, `strings.NewReader` instead of mocks
- Apply the "test doubles without a mocking library" pattern using small interfaces
- Write benchmarks and read the output without lying to themselves

**Lesson 1: The shape of a Go test**
- Step 1 (explanation): `func TestXxx(t *testing.T)`, `t.Errorf` vs. `t.Fatalf`, why we don't use assertion libraries. The standard tooling is the testing library
- Step 2 (exercise): Write a passing test for a provided function. Then write a failing test that catches a documented bug. Two-step pattern teaches that tests describe behavior, not implementation
- Step 3 (exercise): Convert three near-duplicate test functions into a single table-driven test with `t.Run`. Test asserts that all three subtests are still discoverable by name

**Lesson 2: Subtests, helpers, and cleanup**
- Step 1 (explanation): `t.Run` for hierarchy and parallel control. `t.Helper()` so failures point at the call site, not the helper. `t.Cleanup` over `defer` for setup that survives helper boundaries
- Step 2 (exercise): Write a helper `mustParse(t *testing.T, s string) Time` that fails the test on parse error. Tests verify the helper marks itself as a helper
- Step 3 (challenge): Use `t.TempDir` to write a file, then assert it is auto-cleaned. Forces the learner to look up the contract

**Lesson 3: Test doubles without a mocking library**
- Step 1 (explanation): Go's interfaces make mocks trivial — define the interface at the consumer, hand-write a fake. Mocking libraries (`gomock`, `testify/mock`) generate noise; a 5-line struct is clearer
- Step 2 (exercise): Define a `Clock` interface, write a `FakeClock`, test a function that uses it. No external library
- Step 3 (exercise): Test a function that calls a `Notifier` by passing a `RecordingNotifier` that captures calls in a slice. Test asserts the captured slice

**Lesson 4: Benchmarks (briefly), examples, and fuzzing**
- Step 1 (explanation): `func BenchmarkXxx(b *testing.B)` and the `b.N` loop. Why allocations matter (`b.ReportAllocs`). `Example_xxx` functions are tested via output comparison
- Step 2 (exercise): Write a benchmark for two implementations of `Reverse`. Test verifies both implementations produce identical output (the benchmark is run separately, not asserted in CI here)
- Step 3 (challenge): Write a `func FuzzParse(f *testing.F)` with a single seed. The Piston runner executes a bounded fuzz (e.g., `-fuzztime=1s`) and asserts no crashes

**Piston considerations:** This is the course where the testing model and the platform model align most cleanly — everything we ask the learner to write is exactly what `go test` runs. Fuzzing is bounded by `-fuzztime`; Piston's 15–30s timeout gives us room. Benchmarks are written but not asserted on (timing is non-deterministic in a sandbox). Confirm during implementation that Piston's Go image supports `go test -fuzz` (Go 1.18+).

**Reference material:**
- Book: *Learning Go* (Jon Bodner), chapter 13 (writing tests) — best modern treatment of `t.Run`, `t.TempDir`, `t.Cleanup`
- Book: *Test-Driven Development with Go* / *Learn Go with Tests* (Chris James, https://quii.gitbook.io/learn-go-with-tests) — the structure of Lessons 1–3 borrows heavily from this; cite it
- Docs: https://pkg.go.dev/testing
- Community reference: Mat Ryer, "Idiomatic Go Tricks" — the fake-over-mock pattern in Lesson 3 is his

---

### 3.5 Go Concurrency — Intermediate

**Slug:** `go-concurrency`
**Prereqs:** `go-stdlib-and-io`, `go-testing-and-tdd`
**Learner time:** ~7 hours
**Learning outcomes:**
- Reason about a Go program's happens-before relationships
- Use channels for *coordination*, not for shared state
- Pick the right primitive: channel, mutex, `WaitGroup`, `Once`, `errgroup`
- Propagate cancellation with `context.Context`
- Detect race conditions with `-race` and write tests that catch them

**Lesson 1: Sequential Go isn't slow (a deliberately anti-climactic opener)**
- Step 1 (explanation): A scheduler exists, but you don't need it. We will spend the next two lessons showing what concurrency is *for* before showing how to write it. If you do not have a real reason to be concurrent, you do not need to be
- Step 2 (exercise): Write a sequential pipeline: `read → parse → transform → aggregate`. No goroutines. Test asserts the result and the order of operations via a recording fake
- Step 3 (exercise): Same pipeline, refactored into four functions composed by the caller. Forces the abstraction shape that the channel version will use later

**Lesson 2: `sync` first**
- Step 1 (explanation): `sync.Mutex`, `sync.RWMutex`, `sync.WaitGroup`, `sync.Once`. We teach mutexes *before* channels because shared-memory concurrency is what the hardware does — channels are a higher-level abstraction over the same thing
- Step 2 (exercise): Build a thread-safe `Counter` using `sync.Mutex`. Test runs `t.Parallel()` increments and asserts the final value
- Step 3 (exercise): Use `sync.Once` to memoize an expensive computation. Test asserts the underlying function is called exactly once across N goroutines

**Lesson 3: Goroutines and channels**
- Step 1 (explanation): `go f()` is just "schedule this". Channels are typed pipes. Unbuffered = synchronous handoff. Buffered = bounded queue. "Don't communicate by sharing memory; share memory by communicating" — but understand both first
- Step 2 (exercise): `FanOut(in []int, workers int, fn func(int) int) []int` — distribute work across N goroutines, gather results. Output order must match input order. Test asserts on order
- Step 3 (exercise): A producer goroutine sends N values; a consumer goroutine receives until the channel is closed. Test asserts the consumer terminates and the sum matches

**Lesson 4: `select` and cancellation**
- Step 1 (explanation): `select` chooses among ready channel operations. The default branch. Why `select` is what makes channels actually useful
- Step 2 (exercise): Implement `WithTimeout(work func() int, d time.Duration) (int, bool)` using `select` and a timer. Test uses a fake clock or `time.After` with a short-but-real duration
- Step 3 (challenge): Propagate `context.Context` through a worker function — return early when `ctx.Done()` fires. Test cancels mid-flight and asserts the worker stopped within a deadline

**Lesson 5: Patterns and pitfalls**
- Step 1 (explanation): Worker pools, fan-in/fan-out, pipelines. The four canonical leak patterns: forgotten goroutine on early return, blocked send on a closed channel, unbuffered channel with no receiver, double-close panic
- Step 2 (exercise): Build a bounded worker pool with `Submit` and `Shutdown`. Test asserts no leak via a deadline-bound `Shutdown`
- Step 3 (challenge): Refactor a buggy program where the test passes without `-race` and fails with it. The learner must fix the data race

**Piston considerations:** This is the course where Piston bites hardest. Goroutine *scheduling* is non-deterministic by design, so any test that asserts on ordering of concurrent operations will be flaky in any sandbox. We mitigate via three rules: (1) tests assert on *outcomes* (final counter value, sum of results) not intermediate scheduling; (2) where order matters, the exercise itself must enforce it (e.g., results gathered by index, not by completion time); (3) `go test -race` is enabled where Piston supports it — confirm during implementation. Real-world concurrency exercises (saturating CPU cores, network coordination) are out of scope; we replace them with deterministic-by-design problems.

**Reference material:**
- Book: *Concurrency in Go* (Katherine Cox-Buday) — the structural source for Lessons 3–5; the leak taxonomy in Lesson 5 is hers
- Book: *100 Go Mistakes* (Harsanyi), chapters 8–9 (concurrency: foundations + practice) — pitfalls and counter-examples
- Book: *Learning Go* (Bodner), chapter 10 — gentler introduction, used to inform Lessons 1–2 ordering
- Talk: Rob Pike, "Go Concurrency Patterns" (Google I/O 2012) and "Concurrency is not Parallelism"
- Community reference: Ardan Labs Ultimate Go (Bill Kennedy) — the "mechanical sympathy" framing for Lesson 2 borrows from his goroutine scheduling material

---

### 3.6 Go Networking & HTTP — Advanced

**Slug:** `go-networking-and-http`
**Prereqs:** `go-stdlib-and-io`, `go-errors-and-interfaces`
**Learner time:** ~6 hours
**Learning outcomes:**
- Build an `http.Server` with handlers, middleware, and routing
- Test HTTP handlers using `httptest.NewServer` and `httptest.NewRecorder`
- Build an `http.Client` with timeouts and `context.Context`
- Design a small JSON API end-to-end: routing, validation, serialization, error responses
- Recognize the limits of the stdlib router and when (and when not) to reach for `chi`/`gorilla`

**Lesson 1: `http.Handler` is one method**
- Step 1 (explanation): The `http.Handler` interface (`ServeHTTP(w, r)`). `http.HandlerFunc` adapter. `http.ServeMux` (and the 1.22 enhancements). Why handlers are just functions
- Step 2 (exercise): Implement a handler `helloHandler(w http.ResponseWriter, r *http.Request)` returning `"hello, <name>"` from `?name=`. Test uses `httptest.NewRecorder` and asserts on body + status
- Step 3 (exercise): Same handler, registered on a `*http.ServeMux` with two routes (`/hello` and `/health`). Test asserts both via the mux

**Lesson 2: Middleware as decoration**
- Step 1 (explanation): A middleware is `func(http.Handler) http.Handler`. Composition by wrapping. Why the stdlib doesn't have a middleware "framework" — it doesn't need one
- Step 2 (exercise): Write a `LoggingMiddleware` that captures method+path to an `io.Writer`. Test passes a `bytes.Buffer` and asserts on the captured line
- Step 3 (challenge): Compose three middlewares (logging, request-ID injection, panic recovery) and assert order via a recording handler

**Lesson 3: JSON APIs**
- Step 1 (explanation): Decoding request bodies with `json.NewDecoder`. Validation. Error response shape (`{"error": "..."}`). Why you should not use `http.Error` for JSON APIs
- Step 2 (exercise): A `POST /users` handler that decodes a `User` JSON body, validates the email field, and returns 400 + JSON error on failure. Test posts both valid and invalid bodies
- Step 3 (exercise): A `GET /users/{id}` handler (using Go 1.22 `net/http.ServeMux` patterns) returning a JSON user or 404. Test covers both cases

**Lesson 4: Clients, timeouts, and `context`**
- Step 1 (explanation): The default `http.Client` has *no timeout*. Always set one. Use `http.NewRequestWithContext` for cancellation. The body must always be closed — use a helper
- Step 2 (exercise): Write `Fetch(ctx context.Context, url string) ([]byte, error)` with a custom client and a 5-second timeout. Test runs against `httptest.NewServer`
- Step 3 (challenge): Implement retry-with-backoff for 5xx responses, capped at 3 attempts. Test uses an `httptest` server that returns 503 twice, then 200

**Piston considerations:** This is the most important Piston caveat in the entire track. **Real network access is forbidden in Piston**, so this course is built entirely on `net/http/httptest`. `httptest.NewServer` runs an in-process HTTP server on a loopback port — Piston's nsjail allows loopback by default in most configurations. Confirm during implementation that Piston's Go runtime allows binding to 127.0.0.1; if not, fall back to `httptest.NewRecorder` (no real socket, just `http.ResponseWriter` capture) for all tests. The pedagogical compromise: learners do not get to call out to a real API. We mitigate by making the *server* exercises drive the HTTP semantics, and the *client* exercises target an in-process `httptest.Server`. This is actually closer to how production HTTP code should be tested anyway.

**Reference material:**
- Book: *Let's Go* + *Let's Go Further* (Alex Edwards) — the canonical modern treatment of `net/http` and JSON APIs; structure of Lessons 2–3 borrows from these
- Book: *Learning Go* (Bodner), chapter 14 — solid baseline reference
- Docs: https://pkg.go.dev/net/http and https://pkg.go.dev/net/http/httptest
- Community reference: Mat Ryer, "How I write HTTP services in Go" — the handler-as-method-on-a-server-struct pattern in Lesson 2 is his

---

### 3.7 Go Generics Deep Cuts — Specific / Advanced

**Slug:** `go-generics-deep-cuts`
**Prereqs:** `go-errors-and-interfaces`, `go-testing-and-tdd`
**Learner time:** ~4 hours
**Learning outcomes:**
- Write generic functions and types using type parameters
- Express constraints with the `constraints` package and custom interface constraints
- Decide when generics improve a design and when they merely complicate it
- Use type inference idiomatically and recognize when explicit instantiation is required
- Read and reason about the standard library's use of generics (`slices`, `maps`, `cmp`)

**Lesson 1: The smallest generic function**
- Step 1 (explanation): Why Go resisted generics for a decade and why the team finally added them. The minimal syntax: `func Map[T, U any](in []T, fn func(T) U) []U`. Type inference at the call site
- Step 2 (exercise): Implement `Map`, `Filter`, `Reduce` over `[]T`. Tests call them on `[]int` and `[]string` — same generic, two instantiations
- Step 3 (exercise): Compare your `Filter` to `slices.DeleteFunc`. Discussion: when is the stdlib version preferable?

**Lesson 2: Constraints**
- Step 1 (explanation): `comparable`, `any`, the `~` underlying-type operator, custom interface constraints. Why `Ordered` is in `cmp`, not built-in
- Step 2 (exercise): Implement `Min[T cmp.Ordered](xs ...T) T`. Test on `[]int`, `[]float64`, `[]string`
- Step 3 (challenge): Implement a `Set[T comparable]` type backed by `map[T]struct{}` with `Add`, `Has`, `Remove`. Tests use multiple element types

**Lesson 3: When NOT to use generics**
- Step 1 (explanation): The "do not use generics until you have written the same function twice for two types" rule. Generics complicate signatures, slow compilation, and are sometimes harder to read than three concrete versions. The Go team's own guideline
- Step 2 (exercise): Refactor a generic function back to a non-generic interface-based version. Compare readability. The test asserts both produce the same output; the lesson is in the diff
- Step 3 (challenge): Read three real stdlib generic functions (`slices.SortFunc`, `slices.BinarySearchFunc`, `maps.Keys`) and answer multiple-choice questions about why each one is generic. (Hint-driven step, not a code submission)

**Lesson 4: Type sets and the union operator**
- Step 1 (explanation): Union constraints (`int | int64 | float64`), the `~` prefix for any underlying-typed type, why this is *not* a substitute for runtime polymorphism
- Step 2 (exercise): Define `type Numeric interface { ~int | ~int64 | ~float64 }` and implement `Sum[T Numeric](xs []T) T`. Test on a custom `type Celsius float64`
- Step 3 (challenge): Try to add `string` to the constraint and watch the test fail to compile. Compile-time errors are part of the curriculum here — Piston should surface them clearly

**Piston considerations:** Compile errors are first-class output for this course (Lesson 4 step 3 *requires* a failing compile). Confirm Piston returns compiler stderr in a parseable form so we can assert on the error message, not just the exit code. All exercises are pure functions, fully deterministic, no I/O, no concurrency.

**Reference material:**
- Book: *Learning Go* (Bodner), chapter 8 (generics) — the most up-to-date book treatment as of the second edition
- Book: *100 Go Mistakes* (Harsanyi), the post-1.18 supplement on generics misuse
- Talk: Robert Griesemer & Ian Lance Taylor, "Generics in Go" (GopherCon 2021) — the design intent
- Docs: https://go.dev/blog/intro-generics, https://pkg.go.dev/slices, https://pkg.go.dev/cmp
- Community reference: Eli Bendersky's blog post series on Go generics — best deep-dive on type sets

---

## 4. Cross-course exercise patterns

Each step's `testCode` is a generated `<name>_test.go` file that lives alongside the learner's submitted code in a temp directory. Piston compiles and runs `go test ./...` (or equivalent) and surfaces the stdout/stderr/exit-code triple back to the platform. The platform parses Go's standard test output (`--- FAIL: TestX`, `PASS`, panic stack traces) into pass/fail per case. This is the model every exercise in every course must fit into.

A consequence: every exercise must compose the learner's code into a single-package, single-file (or one-file-plus-one-test-file) Go program. Multi-file architecture exercises are not supportable until the Piston runner gains multi-file submission support — currently a known Phase 1 limitation.

Exercise shapes that work well in Piston for Go:

| Pattern | Why it works |
|---|---|
| **Pure functions over slices/maps** | Deterministic input → deterministic output. The bread and butter of every course. |
| **Table-driven tests** | Match Go's idiomatic test shape; one step can cover 5+ cases compactly. |
| **Interface-based composition** | Define interface, ship two implementations, test both via the same handler. Naturally Piston-friendly. |
| **`bytes.Buffer` / `strings.NewReader` for I/O** | No filesystem, no network, fully in-memory. |
| **`httptest.NewServer` for HTTP** | In-process server on loopback. Tests behave identically to real network code. |
| **Error-propagation chains with `errors.Is` / `errors.As`** | Correctness asserted via type identity, not string matching. Robust. |
| **`t.TempDir` for filesystem exercises** | Auto-cleaned, isolated per test. |
| **Bounded fuzzing (`-fuzztime=1s`)** | Fits comfortably in Piston's timeout window. |

Patterns that **do not** work and require pedagogical compromise:

| Pattern | Why it fails | Workaround |
|---|---|---|
| **Real concurrency timing assertions** | Goroutine scheduling is non-deterministic. | Assert on outcomes (final values, sums), not on intermediate scheduling. |
| **Real network calls (`http.Get` to internet)** | Piston has no network egress. | `httptest.NewServer` for everything. |
| **Long-running goroutines / daemons** | Piston is one-shot per execution; no persistence. | Always design with a deadline-bound shutdown. |
| **Wall-clock-based tests (`time.Sleep`, real `time.Now()`)** | Slow and flaky in a sandbox. | Inject a `Clock` interface and use a fake. |
| **Multi-file projects with `go.mod` and external deps** | Piston runs single-program executions; no `go get`. | Keep everything in one file or one generated test file alongside. Stdlib only. |
| **Race detector dependency** | `-race` may or may not be available in Piston's Go image. | Confirm during implementation; if absent, write tests that catch the race deterministically (e.g., asserting on a counter under contention). |
| **Benchmarks as pass/fail** | Timing is non-deterministic in a shared sandbox. | Benchmarks may be *written* (Lesson 3.4.4) but not asserted on. |

---

## 5. Known pedagogical pitfalls

1. **Teaching `interface{}` / `any` before structural typing has clicked.** Learners who see `interface{}` early treat Go as a dynamic language with extra steps. We do not introduce `any` until Section 3.7 (generics) — by then the learner has internalized that interfaces are sets of methods, not type-system escape hatches.

2. **Goroutines before sequential Go is solid.** This is the single most common Go-curriculum mistake, including in the official Tour. We deliberately gate concurrency behind both stdlib and testing, and we open the concurrency course (3.5.1) with a sequential lesson.

3. **Channels before `sync`.** Conventional wisdom (and Rob Pike's quote) says "share memory by communicating", which gets misread as "channels are always better than mutexes". For a learner this is misleading — they need to understand shared-memory concurrency to appreciate why CSP is a higher-level abstraction over the same hardware. We teach `sync.Mutex` (3.5.2) before channels (3.5.3).

4. **Generics as the default abstraction mechanism.** Go's generics are deliberately constrained and exist mostly for library authors. A learner who reaches for generics first writes Java-in-Go. Section 3.7.3 is explicitly titled "When NOT to use generics" and forces the learner to refactor a generic function back to an interface-based one.

5. **Mocking libraries.** `gomock`, `testify/mock`, and similar tools generate noise that obscures Go's natural strength: small, hand-written fakes built on small interfaces. We never introduce a mocking library; Section 3.4.3 makes this explicit.

6. **`panic`/`recover` as exception handling.** They aren't. The only place `recover` legitimately appears in this curriculum is the panic-recovery middleware in Section 3.6.2, and it is framed as a defensive measure for HTTP servers, not a control-flow tool.

7. **`init()` functions.** Magic action-at-a-distance. Not taught at all in this curriculum. If a learner discovers them later, they will already understand why they should not use them.

8. **Reflection.** Out of scope. A learner who needs reflection in their first year of Go is solving the wrong problem.

---

## 6. External references

### Books

| Title | Author(s) | Where it informs the curriculum |
|---|---|---|
| *The Go Programming Language* | Alan A. A. Donovan & Brian W. Kernighan (2015) | Canonical structural source for sections 3.1 and 3.3. Dated on modules and generics; still definitive on interfaces. |
| *Learning Go* (2nd ed.) | Jon Bodner (2024) | Modern, idiomatic, best "why" explanations. Default reference across most courses. |
| *100 Go Mistakes and How to Avoid Them* | Teiva Harsanyi (2022) | Source for "what not to do" framing in 3.2, 3.3, 3.5. The taxonomy of error patterns is from this book. |
| *Concurrency in Go* | Katherine Cox-Buday (2017) | Structural source for the entire concurrency course. The leak taxonomy in 3.5.5 is hers. |
| *Let's Go* + *Let's Go Further* | Alex Edwards (self-published, updated annually) | Structural source for 3.6 (HTTP). The handler-as-method, middleware-as-decoration patterns are his. |
| *Go in Action* | William Kennedy, Brian Ketelsen, Erik St. Martin (2015) | Older but the "mechanical sympathy" framing influences 3.5.2. |

### Online platforms

| Platform | Use |
|---|---|
| **A Tour of Go** (https://go.dev/tour) | Reference baseline. We deliberately diverge from its order (it teaches goroutines too early). |
| **Exercism Go track** (https://exercism.org/tracks/go) | Borrow exercise *shapes* (test scaffolds) for fundamentals. Avoid borrowing the prose. |
| **Gophercises** (Jon Calhoun, https://gophercises.com) | Source of inspiration for the project-flavored exercises in 3.2 and 3.6. Note: many of his exercises require dependencies — we strip those down for Piston. |
| **Go by Example** (https://gobyexample.com) | Quick-reference style; useful for the explanation-step prose in 3.2. |
| **Ardan Labs Ultimate Go** (Bill Kennedy) | "Mechanical sympathy" framing for 3.5. Heavyweight and opinionated — used as a sanity check, not a primary source. |
| **Learn Go with Tests** (Chris James, https://quii.gitbook.io/learn-go-with-tests) | Single biggest influence on 3.4 (testing). The TDD-first structure of that course is borrowed directly. |
| **Udemy: Jose Portilla / Stephen Grider Go courses** | Surveyed for completeness; not used as a structural source — both spend too much time on syntax and too little on idioms. |

### Official documentation

- https://go.dev/doc/effective_go — Effective Go. Required reading; cited in 3.1 and 3.3
- https://go.dev/doc/code — How to write Go code. Module structure baseline
- https://go.dev/blog/ — The official blog. Specific posts cited per course
- https://pkg.go.dev/std — Standard library reference. Linked throughout

### Community learning resources

- **Go Time podcast** (Changelog) — broad listening for tone and current debates; not a curriculum source
- **GopherCon talks** (YouTube) — specific talks cited in 3.5 and 3.7
- **Mat Ryer's blog and YouTube** — handler patterns in 3.6, fake-over-mock in 3.4
- **Eli Bendersky's blog** (https://eli.thegreenplace.net) — generics deep dives for 3.7
- **Dave Cheney's blog** (https://dave.cheney.net) — error handling and "the bigger the interface, the weaker the abstraction" framing

---

## 7. Suggested implementation order

Build in this order. The dependency graph and pedagogical risk both push in the same direction.

1. **`go-fundamentals`** — first, always. Validates the Piston Go pipeline (`_test.go` generation, `go test` invocation, error surfacing). If anything is broken in the Piston Go runtime, this course flushes it out before we have written 100 steps that depend on it.

2. **`go-errors-and-interfaces`** — second. Small, pure, no I/O, no concurrency. Establishes the idiom layer that every later course relies on. Quick to write and quick to validate.

3. **`go-stdlib-and-io`** — third. Introduces `io.Reader`/`io.Writer` and JSON, both of which are dependencies for HTTP. Builds on errors-and-interfaces directly.

4. **`go-testing-and-tdd`** — fourth. Could arguably be earlier, but learners benefit from having seen real exercises (in courses 1–3) before stepping back to think about how those exercises are tested. Also: this course's content is *meta* on the Piston test-runner pipeline, so we want that pipeline well-shaken-down first.

5. **`go-networking-and-http`** — fifth. Highest Piston risk (network sandboxing). We want every other course battle-tested before we hit the `httptest`-on-loopback question. If `httptest.NewServer` cannot bind in Piston, we fall back to `httptest.NewRecorder` and rewrite affected steps — this is a known risk to flag with the reviewer.

6. **`go-concurrency`** — sixth. Hardest content, highest pedagogical stakes. By this point we have a battle-tested Piston pipeline, a learner pool that has seen 4+ courses, and confidence in the test-determinism workarounds.

7. **`go-generics-deep-cuts`** — last. Specific / optional course. Compile-error-as-output (Lesson 3.7.4 step 3) needs Piston stderr surfacing to be solid; least urgent and most experimental.

A phased rollout would ship courses 1–3 as a "Go Basics" bundle, courses 4–5 as "Go Intermediate", and courses 6–7 individually as advanced electives.

### Open questions for the human reviewer

These need a human decision before we start authoring step content:

1. **Piston Go runtime version.** Generics require ≥1.18, fuzzing requires ≥1.18, `net/http.ServeMux` patterns require ≥1.22. Confirm the Piston image's pinned Go version and whether we can request a bump.
2. **Module mode in Piston.** Does the runner generate a minimal `go.mod` per execution or run with `GO111MODULE=off`? Affects whether stdlib-only is automatic or must be enforced by review.
3. **`go test -race` availability.** If the race detector is unavailable (it requires CGO and a libc), Section 3.5.5 needs to be rewritten to catch races deterministically without `-race`.
4. **Loopback networking in nsjail.** Critical for Section 3.6 — does Piston's sandbox allow `net.Listen("tcp", "127.0.0.1:0")` for `httptest.NewServer`? If not, the entire HTTP course collapses to `httptest.NewRecorder` only and we lose middleware-chain integration tests.
5. **Compiler stderr surfacing.** Section 3.7.4.3 requires asserting on compile-error messages, not just exit code. Confirm Piston returns Go's compiler diagnostics in a parseable form.
6. **Multi-file submissions.** Currently a Phase 1 limitation. If this changes, several "challenge" steps could become small project exercises rather than single-function exercises — a meaningful upgrade for the advanced courses.
