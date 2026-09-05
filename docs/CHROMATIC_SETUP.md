# Chromatic (Visual Regression) Setup

Chromatic captures screenshots of every Storybook story and diffs them against the last
accepted baseline. It is wired into `.github/workflows/ci.yml` as the **Visual Regression Tests**
job, which runs on pushes to `main` only.

## How the job behaves

1. `npm run build-storybook` runs unconditionally. If a story is broken (for example it imports a
   component that no longer exists) **the job fails**. This step exists because between June and
   September 2026 the Storybook build was broken and a `continue-on-error` flag hid it.
2. The Chromatic upload step runs only when the `CHROMATIC_PROJECT_TOKEN` secret is set. Without
   the token the step is skipped and the job is reported as passed with a notice in the log.

There is no `continue-on-error` any more: a red Chromatic step is a real failure.

## One-time setup

1. Create a project at [chromatic.com](https://www.chromatic.com/) linked to this repository.
2. Copy the project token (`chpt_...`).
3. Add it as a repository secret named `CHROMATIC_PROJECT_TOKEN`
   (Settings → Secrets and variables → Actions).
4. Push to `main`. The first run establishes the baseline; accept it in the Chromatic UI.

## Running locally

```bash
export CHROMATIC_PROJECT_TOKEN=chpt_xxxxxxxxxxxxx
npm run chromatic
```

`npm run build-storybook` on its own is the quickest way to check that every story still
compiles, and needs no token.

## Free tier

5,000 snapshots per month and one concurrent build, which is ample for this project's story
count. `onlyChanged: true` in the workflow limits snapshots to stories affected by each push.
