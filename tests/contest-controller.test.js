import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createContestController } from '../src/contest-controller.js';

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
    let resolveBaseUrl;
    let sessionApi;
    let setContext;
    let showTextDocument;
    let showInformationMessage;
    let showErrorMessage;
    let submissionWorkspace;
    let submissionsViewProvider;
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
        resolveBaseUrl = vi.fn(() => 'https://api.autojudge.test');
        sessionApi = {
            clearStoredSession: vi.fn(),
            loginAndLoadContest: vi.fn(),
            restoreContestSession: vi.fn(),
            submitSolution: vi.fn(),
        };
        setContext = vi.fn();
        showTextDocument = vi.fn();
        showInformationMessage = vi.fn();
        showErrorMessage = vi.fn();
        submissionWorkspace = {
            createTestCases: vi.fn(),
            exportPublicCases: vi.fn(),
            readActiveSourceFile: vi.fn(),
        };
        submissionsViewProvider = {
            getSelectedProblem: vi.fn(() => null),
            selectProblem: vi.fn(problem => problem),
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
        });

        const result = await controller.loginTeam();

        expect(sessionApi.loginAndLoadContest).toHaveBeenCalledWith({
            baseUrl: 'https://api.autojudge.test',
            context,
            password: '123456',
            teamId: 'teamhash9',
        });
        expect(treeProvider.setSnapshot).toHaveBeenCalledWith(snapshot);
        expect(submissionsViewProvider.setSnapshot).toHaveBeenCalledWith(snapshot);
        expect(setContext).toHaveBeenCalledWith('autojudgeContest.state', 'loggedIn');
        expect(setContext).toHaveBeenCalledWith('autojudgeContest.hasSelectedSubmissionProblem', false);
        expect(showErrorMessage).not.toHaveBeenCalled();
        expect(result).toEqual(snapshot);
    });

    it('restores a saved session when refresh is invoked', async () => {
        const snapshot = createSnapshot();
        sessionApi.restoreContestSession.mockResolvedValue(snapshot);

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
            submissionsViewProvider,
            treeProvider,
        });

        const result = await controller.refreshTree();

        expect(sessionApi.restoreContestSession).toHaveBeenCalledWith({
            baseUrl: 'https://api.autojudge.test',
            context,
        });
        expect(treeProvider.setSnapshot).toHaveBeenCalledWith(snapshot);
        expect(submissionsViewProvider.setSnapshot).toHaveBeenCalledWith(snapshot);
        expect(setContext).toHaveBeenCalledWith('autojudgeContest.state', 'loggedIn');
        expect(setContext).toHaveBeenCalledWith('autojudgeContest.hasSelectedSubmissionProblem', false);
        expect(result).toEqual(snapshot);
    });

    it('logs out by clearing storage and resetting the tree', async () => {
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
            submissionsViewProvider,
            treeProvider,
        });

        await controller.logoutTeam();

        expect(sessionApi.clearStoredSession).toHaveBeenCalledWith(context);
        expect(treeProvider.setSnapshot).toHaveBeenCalledWith(null);
        expect(submissionsViewProvider.setSnapshot).toHaveBeenCalledWith(null);
        expect(setContext).toHaveBeenCalledWith('autojudgeContest.state', 'loggedOut');
        expect(setContext).toHaveBeenCalledWith('autojudgeContest.hasSelectedSubmissionProblem', false);
    });

    it('opens a markdown problem preview from the clicked problem item', async () => {
        const document = { uri: 'untitled:autojudge-problem' };
        openTextDocument.mockResolvedValue(document);

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
            submissionsViewProvider,
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
        expect(showTextDocument).toHaveBeenCalledWith(document, expect.objectContaining({
            preview: true,
        }));
        expect(showErrorMessage).not.toHaveBeenCalled();
    });

    it('prints full submission details to the output channel when a submission is opened', async () => {
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
            submissionsViewProvider,
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
        expect(outputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining('"status": "ACCEPTED"'));
        expect(outputChannel.show).toHaveBeenCalledWith(true);
        expect(showErrorMessage).not.toHaveBeenCalled();
    });

    it('selects a problem from the submissions view and enables the panel actions', async () => {
        const snapshot = createSnapshot();
        submissionsViewProvider.selectProblem.mockReturnValue(snapshot.problems[0]);

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
            submissionsViewProvider,
            treeProvider,
        });

        const result = await controller.selectSubmissionProblem(snapshot.problems[0]);

        expect(submissionsViewProvider.selectProblem).toHaveBeenCalledWith(snapshot.problems[0]);
        expect(setContext).toHaveBeenCalledWith('autojudgeContest.hasSelectedSubmissionProblem', true);
        expect(result).toEqual(snapshot.problems[0]);
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
        submissionsViewProvider.getSelectedProblem.mockReturnValue(snapshot.problems[0]);
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
            submissionsViewProvider,
            treeProvider,
        });

        const result = await controller.submitActiveFile();

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
        expect(submissionsViewProvider.setSnapshot).toHaveBeenCalledWith({
            ...snapshot,
            submissions: [createdSubmission],
        });
        expect(showInformationMessage).toHaveBeenCalledWith('Submitted main.cpp to A + B.');
        expect(result).toEqual(createdSubmission);
    });

    it('exports public cases for the selected problem into testcase files', async () => {
        const snapshot = createSnapshot();
        submissionsViewProvider.getSelectedProblem.mockReturnValue(snapshot.problems[0]);
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
            resolveBaseUrl,
            sessionApi,
            setContext,
            showInformationMessage,
            showTextDocument,
            showErrorMessage,
            submissionWorkspace,
            submissionsViewProvider,
            treeProvider,
        });

        const result = await controller.exportPublicCases();

        expect(submissionWorkspace.exportPublicCases).toHaveBeenCalledWith(snapshot.problems[0], [{
            input: '1 2\n',
            output: '3\n',
        }]);
        expect(showInformationMessage).toHaveBeenCalledWith('Exported 1 public testcase pair for A + B.');
        expect(result).toEqual(expect.objectContaining({
            writtenPairs: expect.any(Array),
        }));
    });

    it('creates an empty testcase pair for the selected problem', async () => {
        const snapshot = createSnapshot();
        submissionsViewProvider.getSelectedProblem.mockReturnValue(snapshot.problems[0]);
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
            submissionsViewProvider,
            treeProvider,
        });

        const result = await controller.createTestCases();

        expect(submissionWorkspace.createTestCases).toHaveBeenCalledWith(snapshot.problems[0]);
        expect(showInformationMessage).toHaveBeenCalledWith('Created testcase files for A + B.');
        expect(result).toEqual(expect.objectContaining({
            inputUri: expect.any(Object),
            outputUri: expect.any(Object),
        }));
    });
});