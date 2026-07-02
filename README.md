# QA Auto Codex

Playwright-based browser automation test project.

## Commands

```powershell
npm install
npx playwright install
npm test
```

## GitHub Actions

The workflow in `.github/workflows/playwright.yml` runs Playwright tests on pushes and pull requests to `main`.

To point tests at a deployed site later, set `PLAYWRIGHT_BASE_URL` in the workflow or repository secrets/variables.
