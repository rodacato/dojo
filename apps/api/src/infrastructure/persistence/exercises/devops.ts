import { type SeedExercise, uuidv5 } from './types'

export const devopsExercises: SeedExercise[] = [
  {
    id: uuidv5('exercise-044-cicd-pipeline'),
    title: 'The CI/CD Pipeline Design',
    description: `Your team of 10 developers deploys a monorepo (frontend + backend + shared library) to AWS. Current process: someone runs a script on their laptop, builds locally, uploads to S3, SSH into the server, and restarts. It takes 30 minutes and has failed 3 times in the last month (wrong environment variables, untested code, partial deploys).

Design a CI/CD pipeline from scratch. Show: every stage from git push to production traffic, including: linting, testing, building, staging deployment, approval, production deployment, and rollback. Choose specific tools and justify each choice.`,
    duration: 30,
    difficulty: 'hard',
    type: 'whiteboard',
    category: 'devops',
    languages: [],
    tags: ['devops', 'cicd', 'automation'],
    topics: ['cicd', 'github-actions', 'deployment-pipeline', 'environment-management', 'rollback', 'monorepo'],
    variations: [
      {
        ownerRole: 'Staff DevOps engineer who has built CI/CD pipelines for 5 different companies and has a zero-tolerance policy for manual deployment steps',
        ownerContext:
          "Evaluate the pipeline design for completeness and correctness. Required stages: (1) lint + type check (fast fail — catches obvious issues in < 1 min); (2) unit tests (parallel per workspace); (3) build (all workspaces); (4) integration tests (against a test database); (5) deploy to staging (automatic on main branch merge); (6) manual or automated approval gate; (7) production deploy (blue-green or canary); (8) smoke tests post-deploy; (9) automatic rollback if smoke tests fail. For the monorepo: evaluate whether the developer uses affected-package detection (only test/build what changed) or always builds everything. For tool choices: GitHub Actions is the simplest for a GitHub monorepo. Evaluate whether the developer addresses: (1) environment variable management (secrets in CI, not in code); (2) the partial deploy problem (frontend and backend must deploy atomically or in the right order); (3) caching (node_modules, build artifacts) for speed. Give credit for a complete pipeline that eliminates every manual step.",
      },
      {
        ownerRole: 'Engineering manager who has been the one running the manual deploy script and is tired of weekend deploy emergencies',
        ownerContext:
          "Evaluate the developer's focus on reliability over sophistication. The pipeline should eliminate the three failure modes: (1) wrong environment variables — managed through CI secrets, not human memory; (2) untested code — tests must pass before deploy is even possible; (3) partial deploys — atomic deployment or coordinated rollout. Evaluate whether the developer proposes: (1) a staging environment that mirrors production (same infra, same env vars, different data); (2) a rollback mechanism that takes < 5 minutes (revert to previous container image, not a full rebuild); (3) deployment notifications (Slack alert when deploy starts, succeeds, or fails). Give credit for: prioritizing reliability over features, proposing a pipeline that a developer can understand in 15 minutes (not a 500-line YAML file), and including monitoring post-deploy (error rate spike \u2192 auto-rollback).",
      },
    ],
  },

  {
    id: uuidv5('exercise-045-container-orchestration'),
    title: 'The Container Orchestration Decision',
    description: `Your company runs 6 services in Docker containers on 3 EC2 instances. Deployments are manual: SSH in, pull the new image, restart the container. Last month, one instance ran out of memory and two services went down silently — nobody noticed for 2 hours.

The team needs container orchestration. The options discussed are:
- **Option A:** Kubernetes (EKS)
- **Option B:** AWS ECS with Fargate
- **Option C:** Docker Swarm

Your team has 2 backend developers and 0 dedicated DevOps engineers. Evaluate each option and make a recommendation. Then design the deployment architecture with your chosen tool.`,
    duration: 20,
    difficulty: 'medium',
    type: 'chat',
    category: 'devops',
    languages: [],
    tags: ['devops', 'containers', 'orchestration'],
    topics: ['kubernetes', 'ecs', 'docker-swarm', 'container-orchestration', 'auto-scaling', 'health-checks'],
    variations: [
      {
        ownerRole: 'Platform engineer who has operated both EKS and ECS in production and has strong opinions about when Kubernetes is and isn\'t appropriate',
        ownerContext:
          "Evaluate the developer's judgment about complexity vs. capability. For 6 services with 2 backend developers and no DevOps: Kubernetes (EKS) is almost certainly overkill — the learning curve and operational overhead will consume the team. Docker Swarm is too limited (no auto-scaling, limited health check options, questionable future). ECS with Fargate is the pragmatic choice: managed infrastructure (no EC2 instances to maintain), simple service definitions, built-in health checks and auto-restart, and the team can learn it in a week. Evaluate whether the developer: (1) correctly assesses team capacity as the primary constraint; (2) addresses the original problems (silent failures \u2192 health checks + alerting; manual deploys \u2192 ECS service updates); (3) explains what they'd lose by not choosing Kubernetes (advanced traffic management, service mesh, custom CRDs). Give credit for recommending the simplest tool that solves the stated problems, and defining the trigger for upgrading to Kubernetes later.",
      },
      {
        ownerRole: 'CTO of the startup who has a $50k/month AWS bill and needs the solution to be cost-efficient',
        ownerContext:
          "Evaluate cost awareness. EKS adds $72/month per cluster ($0.10/hour) plus EC2 costs for worker nodes. ECS with Fargate charges per vCPU/GB-hour with no cluster fee — for 6 small services, this is likely cheaper than running 3 EC2 instances. Docker Swarm has no AWS cost but requires self-managed EC2 instances. The developer should estimate monthly costs for each option. Evaluate whether they consider: (1) right-sizing containers (don't allocate 2GB RAM to a service that uses 256MB); (2) spot instances or Fargate Spot for non-critical services; (3) the hidden cost of Kubernetes — even managed EKS requires significant developer time for configuration, which is expensive at a startup. Give credit for: concrete cost estimates, recommending Fargate for operational simplicity, and noting that the 2-hour silent outage is the most expensive problem to fix (customer impact, reputation damage).",
      },
    ],
  },

  {
    id: uuidv5('exercise-046-blue-green-deploy'),
    title: 'The Blue-Green Deployment',
    description: `Your SaaS application currently deploys by stopping the old version and starting the new one — there's a 30-60 second window where the app is completely down. The sales team has told you that two enterprise customers mentioned this downtime in renewal conversations.

Design a blue-green (or canary) deployment strategy. Show: (1) the infrastructure setup (load balancer, two environments), (2) the deployment process step by step, (3) how you handle database migrations that are needed by the new version but would break the old version, (4) the rollback process. Address the constraint: you only have budget for 1.5x your current infrastructure, not 2x.`,
    duration: 25,
    difficulty: 'medium',
    type: 'whiteboard',
    category: 'devops',
    languages: [],
    tags: ['devops', 'deployment', 'zero-downtime'],
    topics: ['blue-green-deployment', 'canary-deployment', 'zero-downtime', 'database-migrations', 'load-balancing', 'rollback'],
    variations: [
      {
        ownerRole: 'Senior SRE who has implemented blue-green deployments for 4 different production systems and knows the database migration problem is the hardest part',
        ownerContext:
          "Evaluate the deployment design for correctness and the database migration strategy specifically. Blue-green: two identical environments, one active (blue), one idle (green). Deploy new version to green, run smoke tests, switch traffic at the load balancer. Rollback: switch traffic back to blue. The database problem: if the new version adds a column that the old version doesn't know about, the migration must be backward-compatible. Expand-contract pattern: add the column (compatible with both versions), deploy new version, then clean up in a later migration. For the 1.5x budget constraint: canary deployment (10% of traffic to new version) uses less infrastructure than full blue-green. Evaluate whether the developer: (1) addresses the database migration timing problem explicitly; (2) proposes health checks before switching traffic; (3) includes a monitoring window after the switch (watch error rates for 10 minutes before decommissioning the old environment); (4) handles the budget constraint realistically.",
      },
      {
        ownerRole: 'VP of Sales who has personally been on calls where customers asked about uptime SLAs and deployment windows',
        ownerContext:
          "Evaluate from the business perspective. The developer should understand that zero-downtime deployment is a sales enabler — enterprise customers expect 99.9%+ uptime. Evaluate: (1) does the deployment strategy genuinely achieve zero downtime, or does it just reduce downtime to < 5 seconds? (2) can the developer articulate the SLA improvement in terms customers understand ('we deploy multiple times per week with zero user impact')? (3) does the rollback process also have zero downtime? (4) does the developer propose a maintenance page or status page for the rare case when something goes wrong? Give credit for: a credible zero-downtime design, considering the customer communication angle (status page, changelog), and proposing monitoring that proves uptime to customers (uptime monitoring with a public status page).",
      },
    ],
  },

  {
    id: uuidv5('exercise-047-monitoring-alerting'),
    title: 'The Monitoring and Alerting Strategy',
    description: `Your team has no monitoring. You find out about problems when customers email support, or when a developer happens to check the logs. Last week, the API returned 500 errors for 3 hours before anyone noticed.

Design a monitoring and alerting system for your application (2 backend services, 1 frontend, 1 database). Define: (1) what metrics to collect (and from where), (2) what dashboards to build, (3) what alerts to set up (with specific thresholds), (4) the on-call rotation and escalation policy, (5) what tool(s) you would use. Budget: $500/month.`,
    duration: 20,
    difficulty: 'medium',
    type: 'chat',
    category: 'devops',
    languages: [],
    tags: ['devops', 'monitoring', 'observability'],
    topics: ['monitoring', 'alerting', 'observability', 'metrics', 'logging', 'on-call', 'sla'],
    variations: [
      {
        ownerRole: 'Staff SRE who has built monitoring systems from scratch at 3 companies and believes that the first 5 alerts are the only ones that matter',
        ownerContext:
          "Evaluate the monitoring strategy for signal-to-noise ratio. Too many alerts = alert fatigue = ignored alerts. The essential metrics: (1) error rate (5xx responses / total responses) — alert at > 1% for 5 minutes; (2) latency (p50, p95, p99) — alert when p99 exceeds 2 seconds for 10 minutes; (3) availability (health check endpoints) — alert immediately on failure; (4) database connection pool usage — alert at 80%; (5) disk/memory/CPU — alert at 85%. Dashboards: one per service showing golden signals (latency, traffic, errors, saturation). Tool choice: Grafana Cloud or Datadog for $500/month covers small infrastructure. Evaluate whether the developer: (1) defines meaningful thresholds (not 'alert on any error' but 'alert when error rate exceeds normal baseline'); (2) has an escalation policy (page on-call \u2192 if no acknowledgment in 10 min \u2192 page backup \u2192 if no ack in 15 min \u2192 page engineering manager); (3) distinguishes between 'alerting' (wake someone up) and 'informational' (Slack notification). Give credit for: prioritizing the five most important alerts, avoiding alert fatigue, and including log aggregation for debugging after an alert fires.",
      },
      {
        ownerRole: 'Engineering manager who was personally responsible for the 3-hour undetected outage and is determined to never let it happen again',
        ownerContext:
          "Evaluate the developer's ability to design a system that would have caught the specific incident: 500 errors for 3 hours. The minimum viable monitoring: an endpoint health check every 60 seconds that triggers a PagerDuty alert on 3 consecutive failures. This alone would have caught the outage in 3 minutes instead of 3 hours. Evaluate whether the developer starts with this simple, high-impact solution before designing a comprehensive observability platform. Also evaluate: (1) the on-call rotation — who gets woken up? Is it fair (shared rotation, not always the same person)? (2) the escalation policy — what happens if the on-call person doesn't respond? (3) post-incident process — every alert should lead to either a fix or an alert threshold adjustment. Give credit for: starting with the highest-impact monitoring first, proposing a realistic on-call rotation for a small team, and including a monthly review of alerts (delete noisy alerts, adjust thresholds).",
      },
    ],
  },
]
