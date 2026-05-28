# AutoJudge Contest

Browse an AutoJudge contest from VS Code using your team credentials.

This extension currently focuses on contest login, session restore, and a sidebar view of contest problems and submission history. The command surface for opening problems, submitting files, exporting public cases, and opening submission details is present in the UI, but those workflows are still placeholders in the current build.

## Features

- Adds an `AutoJudge Contest` view container to the VS Code activity bar.
- Signs in with an AutoJudge contest team id or hash plus team password.
- Persists the authenticated session in VS Code storage and restores it on refresh.
- Shows the current contest, visible problems, and per-problem submissions in a tree view.
- Writes login, refresh, and error messages to the `AutoJudge Contest` output channel.
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
2. Run `AutoJudge Contest: Login Team`.
3. Enter your team id or hash, then the team password.
4. Expand the tree to inspect the contest header, problems, and recent submissions.
5. Use `AutoJudge Contest: Refresh Contest Tree` to reload the current snapshot or `AutoJudge Contest: Logout Team` to clear the stored session.

## Commands

- `AutoJudge Contest: Login Team` (`autojudgeContest.loginTeam`): prompts for team credentials, authenticates against the configured API, and loads the contest tree.
- `AutoJudge Contest: Logout Team` (`autojudgeContest.logoutTeam`): removes the stored team session and returns the tree to the logged-out state.
- `AutoJudge Contest: Refresh Contest Tree` (`autojudgeContest.refreshTree`): reloads the stored session and refreshes contest, problem, and submission data.
- `AutoJudge Contest: Open Problem` (`autojudgeContest.openProblem`): currently registered as a placeholder and shows `Problem preview is not implemented yet.`
- `AutoJudge Contest: Submit Active File` (`autojudgeContest.submitActiveFile`): currently registered as a placeholder and shows `Active-file submission is not implemented yet.`
- `AutoJudge Contest: Export Public Cases` (`autojudgeContest.exportPublicCases`): currently registered as a placeholder and shows `Public testcase export is not implemented yet.`
- `AutoJudge Contest: Open Submission Result` (`autojudgeContest.openSubmission`): currently registered as a placeholder and shows `Submission detail is not implemented yet.`

The login, logout, and refresh commands are available from the Command Palette. Refresh, login, and logout are also contributed to the contest view title. Problem and submission actions are contributed to the contest tree context menus.

## Keyboard Shortcuts

This version does not contribute any default keyboard shortcuts.

## Configuration

- `autojudgeContest.baseUrl`
  - Full AutoJudge API base URL used for team login, contest loading, and submission history requests.
  - Default: `https://api.autojudge.io`
  - Base paths are preserved, so values such as `https://example.com/api` are valid.
- `autojudgeContest.pollIntervalMs`
  - Contributed setting reserved for submission polling work.
  - Default: `5000`
  - The current runtime does not use this value yet because submission polling has not been implemented.

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
- `Open Problem`, `Submit Active File`, `Export Public Cases`, and `Open Submission Result` are not available yet beyond placeholder notifications.
- The `Export Public Cases` context action is gated by `autojudgeContest.baseExtensionInstalled`; the current runtime does not set that context key yet.

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for repository history and documentation updates.
