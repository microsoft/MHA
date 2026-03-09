# TESTING

This document describes MHA testing policy, local test execution, coverage requirements, and CI validation.

## Test policy

- Major functionality changes must include or update automated Jest tests in the same pull request.
- When behavior changes, contributors are expected to add or update tests that validate the new behavior.
- Automated tests must include assertion checks (Jest `expect(...)`) for behavior verification.
- Pull requests are validated by CI running `npm test`.
- Global minimum coverage thresholds are enforced in `jest.config.ts`:
  - branches: 35
  - functions: 40
  - lines: 40
  - statements: 40

## Local testing workflow

1. Install dependencies: `npm install`
2. Start local development server when validating UI behavior: `npm run dev-server`
3. Run lint and fix issues: `npm run lint`
4. Run tests: `npm test`

## Test outputs

- Local unit test runner page: <https://localhost:44336/Pages/test/>
- Local coverage report page: <https://localhost:44336/Pages/coverage/lcov-report/>
- Hosted unit test report: <https://mha.azurewebsites.net/Pages/test>
- Hosted code coverage report: <https://mha.azurewebsites.net/Pages/coverage/lcov-report>

## CI test validation

- Workflow: `.github/workflows/jest.yml`
- Triggered on pull requests, merge groups, workflow dispatch, and pushes to `main`.
- CI executes:
  - `npm ci`
  - `npm test`
