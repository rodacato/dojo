# PRD-014: Landing Page Copy Draft

> **Status:** confirmed — implementing in Sprint 003 (Spec 018, Phase 0 static form)
> **Date:** 2026-03-21
> **Author:** Claude (Amara Diallo + Priya Menon guiding — copy and positioning)

---

## Idea in one sentence

First-draft copy for the landing page (`/`) — hero, problem statement, how it works, access section — written for a developer audience who will recognize the problem immediately.

---

## Design constraints (from screen spec)

- The landing page is static + dynamic effects (the logo animation is the most complex element)
- No "sign up" CTA — only "request access" (invite-only in Phase 1)
- Target reader: senior developers who have used LLM tools and felt something was off about it
- Tone: direct, honest, slightly uncomfortable — this product knows what it's accusing developers of
- No marketing language ("powerful", "seamless", "cutting-edge") — write like a developer, for a developer

---

## Hero section

**Headline (primary):**
```
The best developers are getting worse.
```

**Subheadline:**
```
Not from lack of effort. From outsourcing thinking to tools that never push back.
```

**Hero body (2–3 sentences):**
```
Copilot finishes your sentences. ChatGPT explains your errors. Your debugger
catches your bugs before you do. The code ships — but the instinct atrophies.

Dojo is a daily kata for software engineers who want to keep the skill, not just the output.
```

**CTA:**
```
[Request access →]
```
*(small note below: "Invite-only. For practitioners, not tourists.")*

---

## Section: The Problem

**Heading:**
```
You can still write code. Can you still think it?
```

**Body:**
```
There's a specific kind of developer. Years of experience. Strong opinions. Good instincts.

They reached for a tool — just this once, just to save time. Then again. Then every sprint.

Now when the tool is gone — offline, rate-limited, wrong — there's a hesitation that wasn't
there before. A reach for autocomplete before the thought finishes forming.

Delegated cognitive atrophy. The skill didn't disappear. It just stopped being exercised.

Dojo exists for developers who noticed.
```

---

## Section: How It Works

**Heading:**
```
One kata. One sensei. Every day.
```

**Steps:**

```
01  The dojo assigns you a kata — a real engineering scenario drawn from
    the kind of work you do. Code review, incident response, architecture
    decision, SQL performance. No toy examples.

02  You have a fixed window. No hints. No autocomplete. No looking things up.
    The code editor is deliberate: just you and the problem.

03  The sensei evaluates your work. Not with a rubric, but with the specific
    judgment of an expert in that domain. A PostgreSQL DBA will not grade
    your React the same way a principal engineer does.

04  If your answer raises more questions than it answers, the sensei asks one.
    Not to be kind. To be honest about what you demonstrated.

05  You get a verdict. Topics to practice. And a receipt for showing up.
```

---

## Section: What the Dojo is Not

```
Not a quiz.          There are no multiple choice answers. No right/wrong toggle.
                     No leaderboard points for guessing correctly.

Not a tutor.         The sensei doesn't teach you. It evaluates you. The difference
                     is what makes the practice real.

Not a substitute.    Dojo is not an alternative to building things. It's the
                     deliberate practice you do so building things doesn't get
                     worse over time.
```

---

## Section: The Rules

```
No skip.
No reroll.
No pause.

The dojo assigns a kata. You do it. You submit. You get feedback.
That's the whole thing.

There's no "I'll come back to this one." The constraint is the point.
The discomfort is where the practice happens.
```

---

## Section: Access

**Heading:**
```
The dojo is invite-only.
```

**Body:**
```
We're not building a platform. We're building a practice.

That means a small number of developers who are serious about this, not a large
number of developers who are curious about it. Invitations go to people we know
or people those people know.

If you want to be considered, leave your GitHub handle and tell us what you're
practicing toward.
```

**Form:**
```
GitHub handle: [___________]
Why you're here (optional): [________________________]
[Request access]
```

**Below the form:**
```
No newsletter. No notifications. We'll reach out directly if we have space.
```

---

## Section: Build in Public

```
Dojo is built openly. Every major decision, every architectural tradeoff,
every mistake — documented in the changelog.

Not because it's a good marketing strategy.
Because if we're asking developers to be honest about their skill,
we should be honest about ours.

[Read the changelog →]
```

---

## Footer

```
Dojo — A software engineering kata practice
Built in public. Invite-only.

[GitHub] [Changelog] [Terms] [Privacy]
```

---

## Alternate hero headlines (for A/B testing in Phase 1)

Ranked by expected resonance:

1. `"The best developers are getting worse."` — primary recommendation (provocative, accurate)
2. `"You can still write code. Can you still think it?"` — more personal, less alarming
3. `"What happens to instinct when you stop using it."` — observation, not accusation
4. `"Practice what the tools replaced."` — action-oriented, clear
5. `"One kata. One hour. Every day. No shortcuts."` — procedural, trust-building

---

## Copy notes for implementation

### Tone calibration
- Write like you're talking to one developer, not "developers" as a category
- Never use second-person plural ("developers often feel...")
- Never explain the problem to someone who doesn't already recognize it — the copy assumes the reader knows the feeling
- The product is not for everyone. Say so explicitly.

### What to avoid
- Adjectives that don't earn their place ("powerful", "unique", "innovative")
- Feature lists that read like a SaaS pricing page
- Promising outcomes ("you'll become a better developer") — the practice speaks for itself
- Corporate warmth ("we're on a journey together")

### The pull quote problem (Amara's note)
The most shareable element of the landing page is the problem statement. If someone screenshots it and posts it on Twitter, it should be a single line that makes a senior developer feel seen. "The best developers are getting worse" is designed for that. Do not dilute it with qualifications.

---

## Next step

- [ ] This copy is not final — implement it, read it on the real screen, then edit
- [ ] The "request access" form maps to `POST /access-requests` (PRD-002, Phase 1)
- [ ] For Phase 0 (creator only), the form is static — it does nothing. Ship the form with a "We'll reach out" confirmation that doesn't actually submit.
- [ ] Review with a non-developer to check: does it explain enough, or does it assume too much?
