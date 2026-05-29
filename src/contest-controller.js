import { CONTEXT_KEYS } from './constants.js';
import { extractPublicCases } from './contest-public-cases.js';
import { buildProblemPreview, renderSubmissionDetails } from './contest-presentation.js';

/**
 * Create the orchestrator that bridges VS Code command handlers to the contest
 * auth/session services and the sidebar tree state.
 * @param {object} options
 * @param {object} options.context
 * @param {(options: { content: string, language: string }) => Promise<unknown>} options.openTextDocument
 * @param {{ appendLine: (message: string) => void }} options.outputChannel
 * @param {() => Promise<{ teamId: string, password: string } | null>} options.promptTeamCredentials
 * @param {() => string} options.resolveBaseUrl
 * @param {{ clearStoredSession: Function, loginAndLoadContest: Function, restoreContestSession: Function, submitSolution: Function }} options.sessionApi
 * @param {(key: string, value: string | boolean) => Promise<void> | void} options.setContext
 * @param {(message: string) => Promise<void> | void} options.showInformationMessage
 * @param {(document: unknown, options?: object) => Promise<void> | void} options.showTextDocument
 * @param {(message: string) => Promise<void> | void} options.showErrorMessage
 * @param {{ createTestCases: Function, exportPublicCases: Function, readActiveSourceFile: Function }} options.submissionWorkspace
 * @param {{ getSelectedProblem: Function, selectProblem: Function, setSnapshot: (snapshot: object | null) => void }} options.submissionsViewProvider
 * @param {{ setSnapshot: (snapshot: object | null) => void }} options.treeProvider
 * @returns {{ createTestCases: (problem?: object | undefined | null) => Promise<object | null>, exportPublicCases: (problem?: object | undefined | null) => Promise<object | null>, loginTeam: () => Promise<object | null>, logoutTeam: () => Promise<null>, openProblem: (problem: object | undefined | null) => Promise<unknown>, openSubmission: (submission: object | undefined | null) => Promise<object | null>, refreshTree: () => Promise<object | null>, selectSubmissionProblem: (problem?: object | undefined | null) => Promise<object | null>, submitActiveFile: (problem?: object | undefined | null) => Promise<object | null> }}
 */
export function createContestController({
    context,
    openTextDocument,
    outputChannel,
    promptTeamCredentials,
    resolveBaseUrl,
    sessionApi,
    setContext,
    showInformationMessage,
    showTextDocument,
    showErrorMessage,
    submissionWorkspace,
    submissionsViewProvider,
    treeProvider,
}) {
    const syncSelectedProblemContext = async (problem) => {
        await setContext(CONTEXT_KEYS.HAS_SELECTED_SUBMISSION_PROBLEM, Boolean(problem));
        return problem;
    };

    const syncTreeState = async (snapshot) => {
        treeProvider.setSnapshot(snapshot);
        submissionsViewProvider.setSnapshot(snapshot);
        await setContext(CONTEXT_KEYS.STATE, snapshot ? 'loggedIn' : 'loggedOut');
        await syncSelectedProblemContext(submissionsViewProvider.getSelectedProblem());
        return snapshot;
    };

    const handleFailure = async (error) => {
        outputChannel.appendLine(`ERROR: ${error.message}`);
        await showErrorMessage(error.message);
        return null;
    };

    /**
     * Resolve a required explorer payload and fail clearly when the tree command
     * is invoked against stale or missing state.
     * @param {object | undefined | null} value
     * @param {string} noun
     * @returns {object | null}
     */
    const requireSelection = async (value, noun) => {
        if (value) {
            return value;
        }

        await showErrorMessage(`Select a ${noun} from the contest explorer first.`);
        return null;
    };

    /**
     * Resolve the current submission target from the explicit explorer item or
     * the submissions view selection and keep both surfaces in sync.
     * @param {object | undefined | null} problem
     * @returns {Promise<object | null>}
     */
    const resolveSubmissionProblem = async (problem) => {
        if (problem) {
            const selectedProblem = submissionsViewProvider.selectProblem(problem) ?? problem;
            await syncSelectedProblemContext(selectedProblem);
            return selectedProblem;
        }

        const selectedProblem = submissionsViewProvider.getSelectedProblem();
        if (selectedProblem) {
            return selectedProblem;
        }

        await showErrorMessage('Choose a contest problem from Team Submissions or Contest Explorer first.');
        return null;
    };

    /**
     * Merge a newly created submission into the current in-memory snapshot so
     * both sidebar views update immediately without waiting for a manual refresh.
     * @param {object} problem
     * @param {object} submission
     * @returns {Promise<object | null>}
     */
    const mergeSubmissionIntoSnapshot = async (problem, submission) => {
        const currentSnapshot = treeProvider.getSnapshot?.();
        if (!currentSnapshot) {
            return null;
        }

        const normalizedSubmission = submission.problem
            ? submission
            : {
                ...submission,
                problem: {
                    id: problem.id,
                    title: problem.title,
                },
            };

        const nextSnapshot = {
            ...currentSnapshot,
            submissions: [
                normalizedSubmission,
                ...currentSnapshot.submissions.filter(entry => entry.id !== normalizedSubmission.id),
            ],
        };

        await syncTreeState(nextSnapshot);
        return nextSnapshot;
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
         * Open a scratch markdown preview for the selected contest problem.
         * @param {object | undefined | null} problem
         * @returns {Promise<unknown | null>}
         */
        async openProblem(problem) {
            const selectedProblem = await requireSelection(problem, 'problem');
            if (!selectedProblem) {
                return null;
            }

            try {
                const document = await openTextDocument({
                    content: buildProblemPreview(selectedProblem),
                    language: 'markdown',
                });

                await showTextDocument(document, {
                    preview: true,
                });
                return document;
            }
            catch (error) {
                return handleFailure(error);
            }
        },

        /**
         * Print the full selected submission payload to the output channel.
         * @param {object | undefined | null} submission
         * @returns {Promise<object | null>}
         */
        async openSubmission(submission) {
            const selectedSubmission = await requireSelection(submission, 'submission');
            if (!selectedSubmission) {
                return null;
            }

            outputChannel.clear?.();
            outputChannel.appendLine(renderSubmissionDetails(selectedSubmission));
            outputChannel.show?.(true);
            return selectedSubmission;
        },

        /**
         * Select the problem targeted by the submissions panel toolbar actions.
         * @param {object | undefined | null} problem
         * @returns {Promise<object | null>}
         */
        async selectSubmissionProblem(problem) {
            const selectedProblem = await requireSelection(problem, 'problem');
            if (!selectedProblem) {
                return null;
            }

            const selection = submissionsViewProvider.selectProblem(selectedProblem) ?? selectedProblem;
            await syncSelectedProblemContext(selection);
            return selection;
        },

        /**
         * Submit the active editor file for the selected contest problem.
         * @param {object | undefined | null} problem
         * @returns {Promise<object | null>}
         */
        async submitActiveFile(problem) {
            const selectedProblem = await resolveSubmissionProblem(problem);
            if (!selectedProblem) {
                return null;
            }

            try {
                const activeSource = await submissionWorkspace.readActiveSourceFile();
                const submission = await sessionApi.submitSolution({
                    baseUrl: resolveBaseUrl(),
                    code: activeSource.sourceCode,
                    context,
                    filename: activeSource.filename,
                    problemId: selectedProblem.id,
                });

                await mergeSubmissionIntoSnapshot(selectedProblem, submission);
                outputChannel.appendLine(`Submitted ${activeSource.filename} to ${selectedProblem.title.trim()}.`);
                await showInformationMessage(`Submitted ${activeSource.filename} to ${selectedProblem.title.trim()}.`);
                return submission;
            }
            catch (error) {
                return handleFailure(error);
            }
        },

        /**
         * Export public testcase pairs for the selected contest problem.
         * @param {object | undefined | null} problem
         * @returns {Promise<object | null>}
         */
        async exportPublicCases(problem) {
            const selectedProblem = await resolveSubmissionProblem(problem);
            if (!selectedProblem) {
                return null;
            }

            try {
                const publicCases = extractPublicCases(selectedProblem);
                if (!publicCases.length) {
                    throw new Error(`No public testcase data is available for ${selectedProblem.title.trim()}.`);
                }

                const exportResult = await submissionWorkspace.exportPublicCases(selectedProblem, publicCases);
                outputChannel.appendLine(`Exported ${publicCases.length} public testcase pair${publicCases.length === 1 ? '' : 's'} for ${selectedProblem.title.trim()}.`);
                await showInformationMessage(`Exported ${publicCases.length} public testcase pair${publicCases.length === 1 ? '' : 's'} for ${selectedProblem.title.trim()}.`);
                return exportResult;
            }
            catch (error) {
                return handleFailure(error);
            }
        },

        /**
         * Create an empty testcase pair in the maintained AutoJudge testcase layout.
         * @param {object | undefined | null} problem
         * @returns {Promise<object | null>}
         */
        async createTestCases(problem) {
            const selectedProblem = await resolveSubmissionProblem(problem);
            if (!selectedProblem) {
                return null;
            }

            try {
                const testcaseFiles = await submissionWorkspace.createTestCases(selectedProblem);
                outputChannel.appendLine(`Created testcase files for ${selectedProblem.title.trim()}.`);
                await showInformationMessage(`Created testcase files for ${selectedProblem.title.trim()}.`);
                return testcaseFiles;
            }
            catch (error) {
                return handleFailure(error);
            }
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