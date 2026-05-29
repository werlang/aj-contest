const PASSED_STATUSES = new Set(['ACCEPTED', 'OK', 'PASS']);
const PENDING_STATUSES = new Set(['PENDING', 'QUEUED', 'RUNNING', 'JUDGING']);

/**
 * Return whether the submission should be shown as a passed result.
 * @param {string | undefined | null} status
 * @returns {boolean}
 */
export function isPassedSubmission(status) {
    return PASSED_STATUSES.has((status || '').toString().trim().toUpperCase());
}

/**
 * Return whether the submission is still pending a final verdict.
 * @param {string | undefined | null} status
 * @returns {boolean}
 */
export function isPendingSubmission(status) {
    return PENDING_STATUSES.has((status || '').toString().trim().toUpperCase());
}