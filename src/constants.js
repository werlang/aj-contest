/**
 * Stable command and view identifiers used across the contest extension.
 */
export const CONTEST_VIEW_ID = 'autojudgeContest.explorer';

/**
 * Stable command identifiers used by the manifest, tree items, and activation flow.
 */
export const COMMANDS = Object.freeze({
    LOGIN_TEAM: 'autojudgeContest.loginTeam',
    LOGOUT_TEAM: 'autojudgeContest.logoutTeam',
    REFRESH_TREE: 'autojudgeContest.refreshTree',
    OPEN_PROBLEM: 'autojudgeContest.openProblem',
    SUBMIT_ACTIVE_FILE: 'autojudgeContest.submitActiveFile',
    EXPORT_PUBLIC_CASES: 'autojudgeContest.exportPublicCases',
    OPEN_SUBMISSION: 'autojudgeContest.openSubmission',
});

/**
 * Tree item context values used by manifest menus.
 */
export const TREE_CONTEXT = Object.freeze({
    CONTEST: 'autojudgeContest.contest',
    LOGIN: 'autojudgeContest.login',
    PROBLEM: 'autojudgeContest.problem',
    SUBMISSION: 'autojudgeContest.submission',
});