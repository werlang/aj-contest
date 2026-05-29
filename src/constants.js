/**
 * Stable command and view identifiers used across the contest extension.
 */
export const CONTEST_VIEW_ID = 'autojudgeContest.explorer';
export const SUBMISSIONS_VIEW_ID = 'autojudgeContest.submissions';

/**
 * Stable context keys used by view gating and selection-aware toolbar actions.
 */
export const CONTEXT_KEYS = Object.freeze({
    HAS_SELECTED_SUBMISSION_PROBLEM: 'autojudgeContest.hasSelectedSubmissionProblem',
    STATE: 'autojudgeContest.state',
});

/**
 * Stable command identifiers used by the manifest, tree items, and activation flow.
 */
export const COMMANDS = Object.freeze({
    CREATE_TEST_CASES: 'autojudgeContest.createTestCases',
    LOGIN_TEAM: 'autojudgeContest.loginTeam',
    LOGOUT_TEAM: 'autojudgeContest.logoutTeam',
    REFRESH_TREE: 'autojudgeContest.refreshTree',
    OPEN_PROBLEM: 'autojudgeContest.openProblem',
    SELECT_SUBMISSION_PROBLEM: 'autojudgeContest.selectSubmissionProblem',
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
    SUBMISSION_PANEL_PROBLEM: 'autojudgeContest.submissionPanelProblem',
    SUBMISSION: 'autojudgeContest.submission',
});