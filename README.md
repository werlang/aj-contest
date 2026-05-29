# AutoJudge Contest

Browse contest problems, watch verdicts land, inspect team standings, and submit solutions to AutoJudge without leaving VS Code.

## Features

- Adds an `AutoJudge Contest` activity-bar container with two views: `Contest Explorer` and `Teams Standings`.
- Signs in with your AutoJudge team id or hash, restores the saved session, and reloads the current contest snapshot on refresh.
- Highlights the contest header with your team name and an offline countdown that keeps updating every second after the contest details are fetched.
- Keeps problem rows focused on navigation: use the book action to open the statement preview, then click submission rows directly to open a formatted result in the `AutoJudge Contest` output channel.
- Submits the active saved source file from a problem row and polls automatically until a final verdict arrives or the timeout path is reached.
- Exports public testcase pairs beside the active source file.
- Creates the next empty custom testcase pair in `autojudge.testcasePath` when that base AutoJudge setting is configured, or beside the active source file when it is not.
- Shows `Teams Standings` sorted by score, refreshes that panel every 15 seconds, and prints the selected team's score plus solved problems to the output channel.
- Supports hosted or self-hosted AutoJudge API deployments through a configurable base URL.

## Install

This extension is currently packaged from this repository for local development or private distribution.

To try it locally:

1. Open this repository in VS Code.
2. Start the development container with `docker compose up -d --build`.
3. Install dependencies with `docker compose exec extension npm install`.
4. Press `F5` to launch an Extension Development Host.

To install a packaged build, run `docker compose exec extension npm run build`, then install the generated `.vsix` from the Extensions view.

## Quick Start

1. Open `AutoJudge Contest` from the activity bar.
2. Run `AutoJudge Contest: Login Team` or use the welcome action.
3. Enter your team id or hash, then the team password.
4. In `Contest Explorer`, expand a problem to inspect its submissions. Use the book icon to open the problem statement, or use the inline actions to submit the active file or export public cases.
5. Click any submission row to open its result in the `AutoJudge Contest` output channel.
6. Run `AutoJudge Contest: Create Test Cases` when you want the next empty custom testcase pair for a selected problem.
7. Open `Teams Standings` to monitor the current ranking. Click a team row to print that team's score and solved problems.
8. Run `AutoJudge Contest: Refresh Contest Tree` to reload the current snapshot, or `AutoJudge Contest: Logout Team` to clear the saved session.

## Commands

- `AutoJudge Contest: Login Team` (`autojudgeContest.loginTeam`): prompts for team credentials, authenticates against the configured API, and loads the contest snapshot.
- `AutoJudge Contest: Logout Team` (`autojudgeContest.logoutTeam`): clears the stored team session and returns both views to the logged-out state.
- `AutoJudge Contest: Refresh Contest Tree` (`autojudgeContest.refreshTree`): reloads the stored session and refreshes contest, problem, submission, and standings data.
- `AutoJudge Contest: Open Problem` (`autojudgeContest.openProblem`): opens a scratch Markdown preview for the selected contest problem.
- `AutoJudge Contest: Submit Active File` (`autojudgeContest.submitActiveFile`): submits the active saved `.c`, `.cpp`, `.java`, `.js`, `.php`, or `.py` file for the selected contest problem and polls for the final verdict.
- `AutoJudge Contest: Export Public Cases` (`autojudgeContest.exportPublicCases`): writes the selected problem's public testcase pairs as `.in` and `.out` files beside the active source file.
- `AutoJudge Contest: Create Test Cases` (`autojudgeContest.createTestCases`): creates the next empty custom testcase pair for the selected problem.
- `AutoJudge Contest: Open Submission Result` (`autojudgeContest.openSubmission`): clears the output channel and prints the formatted submission details plus raw payload for the selected submission.
- `AutoJudge Contest: Open Team Standing` (`autojudgeContest.openTeamStanding`): clears the output channel and prints the selected team's score plus solved problems.

The `Contest Explorer` title contributes refresh plus login or logout actions depending on session state. The `Teams Standings` title contributes refresh and login or logout actions for the same state transitions. The explorer's inline problem actions cover opening the statement, submitting the active file, and exporting public cases, while submission rows and standings rows open directly when selected.

## Configuration

- `autojudgeContest.baseUrl`
  - Full AutoJudge API base URL used for team login, contest loading, submission polling, and standings refresh.
  - Default: `https://api.autojudge.io`
  - Base paths are preserved, so values such as `https://example.com/api` are valid.
- `autojudgeContest.pollIntervalMs`
  - Polling interval, in milliseconds, used while waiting for a final submission verdict.
  - Default: `5000`
  - Minimum: `1000`

The standings refresh cadence is fixed at 15 seconds and is not currently user-configurable.

Example:

```json
{
  "autojudgeContest.baseUrl": "https://api.autojudge.io",
  "autojudgeContest.pollIntervalMs": 5000
}
```

## Troubleshooting

- If login fails immediately, verify that `autojudgeContest.baseUrl` points at the AutoJudge API and not only the public website.
- If refresh returns you to the logged-out state, the stored session likely expired or became invalid and was cleared automatically.
- Submission, public-case export, and testcase creation all require an active saved source file with one of these extensions: `.c`, `.cpp`, `.java`, `.js`, `.php`, or `.py`.
- Public-case export always writes beside the active source file. Custom testcase creation follows `autojudge.testcasePath` from the base AutoJudge extension when that setting exists; otherwise it also writes beside the active source file.
- Submission details and team-standing details are written to the `AutoJudge Contest` output channel. Keep that channel visible if you want to compare multiple results.

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for the current release history.
