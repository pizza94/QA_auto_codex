# Test Plan

This document records the intended Playwright automation scenarios for the IRUDA QA project.

Do not store real passwords, session cookies, one-time tokens, or raw chat prompts here. Keep this file focused on test intent, expected behavior, environment requirements, and verified execution history.

## Table of Contents

1. [Update Rule](#1-update-rule)
2. [Environment](#2-environment)
3. [Current Scenarios](#3-current-scenarios)
   1. [TC-001 Login](#tc-001-login)
4. [Execution History](#4-execution-history)
5. [CI Notes](#5-ci-notes)
6. [Backlog](#6-backlog)

## 1. Update Rule

Update this file whenever a test scenario is completed and the final changes are pushed.

Each update should include:

1. Scenario number and name.
2. Test file path.
3. Purpose and expected result.
4. Key selectors or verification signals.
5. Latest verified run result.
6. Any CI limitation or follow-up needed.

Number new scenarios sequentially as `TC-001`, `TC-002`, `TC-003`, and so on. Keep the table of contents in the same order as the scenario list.

## 2. Environment

- Application base URL: configured through `PLAYWRIGHT_BASE_URL`
- Login user ID: configured through `PLAYWRIGHT_USERNAME`
- Login password: configured through `PLAYWRIGHT_PASSWORD`
- Local target example: `http://10.194.5.53:8180`

## 3. Current Scenarios

### TC-001 Login

Status: implemented and locally verified

File: `tests/login.spec.ts`

Purpose:

1. Open the IRUDA login page.
2. Enter a valid user ID and password from environment variables.
3. Submit the login form.
4. Verify that the browser leaves the login URL.
5. Verify that the Data Portal landing page is visible.

Selectors:

1. User ID input: `#usrId`
2. Password input: `#pswd`
3. Login button: `button.submit`
4. Successful landing signal: heading text matching `Welcome to Data Portal`

Expected result:

1. Login completes within 15 seconds.
2. The final page is not `/iruda_woori/login`.
3. The Data Portal heading is visible.

Latest verified result:

- Local Chromium run with environment credentials: passed
- GitHub Actions run without credentials: login test skipped, smoke tests passed

## 4. Execution History

1. `2026-07-02` - Added Playwright project scaffold and GitHub Actions workflow. GitHub Actions passed with smoke tests.
2. `2026-07-02` - Added `TC-001 Login`. Local Chromium login test passed. GitHub Actions passed with login test skipped because credentials were not configured.
3. `2026-07-02` - Added numbered test plan structure and update rule.

## 5. CI Notes

GitHub-hosted runners usually cannot access private `10.x` network addresses. To run internal IRUDA tests in CI, use one of these approaches:

1. Configure a self-hosted runner inside the internal network.
2. Provide VPN/internal network access to the runner.
3. Run the login test locally and keep GitHub Actions limited to public or mockable checks.

When credentials are not configured, the login test is skipped and the smoke test still runs.

## 6. Backlog

Add scenarios here before implementing them:

1. `TC-002` Navigate to Data Catalog after login.
2. `TC-003` Run a basic search and verify results load.
3. `TC-004` Open a metadata detail page and verify key fields are visible.
4. `TC-005` Validate logout behavior.
