import { isPassedSubmission } from '../utils/submission-status.js';

/**
 * Build the markdown preview shown when a contest problem is opened from the
 * explorer without requiring a second VS Code view surface.
 * @param {object} problem
 * @returns {string}
 */
export function buildProblemPreview(problem) {
    const lines = [
        `# ${getProblemTitle(problem)}`,
    ];

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
    const lines = [
        `Submission #${submission.id ?? 'Unknown'}`,
        `Status: ${formatSubmissionStatus(submission.status)}`,
    ];

    const problemLabel = buildSubmissionProblemLabel(submission?.problem);
    if (problemLabel) {
        lines.push(`Problem: ${problemLabel}`);
    }

    appendSubmissionField(lines, 'Submitted', submission?.submittedAt);

    let scoreLabel = 'Time';
    if (!isPassedSubmission(submission?.status)) {
        scoreLabel = 'Penalty';
    }
    appendSubmissionField(lines, scoreLabel, formatProblemScore(submission?.score));
    
    if (submission?.hint) {
        const { message, expected, received } = submission.hint;
        if (message) {
            const hintMessage = message?.toString().split('\n').map(line => line.trim()).filter(Boolean) || [];
            if (hintMessage.length) {
                lines.push('', 'Hint', ...hintMessage);
            }
        }
        if (expected != null || received != null) {
            lines.push('');
            if (expected != null) {
                lines.push(`Expected:`, expected);
            }
            if (received != null) {
                lines.push(`Received:`, received);
            }
        }
    }

    // lines.push('', 'Payload', JSON.stringify(submission, null, 2));
    return lines.join('\n');
}

/**
 * Build the explorer contest header description with the current team.
 * @param {{ name?: string } | undefined | null} team
 * @returns {string}
 */
export function buildContestHeaderDescription(team) {
    return team?.name?.toString().trim() || 'Unknown Team';
}

/**
 * Format problem score from milliseconds as a minute string.
 * @param {number} ms 
 * @returns {string}
 */
export function formatProblemScore(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = (totalSeconds / 60).toFixed(1);
    return `${minutes} min`;
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
 * Append a submission detail line when the source value is present.
 * @param {string[]} lines
 * @param {string} label
 * @param {unknown} value
 */
function appendSubmissionField(lines, label, value) {
    const normalizedValue = value?.toString().trim();
    if (normalizedValue) {
        lines.push(`${label}: ${normalizedValue}`);
    }
}

/**
 * Build a compact submission problem label for output-channel summaries.
 * @param {{ id?: string | number, title?: string } | undefined | null} problem
 * @returns {string}
 */
function buildSubmissionProblemLabel(problem) {
    const title = problem?.title?.toString().trim();
    const id = problem?.id != null ? ` (#${problem.id})` : '';

    if (title) {
        return `${title}${id}`;
    }

    return id ? `Problem${id}` : '';
}
