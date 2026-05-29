# AutoJudge Contest

Use your AutoJudge team credentials to browse contest problems, inspect submissions, and send solutions without leaving VS Code.

## Features

- Adds an `AutoJudge Contest` activity-bar container with two sidebar views: `Contest Explorer` and `Team Submissions`.
- Shows a `Login Team` welcome action while logged out, then restores the contest snapshot after successful authentication.
- Displays contest problems as collapsible explorer items with only that problem's submissions nested underneath, sorted newest first.
- Shows submission verdict icons in the explorer and opens the full submission payload in the `AutoJudge Contest` output channel when you click a submission.
- Opens a scratch Markdown preview for any contest problem directly from the explorer.
- Lets you select a problem in `Team Submissions` and reuse that target for submit, export, and testcase actions.
- Submits the active saved source file from either the explorer inline action or the `Team Submissions` toolbar.
- Exports public testcase pairs and creates empty custom `.in`/`.out` testcase files in the maintained AutoJudge testcase layout.
- Supports hosted or self-hosted AutoJudge API deployments through a configurable base URL.

## Install

This repository is currently set up for local development or private packaging.

To try it locally:

1. Open this repository in VS Code.
2. Start the dev container services with `docker compose up -d --build`.
3. Install dependencies with `docker compose exec extension npm install`.
4. Press `F5` in VS Code to launch an Extension Development Host.

To package a build, run `docker compose exec extension npm run build` and install the generated `.vsix` from the Extensions view.

## Quick Start

1. Open the `AutoJudge Contest` view from the activity bar.
2. Click `Login Team` in the welcome state or run `AutoJudge Contest: Login Team`.
3. Enter your team id or hash, then the team password.
4. In `Contest Explorer`, expand a problem to inspect its submissions, click the problem to open a preview, or click a submission to print its full result payload in the output channel.
5. In `Team Submissions`, click a problem to mark it as the current submission target.
6. Open a saved supported source file and use the selected problem's row actions for `Submit Active File`, `Export Public Cases`, or `Create Test Cases`, or use the `Team Submissions` toolbar for `Submit Active File` and `Create Test Cases` after a problem is selected.
7. Use `AutoJudge Contest: Refresh Contest Tree` to reload the current snapshot or `AutoJudge Contest: Logout Team` to clear the stored session.

## Commands

- `AutoJudge Contest: Login Team` (`autojudgeContest.loginTeam`): prompts for team credentials, authenticates against the configured API, and loads the contest tree.
- `AutoJudge Contest: Logout Team` (`autojudgeContest.logoutTeam`): removes the stored team session and returns the tree to the logged-out state.
- `AutoJudge Contest: Refresh Contest Tree` (`autojudgeContest.refreshTree`): reloads the stored session and refreshes contest, problem, and submission data.
- `AutoJudge Contest: Open Problem` (`autojudgeContest.openProblem`): opens a scratch Markdown preview for the clicked contest problem.
- `AutoJudge Contest: Submit Active File` (`autojudgeContest.submitActiveFile`): submits the active saved `.c`, `.cpp`, `.java`, `.js`, `.php`, or `.py` file to the clicked explorer problem or the currently selected `Team Submissions` problem.
- `AutoJudge Contest: Export Public Cases` (`autojudgeContest.exportPublicCases`): writes the selected problem's public testcase pairs as `.in`/`.out` files.
- `AutoJudge Contest: Open Submission Result` (`autojudgeContest.openSubmission`): clears the output channel and prints the full submission payload for the clicked submission.
- `AutoJudge Contest: Create Test Cases` (`autojudgeContest.createTestCases`): creates the next empty custom testcase pair for the selected problem.

The `Contest Explorer` title contributes refresh plus login/logout actions based on session state. The `Team Submissions` title contributes `Submit Active File` and `Create Test Cases` after a submission problem is selected. Problem and submission actions are also available inline on their corresponding sidebar rows.

## Keyboard Shortcuts

This version does not contribute any default keyboard shortcuts.

## Configuration

- `autojudgeContest.baseUrl`
  - Full AutoJudge API base URL used for team login, contest loading, and submission history requests.
  - Default: `https://api.autojudge.io`
  - Base paths are preserved, so values such as `https://example.com/api` are valid.
- `autojudgeContest.pollIntervalMs`
  - Contributed setting reserved for future verdict polling work.
  - Default: `5000`
  - The current runtime does not use this value yet.

Testcase export and testcase creation also honor the `autojudge.testcasePath` setting from the base AutoJudge extension when that setting is available. Otherwise, files are created next to the active source file.

Example:

```json
{
  "autojudgeContest.baseUrl": "https://api.autojudge.io",
  "autojudgeContest.pollIntervalMs": 5000
}
```

## Troubleshooting

- If login fails immediately, verify that `autojudgeContest.baseUrl` points at the AutoJudge API and not just the public site.
- If the stored session expires or becomes invalid, refreshing the tree silently clears the saved session and returns the view to the logged-out state.
- Submission, testcase export, and testcase creation require an active saved source file with one of these extensions: `.c`, `.cpp`, `.java`, `.js`, `.php`, or `.py`.
- If testcase files are not appearing where you expect, check whether `autojudge.testcasePath` is configured in the base AutoJudge extension. If it is unset, files are written beside the active source file.
- Submission details are written to the `AutoJudge Contest` output channel, so open that output channel if you want to keep the payload visible while switching files.

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for repository history and documentation updates.
