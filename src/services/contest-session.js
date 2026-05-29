import { clearStoredSession, readStoredSession, writeStoredSession } from './session-store.js';
import { getContestDetails, getContestProblems, getCurrentTeam, getSubmissions, loginTeam, submitSolution as submitContestSolution } from './contest-api.js';
import { isPendingSubmission } from '../utils/submission-status.js';
import config from '../utils/config.js';

export { clearStoredSession, readStoredSession, writeStoredSession };

const DEFAULT_SUBMISSION_POLL_TIMEOUT_MS = 2 * 60 * 1000;

/**
 * Exchange team credentials for a JWT, persist it, and load the initial contest snapshot.
 * @param {{ baseUrl: string, context: import('vscode').ExtensionContext | { secrets: object, globalState: object }, password: string, teamId: string }} options
 * @returns {Promise<{ token: string, team: object, problems: object[], submissions: object[] }>}
 */
export async function loginAndLoadContest({ baseUrl, context, password, teamId }) {
    const { token } = await loginTeam({ baseUrl, password, teamId });
    await writeStoredSession(context, { teamId, token });

    return loadContestSnapshot({ baseUrl, token });
}

/**
 * Attempt to restore a previously persisted contest session.
 * @param {{ baseUrl: string, context: import('vscode').ExtensionContext | { secrets: object, globalState: object } }} options
 * @returns {Promise<{ token: string, team: object, problems: object[], submissions: object[] } | null>}
 */
export async function restoreContestSession({ baseUrl, context }) {
    const session = await readStoredSession(context);
    if (!session) {
        return null;
    }

    try {
        return await loadContestSnapshot({
            baseUrl,
            token: session.token,
        });
    }
    catch (error) {
        if (error.statusCode === 400 || error.statusCode === 401) {
            await clearStoredSession(context);
            return null;
        }

        throw error;
    }
}

/**
 * Refresh the richer contest details for the active snapshot without reloading
 * problems or submissions.
 * @param {{ baseUrl: string, contest: object, context: import('vscode').ExtensionContext | { secrets: object, globalState: object } }} options
 * @returns {Promise<object | null>}
 */
export async function refreshContestDetails({ baseUrl, contest, context }) {
    const session = await readStoredSession(context);
    if (!session?.token) {
        return null;
    }

    try {
        const { contest: detailedContest } = await getContestDetails({
            baseUrl,
            contestId: contest?.id,
            token: session.token,
        });

        return mergeContestSnapshot(contest, detailedContest);
    }
    catch (error) {
        if (error.statusCode === 400 || error.statusCode === 401) {
            await clearStoredSession(context);
            return null;
        }

        throw error;
    }
}

/**
 * Submit source code for a contest problem using the stored team token.
 * @param {{ baseUrl: string, code: string, context: import('vscode').ExtensionContext | { secrets: object, globalState: object }, filename: string, problemId: number | string }} options
 * @returns {Promise<object>}
 */
export async function submitSolution({ baseUrl, code, context, filename, problemId }) {
    const session = await readStoredSession(context);
    if (!session?.token) {
        throw new Error('Log in to AutoJudge Contest before submitting a solution.');
    }

    const response = await submitContestSolution({
        baseUrl,
        code,
        filename,
        problemId,
        token: session.token,
    });

    return response.submission ?? response;
}

/**
 * Poll the authenticated submission history until one submission reaches a
 * final verdict or the timeout expires.
 * @param {{ baseUrl: string, context: import('vscode').ExtensionContext | { secrets: object, globalState: object }, pollIntervalMs?: number, submissionId: number | string, timeoutMs?: number }} options
 * @returns {Promise<object | null>}
 */
export async function pollSubmissionResult({
    baseUrl,
    context,
    pollIntervalMs = config.POLL_INTERVAL_MS,
    submissionId,
    timeoutMs = DEFAULT_SUBMISSION_POLL_TIMEOUT_MS,
}) {
    const session = await readStoredSession(context);
    if (!session?.token) {
        throw new Error('Log in to AutoJudge Contest before checking a submission result.');
    }

    const startedAt = Date.now();
    const normalizedSubmissionId = submissionId?.toString().trim();
    if (!normalizedSubmissionId) {
        throw new Error('Submission polling requires a submission id.');
    }

    while (Date.now() - startedAt < timeoutMs) {
        // Reuse the authenticated submissions feed so the controller updates the
        // same explorer item shape already rendered elsewhere in the extension.
        const submissionResponse = await getSubmissions({
            baseUrl,
            token: session.token,
        });
        const latestSubmission = (submissionResponse.submissions ?? [])
            .find(entry => entry?.id?.toString().trim() === normalizedSubmissionId);

        if (latestSubmission && !isPendingSubmission(latestSubmission.status)) {
            return latestSubmission;
        }

        if (Date.now() - startedAt + pollIntervalMs >= timeoutMs) {
            break;
        }

        await delay(pollIntervalMs);
    }

    return null;
}

/**
 * Load the authenticated team, contest problems, and submission history.
 * @param {{ baseUrl: string, token: string }} options
 * @returns {Promise<{ token: string, team: object, problems: object[], submissions: object[] }>}
 */
export async function loadContestSnapshot({ baseUrl, token }) {
    const { team } = await getCurrentTeam({ baseUrl, token });
    const [contestResponse, problemResponse, submissionResponse] = await Promise.all([
        getContestDetails({
            baseUrl,
            contestId: team.contest.id,
            token,
        }),
        getContestProblems({
            baseUrl,
            contestId: team.contest.id,
            token,
        }),
        getSubmissions({
            baseUrl,
            token,
        }),
    ]);

    return {
        problems: problemResponse.problems,
        submissions: submissionResponse.submissions,
        team: {
            ...team,
            contest: mergeContestSnapshot(team.contest, contestResponse.contest),
        },
        token,
    };
}

/**
 * Merge the summary contest fields from `GET /teams` with the richer countdown
 * payload returned by `GET /contests/:id`.
 * @param {object | undefined | null} summaryContest
 * @param {object | undefined | null} detailedContest
 * @param {number} [now]
 * @returns {object}
 */
function mergeContestSnapshot(summaryContest, detailedContest, now = Date.now()) {
    return {
        ...summaryContest,
        ...detailedContest,
        countdownTargetMs: normalizeCountdownTarget(detailedContest?.remainingTime ?? summaryContest?.remainingTime, now),
    };
}

/**
 * Convert the API's remaining-time milliseconds into a fixed local deadline.
 * @param {unknown} remainingTime
 * @param {number} now
 * @returns {number | null}
 */
function normalizeCountdownTarget(remainingTime, now) {
    if (remainingTime == null) {
        return null;
    }

    const normalizedRemainingTime = Number(remainingTime);
    if (!Number.isFinite(normalizedRemainingTime)) {
        return null;
    }

    return now + Math.max(normalizedRemainingTime, 0);
}

/**
 * Delay the next submission refresh without busy-waiting the extension host.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, Math.max(ms, 0));
    });
}