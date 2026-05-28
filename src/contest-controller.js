/**
 * Create the orchestrator that bridges VS Code command handlers to the contest
 * auth/session services and the sidebar tree state.
 * @param {object} options
 * @param {object} options.context
 * @param {{ appendLine: (message: string) => void }} options.outputChannel
 * @param {() => Promise<{ teamId: string, password: string } | null>} options.promptTeamCredentials
 * @param {() => string} options.resolveBaseUrl
 * @param {{ clearStoredSession: Function, loginAndLoadContest: Function, restoreContestSession: Function }} options.sessionApi
 * @param {(key: string, value: string | boolean) => Promise<void> | void} options.setContext
 * @param {(message: string) => Promise<void> | void} options.showErrorMessage
 * @param {{ setSnapshot: (snapshot: object | null) => void }} options.treeProvider
 * @returns {{ loginTeam: () => Promise<object | null>, logoutTeam: () => Promise<null>, refreshTree: () => Promise<object | null> }}
 */
export function createContestController({
    context,
    outputChannel,
    promptTeamCredentials,
    resolveBaseUrl,
    sessionApi,
    setContext,
    showErrorMessage,
    treeProvider,
}) {
    const syncTreeState = async (snapshot) => {
        treeProvider.setSnapshot(snapshot);
        await setContext('autojudgeContest.state', snapshot ? 'loggedIn' : 'loggedOut');
        return snapshot;
    };

    const handleFailure = async (error) => {
        outputChannel.appendLine(`ERROR: ${error.message}`);
        await showErrorMessage(error.message);
        return null;
    };

    return {
        /**
         * Prompt for team credentials, then load and display the contest snapshot.
         * @returns {Promise<object | null>}
         */
        async loginTeam() {
            const credentials = await promptTeamCredentials();
            if (!credentials) {
                return null;
            }

            try {
                const snapshot = await sessionApi.loginAndLoadContest({
                    baseUrl: resolveBaseUrl(),
                    context,
                    password: credentials.password,
                    teamId: credentials.teamId,
                });
                outputChannel.appendLine(`Logged in as ${snapshot.team.name} for ${snapshot.team.contest.name.trim()}.`);
                return await syncTreeState(snapshot);
            }
            catch (error) {
                return handleFailure(error);
            }
        },

        /**
         * Clear the stored team session and return the sidebar to the logged-out state.
         * @returns {Promise<null>}
         */
        async logoutTeam() {
            await sessionApi.clearStoredSession(context);
            outputChannel.appendLine('Logged out of AutoJudge Contest.');
            await syncTreeState(null);
            return null;
        },

        /**
         * Reload the currently stored contest session, if any.
         * @returns {Promise<object | null>}
         */
        async refreshTree() {
            try {
                const snapshot = await sessionApi.restoreContestSession({
                    baseUrl: resolveBaseUrl(),
                    context,
                });
                if (snapshot) {
                    outputChannel.appendLine(`Loaded ${snapshot.team.contest.name.trim()} for ${snapshot.team.name}.`);
                }
                return await syncTreeState(snapshot);
            }
            catch (error) {
                return handleFailure(error);
            }
        },
    };
}