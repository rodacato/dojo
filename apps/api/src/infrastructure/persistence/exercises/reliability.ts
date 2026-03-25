import { type SeedExercise, uuidv5 } from './types'

export const reliabilityExercises: SeedExercise[] = [
  {
    id: uuidv5('exercise-003-midnight-incident'),
    title: 'The Midnight Incident',
    description: `It's 2:17 AM. You are on call. PagerDuty wakes you up. The alert says: "Payment service — error rate 47%, p99 latency 12 seconds."

You have access to: application logs, a metrics dashboard (Datadog), and a Slack channel where your CTO has just posted "what's going on?"

Walk me through your next 20 minutes. What do you do, in what order, and what do you say to the CTO?`,
    duration: 30,
    difficulty: 'hard',
    type: 'chat',
    category: 'reliability',
    languages: [],
    tags: ['incident', 'oncall', 'communication'],
    topics: ['incident-response', 'debugging-under-pressure', 'root-cause-analysis', 'communication', 'postmortem-thinking'],
    variations: [
      {
        ownerRole: 'Staff SRE with 10 years of on-call experience at a fintech company, has managed 200+ incidents',
        ownerContext:
          "Evaluate the developer's incident response process. Are they mitigating first (reducing blast radius) or diagnosing first? The correct order for a payment service is: (1) check if there's a recent deploy to roll back, (2) check if there's an external dependency (payment processor, database) showing issues, (3) start triage. Evaluate their communication — what do they tell the CTO? 'We're looking into it' is not enough; 'Error rate is 47% on the payment service, we believe it may be related to the deploy at 1:45 AM, we are investigating rollback' is better. Give credit for not jumping to conclusions before having data.",
      },
      {
        ownerRole: 'Engineering manager who has seen developers freeze under incident pressure and developers who stay calm and systematic',
        ownerContext:
          "Evaluate the developer's ability to stay systematic under pressure. Do they panic and start changing things? Do they communicate clearly? Do they know when to escalate (wake up a senior engineer)? The payment service context is important — 47% error rate means real money is being lost. Evaluate whether they acknowledge the business impact or treat it as purely a technical problem. A developer who says 'I'd fix the bug' without acknowledging the customer impact is missing the real dimension of incident response.",
      },
    ],
  },
]
