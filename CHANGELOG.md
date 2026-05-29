# Changelog

All notable changes to this repository are documented in this file.

## Unreleased

### Added

- Added full contest explorer interactions: login welcome actions, problem previews, per-problem nested submissions sorted newest first, verdict icons, and output-channel submission details.
- Added the `Team Submissions` sidebar view with selectable problem targets, active-file submission, public testcase export, and custom testcase-pair creation.

### Changed

- Rewrote the README to match the current contest explorer, Team Submissions workflow, commands, and configuration surface.
- Clarified that testcase export and testcase creation use `autojudge.testcasePath` when available and otherwise write beside the active source file.
- Clarified that `autojudgeContest.pollIntervalMs` is still contributed in the manifest but is not used by the current runtime yet.
