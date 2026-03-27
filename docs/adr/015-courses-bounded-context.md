# ADR 015: Courses as a separate bounded context (Learning)

**Status:** Accepted
**Date:** 2026-03-27
**Context:** Sprint 013 pre-work for Courses MVP (Sprint 014)

## Decision

Courses are a **separate bounded context** called Learning, distinct from Practice (katas).

```
Practice Context (existing)     Learning Context (new)
├── Session (aggregate)         ├── Course (aggregate root)
├── Attempt (entity)            │   ├── Lesson (entity)
├── Exercise (from Content)     │   └── Step (value object)
└── Timer, Sensei, Verdict      └── CourseProgress (entity)
```

## Why separate

- **Different lifecycle:** Courses have no timer, no sensei, no verdict. Steps are pass/fail via Piston only.
- **Different access model:** Courses are public (no auth). Katas are invite-only.
- **Different aggregates:** A Course contains Lessons → Steps. A Session contains Attempts. No shared entities.
- **Different UX:** "Run" not "Submit". Instant feedback, not streaming evaluation. Hints, not follow-ups.

## Shared infrastructure

- `CodeExecutionPort` (Piston) — reused as-is
- `users` table — CourseProgress references userId (nullable for anonymous)
- Auth middleware — courses skip it

## Consequences

- New tables: `courses`, `lessons`, `steps`, `course_progress`
- New domain directory: `apps/api/src/domain/learning/`
- New routes: `/learn/*` (public, no auth)
- CourseProgress for anonymous users: localStorage on frontend, no DB writes until auth
