# Chromatic Setup Guide

Chromatic provides visual regression testing for Storybook. This is **optional** for Phase 0 but recommended for production use.

## Current Status

- ✅ Chromatic is configured in the CI workflow
- ⚠️ Chromatic will be **skipped** until you add the project token
- ✅ All other CI checks will pass without Chromatic

## Setup Instructions

### 1. Create a Chromatic Account

1. Go to [chromatic.com](https://www.chromatic.com/)
2. Sign up with your GitHub account
3. Create a new project for "Sonar Quiz System"

### 2. Get Your Project Token

1. In Chromatic dashboard, go to your project settings
2. Copy the **Project Token** (looks like: `chpt_xxxxxxxxxxxxx`)

### 3. Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `CHROMATIC_PROJECT_TOKEN`
5. Value: Paste your Chromatic project token
6. Click **Add secret**

### 4. Verify Setup

Once the token is added:

1. Push a commit to your branch
2. GitHub Actions will automatically run Chromatic
3. Check the workflow run to see visual regression results
4. View detailed reports in the Chromatic dashboard

## Running Locally

```bash
# Set your token as an environment variable
export CHROMATIC_PROJECT_TOKEN=chpt_xxxxxxxxxxxxx

# Run Chromatic locally
npm run chromatic
```

## What Chromatic Does

- 📸 Captures snapshots of all Storybook stories
- 🔍 Compares them against the baseline
- ⚠️ Flags visual changes for review
- ✅ Prevents unintended UI regressions

## Free Tier Limits

Chromatic's free tier includes:
- 5,000 snapshots/month
- Unlimited collaborators
- 1 concurrent build

This is sufficient for Phase 0-1 development.

## Disabling Chromatic

If you don't want to use Chromatic:

1. The CI will automatically skip it (no action needed)
2. Alternatively, remove the `chromatic` job from `.github/workflows/ci.yml`
3. Remove the `chromatic` dev dependency from `package.json`

## Learn More

- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [Storybook + Chromatic Tutorial](https://storybook.js.org/tutorials/intro-to-storybook/react/en/deploy/)
