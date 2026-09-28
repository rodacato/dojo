import {
  LegalPage,
  LegalCallout,
  LegalCode,
  LegalList,
  LegalListItem,
  type LegalSection,
} from '../components/LegalPage'

const SECTIONS: LegalSection[] = [
  {
    id: 'what-we-collect',
    label: 'What we collect',
    body: (
      <>
        <p>
          Dojo is open-source software that anyone can run. This instance is run by its operator,
          not by the dojo project, and its data stays on the operator&apos;s server. When you use
          it, it stores:
        </p>
        <LegalList>
          <LegalListItem>
            Your GitHub profile information (username, avatar URL, email).
          </LegalListItem>
          <LegalListItem>Your kata submissions and the sensei's evaluations.</LegalListItem>
          <LegalListItem>
            Session metadata (start time, completion time, kata selected).
          </LegalListItem>
          <LegalListItem>
            Your streak and activity data (derived from sessions).
          </LegalListItem>
        </LegalList>
      </>
    ),
  },
  {
    id: 'what-we-dont',
    label: "What we don't collect",
    body: (
      <>
        <p>Dojo deliberately does not collect:</p>
        <LegalList>
          <LegalListItem>
            Analytics or tracking data (no Google Analytics, no Mixpanel, no Segment).
          </LegalListItem>
          <LegalListItem>
            Your GitHub repositories, code, or commit history.
          </LegalListItem>
          <LegalListItem>Browser fingerprints or device identifiers.</LegalListItem>
          <LegalListItem>Cookies beyond the ones sign-in needs.</LegalListItem>
        </LegalList>
      </>
    ),
  },
  {
    id: 'how-data-is-used',
    label: 'How data is used',
    body: (
      <>
        <p>Your data is used to:</p>
        <LegalList>
          <LegalListItem>
            Run the kata loop (assign katas, evaluate submissions, track progress).
          </LegalListItem>
          <LegalListItem>
            Compute your belt and milestones, and publish a verdict only when you share it.
          </LegalListItem>
        </LegalList>
        <p>
          Your submissions are sent for evaluation to the LLM provider the operator of this
          instance configured. What that provider keeps is governed by its own terms. Dojo does
          not use your data to train any models.
        </p>
        <p>
          If the operator enables external error reporting (Sentry), error reports are sent
          there as well.
        </p>
      </>
    ),
  },
  {
    id: 'github-oauth',
    label: 'GitHub OAuth',
    body: (
      <>
        <p>Dojo requests a single GitHub OAuth scope:</p>
        <LegalList>
          <LegalListItem>
            <LegalCode>user:email</LegalCode> — your email address (for account identification).
            Your public profile (username, avatar) needs no extra scope.
          </LegalListItem>
        </LegalList>
        <p>
          Dojo does not request access to your repositories, organizations, or any other GitHub
          data. You can revoke access at any time from your GitHub settings.
        </p>
      </>
    ),
  },
  {
    id: 'data-retention',
    label: 'Data retention',
    body: (
      <>
        <LegalCallout>
          <p className="text-base font-medium leading-relaxed">
            Sessions are yours. Dojo doesn&apos;t sell them, share them, or train models on them.
          </p>
        </LegalCallout>
        <p>
          Your session data lives in this instance&apos;s database, on the server its operator
          runs. It is not replicated to third-party analytics platforms. Ask the operator to
          delete your account and your data goes with it.
        </p>
      </>
    ),
  },
  {
    id: 'your-rights',
    label: 'Your rights',
    body: (
      <>
        <p>You can ask the operator of this instance to:</p>
        <LegalList>
          <LegalListItem>
            Send you a copy of all data associated with your account.
          </LegalListItem>
          <LegalListItem>
            Delete your account and associated data.
          </LegalListItem>
        </LegalList>
        <p>You can revoke GitHub OAuth access yourself at any time.</p>
      </>
    ),
  },
  {
    id: 'contact',
    label: 'Contact',
    body: (
      <p>
        Privacy questions about this instance go to its operator. Questions about the dojo
        software itself: open an issue on GitHub.
      </p>
    ),
  },
]

export function PrivacyPage() {
  return <LegalPage title="Privacy Policy" lastUpdated="2026-09-28" sections={SECTIONS} />
}
