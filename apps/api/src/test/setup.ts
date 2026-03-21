// Provide env vars before config.ts is imported, so validation passes in tests.
// Tests use mock adapters — no real DB or LLM connections are made.
process.env['DATABASE_URL'] = 'postgresql://dojo:dojo@localhost:5432/dojo_test'
process.env['SESSION_SECRET'] = 'test-secret-minimum-32-characters-long!!'
process.env['GITHUB_CLIENT_ID'] = 'test-client-id'
process.env['GITHUB_CLIENT_SECRET'] = 'test-client-secret'
process.env['LLM_BASE_URL'] = 'http://localhost:11434'
process.env['LLM_API_KEY'] = 'test-api-key'
process.env['WEB_URL'] = 'http://localhost:5173'
process.env['NODE_ENV'] = 'test'
