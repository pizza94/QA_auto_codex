# Test Plan

This document records the intended Playwright automation scenarios for the IRUDA QA project.

It should describe test intent, expected behavior, and required environment values. Do not store real passwords, session cookies, one-time tokens, or raw chat prompts here.

## Environment

- Application base URL: configured through `PLAYWRIGHT_BASE_URL`
- Login user ID: configured through `PLAYWRIGHT_USERNAME`
- Login password: configured through `PLAYWRIGHT_PASSWORD`
- Local target example: `http://10.194.5.53:8180`

## Current Scenarios

### Login

File: `tests/login.spec.ts`

Purpose:

- Open the IRUDA login page.
- Enter a valid user ID and password from environment variables.
- Submit the login form.
- Verify that the browser leaves the login URL.
- Verify that the Data Portal landing page is visible.

Selectors:

- User ID input: `#usrId`
- Password input: `#pswd`
- Login button: `button.submit`
- Successful landing signal: heading text matching `Welcome to Data Portal`

Expected result:

- Login completes within 15 seconds.
- The final page is not `/iruda_woori/login`.
- The Data Portal heading is visible.

## CI Notes

GitHub-hosted runners usually cannot access private `10.x` network addresses. To run internal IRUDA tests in CI, use one of these approaches:

- Configure a self-hosted runner inside the internal network.
- Provide VPN/internal network access to the runner.
- Run the login test locally and keep GitHub Actions limited to public or mockable checks.

When credentials are not configured, the login test is skipped and the smoke test still runs.

## Backlog

Add scenarios here before implementing them:

- Navigate to Data Catalog after login.
- Run a basic search and verify results load.
- Open a metadata detail page and verify key fields are visible.
- Validate logout behavior.