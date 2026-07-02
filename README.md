# QA Auto Codex

Playwright-based browser automation test project.

## Commands

```powershell
npm install
npx playwright install
npm test
```

Run the IRUDA login test locally:

```powershell
$env:PLAYWRIGHT_BASE_URL = "http://10.194.5.53:8180"
$env:PLAYWRIGHT_USERNAME = "your-user-id"
$env:PLAYWRIGHT_PASSWORD = "your-password"
npm run test:login -- --project=chromium
```

## GitHub Actions

The workflow in `.github/workflows/playwright.yml` runs Playwright tests on pushes and pull requests to `main`.

For CI login tests, configure these repository values:

- Variable: `PLAYWRIGHT_BASE_URL`
- Secret: `PLAYWRIGHT_USERNAME`
- Secret: `PLAYWRIGHT_PASSWORD`

The `10.x` IRUDA URL is an internal network address, so GitHub-hosted runners usually cannot reach it unless the runner has VPN/internal network access. Without the username/password secrets, the login test is skipped and the smoke test still runs.
