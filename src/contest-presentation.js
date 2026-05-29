const PASSED_STATUSES = new Set(['ACCEPTED', 'OK', 'PASS']);
const PENDING_STATUSES = new Set(['PENDING', 'QUEUED', 'RUNNING', 'JUDGING']);

/**
 * Build the markdown preview shown when a contest problem is opened from the
 * explorer without requiring a second VS Code view surface.
 * @param {object} problem
 * @returns {string}
 */
export function buildProblemPreview(problem) {
    const lines = [
        `# ${getProblemTitle(problem)}`,
        '',
        `- Problem ID: ${problem.id ?? 'Unknown'}`,
        `- Problem Hash: \`${problem.hash ?? 'Unavailable'}\``,
    ];

    if (problem.order != null) {
        lines.push(`- Contest Order: ${problem.order}`);
    }

    const statement = getProblemStatement(problem);
    if (statement) {
        lines.push('', statement.trim());
    }
    else {
        lines.push('', 'Problem statement details were not included in the current contest snapshot.');
    }

    return lines.join('\n');
}

/**
 * Return a readable status label for explorer descriptions and output messages.
 * @param {string | undefined | null} status
 * @returns {string}
 */
export function formatSubmissionStatus(status) {
    if (!status) {
        return 'Unknown';
    }

    return status
        .toString()
        .trim()
        .toLowerCase()
        .split(/[_\s]+/)
        .filter(Boolean)
        .map(token => token.charAt(0).toUpperCase() + token.slice(1))
        .join(' ');
}

/**
 * Render the full submission payload in a readable output-channel block.
 * @param {object} submission
 * @returns {string}
 */
export function renderSubmissionDetails(submission) {
    const header = `Submission #${submission.id ?? 'Unknown'} · ${formatSubmissionStatus(submission.status)}`;
    return `${header}\n${JSON.stringify(submission, null, 2)}`;
}

/**
 * Return the best available problem title while guarding against blank API data.
 * @param {object} problem
 * @returns {string}
 */
function getProblemTitle(problem) {
    const title = problem?.title?.toString().trim();
    return title || `Problem ${problem?.id ?? ''}`.trim();
}

/**
 * Choose the most informative statement field currently present in the problem payload.
 * @param {object} problem
 * @returns {string}
 */
function getProblemStatement(problem) {
    return [problem?.description, problem?.statement, problem?.body]
        .find(value => typeof value === 'string' && value.trim());
}

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