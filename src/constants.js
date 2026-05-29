/**
 * Stable command and view identifiers used across the contest extension.
 */
export const CONTEST_VIEW_ID = 'autojudgeContest.explorer';
export const TEAMS_VIEW_ID = 'autojudgeContest.teams';

/**
 * Stable context keys used by view gating and selection-aware toolbar actions.
 */
export const CONTEXT_KEYS = Object.freeze({
    STATE: 'autojudgeContest.state',
});

/**
 * Stable command identifiers used by the manifest, tree items, and activation flow.
 */
export const COMMANDS = Object.freeze({
    LOGIN_TEAM: 'autojudgeContest.loginTeam',
    LOGOUT_TEAM: 'autojudgeContest.logoutTeam',
    OPEN_PROBLEM: 'autojudgeContest.openProblem',
    EXPORT_PUBLIC_CASES: 'autojudgeContest.exportPublicCases',
    OPEN_SUBMISSION: 'autojudgeContest.openSubmission',
    OPEN_TEAM_STANDING: 'autojudgeContest.openTeamStanding',
    REFRESH_TREE: 'autojudgeContest.refreshTree',
    SUBMIT_ACTIVE_FILE: 'autojudgeContest.submitActiveFile',
});

/**
 * Tree item context values used by manifest menus.
 */
export const TREE_CONTEXT = Object.freeze({
    CONTEST: 'autojudgeContest.contest',
    LOGIN: 'autojudgeContest.login',
    PROBLEM: 'autojudgeContest.problem',
    STANDING_TEAM: 'autojudgeContest.standingTeam',
    SUBMISSION: 'autojudgeContest.submission',
});