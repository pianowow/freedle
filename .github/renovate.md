# Renovate Dependency Maintenance

## Goals

Freedle uses Renovate to surface small dependency updates before package drift becomes a large upgrade project. The automation is intentionally conservative: a scheduled GitHub Actions workflow runs Renovate, Renovate opens pull requests, CI checks them, and a human reviewer decides whether to merge.

This setup is also meant to be transferable to GitLab or another forge later. GitHub Actions runs Renovate for this repository today, and the same Renovate policy can be adapted to a GitLab scheduled pipeline model.

## Bot Behavior

The source of truth is `.github/renovate.json`. Renovate is expected to run from a scheduled GitHub Actions workflow, not from the hosted Renovate GitHub App.

Renovate is configured to:

- scan npm dependencies in `frontend`, `admin-frontend`, and `backend`;
- scan GitHub Actions dependencies in `.github/workflows`;
- open PRs only during the Friday evening maintenance window, 4 PM through 7:59 PM America/New_York;
- keep automerge disabled;
- limit open Renovate noise with `prHourlyLimit` and `prConcurrentLimit`;
- maintain a dependency dashboard issue for visibility.

The GitHub Actions workflow should be scheduled inside the same Friday evening window. The Renovate schedule is still useful as a second gate: if the workflow is run manually or its cron time changes, Renovate will only create branches during the allowed maintenance window.

## GitHub Actions Setup

Renovate needs a token that can create branches, update files, and open pull requests. The repository `GITHUB_TOKEN` is intentionally not used for Renovate because it is too restrictive for this job, especially when Renovate manages `.github/workflows` files.

Create a repository secret:

1. Create a GitHub fine-grained personal access token, preferably from a bot or maintenance account rather than a day-to-day personal account.
2. Scope the token to this repository only.
3. Grant the least permissions needed for Renovate:
   - repository contents: read and write;
   - pull requests: read and write;
   - issues: read and write, for the dependency dashboard;
   - workflows: read and write, because the `github-actions` manager updates `.github/workflows`.
4. Save the token in GitHub as an Actions repository secret named `RENOVATE_TOKEN`.

The workflow that runs Renovate should be scheduled/manual only. Do not run it on `pull_request`, because pull request workflows can involve untrusted code and should not receive this secret.

Expected workflow shape:

```yaml
name: Renovate

on:
  schedule:
    - cron: "0 21 * * 5"
  workflow_dispatch:

jobs:
  renovate:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: renovatebot/github-action@v43.0.0
        with:
          configurationFile: .github/renovate.json
          token: ${{ secrets.RENOVATE_TOKEN }}
```

The example cron runs on Fridays at 21:00 UTC, which is 5 PM America/New_York during daylight saving time and 4 PM during standard time. GitHub Actions cron uses UTC, so daylight saving time can shift a UTC cron relative to local time; the Renovate config timezone and schedule remain the local-time guardrail.

Security notes:

- Keep `RENOVATE_TOKEN` scoped to this repository.
- Keep the workflow off `pull_request`.
- Do not print the token or run shell debug modes that could expose environment values.
- Rotate the token if repository access changes or workflow logs suggest accidental disclosure.

## PR Shape

Npm updates are scoped by package root:

- `frontend/package.json` and `frontend/package-lock.json`;
- `admin-frontend/package.json` and `admin-frontend/package-lock.json`;
- `backend/package.json` and `backend/package-lock.json`.

GitHub Actions updates are scoped separately from application dependencies.

The intent is to avoid one large PR that mixes frontend, admin, backend, and workflow changes. If Renovate opens a PR that crosses these boundaries, treat that as a config issue and adjust `.github/renovate.json` before merging similar updates.

## CI and Audit

The current CI scope remains frontend-only. Because Renovate pushes branches to this repository, the existing `push` trigger runs frontend lint, test, build, and production dependency audit checks for Renovate branches that touch `frontend/**`. A separate `pull_request` trigger is intentionally not used here to avoid duplicate CI runs for same-repository branches.

The audit command is:

```sh
npm audit --omit=dev
```

This checks production dependencies only. It intentionally does not audit dev dependencies yet, so build-tool and dev-server advisories may not be caught by CI.

Backend dependency PRs are in scope for Renovate, but backend CI and backend `npm audit` are not part of this change. Because backend dependencies affect runtime security, backend Renovate PRs should get extra manual attention until backend audit coverage is added.

## Reviewer Workflow

For each Renovate PR:

1. Check which package root changed.
2. Read the Renovate release notes and changelog links in the PR body.
3. Confirm CI passed when the PR touches `frontend/**`.
4. For patch and minor updates, merge if CI is green and the changed package is low risk.
5. For major updates, framework updates, runtime server updates, or anything touching Vite/Vue/Fastify, check the changelog before merging.
6. For frontend runtime or build-tool changes, run the app locally and do a browser smoke test.

Useful frontend commands:

```sh
cd frontend
npm ci
npm run lint
npm test
npm run build
npm audit --omit=dev
npm run dev
```

Useful backend commands until backend CI exists:

```sh
cd backend
npm ci
npm run lint
npm audit --omit=dev
npm start
```

Useful admin frontend commands until admin CI exists:

```sh
cd admin-frontend
npm ci
npm run lint
npm run build
npm audit --omit=dev
```

## Handling Failures

If CI fails, prefer fixing the Renovate branch when the fix is small and directly caused by the dependency update. If the update needs broader migration work, close the Renovate PR and open a focused manual upgrade branch.

If `npm audit --omit=dev` fails, inspect whether the advisory affects reachable production code. Prefer a dependency update when available. If there is no fix, document the risk in the PR and leave the PR open until a remediation path is clear.
