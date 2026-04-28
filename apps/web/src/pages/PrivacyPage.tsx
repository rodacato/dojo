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
        <p>When you use dojo, we store:</p>
        <LegalList>
          <LegalListItem>
            Your GitHub profile information (username, avatar URL, email).
          </LegalListItem>
          <LegalListItem>Your kata submissions and the sensei's evaluations.</LegalListItem>
          <LegalListItem>
            Session metadata (start time, completion time, exercise selected).
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
        <p>We deliberately do not collect:</p>
        <LegalList>
          <LegalListItem>
            Analytics or tracking data (no Google Analytics, no Mixpanel, no Segment).
          </LegalListItem>
          <LegalListItem>
            Your GitHub repositories, code, or commit history.
          </LegalListItem>
          <LegalListItem>Browser fingerprints or device identifiers.</LegalListItem>
          <LegalListItem>
            Cookies beyond the session token required for authentication.
          </LegalListItem>
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
            Run the kata loop (assign exercises, evaluate submissions, track progress).
          </LegalListItem>
          <LegalListItem>
            Display your profile and streak to other practitioners.
          </LegalListItem>
          <LegalListItem>
            Generate the leaderboard (ranked by consistency, not score).
          </LegalListItem>
        </LegalList>
        <p>
          Your submissions are sent to Anthropic's Claude API for evaluation. They are not
          stored by Anthropic beyond the API request. We do not use your data to train any
          models.
        </p>
      </>
    ),
  },
  {
    id: 'github-oauth',
    label: 'GitHub OAuth',
    body: (
      <>
        <p>We request the minimum GitHub OAuth scopes:</p>
        <LegalList>
          <LegalListItem>
            <LegalCode>read:user</LegalCode> — your public profile (username, avatar).
          </LegalListItem>
          <LegalListItem>
            <LegalCode>user:email</LegalCode> — your email address (for account identification).
          </LegalListItem>
        </LegalList>
        <p>
          We do not request access to your repositories, organizations, or any other GitHub
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
          <p className="text-[15px] font-medium leading-relaxed">
            Sessions are yours. We don't sell them, share them, or use them to train models.
          </p>
        </LegalCallout>
        <p>
          Your session data is stored on a self-hosted VPS (Hetzner, Germany). It is not
          replicated to third-party analytics platforms. If you delete your account, your
          profile is removed. Anonymized session data may be retained for leaderboard
          integrity.
        </p>
      </>
    ),
  },
  {
    id: 'your-rights',
    label: 'Your rights',
    body: (
      <>
        <p>You can:</p>
        <LegalList>
          <LegalListItem>
            Request a copy of all data associated with your account.
          </LegalListItem>
          <LegalListItem>
            Request deletion of your account and associated data.
          </LegalListItem>
          <LegalListItem>Revoke GitHub OAuth access at any time.</LegalListItem>
        </LegalList>
      </>
    ),
  },
  {
    id: 'contact',
    label: 'Contact',
    body: (
      <p>
        Privacy questions? Open an issue on GitHub or reach out via the channels listed on the
        open source page.
      </p>
    ),
  },
]

export function PrivacyPage() {
  return <LegalPage title="Privacy Policy" lastUpdated="2026-04-15" sections={SECTIONS} />
}
