import { type SeedExercise, uuidv5 } from './types'

export const architectureExercises: SeedExercise[] = [
  {
    id: uuidv5('exercise-006-architecture-decision'),
    title: 'The Architecture Decision',
    description: `A startup's checkout service sends a confirmation email after every purchase. Currently: the checkout service calls the email service directly (synchronous HTTP). When the email service goes down, checkouts fail. When the email service is slow, checkouts are slow.

The CTO wants you to propose an architecture that decouples the two services. You have 45 minutes. Show your design.

Use the diagram area to show the proposed architecture. Write your reasoning in the text area below the diagram.`,
    duration: 45,
    difficulty: 'hard',
    type: 'whiteboard',
    category: 'architecture',
    languages: [],
    tags: ['architecture', 'distributed-systems', 'reliability'],
    topics: ['system-design', 'event-driven-architecture', 'message-queues', 'trade-offs', 'scalability', 'reliability', 'outbox-pattern', 'idempotency'],
    variations: [
      {
        ownerRole: 'Staff distributed systems engineer who has designed event-driven systems at a company processing 10M orders/day',
        ownerContext:
          "Evaluate whether the developer understands the fundamental trade-off they are making: moving from synchronous (consistent but coupled) to asynchronous (decoupled but eventually consistent). Does their design handle the 'at-least-once delivery' problem? What happens if the queue consumer crashes after pulling a message but before sending the email — will the email be sent again? Does the design include a dead-letter queue for failed email sends? Give credit for: identifying the consistency trade-off, proposing message queue (Kafka, RabbitMQ, SQS — any is fine), handling idempotency, and acknowledging what observability looks like in the new system.",
      },
      {
        ownerRole: 'CTO of a Series A startup who has 5 engineers and needs to choose between the right architecture and the shippable architecture',
        ownerContext:
          "Evaluate the developer's judgment about complexity. A developer who proposes Kafka + Zookeeper + multiple consumer groups for a startup with 5 engineers is overengineering. The pragmatic solution might be: a simple outbox pattern (write email_jobs to DB in the same transaction as the purchase, have a worker poll the table). Does the developer consider the team's capacity and operational complexity, not just the technical correctness? Give credit for proposing the simplest thing that works, noting what it doesn't do (not fault-tolerant to extended email service outages), and defining when they would upgrade to a real queue.",
      },
    ],
  },

  {
    id: uuidv5('exercise-016-caching-decision'),
    title: 'The Caching Decision',
    description: `Your product analytics dashboard endpoint is getting slow. It aggregates 90 days of event data for the current user and is now taking 3\u20138 seconds for active users. You have been asked to fix it.

Three engineers on the team each proposed a solution in Slack:

- **Engineer A:** "Add a Redis cache. Cache the result for 5 minutes. Problem solved."
- **Engineer B:** "The query is the problem. Let's add a materialized view and refresh it hourly."
- **Engineer C:** "This is a read-heavy, user-specific endpoint. Move it behind a CDN with a short TTL and user-scoped cache keys."

Your tech lead is asking you to decide. Which approach do you recommend, and why? What would make you change your recommendation?`,
    duration: 30,
    difficulty: 'hard',
    type: 'chat',
    category: 'architecture',
    languages: [],
    tags: ['architecture', 'caching', 'performance'],
    topics: ['caching', 'redis', 'materialized-views', 'cdn', 'cache-invalidation', 'trade-offs', 'performance'],
    variations: [
      {
        ownerRole: 'Staff engineer who has implemented all three caching strategies in production and has strong opinions about when each is appropriate',
        ownerContext:
          "Evaluate the developer's ability to reason about trade-offs, not just pick an answer. Each approach has merits and failure modes. Redis: correct, but adds operational complexity, doesn't fix the slow query (it still runs once per cache miss for each user), and 5-minute stale data may be unacceptable for a dashboard. Materialized view: fixes the underlying query, but hourly refresh may produce stale data in a product analytics context where users expect near-real-time numbers. CDN: wrong tool for user-specific authenticated data — CDN caching of user-scoped endpoints is complex and error-prone (cache poisoning risk). The pragmatic answer for most teams: fix the query first (add indexes, move to pre-aggregation), then add Redis caching if needed. Give credit for: identifying stale data risk for each approach, asking about freshness requirements before deciding, and noting that 'caching a slow query' is not the same as 'fixing a slow query.'",
      },
      {
        ownerRole: 'CTO of a 12-person startup who has been burned by adding premature infrastructure complexity and is asking the dev to justify every new moving part',
        ownerContext:
          "Evaluate the developer's judgment about organizational complexity. Redis means a new infrastructure dependency, new failure modes (Redis down \u2192 dashboard down), and operational knowledge requirements. Materialized view is database-native and operationally simple, but requires understanding PostgreSQL internals. CDN for auth endpoints is a trap — most junior engineers haven't dealt with the cache poisoning risk of user-specific CDN entries. The right question to ask before any of these: 'Have we looked at EXPLAIN ANALYZE on the actual query?' The answer may be that a single index eliminates the problem entirely at zero operational cost. Give credit for: questioning the problem framing (why is it slow?), proposing the simplest intervention first (query optimization), and only recommending infrastructure additions if the query is already optimal.",
      },
    ],
  },

  {
    id: uuidv5('exercise-028-microservices-boundaries'),
    title: 'The Microservice Boundary Decision',
    description: `Your company has a monolith that handles: user management, product catalog, ordering, payments, inventory, shipping, and notifications. It's a Rails app, 300k lines, 8 developers. Deployments take 45 minutes and happen twice a week because everyone is afraid of breaking something.

The CTO has decided to "move to microservices." You have been asked to propose the first two services to extract and the extraction plan.

Draw the current monolith's main modules, identify the service boundaries, and propose your first two extractions with justification. Include the communication pattern between the new services and the remaining monolith.`,
    duration: 45,
    difficulty: 'hard',
    type: 'whiteboard',
    category: 'architecture',
    languages: [],
    tags: ['architecture', 'microservices', 'system-design'],
    topics: ['microservices', 'monolith-decomposition', 'bounded-contexts', 'service-boundaries', 'strangler-fig-pattern'],
    variations: [
      {
        ownerRole: 'Principal architect who has led two monolith-to-microservices migrations and considers 60% of microservice migrations a mistake',
        ownerContext:
          "Evaluate the developer's judgment about WHAT to extract, not just HOW. The first extraction should be the module with the clearest boundary and the least coupling to the rest of the monolith. Notifications is often the best first candidate: it has a clear input (send this to that person), minimal shared state, and extracting it provides immediate value (independent scaling, different deployment cadence). Payments is a tempting second choice but has high coupling to orders and inventory — extracting it early is risky. Evaluate whether the developer: (1) considers coupling and data ownership when choosing boundaries; (2) proposes the strangler fig pattern (new service handles new requests, old code handles existing); (3) addresses the data split problem — how do you share user data between the monolith and the new service? Give credit for questioning whether microservices are the right answer for 8 developers.",
      },
      {
        ownerRole: 'VP of Engineering who has seen microservice migrations succeed and fail, and judges proposals based on team capacity and organizational impact',
        ownerContext:
          "Evaluate organizational awareness. With 8 developers, each new microservice needs an owner. Two new services means at least 2 developers are now split between the monolith and their service. Does the developer consider the team size constraint? Does their extraction plan account for: (1) a shared database phase (both monolith and service read the same DB initially); (2) an API contract between the service and the monolith; (3) deployment independence (the whole point — can the new service deploy without the monolith?). Give credit for: realistic timelines (first extraction takes 2-3 months, not 2 weeks), acknowledging that the monolith doesn't go away, and proposing a concrete communication pattern (synchronous REST for queries, async events for state changes).",
      },
    ],
  },

  {
    id: uuidv5('exercise-029-event-driven-architecture'),
    title: 'The Event-Driven Transition',
    description: `Your food delivery platform currently uses synchronous REST calls between services:

1. Customer places order \u2192 Order Service calls Payment Service (sync)
2. Payment succeeds \u2192 Order Service calls Restaurant Service (sync)
3. Restaurant accepts \u2192 Order Service calls Delivery Service (sync)
4. Driver assigned \u2192 Order Service calls Notification Service (sync)

When any downstream service is slow or down, the entire order flow fails. Last week, the Notification Service had a 5-minute outage and it blocked 400 orders.

Redesign this flow using events. Show the event flow, the topics/queues, and explain what happens when each service fails.`,
    duration: 30,
    difficulty: 'hard',
    type: 'whiteboard',
    category: 'architecture',
    languages: [],
    tags: ['architecture', 'event-driven', 'resilience'],
    topics: ['event-driven-architecture', 'message-queues', 'saga-pattern', 'eventual-consistency', 'failure-handling'],
    variations: [
      {
        ownerRole: 'Staff engineer who designed the event-driven architecture for a food delivery platform processing 500k orders per day',
        ownerContext:
          "Evaluate the developer's event design for correctness and failure handling. Key events: `OrderPlaced`, `PaymentCompleted`, `PaymentFailed`, `RestaurantAccepted`, `RestaurantRejected`, `DriverAssigned`, `OrderDelivered`. Critical evaluation: (1) Payment MUST still be synchronous or saga-coordinated — you cannot fire-and-forget a payment; (2) Notification should be fully async — it should never block order flow; (3) Restaurant acceptance needs a timeout — what if the restaurant never responds? (4) The developer should identify which events need guaranteed delivery (payment, restaurant) vs. best-effort (notification). Give credit for: proposing a saga or orchestrator for the payment\u2192restaurant\u2192delivery flow, handling compensation (what happens when payment succeeds but restaurant rejects?), and explaining dead-letter queues for failed events.",
      },
      {
        ownerRole: 'CTO of the food delivery startup who needs this redesign to be incremental, not a 6-month rewrite',
        ownerContext:
          "Evaluate incrementalism. The developer should NOT propose replacing all 4 synchronous calls with events simultaneously. The pragmatic approach: (1) first, make Notification async (highest impact, lowest risk — an undelivered notification is not a failed order); (2) then, add events between Restaurant and Delivery services; (3) keep Payment synchronous or move to a saga pattern last (highest risk). Evaluate whether the developer proposes running both patterns in parallel during transition (sync call + event publish, with the event consumer as the new path and the sync call as fallback). Give credit for: realistic sequencing, acknowledging that event-driven systems are harder to debug, and proposing observability (distributed tracing, event replay) as part of the design.",
      },
    ],
  },

  {
    id: uuidv5('exercise-030-cqrs-pattern'),
    title: 'The CQRS Decision',
    description: `Your SaaS product has a dashboard that reads data from 6 different tables with complex JOINs. The same database handles all write operations (user actions, billing, settings). During peak hours, the dashboard queries compete with writes and both slow down.

The team is considering CQRS (Command Query Responsibility Segregation). Design a CQRS architecture for this system. Show: (1) how writes flow, (2) how the read model is built and kept in sync, (3) what technology you would use for the read store, (4) what happens when the read model is stale.`,
    duration: 30,
    difficulty: 'hard',
    type: 'whiteboard',
    category: 'architecture',
    languages: [],
    tags: ['architecture', 'cqrs', 'system-design'],
    topics: ['cqrs', 'event-sourcing', 'read-models', 'eventual-consistency', 'projection-rebuild'],
    variations: [
      {
        ownerRole: 'Staff architect who has implemented CQRS at two companies — one successfully and one that was rolled back after 8 months of pain',
        ownerContext:
          "Evaluate whether the developer understands the trade-offs of CQRS, not just the pattern. Key evaluation: (1) do they separate the write model (normalized, transactional) from the read model (denormalized, optimized for queries)? (2) what synchronization mechanism do they propose — change data capture, domain events, or database triggers? (3) do they address the consistency gap — when a user updates their settings and immediately refreshes the dashboard, will they see the old data? (4) do they acknowledge the operational complexity — now you have two data stores to maintain, monitor, and debug. Give credit for: addressing the staleness problem explicitly (showing a 'last updated' timestamp, or using read-your-own-writes consistency), choosing an appropriate read store (Elasticsearch for search, materialized views for simple cases), and identifying when CQRS is overkill (maybe a read replica is sufficient).",
      },
      {
        ownerRole: 'Senior developer who proposed CQRS at a previous company, implemented it, and then spent 6 months debugging sync issues',
        ownerContext:
          "Evaluate whether the developer considers simpler alternatives before committing to CQRS. A PostgreSQL read replica might solve the problem at 10% of the complexity. A set of materialized views refreshed every minute might be sufficient for a dashboard. CQRS is the right answer when reads and writes have fundamentally different shapes and scale independently — evaluate whether the developer establishes this before proposing the full pattern. Give credit for: listing alternatives (read replica, materialized views, query optimization) and explaining why each is or isn't sufficient, designing the sync mechanism with failure handling (what happens when a projection fails mid-update?), and proposing a way to rebuild projections from scratch (event replay or full re-read from the write store).",
      },
    ],
  },

  {
    id: uuidv5('exercise-031-api-gateway'),
    title: 'The API Gateway Design',
    description: `Your company has 8 backend microservices. The mobile app and web frontend currently call each service directly. This causes problems: each client needs to know every service's URL, handle authentication independently, and make multiple round-trips for a single page.

Design an API gateway. Show: what it does, how routing works, how authentication is centralized, and how you would implement request aggregation (one client call that fans out to 3 services). Address the concern: "Isn't the gateway a single point of failure?"`,
    duration: 25,
    difficulty: 'medium',
    type: 'whiteboard',
    category: 'architecture',
    languages: [],
    tags: ['architecture', 'api-gateway', 'microservices'],
    topics: ['api-gateway', 'reverse-proxy', 'authentication', 'request-aggregation', 'single-point-of-failure'],
    variations: [
      {
        ownerRole: 'Platform engineer who has built and operated API gateways at two different companies, one using Kong and one custom-built',
        ownerContext:
          "Evaluate the design for completeness. An API gateway should handle: (1) routing — URL pattern to service mapping; (2) authentication — validate JWT/session once at the gateway, pass user context downstream; (3) rate limiting — protect backend services from abuse; (4) request aggregation — BFF (Backend for Frontend) pattern for combining multiple service calls; (5) observability — centralized logging, tracing, metrics. For the single-point-of-failure concern: the gateway must be horizontally scalable (multiple instances behind a load balancer) and stateless (no session state in the gateway itself). Evaluate whether the developer distinguishes between a 'thin' gateway (routing + auth only) and a 'fat' gateway (business logic in the gateway) — fat gateways become monoliths. Give credit for recommending an existing solution (Kong, AWS API Gateway, Envoy) over building custom.",
      },
      {
        ownerRole: 'Mobile tech lead whose team currently makes 12 API calls to load the home screen and needs that reduced to 2-3',
        ownerContext:
          "Evaluate from the client perspective. The mobile team's main pain point is multiple round-trips on cellular connections with high latency. Does the gateway design include a BFF (Backend for Frontend) layer that aggregates responses? Does it support GraphQL or a similar query mechanism so the mobile app can request exactly the fields it needs? Evaluate whether the developer considers mobile-specific concerns: payload size (mobile clients need smaller responses), partial failure (what if 2 of 3 backend calls succeed — does the gateway return partial data or fail entirely?), and caching at the gateway level for data that changes infrequently. Give credit for addressing partial failure gracefully — a home screen that shows user profile and order history but says 'recommendations unavailable' is better than a blank screen.",
      },
    ],
  },

  {
    id: uuidv5('exercise-032-service-mesh'),
    title: 'The Service Mesh Evaluation',
    description: `Your engineering team runs 15 microservices on Kubernetes. Inter-service communication uses plain HTTP. You have recurring problems: no mutual TLS between services, inconsistent retry policies, no distributed tracing, and difficulty debugging request flows across services.

Your infrastructure lead proposes adding a service mesh (Istio). Your senior developer says "it's too complex for our team size." Evaluate both positions. When is a service mesh worth it? Design what the service mesh would look like for your system and identify what it replaces.`,
    duration: 25,
    difficulty: 'medium',
    type: 'chat',
    category: 'architecture',
    languages: [],
    tags: ['architecture', 'service-mesh', 'infrastructure'],
    topics: ['service-mesh', 'istio', 'envoy', 'mtls', 'distributed-tracing', 'sidecar-pattern'],
    variations: [
      {
        ownerRole: 'Platform architect who evaluated and deployed Istio for a 40-service platform and has opinions about when the complexity is justified',
        ownerContext:
          "Evaluate the developer's ability to reason about infrastructure complexity vs. value. A service mesh provides: mTLS (zero-trust networking), traffic management (retries, circuit breaking, canary deploys), observability (distributed tracing, metrics), and policy enforcement. But it adds: sidecar proxy overhead (CPU, memory, latency), operational complexity (mesh control plane is another thing to manage), and a steep learning curve. For 15 services, the answer depends on the team: a team of 30 engineers with dedicated platform engineers — yes. A team of 15 engineers with no platform team — probably not. Evaluate whether the developer considers alternatives: Linkerd (simpler than Istio), or implementing specific features individually (add tracing with OpenTelemetry, add mTLS with cert-manager, add retries in application code). Give credit for a nuanced answer that identifies which mesh features are most valuable for this specific scenario.",
      },
      {
        ownerRole: 'Senior developer who has worked on a platform with Istio and spent 20% of their time debugging mesh-related issues',
        ownerContext:
          "Evaluate whether the developer acknowledges the hidden costs. Istio adds ~10ms latency per hop (sidecar proxy), increases memory usage by ~100MB per pod (Envoy sidecar), and makes debugging harder (is the failure in my service or in the mesh?). The developer should weigh these costs against the benefits. Key question: of the four stated problems (no mTLS, inconsistent retries, no tracing, debugging difficulty), which can be solved WITHOUT a service mesh? Tracing can be added with OpenTelemetry. Retry policies can be standardized with a shared HTTP client library. Only mTLS and traffic management are genuinely hard to implement without a mesh. Give credit for: quantifying the trade-off, proposing an incremental adoption path, and identifying that the debugging difficulty might get worse, not better, with a mesh.",
      },
    ],
  },

  {
    id: uuidv5('exercise-033-monolith-to-micro'),
    title: 'The Monolith Strangler',
    description: `You have inherited a 5-year-old Django monolith that handles everything: user auth, content management, billing, analytics, and a REST API for mobile clients. The team has grown from 3 to 12 developers. Deployment conflicts are constant — two teams tried to deploy different features on the same day and one broke the other.

The VP of Engineering wants a plan to gradually decompose this monolith. You cannot stop feature development during the migration. Draw the current state, the target state (3-4 services), and the migration plan showing how you get from one to the other without downtime.`,
    duration: 45,
    difficulty: 'hard',
    type: 'whiteboard',
    category: 'architecture',
    languages: [],
    tags: ['architecture', 'migration', 'strangler-fig'],
    topics: ['strangler-fig-pattern', 'monolith-decomposition', 'incremental-migration', 'database-splitting', 'feature-flags'],
    variations: [
      {
        ownerRole: 'Principal engineer who has executed two multi-year monolith decomposition projects and considers the database split the hardest part',
        ownerContext:
          "Evaluate the migration plan for realism. The strangler fig pattern is the correct approach: new functionality is built in a new service, existing functionality is gradually migrated. Key evaluation: (1) the developer must address the shared database problem — all code reads from one Django DB. Extracting a service without splitting the database just creates a distributed monolith. (2) The migration plan should be ordered by risk: start with the least coupled module (analytics or notifications), not the most valuable (billing). (3) Each phase must be independently deployable and reversible. (4) The API layer needs a routing mechanism (reverse proxy or API gateway) to send requests to either the monolith or the new service. Give credit for: a phased plan with clear milestones, addressing data ownership at each phase, and being explicit about what stays in the monolith (auth is usually last to extract).",
      },
      {
        ownerRole: 'VP of Engineering who needs to justify this migration to the board with concrete timelines and risk mitigation, not just technical architecture',
        ownerContext:
          "Evaluate whether the developer thinks about the business context. The migration must not slow down feature delivery — this is non-negotiable. Does the plan include: (1) a timeline estimate per phase (each extraction is 2-4 months, not 2 weeks)? (2) a staffing plan (who works on migration vs. features — ideally the same team owns both)? (3) measurable success criteria (deployment frequency increases, deployment conflicts decrease)? (4) rollback plans for each phase? Give credit for: acknowledging that the migration will take 12-18 months, proposing quick wins in the first 2 months (shared CI/CD pipeline improvements, modular monolith as an intermediate step), and defining when to stop decomposing (not every module needs to be a separate service).",
      },
    ],
  },
]
