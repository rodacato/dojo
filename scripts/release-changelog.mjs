#!/usr/bin/env node
// Generates a CHANGELOG entry from the conventional commits since the last v* tag.
// Invoked by `pnpm version` through the "version" lifecycle script; also runnable by hand:
//   node scripts/release-changelog.mjs --dry-run

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DRY_RUN = process.argv.includes('--dry-run')
const UNRELEASED = '## [Unreleased]'

// stderr is piped, not inherited: `git describe` before the first tag prints a fatal that is
// expected and handled here, and inheriting it makes a good run read as a failed one.
function git(cmd) {
  return execSync(cmd, { encoding: 'utf8', cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function getPreviousTag() {
  try {
    // --match 'v*' because only v* tags are releases; a marker tag must not become the range start.
    return git("git describe --tags --abbrev=0 --match 'v*'")
  } catch {
    return null
  }
}

function getCommitsSince(ref) {
  const range = ref ? `${ref}..HEAD` : 'HEAD'
  const log = git(`git log ${range} --pretty=format:"%H\t%s" --no-merges`)
  if (!log) return []
  return log.split('\n').map((line) => {
    const [hash, subject] = line.split('\t')
    return { hash, subject: subject || '' }
  })
}

export function parseCommit(subject) {
  const match = subject.match(/^(\w+)(\(([^)]+)\))?(!)?:\s*(.+)$/)
  if (!match) return null
  const [, type, , scope, bang, description] = match
  return { type, scope: scope || null, description, breaking: !!bang }
}

// Insertion order is the section order in the entry. `security` gets its own heading above the
// Changed group so an operator reading release notes sees it early.
export const TYPE_LABELS = {
  feat: 'Added',
  fix: 'Fixed',
  security: 'Security',
  perf: 'Changed',
  refactor: 'Changed',
  style: 'Changed',
  revert: 'Changed',
  docs: 'Documentation',
  chore: 'Maintenance',
  build: 'Maintenance',
  test: 'Testing',
  ci: 'CI',
}

export const TYPE_ORDER = Object.keys(TYPE_LABELS)

export function groupCommits(commits) {
  const groups = {}
  const breaking = []
  const dropped = []

  for (const { subject, hash } of commits) {
    const parsed = parseCommit(subject)
    if (!parsed) {
      dropped.push({ subject, hash, why: 'not a conventional commit' })
      continue
    }

    const { type, scope, description, breaking: isBreaking } = parsed

    if (isBreaking) breaking.push({ scope, description, hash })

    if (!TYPE_LABELS[type]) {
      dropped.push({ subject, hash, why: `unknown type "${type}"` })
      continue
    }

    if (!groups[type]) groups[type] = []
    groups[type].push({ scope, description, hash })
  }

  return { groups, breaking, dropped }
}

export function formatEntry(version, date, groups, breaking) {
  const lines = [`## [${version}] - ${date}`, '']

  if (breaking.length > 0) {
    lines.push('### Breaking Changes', '')
    for (const { scope, description } of breaking) {
      lines.push(`- ${scope ? `**${scope}:** ` : ''}${description}`)
    }
    lines.push('')
  }

  // Grouped by label, not by type: perf, refactor, style and revert all read as Changed, and
  // iterating types printed that heading once per type that had commits.
  const sections = new Map()
  for (const type of TYPE_ORDER) {
    if (!groups[type] || groups[type].length === 0) continue
    const label = TYPE_LABELS[type]
    if (!sections.has(label)) sections.set(label, [])
    sections.get(label).push(...groups[type])
  }

  for (const [label, entries] of sections) {
    lines.push(`### ${label}`, '')
    for (const { scope, description } of entries) {
      lines.push(`- ${scope ? `**${scope}:** ` : ''}${description}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

// A release that leaves a commit out of the entry has to say so. Stderr, so a piped --dry-run
// still yields only the entry.
function reportDropped(dropped) {
  if (dropped.length === 0) return
  console.error(`release-changelog: ${dropped.length} commit(s) are not in this entry`)
  for (const { hash, subject, why } of dropped) {
    console.error(`  ${hash.slice(0, 7)} ${subject}  — ${why}`)
  }
}

// Inserts below the `## [Unreleased]` heading and nowhere else, so the historical sprint log
// further down the file is never rewritten.
export function insertEntry(changelog, entry) {
  const at = changelog.indexOf(UNRELEASED)
  if (at === -1) throw new Error(`CHANGELOG.md has no "${UNRELEASED}" heading to insert below`)
  const head = changelog.slice(0, at + UNRELEASED.length)
  const tail = changelog.slice(at + UNRELEASED.length).replace(/^\n+/, '')
  return `${head}\n\n${entry.trimEnd()}\n\n${tail}`
}

function main() {
  const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
  const date = new Date().toISOString().slice(0, 10)
  const commits = getCommitsSince(getPreviousTag())
  const { groups, breaking, dropped } = groupCommits(commits)

  const entry = formatEntry(version, date, groups, breaking)
  reportDropped(dropped)

  if (DRY_RUN) {
    console.log(entry)
    return
  }

  const path = join(ROOT, 'CHANGELOG.md')
  writeFileSync(path, insertEntry(readFileSync(path, 'utf8'), entry), 'utf8')
  console.log(`CHANGELOG.md updated for v${version}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
