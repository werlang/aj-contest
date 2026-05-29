# AGENTS.md

## Project Scope

- This repository is a VS Code extension for browsing AutoJudge contest data with team credentials.
- The implemented runtime currently covers team login, logout, session restore, contest explorer rendering, submission-history display, problem preview, submission-detail output, active-file submission, public testcase export, and testcase-file creation.
- The sidebar surface now includes both the `Contest Explorer` view and the `Team Submissions` view under the same `AutoJudge Contest` activity-bar container.
- Keep changes focused on the extension, its docs, and its agent customizations. Do not add unrelated app or backend patterns.

## Key Files

- [package.json](package.json): extension manifest, `Contest Explorer` and `Team Submissions` views, contributed commands and menus, and the `autojudgeContest.baseUrl` and `autojudgeContest.pollIntervalMs` settings.
- [src/extension.js](src/extension.js): activation entrypoint that creates the `AutoJudge Contest` output channel, both sidebar views, and the command registrations.
- [src/commands.js](src/commands.js): command wiring, login prompt flow, base URL resolution, and controller-backed registrations for preview, submission, testcase export, and testcase creation actions.
- [src/contest-controller.js](src/contest-controller.js): login, logout, refresh, error handling, problem preview, submission-detail rendering, submission workflows, testcase actions, and context synchronization across both views.
- [src/contest-session.js](src/contest-session.js): session persistence and contest snapshot loading.
- [src/contest-api.js](src/contest-api.js): AutoJudge contest HTTP contract for team login, current-team lookup, contest problems, submissions, and solution upload.
- [src/contest-tree-provider.js](src/contest-tree-provider.js): visible contest explorer structure for logged-out and logged-in contest states.
- [src/submissions-view-provider.js](src/submissions-view-provider.js): selectable `Team Submissions` problem list and current submission target state.
- [src/contest-public-cases.js](src/contest-public-cases.js): public testcase extraction helpers for contest problems.
- [src/contest-submission-workspace.js](src/contest-submission-workspace.js): active-file validation plus testcase export and testcase creation file-system workflows.
- [src/session-store.js](src/session-store.js): VS Code secrets and global state storage for the team session.
- [tests/activation.test.js](tests/activation.test.js), [tests/contest-controller.test.js](tests/contest-controller.test.js), [tests/contest-public-cases.test.js](tests/contest-public-cases.test.js), [tests/contest-session.test.js](tests/contest-session.test.js), [tests/contest-tree-provider.test.js](tests/contest-tree-provider.test.js), [tests/session-store.test.js](tests/session-store.test.js), [tests/submissions-view-provider.test.js](tests/submissions-view-provider.test.js): current coverage for activation, controller flow, testcase extraction, session persistence, explorer rendering, and submissions-panel behavior.
- [README.md](README.md): user-facing extension behavior and current command status.

## Project Skills

- `.agents/skills/autojudge-extension-runtime/`: use for contest runtime changes to command behavior, session restore, explorer and submission actions, output-channel messaging, API interactions, refresh behavior, or future submission polling. Pair it with the repository `docker-vitest-tdd` skill plus the global `document-touched-code` and skeptical review skills so extension changes stay maintainable, documented, and security-reviewed.
- `.agents/skills/autojudge-manifest-sync/`: use for changes to commands, views, menus, settings, context-key gating, and user-facing docs that must stay aligned with `package.json`.
- `.agents/skills/docker-container-development/`: use when repository commands should run through the Compose development container instead of the host machine.
- `.agents/skills/docker-vitest-tdd/`: use when a runtime change should be driven by Vitest coverage inside the Compose environment.
- Global skill `document-touched-code`: use by default when touching runtime code or tests so JSDoc and focused comments stay aligned with the changed behavior.
- Global skill `refactor-feature-additions`: use for maintainable feature or refactor work that should leave behind tests, documentation, and explicit validation.
- Global skills `frontend-bug-review-generalized` and `backend-bug-review-generalized`: use for skeptical correctness and vulnerability review of VS Code extension runtime work, choosing the review surface based on whether the risk is explorer or UI facing or API, auth, or storage facing.

## Working Conventions

- Use modern ESM-style JavaScript consistent with the existing `import` and named export pattern.
- Preserve the current ownership boundaries: activation in [src/extension.js](src/extension.js), command registration in [src/commands.js](src/commands.js), controller flow in [src/contest-controller.js](src/contest-controller.js), remote API helpers in [src/contest-api.js](src/contest-api.js), session persistence in [src/contest-session.js](src/contest-session.js) and [src/session-store.js](src/session-store.js), explorer rendering in [src/contest-tree-provider.js](src/contest-tree-provider.js), submissions-panel rendering in [src/submissions-view-provider.js](src/submissions-view-provider.js), and testcase/workspace helpers in [src/contest-public-cases.js](src/contest-public-cases.js) and [src/contest-submission-workspace.js](src/contest-submission-workspace.js).
- Prefer maintainable OOP-friendly structure: keep VS Code registration and prompt glue thin, move stateful contest behavior into the controller or focused helpers, and only introduce new classes when they own a clear long-lived responsibility.
- If you change a contributed command, menu item, view, or setting, update [package.json](package.json), [README.md](README.md), and any user-facing [CHANGELOG.md](CHANGELOG.md) entry that describes the change.
- Treat [README.md](README.md) as a VS Code extension README, not a generic library README. Keep the wording centered on extension usage and current capabilities.
- Keep output user-facing and concise in the `AutoJudge Contest` output channel and VS Code notifications.
- Start the development environment with `docker compose up -d --build` and run repository commands inside the `extension` service.
- Do not run `node`, `npm`, `npx`, or `vitest` directly on the host; use `docker compose exec extension ...` instead.
- When a task changes runtime behavior, add or update focused Vitest coverage when practical and validate with `docker compose exec extension npm test`.
- Never log passwords, bearer tokens, or other secret material to the output channel, notifications, tests, or persisted files.

## Runtime Behavior To Preserve

- The contributed commands are `autojudgeContest.createTestCases`, `autojudgeContest.loginTeam`, `autojudgeContest.logoutTeam`, `autojudgeContest.refreshTree`, `autojudgeContest.openProblem`, `autojudgeContest.submitActiveFile`, `autojudgeContest.exportPublicCases`, and `autojudgeContest.openSubmission`.
- Login prompts for a team id or hash and then a password.
- Successful login stores the returned token in VS Code secrets and stores the team id in global state.
- Refresh attempts to restore the stored session, loads the current team, contest problems, and submissions, and updates both sidebar views.
- If session restore receives `400` or `401`, the stored session is cleared and the view returns to the logged-out state.
- Both views show a login action when logged out. When logged in, `Contest Explorer` shows a contest header plus problems sorted by `order` with only that problem's submissions nested newest-first, and `Team Submissions` shows all contest problems as selectable submission targets.
- Opening a problem renders a scratch Markdown preview, and opening a submission clears the `AutoJudge Contest` output channel and prints the full submission payload.
- Submitting the active file works from the explorer problem actions and the selected `Team Submissions` problem, then merges the new submission into the in-memory snapshot so both views refresh immediately.
- Exporting public cases and creating testcase files operate on the selected contest problem and use the maintained testcase workspace helper.
- The configured API base URL must support optional base paths; reuse [src/contest-api.js](src/contest-api.js) normalization instead of rebuilding URLs elsewhere.

## Validation

- Run automated checks through the Compose container. The default test command is `docker compose exec extension npm test`.
- For manifest and docs changes, verify that [package.json](package.json), [README.md](README.md), and [CHANGELOG.md](CHANGELOG.md) stay in sync.
- For behavior changes, favor manual validation in the Extension Development Host using both `Contest Explorer` and `Team Submissions`, including login, refresh, logout, preview, submission-detail, submit, testcase export, and testcase creation flows.
- Pair tree, controller, submissions-view, or testcase-workspace changes with focused Vitest coverage when the touched code can be exercised outside VS Code.

## Pitfalls

- Do not assume the public site URL and API URL are the same; the extension targets the API base URL configured by `autojudgeContest.baseUrl`.
- The login flow uses `POST teams/{teamId}/login` with the password in the `Authorization: Bearer ...` header, then restores the contest snapshot with `GET teams`, `GET contests/{contestId}/problems`, and `GET submissions` before later submission actions reuse the stored contest token.
- `autojudgeContest.pollIntervalMs` exists in the manifest but is not used by the current runtime yet.
- Testcase export and testcase creation may honor the base AutoJudge extension's `autojudge.testcasePath` setting when it is available, but the contest extension runtime does not depend on a separate `autojudgeContest.baseExtensionInstalled` context key.
- Legacy run/test files such as [src/runner.js](src/runner.js), [src/input-resolver.js](src/input-resolver.js), and related helpers are not part of the current activation flow for this contest extension.