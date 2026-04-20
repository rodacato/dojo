import { type SeedExercise, uuidv5 } from './types'

// Sprint 020 Part 4.2 — Code Review kata format (PRD 027).
// One proof-of-concept kata. Deliberately targets issues that are
// unambiguous (race condition, missing null check, swallowed error message,
// unused test import) so the first surface reveal of the format lands on
// judgement calls that a senior reviewer would actually flag.

export const reviewExercises: SeedExercise[] = [
  {
    id: uuidv5('exercise-review-001-inventory-drift'),
    title: 'Inventory drift bug',
    description: `## PR #1842 — fix: reserve inventory on checkout

> *Closes: INV-312 ("production inventory count drifted 14 units over the weekend")*
>
> The race was between \`GET /inventory\` and \`POST /checkout\`. We now reserve the
> units inside the checkout handler before charging the card.

---

### \`packages/checkout/src/checkout.ts\` (modified)

\`\`\`diff
 import { stripe } from '../integrations/stripe'
 import { inventoryRepo } from '../persistence/inventory'
 import { userRepo } from '../persistence/user'

-export async function checkout(userId: string, sku: string, qty: number) {
-  const user = await userRepo.findById(userId)
-  const inventory = await inventoryRepo.findBySku(sku)
-  if (inventory.units < qty) {
-    throw new Error('out of stock')
-  }
-  const charge = await stripe.charge(user.paymentMethod, qty * inventory.price)
-  await inventoryRepo.update(sku, inventory.units - qty)
-  return { chargeId: charge.id }
-}
+export async function checkout(userId: string, sku: string, qty: number) {
+  const user = await userRepo.findById(userId)
+
+  // INV-312: reserve before we charge so concurrent checkouts can't
+  // oversell. Reads the row, checks availability, writes the new count.
+  const inventory = await inventoryRepo.findBySku(sku)
+  if (inventory.units < qty) {
+    throw new Error('out of stock')
+  }
+  await inventoryRepo.update(sku, inventory.units - qty)
+
+  try {
+    const charge = await stripe.charge(user.paymentMethod, qty * inventory.price)
+    return { chargeId: charge.id }
+  } catch (err) {
+    throw new Error('error')
+  }
+}
\`\`\`

---

### \`packages/checkout/src/checkout.test.ts\` (modified)

\`\`\`diff
-import { describe, it, expect } from 'vitest'
+import { describe, it, expect, vi } from 'vitest'
 import { checkout } from './checkout'
 import { inventoryRepo } from '../persistence/inventory'
 import { userRepo } from '../persistence/user'

 describe('checkout', () => {
   it('reserves inventory before charging', async () => {
-    // ... existing test
+    // ... existing test
+  })
+
+  it('throws when inventory is insufficient', async () => {
+    inventoryRepo.findBySku = async () => ({ units: 1, price: 100 })
+    userRepo.findById   = async () => ({ paymentMethod: 'pm_123' })
+    await expect(checkout('u1', 'SKU1', 5)).rejects.toThrow('out of stock')
   })
 })
\`\`\`

---

Write your code review. Focus on correctness and what you would ask changed before merging.`,
    duration: 15,
    difficulty: 'medium',
    type: 'review',
    category: 'code-review',
    languages: ['typescript'],
    tags: ['review', 'concurrency', 'error-handling'],
    topics: ['code-review', 'concurrency', 'error-handling', 'testing'],
    rubric: {
      expectedIssues: [
        {
          title: 'Race condition: read-check-write on inventory.units is not atomic',
          severity: 'high',
          why:
            'Two concurrent checkouts can both read units=5, both pass the qty check, and both decrement — still overselling. This is exactly the INV-312 symptom the PR claims to fix. A reviewer must catch that the "fix" does not actually fix the race — it just relocates it inside the handler. The correct fix is a conditional UPDATE (e.g. UPDATE ... SET units = units - :qty WHERE sku = :sku AND units >= :qty) or a row-level lock.',
        },
        {
          title: 'Missing null check on user lookup before reading paymentMethod',
          severity: 'high',
          why:
            'userRepo.findById may return null. The current code accesses user.paymentMethod unconditionally and would throw a TypeError for any bad userId. A reviewer should ask for an explicit NotFound error with the userId in the message.',
        },
        {
          title: 'Swallowed error message in stripe catch — throw new Error("error")',
          severity: 'medium',
          why:
            'The catch block loses both the original stripe error and the original error class. If stripe.charge throws a CardDeclinedError or a rate-limit error, the caller only sees "error". A reviewer should ask that the original error be rethrown or wrapped with the message preserved.',
        },
        {
          title: 'Inventory decremented before charge — no rollback on charge failure',
          severity: 'high',
          why:
            'Orthogonal to the race condition, the order is "decrement inventory → charge". If stripe fails, the inventory is already gone. Either charge first then decrement, or decrement inside a transaction that rolls back on charge failure. A reviewer should flag this.',
        },
        {
          title: 'Unused `vi` import in checkout.test.ts',
          severity: 'low',
          why:
            'The added test does not use vi anywhere (the mocks are hand-rolled with assignment). The import will either trip a lint rule or sit as dead weight. Small but worth flagging.',
        },
      ],
      contextNotes:
        'The PR author is a recent hire and this is their second PR. The reviewer should be direct about the race-condition issue (it undoes the stated goal of the PR) while also being explicit about what a correct fix would look like.',
    },
    variations: [
      {
        ownerRole: 'Senior backend engineer who ran checkout at a previous e-commerce company and lived through one inventory-drift incident',
        ownerContext:
          "Evaluate the reviewer's ability to catch the race condition as the primary issue. A reviewer who finds the null check and the swallowed error but misses the race condition has pattern-matched — the whole *point* of this PR is to fix the race and it doesn't. Credit reviewers who notice the decrement-before-charge ordering as a separate correctness concern. Accept valid-outside-rubric observations (e.g. the lack of idempotency key on stripe.charge) as additional caught issues.",
      },
      {
        ownerRole: 'Principal engineer who reviews PRs across the company and cares about whether the review *teaches*',
        ownerContext:
          "Focus on whether the reviewer's comments explain WHY, not just WHAT. A comment like 'race condition here' is worth less than 'this is still the original INV-312 race — you moved it from between two requests to between two DB operations in the same request'. Judge the review as if you had to merge or reject the PR based on it.",
      },
    ],
  },
]
