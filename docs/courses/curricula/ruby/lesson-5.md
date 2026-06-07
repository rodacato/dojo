# Ruby — Lesson 5: Methods

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-07
> **Spec:** [ruby.md §4 Lesson 5](ruby.md#lesson-5--methods)
> **Primary audience:** A1 Mariana (JS Senior), A2 Esteban (Python Mid-Senior). Secondary: A4 Felipe.
> **Step count:** 4 (1 `read` + 2 `kata` + 1 `challenge`).

Production prose for each step's fields. Content in English, meta-notes in Spanish where helpful.

This is the scroll's closing lesson. It closes the loop the object-model lesson opened — methods are objects too — and ends with the "what we didn't cover" list pointing at deep-dive scrolls.

---

## Step 5.1 — `read` — "Keyword args, splats, implicit return, and method introspection"

**Title:** `Keyword args, splats, implicit return, and method introspection`
**Type:** `read`
**Word count target:** ~370.

### `instruction` (markdown body)

```markdown
## Why this matters

You've defined methods in every previous lesson — `repeat`, `summarize`, `safe_call`, `classify`. This step makes the parameter list and the return mechanism explicit. The Ruby-specific parts: how keyword arguments differ from Python's `**kwargs`, how splats compose, and the fact that methods are themselves introspectable objects (closing the loop from Lesson 3).

## Keyword arguments — separate from positional

```ruby
def greet(name:, greeting: "Hello")
  "#{greeting}, #{name}!"
end

greet(name: "Ada")                   # => "Hello, Ada!"
greet(name: "Linus", greeting: "Hej") # => "Hej, Linus!"
greet()                              # ArgumentError: missing keyword: :name
```

The trailing colon (`name:`) makes the parameter **keyword-only**. The caller must use the keyword form; positional won't work. Defaults work the same as for positional args (`greeting: "Hello"`).

This is the part that surprises Python developers: in Python, `def f(name)` is equivalent to `def f(*, name)` only when you make it so with the bare `*`. In Ruby, the trailing colon on the parameter is the syntactic switch — positional and keyword are entirely separate slots, not flavours of the same thing.

## Splats — `*args` and `**opts`

```ruby
def tally_args(*nums, **opts)
  { positional: nums, keyword: opts }
end

tally_args(1, 2, 3, label: "x", verbose: true)
# => { positional: [1, 2, 3], keyword: { label: "x", verbose: true } }
```

`*args` collects extra positional arguments into an Array. `**opts` collects extra keyword arguments into a Hash. They compose with named parameters:

```ruby
def request(url, *headers, method: "GET", **extras)
  # ...
end
```

**Python developers:** `**opts` is essentially Ruby's `**kwargs` — same mechanism, same shape. `*nums` is Ruby's `*args`. For the splats, the analogy holds. Where Ruby diverges from Python is in how it handles a *block* — captured as a separate single-slot argument with `&block` (Lesson 1), with no Python equivalent. The splats: same model. The block: Ruby-only.

This pattern is how every Ruby DSL turns method calls into data — Rails' `has_many :posts, dependent: :destroy` is `has_many(:posts, dependent: :destroy)`, with `:posts` as positional and `dependent: :destroy` as a keyword. The framework receives the data as method parameters and decides what to do with it.

## Implicit return — the last expression is the value

```ruby
def double(n)
  n * 2          # this is what the method returns
end

double(5)        # => 10
```

Every method returns its last expression's value. No `return` keyword needed for the common case. Use explicit `return` for early exits (`return nil if x.nil?`) — never for the last line.

This is the same rule blocks follow (Lesson 1's `yield` discussion). Method, block, lambda — every chunk of code in Ruby returns its last expression by default.

## Methods are objects too — `Method#parameters`

The object-model rule from Lesson 3 applies to methods: a method is an object you can fetch with `method(:name)`, and that object has a `.parameters` method that tells you what shape it accepts.

```ruby
def greet(name:, greeting: "Hello", *titles, **extras)
  # ...
end

method(:greet).parameters
# => [[:keyreq, :name], [:key, :greeting], [:rest, :titles], [:keyrest, :extras]]
```

Each entry is `[kind, name]`. The kinds: `:req` (required positional), `:opt` (optional positional), `:rest` (`*args`), `:keyreq` (required keyword), `:key` (optional keyword), `:keyrest` (`**opts`), `:block` (`&block`).

This is how introspection libraries — and metaprogramming-heavy frameworks — work. They ask the method what it expects, then build something appropriate. The challenge at the end of this lesson exercises it directly.

## What we didn't cover

Four things you'll encounter in real Ruby that aren't in this scroll: `attr_accessor` (encapsulation cost vs syntax), `method_missing` (dynamic dispatch via missing-message hook), eigenclasses (singleton class on every object), and monkey-patching (reopening core classes). All real, all powerful, all foot-gun-shaped. They live in the OOP and metaprogramming deep-dive scrolls — not in a 90-minute polyglot crash.

**You don't need to memorise the names now.** When one of these shows up in production Ruby — and one will — you'll recognise that you're looking at a named, deferred topic and you'll know there's a deep-dive scroll for it. That's the goal: *recognise, don't memorise*. Reach for the deep-dive when the footgun fires.
```

### Paragraph-test audit

| Paragraph | Removes what polyglot decision? | Verdict |
|---|---|---|
| "Why this matters" | "Will this re-teach how to define a function?" — anti-tour-guide | KEEP |
| "Keyword arguments — separate from positional" | The Python-vs-Ruby kwargs distinction | KEEP |
| "Splats" | "What's `*args` / `**opts` in Ruby and how do they compose?" | KEEP |
| "Implicit return" | "Do I need `return` everywhere or is the last expression enough?" | KEEP |
| "Methods are objects too" | Closes the loop from Lesson 3; sets up the challenge | KEEP |
| "What we didn't cover" | "Where do I go next? What did I deliberately not learn?" | KEEP — named-and-deferred per §2.5 |

Cut from draft: a paragraph on default-value evaluation timing (`def f(x = some_expr)` evaluates `some_expr` per-call) — interesting but deep-dive; a paragraph on `BasicObject#method_missing` and how it composes with `method` — that's metaprogramming territory.

---

## Step 5.2 — `kata` — `greet(name:, greeting: "Hello")`

**Title:** `greet(name:, greeting: "Hello") — required and default keyword args`
**Type:** `kata`

### `instruction`

```markdown
## Your task

Write a method `greet` whose **signature** matches all of the following:

- `name` is a **keyword-only required** parameter.
- `greeting` is a **keyword-only optional** parameter, defaulting to `"Hello"`.
- Positional calls must raise `ArgumentError`.
- Calls missing `name` must raise `ArgumentError`.

The body is one line of string interpolation returning `"<greeting>, <name>!"`.

## Examples

```ruby
greet(name: "Ada")                    # => "Hello, Ada!"
greet(name: "Linus", greeting: "Hej") # => "Hej, Linus!"
greet()                               # raises ArgumentError
greet("Ada")                          # raises ArgumentError (positional)
```

## Why this kata exists

**The body is trivial — one line. The kata is the signature.** Writing `def greet(name, greeting = "Hello")` (positional with default) makes the first two tests pass but breaks the fourth — Ruby happily accepts `greet("Ada")`. The keyword-only signature (trailing colons on the parameter names) is what the tests are checking. Get the signature right, and the body is one line of `"#{greeting}, #{name}!"`.
```

### `starterCode`

```ruby
# Write the signature so `greet` is keyword-only:
#   - name: required (no default)
#   - greeting: defaults to "Hello"
# Then write the one-line body.

def greet
  # Your code here.
end
```

### `testCode`

```ruby
_t('greets with default greeting') do
  _eq greet(name: "Ada"), "Hello, Ada!"
end

_t('greets with custom greeting') do
  _eq greet(name: "Linus", greeting: "Hej"), "Hej, Linus!"
end

_t('raises ArgumentError when name is missing') do
  begin
    greet(greeting: "Hey")
    raise "expected ArgumentError"
  rescue ArgumentError
    _eq true, true
  end
end

_t('raises ArgumentError when called positionally') do
  begin
    greet("Ada")
    raise "expected ArgumentError"
  rescue ArgumentError
    _eq true, true
  end
end
```

### `hint`

> The signature is already given to you in the starter code — your job is the one-line body that interpolates the two parameters into the return string. The reason this kata exists is to write a method whose signature couldn't be called positionally; the body itself is one line of interpolation.

### `solution`

```ruby
def greet(name:, greeting: "Hello")
  "#{greeting}, #{name}!"
end
```

### `alternativeApproach`

> If you wrote `def greet(name, greeting = "Hello")` (positional with a default), the method works for the first two tests but fails the fourth one — Ruby happily accepts `greet("Ada")` because `name` is the first positional. The keyword-only signature (trailing colons) is the part the kata is exercising.
>
> A method that wants to accept both positional and keyword would split the signature: `def f(name, greeting: "Hello")` — positional `name`, keyword `greeting`. That's a valid pattern when one argument is so essential it deserves a positional slot and others are options. For two equally important parameters, keyword-only reads better at the call site (`greet(name: ..., greeting: ...)` is self-documenting; `greet("Ada", "Hej")` six months later requires looking up the signature).

---

## Step 5.3 — `kata` — `tally_args(*nums, **opts)`

**Title:** `tally_args(*nums, **opts) — splat both ways`
**Type:** `kata`

### `instruction`

```markdown
## Your task

Implement `tally_args(*nums, **opts)` that returns a Hash:

```
{
  positional_count: <number of positional args>,
  keyword_count: <number of keyword args>,
  positional: <the positional args as an Array>,
  keyword: <the keyword args as a Hash>,
}
```

## Examples

```ruby
tally_args(1, 2, 3, label: "x")
# => {
#      positional_count: 3,
#      keyword_count: 1,
#      positional: [1, 2, 3],
#      keyword: { label: "x" },
#    }

tally_args()
# => {
#      positional_count: 0,
#      keyword_count: 0,
#      positional: [],
#      keyword: {},
#    }

tally_args("a", verbose: true, mode: :strict)
# => {
#      positional_count: 1,
#      keyword_count: 2,
#      positional: ["a"],
#      keyword: { verbose: true, mode: :strict },
#    }
```

The signature uses both splats. `*nums` collects all positional args into an Array. `**opts` collects all keyword args into a Hash. The Hash you return uses symbol keys (`positional_count:`, `keyword_count:`, `positional:`, `keyword:`).
```

### `starterCode`

```ruby
def tally_args(*nums, **opts)
  # Your code here.
end
```

### `testCode`

```ruby
_t('three positionals and one keyword') do
  result = tally_args(1, 2, 3, label: "x")
  expected = { positional_count: 3, keyword_count: 1, positional: [1, 2, 3], keyword: { label: "x" } }
  _eq result, expected
end

_t('no arguments at all') do
  result = tally_args()
  expected = { positional_count: 0, keyword_count: 0, positional: [], keyword: {} }
  _eq result, expected
end

_t('one positional and two keywords') do
  result = tally_args("a", verbose: true, mode: :strict)
  expected = { positional_count: 1, keyword_count: 2, positional: ["a"], keyword: { verbose: true, mode: :strict } }
  _eq result, expected
end
```

### `hint`

> Both splats give you exactly what you need — `nums` is already an Array, `opts` is already a Hash. Their lengths are the counts. The return is one Hash literal with four entries.

### `solution`

```ruby
def tally_args(*nums, **opts)
  {
    positional_count: nums.length,
    keyword_count: opts.length,
    positional: nums,
    keyword: opts,
  }
end
```

### `alternativeApproach`

> A Ruby idiom worth knowing: if you wanted to also accept and pass on a block, the full splat list is `(*nums, **opts, &block)`. Combined with `Method#parameters` from the read, you can write methods that adapt to any call shape — which is exactly how Rails routing, RSpec matchers, and most DSL libraries work under the hood.
>
> If you found yourself reaching for `*nums.size` (no method `size`), remember `nums` is *already* an Array — it's not a splatted shape inside the method body. The same goes for `opts` — it's a Hash from the moment you enter the method.

---

## Step 5.4 — `challenge` — `parameters_of(method_name)`

**Title:** `parameters_of(method_name) — introspect a method's signature`
**Type:** `challenge` (no hint by default)

### `instruction`

```markdown
## Your task

Implement `parameters_of(method_name)` that takes a Symbol naming a method defined in the current scope, and returns a Hash counting how many parameters of each kind the method has:

```
{
  required: <count of :req — required positional>,
  optional: <count of :opt — optional positional with default>,
  keyword_required: <count of :keyreq — required keyword (name:)>,
  keyword_optional: <count of :key — optional keyword (name: default)>,
  rest: <true if the method has *args, false otherwise>,
  keyrest: <true if the method has **opts, false otherwise>,
}
```

This closes the loop on the object model from Lesson 3: methods are objects, and `Method#parameters` lets you ask any method "what shape do you accept?" without calling it.

## Test method definitions — already provided

The test code defines five methods for you to introspect. You don't need to write any of them; you only need to write `parameters_of`.

```ruby
def fixture_simple(a, b)
  # two required positional
end

def fixture_defaults(a, b = 1)
  # one required, one optional positional
end

def fixture_keywords(a:, b: "default")
  # one keyreq, one key
end

def fixture_splats(*args, **opts)
  # rest and keyrest only
end

def fixture_mixed(a, b: 1, *rest, c:, **opts)
  # all the shapes at once
end
```

## Example

```ruby
parameters_of(:fixture_simple)
# => { required: 2, optional: 0, keyword_required: 0, keyword_optional: 0, rest: false, keyrest: false }

parameters_of(:fixture_mixed)
# => { required: 1, optional: 0, keyword_required: 1, keyword_optional: 1, rest: true, keyrest: true }
```

## What this exercises

- `method(:name)` to obtain the Method object.
- `Method#parameters` returns an Array of `[kind, name]` pairs.
- `Enumerable#count` (with a block or with an argument) to count by kind.
- The mental model that "methods are objects too" — same property the object-model lesson built.

The 15-minute budget is real.
```

### `starterCode`

```ruby
def fixture_simple(a, b); end
def fixture_defaults(a, b = 1); end
def fixture_keywords(a:, b: "default"); end
def fixture_splats(*args, **opts); end
def fixture_mixed(a, b: 1, *rest, c:, **opts); end

def parameters_of(method_name)
  # Your code here.
end
```

### `testCode`

```ruby
_t('simple — two required positional') do
  result = parameters_of(:fixture_simple)
  expected = { required: 2, optional: 0, keyword_required: 0, keyword_optional: 0, rest: false, keyrest: false }
  _eq result, expected
end

_t('defaults — one required, one optional') do
  result = parameters_of(:fixture_defaults)
  expected = { required: 1, optional: 1, keyword_required: 0, keyword_optional: 0, rest: false, keyrest: false }
  _eq result, expected
end

_t('keywords — one keyreq, one key') do
  result = parameters_of(:fixture_keywords)
  expected = { required: 0, optional: 0, keyword_required: 1, keyword_optional: 1, rest: false, keyrest: false }
  _eq result, expected
end

_t('splats — rest and keyrest, no named') do
  result = parameters_of(:fixture_splats)
  expected = { required: 0, optional: 0, keyword_required: 0, keyword_optional: 0, rest: true, keyrest: true }
  _eq result, expected
end

_t('mixed — all shapes') do
  result = parameters_of(:fixture_mixed)
  expected = { required: 1, optional: 0, keyword_required: 1, keyword_optional: 1, rest: true, keyrest: true }
  _eq result, expected
end
```

### `hint`

> *(Challenges ship without a hint by default. See `alternativeApproach` for shape.)*

### `solution`

```ruby
def parameters_of(method_name)
  params = method(method_name).parameters
  kinds = params.map(&:first)
  {
    required:         kinds.count(:req),
    optional:         kinds.count(:opt),
    keyword_required: kinds.count(:keyreq),
    keyword_optional: kinds.count(:key),
    rest:             kinds.include?(:rest),
    keyrest:          kinds.include?(:keyrest),
  }
end
```

### `alternativeApproach`

> The shape is straightforward once you see `Method#parameters`. The clever bit is realising you only need the first element of each pair (the kind symbol) — once you map to that, every count is `Array#count(symbol)` and every boolean is `Array#include?(symbol)`.
>
> An equivalent build-up using `each_with_object` and case-matching:
>
> ```ruby
> def parameters_of(method_name)
>   result = { required: 0, optional: 0, keyword_required: 0, keyword_optional: 0, rest: false, keyrest: false }
>   method(method_name).parameters.each do |(kind, _name)|
>     case kind
>     when :req     then result[:required] += 1
>     when :opt     then result[:optional] += 1
>     when :keyreq  then result[:keyword_required] += 1
>     when :key     then result[:keyword_optional] += 1
>     when :rest    then result[:rest] = true
>     when :keyrest then result[:keyrest] = true
>     end
>   end
>   result
> end
> ```
>
> Longer, but uses the `case/when` mechanic from Lesson 4 in a new context. Either form is idiomatic; the `map(&:first)` + `count` form is more compact, the explicit `each` form is easier to extend (e.g. adding handling for `:block` parameters).

---

## Self-review checkpoint

- [x] Read 5.1 covers exactly four things: keyword args, splats, implicit return, method introspection. Closes the loop from Lesson 3 (methods are objects too).
- [x] "What we didn't cover" section at the end of 5.1 names `attr_*`, `method_missing`, eigenclasses, monkey-patching with explicit pointer to deep-dives.
- [x] Kata 5.2 forces keyword-only (positional rejected by signature) — fourth test exercises the trap.
- [x] Kata 5.3 forces both splats in one signature.
- [x] Challenge 5.4 ships without hint (per [README §5](../../README.md)). Closes the scroll by exercising `Method#parameters` — methods-as-objects.
- [x] Hints discipline §2.4 applied: 5.2's hint clarifies the kata is about the signature (the body is trivial); 5.3 points at "Array's length is the count" without writing it.
- [x] Content in English; meta-notes in Spanish.
