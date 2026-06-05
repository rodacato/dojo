# Exercise Variety Analysis — What Works Across Platforms

> What Dojo can learn from how LeetCode, HackerRank, Codewars, Exercism, and others structure their exercise catalogs.

---

## How Each Platform Organizes Exercises

### LeetCode — Algorithm puzzles by difficulty + topic

```
3,816 problems
├── Easy (922) / Medium (1,922) / Hard (902)
├── Topics: Array, String, Hash Table, DP, Math, Sorting, Greedy, DFS/BFS, ...
├── Curated lists: LeetCode 75, Top Interview 150, SQL 50
└── Company tags (premium): "Asked at Google in last 6 months"
```

**What works:** The curated lists (LeetCode 75, Blind 75) are more valuable than the full catalog. Most users never touch 90% of problems — they follow a list.

**What doesn't:** Problems are abstract algorithm puzzles. "Find the kth largest element" doesn't teach you anything about building software. The 47% interview fail rate despite solving problems proves this.

### HackerRank — Domains as organizing principle

```
7,500+ challenges
├── Algorithms → Sorting / Search / Strings / Graph / Greedy / DP
├── Data Structures → Arrays / Linked Lists / Trees / Stacks / Heaps
├── SQL → Basic Select / Advanced Select / Aggregation / Joins / Advanced Joins
├── Functional Programming → Intro / Recursion / Ad Hoc
├── AI → Statistics / Digital Image Analysis / NLP
├── Mathematics → Fundamentals / Number Theory / Combinatorics
├── Regex → Intro / Character Class / Repetitions / Grouping
└── Linux Shell → Bash / Text Processing / Arrays / Grep Sed Awk
```

**What works:** Domain-based organization is intuitive. "I want to practice SQL" → go to SQL section. The hierarchy (domain → subdomain → difficulty) makes navigation clear.

**What doesn't:** Problems within each domain are still abstract. "SQL Aggregation" exercises don't reflect real queries you'd write at work.

### Codewars — Kata by kyu rank + tags

```
12,000+ kata
├── Ranked: 8 kyu (easiest) → 1 dan (hardest)
├── Tags: Algorithms, Strings, Mathematics, Regular Expressions, Arrays, ...
├── Languages: 58+ (same problem, multiple languages)
└── Community-created: anyone with 300+ honor can create
```

**What works:** The multi-language aspect is unique — solve the same problem in Python, then Go, then Rust. This teaches language-specific idioms through comparison. The kyu/dan system gives identity ("I'm a 3 kyu").

**What doesn't:** Quality variance is enormous. Some kata are brilliant, others are ambiguous, buggy, or trivial. No pedagogical progression — it's a flat catalog you browse.

### Exercism — Learning tracks with mentorship

```
77 language tracks
├── Each track: ~100 exercises in progression order
├── Concept exercises: teach one specific language feature
├── Practice exercises: apply multiple concepts
├── Mentorship: volunteer mentors review your solution
└── Approaches: after solving, see different approaches with explanations
```

**What works:** Exercises are sequenced — you learn goroutines AFTER you learn functions. Mentorship adds human nuance that automated evaluation can't match. The "Approaches" page (like Codewars' solutions) is the learning moment.

**What doesn't:** Mentorship creates a bottleneck — wait times can be days. 19,600 volunteers is impressive but not scalable. And the exercises are still "implement this function" — not real-world scenarios.

---

## Exercise Formats Across Platforms

| Format | Who does it | How it works | Dojo fit |
|---|---|---|---|
| **Implement function** | Everyone | Given signature + tests, write the body | ✅ Already have (code type) |
| **Fix the bug** | Codewars, HackerRank | Given buggy code + failing test, find and fix | ✅ High value — real skill |
| **Refactor** | Codewars (rare) | Given working messy code, improve without breaking tests | ✅ High value — unique |
| **SQL query** | LeetCode, HackerRank, StrataScratch | Given schema + question, write the query | ✅ Already have |
| **System design** | LeetCode (premium), HackerRank | Design a system in text/diagram | ✅ Already have (chat type) |
| **Code review** | Nobody well | Review a PR for issues | 🆕 Unique to Dojo |
| **Multiple choice** | HackerRank, LeetCode | Choose the correct answer | ❌ Doesn't fit Dojo |
| **Fill in the blank** | HackerRank (SkillUp) | Complete partial code | ❌ Too simple for mid-senior |
| **Live coding** | HackerRank (CodePair) | Pair programming with interviewer | ❌ Requires two people |
| **Multi-file project** | None well | Build something across files | 🔮 Future (WebContainers) |
| **Regex** | HackerRank, RegexCrossword | Write regex to match patterns | ⚡ Low effort, fun |
| **Shell/CLI** | HackerRank | Write bash commands/scripts | ⚡ Possible with Piston |

---

## Exercise Categories — What Mid-Senior Developers Actually Need

Based on market research gaps + what platforms DON'T offer:

### Category 1: "Real Work" (Dojo's differentiator)

Nobody does this well. This is where Dojo wins.

| Subcategory | Example | Why it matters |
|---|---|---|
| **Debugging** | "This function returns wrong results for input X. The tests show where. Fix it." | Debugging is 50% of a senior dev's day |
| **Refactoring** | "This 200-line function works but is unmaintainable. Refactor it." | The skill most valued by teams, least practiced |
| **Code review** | "Here's a PR with 5 issues. Identify them and explain why." | Seniors do this daily, no platform teaches it |
| **Error handling** | "This code swallows errors. Add proper error handling with context." | The difference between junior and senior code |
| **Performance** | "This query/function is O(n³). Make it fast without changing the API." | Applied optimization, not abstract algorithm theory |
| **Type safety** | "Add TypeScript types to this untyped module. No `any` allowed." | Practical TS skill, not type gymnastics |
| **Test writing** | "This function has a hidden bug. Write tests that catch it." | Testing is a skill, not a checkbox |
| **API design** | "Design the REST API for this feature. Think about edge cases." | Chat-type kata with architectural thinking |

### Category 2: Language Mastery (proven by Codewars/Exercism)

Practicing language-specific patterns and idioms.

| Subcategory | Languages | Example |
|---|---|---|
| **Idiomatic patterns** | All | "Rewrite this Java-style Go into idiomatic Go" |
| **Concurrency** | Go, Rust, Elixir | "Implement a bounded worker pool with graceful shutdown" |
| **Error patterns** | Go, Rust | "Custom error types with Is/As/Unwrap" |
| **Functional** | Elixir, Rust, TS | "Replace these 12 if/else with pattern matching" |
| **Memory** | Rust | "Fix the borrow checker errors in this code" |
| **Metaprogramming** | Ruby, Elixir | "Write a macro/DSL that does X" |

### Category 3: SQL (underserved everywhere)

LeetCode has 50 SQL problems. StrataScratch and DataLemur focus on interview prep. Nobody teaches advanced SQL for working developers.

| Subcategory | Example | Why it matters |
|---|---|---|
| **Window functions** | "Rank + running total + compare to partition average" | Most developers can't use these |
| **CTEs** | "Refactor this 5-level nested subquery" | Readability skill |
| **Recursive CTEs** | "Org chart traversal" | Rarely taught, often needed |
| **Query optimization** | "This query is slow. Rewrite it." | Real-world performance |
| **Data modeling** | "Given this API response, design the schema" | Design skill, not just writing |
| **Real-world analysis** | "Find churned users", "Cohort analysis" | Actual business queries |

### Category 4: Frontend (nobody does this)

Zero competition. No platform has live preview for frontend challenges.

| Subcategory | Example | Tech |
|---|---|---|
| **CSS Layout** | "Replicate this layout (Grid only, no media queries)" | iframe |
| **Accessibility** | "Make this form keyboard-navigable with ARIA" | iframe |
| **DOM manipulation** | "Infinite scroll without a framework" | iframe |
| **React hooks** | "Implement useDebounce with cleanup" | Sandpack |
| **Component patterns** | "Compound Accordion with Context" | Sandpack |
| **Performance** | "This component re-renders 47 times. Fix it." | Sandpack |
| **Animation** | "CSS-only loading spinner" | iframe |
| **Canvas** | "Draw an analog clock" | iframe |

### Category 5: Architecture & System Design (chat-type)

Dojo already has chat-type katas. These are the topics that matter most.

| Subcategory | Example |
|---|---|
| **API design** | "Design a pagination cursor that survives server restarts" |
| **Event-driven** | "Design the domain events for an e-commerce order flow" |
| **Trade-offs** | "REST vs GraphQL for this specific use case — argue both sides" |
| **Incident response** | "This service is returning 500s. Walk through your debugging process" |
| **Architecture review** | "Here's a system diagram. What would break first at 10x scale?" |

---

## Difficulty Distribution — What the Data Says

### LeetCode distribution
- Easy: 24% | Medium: 50% | Hard: 26%
- Most users only solve Easy and Medium — Hard is for top ~10%

### Codewars distribution
- 8-7 kyu (beginner): ~35% | 6-4 kyu (intermediate): ~45% | 3-1 kyu (hard): ~15% | dan: ~5%
- Sweet spot is 6-4 kyu for active users

### Recommended for Dojo (mid-senior audience)
- **Easy: 20%** — Warm-ups, language onboarding, confidence builders
- **Medium: 55%** — Core catalog, most katas here
- **Hard: 25%** — Challenge katas, the ones you share on your card

The mid-senior audience doesn't need beginner hand-holding, but "Hard" should mean "requires deep thinking", not "requires obscure algorithm knowledge".

---

## Multi-Language: Same Problem, Different Idioms

Codewars does this best. Same kata, solve in Python then Go then Rust. The learning is in the comparison.

### How to adapt for Dojo

| Problem | Python approach | Go approach | Rust approach | Learning |
|---|---|---|---|---|
| "Parse CSV" | csv module / list comprehension | bufio.Scanner / strings.Split | iter / Result<> chain | Error handling philosophy |
| "Worker pool" | concurrent.futures | goroutines + channels | tokio spawn + mpsc | Concurrency models |
| "Error hierarchy" | Exception classes | error wrapping | enum + thiserror | Error design patterns |
| "JSON transform" | dict comprehension | struct + json tags | serde + derive | Type system differences |

The sensei compares approaches: "In Go you used goroutines, in Rust you used channels — here's why the Rust approach is more memory-safe."

---

## Retention Mechanics Through Exercises

### LeetCode's Daily Challenge

- One problem per day, same for all users
- Completing it gives LeetCoins and streak credit
- Creates social moment: "did you do today's?"
- **85%+ of active users** engage with the daily challenge

### Codewars' "Train" button

- Random kata matching your skill level
- Zero decision fatigue — just click "Train"
- The randomness is part of the fun

### Exercism's "Dig Deeper"

- After solving, see alternative approaches explained
- "There are 3 common ways to solve this" with pros/cons
- Creates learning even for problems you already solved

### For Dojo

Combine the best:
1. **Weekly challenge** (adapted LeetCode daily — less pressure for mid-senior)
2. **"Surprise me" button** (Codewars' random train — already partially built with interest-based selection)
3. **Post-kata insight** (Exercism's "Dig Deeper" + AI sensei commentary)

---

## Current Dojo Catalog Gap Analysis

### What we have (60+ exercises)

Based on Sprint history, the catalog includes:
- Code katas (TypeScript, Python, Go, SQL, Ruby, Rust)
- Chat katas (system design, architecture, communication)
- Whiteboard katas (diagram-based)

### What's missing

| Gap | Priority | Sprint |
|---|---|---|
| **Exercises with testCode** (none currently work with Piston) | Critical | 012 |
| **Bug fix exercises** ("find and fix the bug") | High | 012 |
| **Refactoring exercises** (given messy code, improve it) | High | 012 |
| **Code review exercises** ("review this PR") | High | 012-013 |
| **Frontend exercises** (HTML/CSS/React) | High | 014 |
| **Multi-language variants** (same problem, 3 languages) | Medium | 013+ |
| **Test writing exercises** ("write tests that catch the bug") | Medium | 013 |
| **Regex exercises** | Low | 014+ |
| **Shell/CLI exercises** | Low | Future |

---

## Recommendations

### For Sprint 012 (immediate)

Focus new exercises on formats that differentiate Dojo:
1. **5 "implement function" with testCode** — the basic format, but with real tests via Piston
2. **3 "fix the bug"** — give broken code + failing tests, find the fix
3. **2 "refactor this"** — give working-but-messy code, improve it, tests must still pass
4. **3 SQL with testCode** — window functions, CTEs, real-world analysis
5. **2 "code review" (chat-type)** — give a PR diff, identify issues

### For Sprint 013-014

- Multi-language variants of popular katas
- Frontend katas (unique, zero competition)
- Test-writing katas ("write tests that catch the hidden bug")
- Course exercises (different format — progressive, no timer)

### Quality bar (Valentina)

Every exercise must answer: **"What does the developer know after this that they didn't know before?"**

If the answer is "they can implement flatten" — that's a LeetCode problem, not a Dojo kata.
If the answer is "they understand when recursion hits stack limits and when to use iteration" — that's a Dojo kata.
