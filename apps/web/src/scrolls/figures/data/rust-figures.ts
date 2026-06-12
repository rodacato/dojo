import type { BeforeAfterData } from '../BeforeAfter'
import type { DisambiguationData } from '../Disambiguation'
import type { TabbedCardData } from '../TabbedCard'
import type { FigureData } from './ruby-figures'

const copyVsClone: DisambiguationData = {
  type: 'disambiguation',
  id: 'copy-vs-clone',
  sharedSkeletonLabel: 'Two ways to end up with two independent values',
  attributes: [
    'Explicitness',
    'What gets duplicated',
    'Typical types',
    'Original binding afterwards',
  ],
  entries: [
    {
      title: 'Copy',
      values: {
        'Explicitness': 'Implicit — plain assignment duplicates; nothing extra is written',
        'What gets duplicated': 'The bits themselves — fixed-size bitwise copy, cheap for these types',
        'Typical types': 'i32, bool, char, f64, tuples/arrays of Copy types',
        'Original binding afterwards': 'Still valid — both names own an independent value',
      },
    },
    {
      title: 'Clone',
      values: {
        'Explicitness': 'Explicit — you write .clone() and every reader sees the cost',
        'What gets duplicated': 'The owned data — runs code, may allocate (a String duplicates its heap buffer)',
        'Typical types': 'String, Vec<T>, Box<T>, most owned types',
        'Original binding afterwards': 'Still valid — you paid for the duplicate explicitly',
      },
    },
  ],
  highlightAttribute: 'Explicitness',
  caption:
    'Both columns end with two usable values. The dividing line is explicitness: Copy duplicates silently on assignment because it is a cheap bitwise copy for these types; Clone makes you write the call because it may allocate. The columns are not disjoint — every Copy type is also Clone (Copy: Clone). A type with neither moves on assignment — the default this lesson is about.',
}

const stringVsStr: DisambiguationData = {
  type: 'disambiguation',
  id: 'string-vs-str',
  sharedSkeletonLabel: 'UTF-8 text, read through the same methods',
  attributes: [
    'Ownership',
    'Mutability',
    'Function-signature default',
    'Getting one from the other',
  ],
  entries: [
    {
      title: 'String',
      values: {
        'Ownership': 'Owns its heap buffer — allocates it, grows it, drops it',
        'Mutability': 'Growable: push_str, push, clear',
        'Function-signature default': 'Take it only when the function keeps the data',
        'Getting one from the other': '.to_string() allocates a new owned buffer',
      },
    },
    {
      title: '&str',
      values: {
        'Ownership': 'Borrowed view into string data someone else owns',
        'Mutability': 'Read-only window; cannot grow what it does not own',
        'Function-signature default': 'The default argument type — &String coerces into it',
        'Getting one from the other': '&owned (or owned.as_str()) borrows; zero allocation',
      },
    },
  ],
  highlightAttribute: 'Ownership',
  caption:
    'One attribute decides everything below it: String owns the bytes, &str borrows them. When you can say which one a signature should use and why, the cascade rows are corollaries, not new rules.',
}

const matchLadderVsQuestionMark: BeforeAfterData = {
  type: 'before-after',
  id: 'match-ladder-vs-question-mark',
  language: 'rust',
  left: {
    title: 'The match ladder',
    code: `fn sum_pair(a: &str, b: &str) -> Result<i32, ParseIntError> {
    let first = match a.parse::<i32>() {
        Ok(n) => n,
        Err(e) => return Err(e),
    };
    let second = match b.parse::<i32>() {
        Ok(n) => n,
        Err(e) => return Err(e),
    };
    Ok(first + second)
}`,
    annotations: [
      { line: 4, mark: '✕', text: 'Unwrap-or-early-return boilerplate…' },
      { line: 8, mark: '✕', text: '…repeated verbatim for every fallible call' },
    ],
  },
  right: {
    title: 'The same pipeline with ?',
    code: `fn sum_pair(a: &str, b: &str) -> Result<i32, ParseIntError> {
    Ok(a.parse::<i32>()? + b.parse::<i32>()?)
}`,
    annotations: [
      { line: 2, mark: '✓', text: 'Each ? is one whole Ok/Err match, inlined' },
    ],
  },
  caption:
    'Identical behavior, identical signature, identical early returns — ? is the left pane\'s ladder compressed to one character per fallible call. Both panes assume use std::num::ParseIntError; and both compile.',
}

const dispatchDecision: TabbedCardData = {
  type: 'tabbed-card',
  id: 'dispatch-decision',
  defaultTab: 0,
  tabs: [
    {
      label: '<T: Greet>',
      body: `\`\`\`rust
fn announce<T: Greet>(guest: &T) -> String {
    format!("now arriving: {}", guest.name())
}
\`\`\`
**Static dispatch, monomorphized.** One specialized copy per concrete \`T\` in the binary; calls are direct and cost nothing at runtime, and callers can name the type (\`announce::<Person>(&dev)\`). Cost: binary size grows per type. **The default when the types are known at compile time.**`,
    },
    {
      label: 'impl Greet',
      body: `\`\`\`rust
fn announce(guest: &impl Greet) -> String {
    format!("now arriving: {}", guest.name())
}
\`\`\`
**The same static dispatch, sugared.** Compiles to exactly the first tab — same monomorphization, same zero runtime cost. What you trade away: callers can no longer name the type explicitly. **Reads lighter for one-off bounds; identical machinery.**`,
    },
    {
      label: 'Box<dyn Greet>',
      body: `\`\`\`rust
fn announce(guest: Box<dyn Greet>) -> String {
    format!("now arriving: {}", guest.name())
}
\`\`\`
**Dynamic dispatch.** One compiled body; every call goes through a vtable and the value lives behind a heap allocation. What that buys: runtime heterogeneity — a \`Vec<Box<dyn Greet>>\` holds different concrete types at once. **The escape hatch, not the default.**`,
    },
  ],
  caption:
    'Three signatures, one contract. The first two compile to the same monomorphized code — pick by call-site ergonomics. The third buys runtime heterogeneity with a vtable and an allocation. Choose by dispatch need, not by which spelling resembles home.',
}

export const RUST_FIGURES: Record<string, FigureData> = {
  'copy-vs-clone': copyVsClone,
  'string-vs-str': stringVsStr,
  'match-ladder-vs-question-mark': matchLadderVsQuestionMark,
  'dispatch-decision': dispatchDecision,
}
