# AGENTS.md

## Project Scope

- This repository is a VS Code extension for browsing AutoJudge contest data with team credentials.
- The implemented runtime currently covers team login, logout, session restore, contest tree rendering, and submission-history display.
- Problem preview, active-file submission, public case export, and submission-detail commands are scaffolded in the manifest but still behave as placeholders.
- Keep changes focused on the extension, its docs, and its agent customizations. Do not add unrelated app or backend patterns.

## Key Files

- [package.json](package.json): extension manifest, activity bar container, contest tree view, contributed commands, menus, and the `autojudgeContest.baseUrl` and `autojudgeContest.pollIntervalMs` settings.
- [src/extension.js](src/extension.js): activation entrypoint that creates the `AutoJudge Contest` output channel, contest tree view, and command registrations.
- [src/commands.js](src/commands.js): command wiring, login prompt flow, base URL resolution, and placeholder handlers for not-yet-implemented commands.
- [src/contest-controller.js](src/contest-controller.js): login, logout, refresh, error handling, and context synchronization for the tree view state.
- [src/contest-session.js](src/contest-session.js): session persistence and contest snapshot loading.
- [src/contest-api.js](src/contest-api.js): AutoJudge contest HTTP contract for team login, current-team lookup, contest problems, and submissions.
- [src/contest-tree-provider.js](src/contest-tree-provider.js): visible tree structure for logged-out and logged-in contest states.
- [src/session-store.js](src/session-store.js): VS Code secrets and global state storage for the team session.
- [tests/activation.test.js](tests/activation.test.js), [tests/contest-controller.test.js](tests/contest-controller.test.js), [tests/contest-session.test.js](tests/contest-session.test.js), [tests/contest-tree-provider.test.js](tests/contest-tree-provider.test.js), [tests/session-store.test.js](tests/session-store.test.js): current coverage for activation, controller flow, session persistence, and tree rendering.
- [README.md](README.md): user-facing extension behavior and current command status.

## Project Skills

- `.agents/skills/autojudge-extension-runtime/`: use for changes to command behavior, contest session flow, output-channel messaging, API interactions, refresh behavior, or future submission polling.
- `.agents/skills/autojudge-manifest-sync/`: use for changes to commands, menus, settings, view metadata, and user-facing docs that must stay aligned with `package.json`.
- `.agents/skills/docker-container-development/`: use when repository commands should run through the Compose development container instead of the host machine.
- `.agents/skills/docker-vitest-tdd/`: use when a runtime change should be driven by Vitest coverage inside the Compose environment.

## Working Conventions

- Use modern ESM-style JavaScript consistent with the existing `import` and named export pattern.
- Preserve the current ownership boundaries: activation in [src/extension.js](src/extension.js), command registration in [src/commands.js](src/commands.js), controller flow in [src/contest-controller.js](src/contest-controller.js), remote API helpers in [src/contest-api.js](src/contest-api.js), session persistence in [src/contest-session.js](src/contest-session.js) and [src/session-store.js](src/session-store.js), and tree rendering in [src/contest-tree-provider.js](src/contest-tree-provider.js).
- If you change a contributed command, menu item, view, or setting, update [package.json](package.json), [README.md](README.md), and any user-facing [CHANGELOG.md](CHANGELOG.md) entry that describes the change.
- Treat [README.md](README.md) as a VS Code extension README, not a generic library README. Keep the wording centered on extension usage and current capabilities.
- Keep output user-facing and concise in the `AutoJudge Contest` output channel and VS Code notifications.
- Start the development environment with `docker compose up -d --build` and run repository commands inside the `extension` service.
- Do not run `node`, `npm`, `npx`, or `vitest` directly on the host; use `docker compose exec extension ...` instead.
- When a task changes runtime behavior, add or update focused Vitest coverage when practical and validate with `docker compose exec extension npm test`.

## Runtime Behavior To Preserve

- The contributed commands are `autojudgeContest.loginTeam`, `autojudgeContest.logoutTeam`, `autojudgeContest.refreshTree`, `autojudgeContest.openProblem`, `autojudgeContest.submitActiveFile`, `autojudgeContest.exportPublicCases`, and `autojudgeContest.openSubmission`.
- Only login, logout, and refresh currently implement real behavior. The other four commands intentionally emit placeholder messages.
- Login prompts for a team id or hash and then a password.
- Successful login stores the returned token in VS Code secrets and stores the team id in global state.
- Refresh attempts to restore the stored session, loads the current team, contest problems, and submissions, and updates the tree view.
- If session restore receives `400` or `401`, the stored session is cleared and the view returns to the logged-out state.
- The tree shows a login action when logged out, then a contest header plus problems sorted by `order` and submissions sorted newest-first when logged in.
- The configured API base URL must support optional base paths; reuse [src/contest-api.js](src/contest-api.js) normalization instead of rebuilding URLs elsewhere.

## Validation

- Run automated checks through the Compose container. The default test command is `docker compose exec extension npm test`.
- For manifest and docs changes, verify that [package.json](package.json), [README.md](README.md), and [CHANGELOG.md](CHANGELOG.md) stay in sync.
- For behavior changes, favor manual validation in the Extension Development Host using the `AutoJudge Contest` view plus the login, refresh, and logout flows.
- Pair tree or controller changes with focused Vitest coverage when the touched code can be exercised outside VS Code.

## Pitfalls

- Do not assume the public site URL and API URL are the same; the extension targets the API base URL configured by `autojudgeContest.baseUrl`.
- The login flow uses `POST teams/{teamId}/login` with the password in the `Authorization: Bearer ...` header, then restores the contest snapshot with `GET teams`, `GET contests/{contestId}/problems`, and `GET submissions`.
- `autojudgeContest.pollIntervalMs` exists in the manifest but is not used by the current runtime yet.
- The `Export Public Cases` menu item is gated by `autojudgeContest.baseExtensionInstalled`, and the current runtime does not set that context key.
- Legacy run/test files such as [src/runner.js](src/runner.js), [src/input-resolver.js](src/input-resolver.js), and related helpers are not part of the current activation flow for this contest extension.