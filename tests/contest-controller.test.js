import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createContestController } from '../src/controllers/contest-controller.js';

async function flushPromises(turns = 10) {
    for (let index = 0; index < turns; index += 1) {
        await Promise.resolve();
    }
}

function createSnapshot() {
    return {
        problems: [{
            id: 1,
            hash: 'prob-a',
            publicCases: [
                {
                    input: '1 2\n',
                    output: '3\n',
                },
            ],
            title: 'A + B',
        }],
        submissions: [],
        team: {
            contest: {
                id: 4,
                name: 'Regional Final',
                teams: [
                    {
                        id: 12,
                        name: 'Array Ninjas',
                        score: 350,
                        problems: [
                            { id: 1, order: 1, solved: true, title: 'A + B' },
                            { id: 2, order: 2, solved: true, title: 'Binary Search' },
                        ],
                    },
                    {
                        id: 9,
                        name: 'Bits',
                        score: 200,
                        problems: [
                            { id: 1, order: 1, solved: true, title: 'A + B' },
                        ],
                    },
                ],
            },
            name: 'Bits',
        },
        token: 'team-jwt-token',
    };
}

describe('contest controller', () => {
    let context;
    let outputChannel;
    let openTextDocument;
    let promptTeamCredentials;
    let resolvePollIntervalMs;
    let resolveBaseUrl;
    let sessionApi;
    let executeCommand;
    let setContext;
    let showTextDocument;
    let showInformationMessage;
    let showErrorMessage;
    let withProgressNotification;
    let submissionWorkspace;
    let teamsStandingsProvider;
    let treeProvider;

    beforeEach(() => {
        context = { id: 'extension-context' };
        outputChannel = {
            appendLine: vi.fn(),
            clear: vi.fn(),
            show: vi.fn(),
        };
        openTextDocument = vi.fn();
        promptTeamCredentials = vi.fn();
        resolvePollIntervalMs = vi.fn(() => 1500);
        resolveBaseUrl = vi.fn(() => 'https://api.autojudge.test');
        sessionApi = {
            clearStoredSession: vi.fn(),
            loginAndLoadContest: vi.fn(),
            pollSubmissionResult: vi.fn(),
            refreshContestDetails: vi.fn(),
            restoreContestSession: vi.fn(),
            submitSolution: vi.fn(),
        };
        executeCommand = vi.fn();
        setContext = vi.fn();
        showTextDocument = vi.fn();
        showInformationMessage = vi.fn();
        showErrorMessage = vi.fn();
        withProgressNotification = vi.fn(async (_title, task) => await task());
        submissionWorkspace = {
            createTestCases: vi.fn(),
            exportPublicCases: vi.fn(),
            readActiveSourceFile: vi.fn(),
        };
        teamsStandingsProvider = {
            setSnapshot: vi.fn(),
        };
        treeProvider = {
            getSnapshot: vi.fn(() => null),
            setSnapshot: vi.fn(),
        };
    });

    it('logs in with prompted credentials and pushes the snapshot into the tree', async () => {
        const snapshot = createSnapshot();
        promptTeamCredentials.mockResolvedValue({ password: '123456', teamId: 'teamhash9' });
        sessionApi.loginAndLoadContest.mockResolvedValue(snapshot);

        const controller = createContestController({
            context,
            executeCommand,
            openTextDocument,
            outputChannel,
            promptTeamCredentials,
            resolvePollIntervalMs,
            resolveBaseUrl,
            sessionApi,
            setContext,
            showInformationMessage,
            showTextDocument,
            showErrorMessage,
            submissionWorkspace,
            teamsStandingsProvider,
            treeProvider,
        });

        const result = await controller.loginTeam();

        expect(sessionApi.loginAndLoadContest).toHaveBeenCalledWith({
            baseUrl: 'https://api.autojudge.test',
            context,
            password: '123456',
            teamId: 'teamhash9',
        });
        expect(treeProvider.setSnapshot).toHaveBeenCalledWith(snapshot);
        expect(teamsStandingsProvider.setSnapshot).toHaveBeenCalledWith(snapshot);
        expect(setContext).toHaveBeenCalledWith('autojudgeContest.state', 'loggedIn');
        expect(showErrorMessage).not.toHaveBeenCalled();
        expect(result).toEqual(snapshot);
    });

    it('restores a saved session when refresh is invoked', async () => {
        const snapshot = createSnapshot();
        sessionApi.restoreContestSession.mockResolvedValue(snapshot);

        const controller = createContestController({
            context,
            executeCommand,
            openTextDocument,
            outputChannel,
            promptTeamCredentials,
            resolvePollIntervalMs,
            resolveBaseUrl,
            sessionApi,
            setContext,
            showInformationMessage,
            showTextDocument,
            showErrorMessage,
            submissionWorkspace,
            teamsStandingsProvider,
            treeProvider,
        });

        const result = await controller.refreshTree();

        expect(sessionApi.restoreContestSession).toHaveBeenCalledWith({
            baseUrl: 'https://api.autojudge.test',
            context,
        });
        expect(treeProvider.setSnapshot).toHaveBeenCalledWith(snapshot);
        expect(teamsStandingsProvider.setSnapshot).toHaveBeenCalledWith(snapshot);
        expect(setContext).toHaveBeenCalledWith('autojudgeContest.state', 'loggedIn');
        expect(result).toEqual(snapshot);
    });

    it('logs out by clearing storage and resetting the tree', async () => {
        const controller = createContestController({
            context,
            executeCommand,
            openTextDocument,
            outputChannel,
            promptTeamCredentials,
            resolvePollIntervalMs,
            resolveBaseUrl,
            sessionApi,
            setContext,
            showInformationMessage,
            showTextDocument,
            showErrorMessage,
            submissionWorkspace,
            teamsStandingsProvider,
            treeProvider,
        });

        await controller.logoutTeam();

        expect(sessionApi.clearStoredSession).toHaveBeenCalledWith(context);
        expect(treeProvider.setSnapshot).toHaveBeenCalledWith(null);
        expect(teamsStandingsProvider.setSnapshot).toHaveBeenCalledWith(null);
        expect(setContext).toHaveBeenCalledWith('autojudgeContest.state', 'loggedOut');
    });

    it('opens a markdown problem preview from the clicked problem item', async () => {
        const document = { uri: 'untitled:autojudge-problem' };
        openTextDocument.mockResolvedValue(document);

        const controller = createContestController({
            context,
            executeCommand,
            openTextDocument,
            outputChannel,
            promptTeamCredentials,
            resolvePollIntervalMs,
            resolveBaseUrl,
            sessionApi,
            setContext,
            showInformationMessage,
            showTextDocument,
            showErrorMessage,
            submissionWorkspace,
            teamsStandingsProvider,
            treeProvider,
        });

        await controller.openProblem({
            description: 'Add two integers.',
            hash: 'prob-a',
            id: 1,
            order: 1,
            title: 'A + B',
        });

        expect(openTextDocument).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('# A + B'),
            language: 'markdown',
        }));
        expect(openTextDocument).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('`prob-a`'),
        }));
        expect(executeCommand).toHaveBeenCalledWith('markdown.showPreview', document.uri, expect.any(Object));
        expect(showTextDocument).not.toHaveBeenCalled();
        expect(showErrorMessage).not.toHaveBeenCalled();
    });

    it('prints formatted submission details to the output channel when a submission is opened', async () => {
        const controller = createContestController({
            context,
            openTextDocument,
            outputChannel,
            promptTeamCredentials,
            resolvePollIntervalMs,
            resolveBaseUrl,
            sessionApi,
            setContext,
            showInformationMessage,
            showTextDocument,
            showErrorMessage,
            withProgressNotification,
            submissionWorkspace,
            teamsStandingsProvider,
            treeProvider,
        });

        const submission = {
            id: 12,
            memory: '32 MB',
            problem: { id: 1, title: 'A + B' },
            status: 'ACCEPTED',
            submittedAt: '2026-05-28T03:10:00.000Z',
            time: '15 ms',
        };

        await controller.openSubmission(submission);

        expect(outputChannel.clear).toHaveBeenCalledTimes(1);
        expect(outputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining('Submission #12'));
        expect(outputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining('Status: Accepted'));
        expect(outputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining('Problem: A + B (#1)'));
        expect(outputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining('Payload'));
        expect(outputChannel.show).toHaveBeenCalledWith(true);
        expect(showErrorMessage).not.toHaveBeenCalled();
    });

    it('prints a clicked standings team to the output channel', async () => {
        const snapshot = createSnapshot();

        const controller = createContestController({
            context,
            openTextDocument,
            outputChannel,
            promptTeamCredentials,
            resolvePollIntervalMs,
            resolveBaseUrl,
            sessionApi,
            setContext,
            showInformationMessage,
            showTextDocument,
            showErrorMessage,
            withProgressNotification,
            submissionWorkspace,
            teamsStandingsProvider,
            treeProvider,
        });

        const result = await controller.openTeamStanding(snapshot.team.contest.teams[0]);

        expect(outputChannel.clear).toHaveBeenCalledTimes(1);
        expect(outputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining('Team: Array Ninjas'));
        expect(outputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining('Score: 350'));
        expect(outputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining('Solved Problems:'));
        expect(outputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining('- A + B'));
        expect(outputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining('- Binary Search'));
        expect(outputChannel.show).toHaveBeenCalledWith(true);
        expect(result).toEqual(snapshot.team.contest.teams[0]);
    });

    it('submits the active file for the selected problem and refreshes the in-memory snapshot', async () => {
        const snapshot = createSnapshot();
        const createdSubmission = {
            id: 27,
            problem: {
                id: 1,
                title: 'A + B',
            },
            status: 'PENDING',
            submittedAt: '2026-05-28T04:00:00.000Z',
        };
        treeProvider.getSnapshot.mockReturnValue(snapshot);
        submissionWorkspace.readActiveSourceFile.mockResolvedValue({
            filename: 'main.cpp',
            sourceCode: '#include <iostream>\nint main() { return 0; }\n',
        });
        sessionApi.submitSolution.mockResolvedValue(createdSubmission);

        const controller = createContestController({
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
            teamsStandingsProvider,
            treeProvider,
        });

        const result = await controller.submitActiveFile(snapshot.problems[0]);

        expect(sessionApi.submitSolution).toHaveBeenCalledWith({
            baseUrl: 'https://api.autojudge.test',
            code: '#include <iostream>\nint main() { return 0; }\n',
            context,
            filename: 'main.cpp',
            problemId: 1,
        });
        expect(treeProvider.setSnapshot).toHaveBeenCalledWith({
            ...snapshot,
            submissions: [createdSubmission],
        });
        expect(teamsStandingsProvider.setSnapshot).toHaveBeenCalledWith({
            ...snapshot,
            submissions: [createdSubmission],
        });
        expect(showInformationMessage).toHaveBeenCalledWith('Submitted main.cpp to A + B.');
        expect(result).toEqual(createdSubmission);
    });

    it('polls a pending submission until a final verdict arrives and refreshes the visible submission item', async () => {
        const snapshot = createSnapshot();
        const createdSubmission = {
            id: 27,
            problem: {
                id: 1,
                title: 'A + B',
            },
            status: 'PENDING',
            submittedAt: '2026-05-28T04:00:00.000Z',
        };
        const finalSubmission = {
            id: 27,
            problem: {
                id: 1,
                title: 'A + B',
            },
            status: 'ACCEPTED',
            submittedAt: '2026-05-28T04:00:00.000Z',
        };
        treeProvider.getSnapshot.mockReturnValue(snapshot);
        submissionWorkspace.readActiveSourceFile.mockResolvedValue({
            filename: 'main.cpp',
            sourceCode: '#include <iostream>\nint main() { return 0; }\n',
        });
        sessionApi.submitSolution.mockResolvedValue(createdSubmission);
        sessionApi.pollSubmissionResult.mockResolvedValue(finalSubmission);

        const controller = createContestController({
            context,
            openTextDocument,
            outputChannel,
            promptTeamCredentials,
            resolvePollIntervalMs,
            resolveBaseUrl,
            sessionApi,
            setContext,
            showInformationMessage,
            showTextDocument,
            showErrorMessage,
            withProgressNotification,
            submissionWorkspace,
            teamsStandingsProvider,
            treeProvider,
        });

        const result = await controller.submitActiveFile(snapshot.problems[0]);

        expect(sessionApi.pollSubmissionResult).toHaveBeenCalledWith({
            baseUrl: 'https://api.autojudge.test',
            context,
            pollIntervalMs: 1500,
            submissionId: 27,
            timeoutMs: 120000,
        });
        expect(treeProvider.setSnapshot).toHaveBeenNthCalledWith(1, {
            ...snapshot,
            submissions: [createdSubmission],
        });
        expect(treeProvider.setSnapshot).toHaveBeenNthCalledWith(2, {
            ...snapshot,
            submissions: [finalSubmission],
        });
        expect(withProgressNotification).toHaveBeenCalledWith(
            'Waiting for the final verdict for submission #27.',
            expect.any(Function)
        );
        expect(showInformationMessage).toHaveBeenCalledWith('Waiting for the final verdict for submission #27.');
        expect(showInformationMessage).toHaveBeenCalledWith('Submission #27 finished with Accepted.');
        expect(result).toEqual(finalSubmission);
    });

    it('starts the judging progress notification without waiting for transient info messages to resolve', async () => {
        const snapshot = createSnapshot();
        const createdSubmission = {
            id: 27,
            problem: {
                id: 1,
                title: 'A + B',
            },
            status: 'PENDING',
            submittedAt: '2026-05-28T04:00:00.000Z',
        };
        const finalSubmission = {
            id: 27,
            problem: {
                id: 1,
                title: 'A + B',
            },
            status: 'ACCEPTED',
            submittedAt: '2026-05-28T04:00:00.000Z',
        };
        let resolveSubmittedMessage;
        treeProvider.getSnapshot.mockReturnValue(snapshot);
        submissionWorkspace.readActiveSourceFile.mockResolvedValue({
            filename: 'main.cpp',
            sourceCode: '#include <iostream>\nint main() { return 0; }\n',
        });
        sessionApi.submitSolution.mockResolvedValue(createdSubmission);
        sessionApi.pollSubmissionResult.mockResolvedValue(finalSubmission);
        showInformationMessage
            .mockImplementationOnce(() => new Promise(resolve => {
                resolveSubmittedMessage = resolve;
            }))
            .mockResolvedValue(undefined);

        const controller = createContestController({
            context,
            openTextDocument,
            outputChannel,
            promptTeamCredentials,
            resolvePollIntervalMs,
            resolveBaseUrl,
            sessionApi,
            setContext,
            showInformationMessage,
            showTextDocument,
            showErrorMessage,
            withProgressNotification,
            submissionWorkspace,
            teamsStandingsProvider,
            treeProvider,
        });

        const pendingResult = controller.submitActiveFile(snapshot.problems[0]);

        await flushPromises();

        expect(withProgressNotification).toHaveBeenCalledWith(
            'Waiting for the final verdict for submission #27.',
            expect.any(Function)
        );
        expect(sessionApi.pollSubmissionResult).toHaveBeenCalledWith({
            baseUrl: 'https://api.autojudge.test',
            context,
            pollIntervalMs: 1500,
            submissionId: 27,
            timeoutMs: 120000,
        });

        resolveSubmittedMessage();

        await expect(pendingResult).resolves.toEqual(finalSubmission);
    });

    it('stops polling safely when the submission stays pending', async () => {
        const snapshot = createSnapshot();
        const createdSubmission = {
            id: 27,
            problem: {
                id: 1,
                title: 'A + B',
            },
            status: 'PENDING',
            submittedAt: '2026-05-28T04:00:00.000Z',
        };
        treeProvider.getSnapshot.mockReturnValue(snapshot);
        submissionWorkspace.readActiveSourceFile.mockResolvedValue({
            filename: 'main.cpp',
            sourceCode: '#include <iostream>\nint main() { return 0; }\n',
        });
        sessionApi.submitSolution.mockResolvedValue(createdSubmission);
        sessionApi.pollSubmissionResult.mockResolvedValue(null);

        const controller = createContestController({
            context,
            openTextDocument,
            outputChannel,
            promptTeamCredentials,
            resolvePollIntervalMs,
            resolveBaseUrl,
            sessionApi,
            setContext,
            showInformationMessage,
            showTextDocument,
            showErrorMessage,
            withProgressNotification,
            submissionWorkspace,
            teamsStandingsProvider,
            treeProvider,
        });

        const result = await controller.submitActiveFile(snapshot.problems[0]);

        expect(sessionApi.pollSubmissionResult).toHaveBeenCalledWith({
            baseUrl: 'https://api.autojudge.test',
            context,
            pollIntervalMs: 1500,
            submissionId: 27,
            timeoutMs: 120000,
        });
        expect(treeProvider.setSnapshot).toHaveBeenCalledTimes(1);
        expect(treeProvider.setSnapshot).toHaveBeenCalledWith({
            ...snapshot,
            submissions: [createdSubmission],
        });
        expect(withProgressNotification).toHaveBeenCalledWith(
            'Waiting for the final verdict for submission #27.',
            expect.any(Function)
        );
        expect(showInformationMessage).toHaveBeenCalledWith('Waiting for the final verdict for submission #27.');
        expect(showInformationMessage).toHaveBeenCalledWith('Submission #27 is still pending. Refresh the explorer later for the final result.');
        expect(showErrorMessage).not.toHaveBeenCalled();
        expect(result).toEqual(createdSubmission);
    });

    it('exports public cases for the selected problem into testcase files', async () => {
        const snapshot = createSnapshot();
        submissionWorkspace.exportPublicCases.mockResolvedValue({
            destinationUri: { fsPath: '/workspace/cases' },
            writtenPairs: [{
                inputUri: { fsPath: '/workspace/cases/prob-a-public-01.in' },
                outputUri: { fsPath: '/workspace/cases/prob-a-public-01.out' },
            }],
        });

        const controller = createContestController({
            context,
            openTextDocument,
            outputChannel,
            promptTeamCredentials,
            resolvePollIntervalMs,
            resolveBaseUrl,
            sessionApi,
            setContext,
            showInformationMessage,
            showTextDocument,
            showErrorMessage,
            submissionWorkspace,
            teamsStandingsProvider,
            treeProvider,
        });

        const result = await controller.exportPublicCases(snapshot.problems[0]);

        expect(submissionWorkspace.exportPublicCases).toHaveBeenCalledWith(snapshot.problems[0], [{
            input: '1 2\n',
            output: '3\n',
        }]);
        expect(showInformationMessage).toHaveBeenCalledWith('Exported 1 public testcase pair for A + B.');
        expect(result).toEqual(expect.objectContaining({
            writtenPairs: expect.any(Array),
        }));
    });

    it('exports public cases from top-level API input and output fields', async () => {
        submissionWorkspace.exportPublicCases.mockResolvedValue({
            destinationUri: { fsPath: '/workspace/cases' },
            writtenPairs: [{
                inputUri: { fsPath: '/workspace/cases/prob-a-public-01.in' },
                outputUri: { fsPath: '/workspace/cases/prob-a-public-01.out' },
            }],
        });

        const controller = createContestController({
            context,
            openTextDocument,
            outputChannel,
            promptTeamCredentials,
            resolvePollIntervalMs,
            resolveBaseUrl,
            sessionApi,
            setContext,
            showInformationMessage,
            showTextDocument,
            showErrorMessage,
            submissionWorkspace,
            teamsStandingsProvider,
            treeProvider,
        });

        const selectedProblem = {
            id: 1,
            hash: 'prob-a',
            input: '1 2\n',
            output: '3\n',
            title: 'A + B',
        };

        const result = await controller.exportPublicCases(selectedProblem);

        expect(submissionWorkspace.exportPublicCases).toHaveBeenCalledWith(selectedProblem, [{
            input: '1 2\n',
            output: '3\n',
        }]);
        expect(showInformationMessage).toHaveBeenCalledWith('Exported 1 public testcase pair for A + B.');
        expect(result).toEqual(expect.objectContaining({
            writtenPairs: expect.any(Array),
        }));
    });

    it('shows a concise error when the selected problem has no public cases', async () => {
        const controller = createContestController({
            context,
            openTextDocument,
            outputChannel,
            promptTeamCredentials,
            resolvePollIntervalMs,
            resolveBaseUrl,
            sessionApi,
            setContext,
            showInformationMessage,
            showTextDocument,
            showErrorMessage,
            submissionWorkspace,
            teamsStandingsProvider,
            treeProvider,
        });

        const result = await controller.exportPublicCases({
            id: 1,
            hash: 'prob-a',
            title: 'A + B',
        });

        expect(submissionWorkspace.exportPublicCases).not.toHaveBeenCalled();
        expect(showErrorMessage).toHaveBeenCalledWith('No public cases available for A + B.');
        expect(outputChannel.appendLine).toHaveBeenCalledWith('ERROR: No public cases available for A + B.');
        expect(result).toBeNull();
    });

    it('creates an empty testcase pair for the selected problem', async () => {
        const snapshot = createSnapshot();
        submissionWorkspace.createTestCases.mockResolvedValue({
            inputUri: { fsPath: '/workspace/cases/prob-a-custom-01.in' },
            outputUri: { fsPath: '/workspace/cases/prob-a-custom-01.out' },
        });

        const controller = createContestController({
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
            teamsStandingsProvider,
            treeProvider,
        });

        const result = await controller.createTestCases(snapshot.problems[0]);

        expect(submissionWorkspace.createTestCases).toHaveBeenCalledWith(snapshot.problems[0]);
        expect(showInformationMessage).toHaveBeenCalledWith('Created testcase files for A + B.');
        expect(result).toEqual(expect.objectContaining({
            inputUri: expect.any(Object),
            outputUri: expect.any(Object),
        }));
    });

    it('refreshes the standings snapshot on a fixed timer after login without relying on provider-owned snapshot state', async () => {
        vi.useFakeTimers();

        const snapshot = createSnapshot();
        const refreshedSnapshot = {
            ...snapshot,
            team: {
                ...snapshot.team,
                contest: {
                    ...snapshot.team.contest,
                    teams: [
                        {
                            id: 12,
                            name: 'Array Ninjas',
                            score: 360,
                            problems: [
                                { id: 1, order: 1, solved: true, title: 'A + B' },
                                { id: 2, order: 2, solved: true, title: 'Binary Search' },
                            ],
                        },
                    ],
                },
            },
        };
        promptTeamCredentials.mockResolvedValue({ password: '123456', teamId: 'teamhash9' });
        sessionApi.loginAndLoadContest.mockResolvedValue(snapshot);
        sessionApi.refreshContestDetails.mockResolvedValue(refreshedSnapshot.team.contest);
        treeProvider.getSnapshot.mockReturnValue(null);

        const controller = createContestController({
            context,
            openTextDocument,
            outputChannel,
            promptTeamCredentials,
            resolvePollIntervalMs,
            resolveBaseUrl,
            sessionApi,
            setContext,
            showInformationMessage,
            showTextDocument,
            showErrorMessage,
            submissionWorkspace,
            teamsStandingsProvider,
            treeProvider,
        });

        await controller.loginTeam();
        await vi.advanceTimersByTimeAsync(15000);

        expect(sessionApi.refreshContestDetails).toHaveBeenCalledWith({
            baseUrl: 'https://api.autojudge.test',
            contest: snapshot.team.contest,
            context,
        });
        expect(teamsStandingsProvider.setSnapshot).toHaveBeenLastCalledWith(refreshedSnapshot);

        controller.dispose();
        vi.useRealTimers();
    });
});