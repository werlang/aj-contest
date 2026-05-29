import { getContestProblems, getCurrentTeam, getSubmissions, loginTeam, submitSolution as submitContestSolution } from './contest-api.js';
import { clearStoredSession, readStoredSession, writeStoredSession } from './session-store.js';

export { clearStoredSession, readStoredSession, writeStoredSession };

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
 * Load the authenticated team, contest problems, and submission history.
 * @param {{ baseUrl: string, token: string }} options
 * @returns {Promise<{ token: string, team: object, problems: object[], submissions: object[] }>}
 */
export async function loadContestSnapshot({ baseUrl, token }) {
    const { team } = await getCurrentTeam({ baseUrl, token });
    const [problemResponse, submissionResponse] = await Promise.all([
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
        team,
        token,
    };
}