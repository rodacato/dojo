# Releasing dojo

## Versioning

dojo follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html): `MAJOR.MINOR.PATCH[-pre]`,
tagged as annotated `vX.Y.Z[-pre]` tags.

| Component | When to bump |
|-----------|-------------|
| **MAJOR** | Breaking changes to the database schema, the API, or the core architecture |
| **MINOR** | New features |
| **PATCH** | Bug fixes, performance work, dependency updates |

The version lives in one place: the root `package.json`. The workspace packages stay at `0.0.0` —
they are private and never published.

`v0.1.0` is the baseline: the first tagged version, cut on the commit that added this document. The
sprint-by-sprint history before it is kept verbatim under **Historical sprint log** in
[CHANGELOG.md](CHANGELOG.md) and is deliberately not converted into version sections.

## Release process

A release is an annotated tag on a commit that is already on `master`. Releasing and deploying are
independent: tagging does not deploy, and deploying does not tag
([docs/ops/deploy.md](docs/ops/deploy.md)).

The [Release workflow](.github/workflows/release.yml) has two jobs, and the human step between them
is not an oversight.

### 1. Run the workflow with a bump

Actions → **Release** → *Run workflow* → `patch`, `minor` or `major`.

`prepare` bumps the root `package.json`, generates the CHANGELOG entry from the conventional commits
since the last `v*` tag, commits both as `chore(release): vX.Y.Z`, and pushes the branch
`release/vX.Y.Z`. It does not open the pull request.

### 2. Open the pull request yourself

The run summary links a pre-filled compare view. Open it by hand: a pull request authored by a token
runs no CI, so opening it yourself is what gives the release branch its required checks.

### 3. Read the entry before merging

The generator is mechanical and the entry is the release notes — this is the moment to catch it:

- Anything that breaks an existing install belongs under **Breaking Changes**, and it only lands
  there when the commit was written as `type!:`. No other wording is detected.
- Check the `prepare` run log for `release-changelog: N commit(s) are not in this entry`. It lists
  every commit it could not file and why. A commit dropped for an unknown type usually means the
  type was a scope written in the wrong place (`deploy: …` instead of `ci(deploy): …`); fix the
  entry by hand and fix the habit.
- Edit the entry on the branch if it needs it. Hand-edits are expected, not a failure.

### 4. Merge

`publish` runs on the push to `master`, filtered to `package.json`, and decides for itself whether
there is anything to cut: a version in the manifest with no matching tag. When there is, it takes
the version's section out of `CHANGELOG.md` as the notes, creates the annotated tag, pushes **only
the tag**, and creates the GitHub Release with `--verify-tag`. A version with no changelog section
fails the job before the tag exists.

**What `publish` does not do:** it re-runs no part of CI. The code was gated by the release pull
request's own required checks, and the commit is on `master` by construction of the trigger.
Duplicating the test matrix here would create a second definition of "green" that drifts from
`ci.yml`.

## Writing commits so the entry is right

The entry is built from commit subjects, so the prefix decides the section. This map is the
generator's (`scripts/release-changelog.mjs`); [CONTRIBUTING.md](CONTRIBUTING.md) carries the same
table for contributors.

| Section | Prefixes |
|---|---|
| **Breaking Changes** | any `type!:` — and the commit also appears under its own section |
| Added | `feat` |
| Fixed | `fix` |
| Security | `security` |
| Changed | `perf`, `refactor`, `style`, `revert` |
| Documentation | `docs` |
| Maintenance | `chore`, `build` |
| Testing | `test` |
| CI | `ci` |

Any other prefix, and any subject that is not a conventional commit, is reported as dropped rather
than filed somewhere approximate.

## Doing it by hand

When the workflow is unavailable, the manual path is the same shape. Bump the version and run
`node scripts/release-changelog.mjs` on a branch, land it by pull request, then:

```bash
git fetch origin
sha=$(git rev-parse origin/master)
git merge-base --is-ancestor "$sha" origin/master && git tag -a vX.Y.Z "$sha" -m "dojo vX.Y.Z"
git push origin vX.Y.Z
```

Never `git push origin master --tags`: it pushes to the protected branch and publishes every local
tag at once.

Then create the Release from the version's changelog section:

```bash
v=X.Y.Z
awk -v h="## [$v]" 'index($0, h) == 1 { f = 1; next } f && /^## / { exit } f' CHANGELOG.md > /tmp/notes.md
gh release create "v$v" --verify-tag --title "dojo v$v" --notes-file /tmp/notes.md
```

Add `--prerelease` for a version with a pre-release suffix.

## Hotfix process

A hotfix is a normal change on `master`: a pull request with the fix and its tests, then a patch
release from step 1. No branch is cut from a tag, and no tag lands on a commit that is not on
`master`. To put the fix in production, promote `master` as
[docs/ops/deploy.md](docs/ops/deploy.md) describes.

## Tags that are not releases

Only `v*` tags are releases. A tag that marks a point in history has no GitHub Release and no
changelog section, and the changelog generator ignores it when it looks for the previous release.

## Artifacts

**Releases produce no images and publish no packages.** Every workspace package is private and
never reaches a registry.

The container images come from deploying, not from releasing: `kamal deploy` builds and pushes
`ghcr.io/<owner>/dojo-api` and `ghcr.io/<owner>/dojo-web`, tagged with the deployed commit's SHA
(Kamal's default version, since no `--version` is passed) and with `latest`, which is whatever was
deployed last and not the latest release. There is no `:vX.Y.Z` image.

Sentry releases are keyed by commit SHA too — the deploy workflow passes `SENTRY_RELEASE:
${{ github.sha }}`. Tagging a version creates no Sentry release.
