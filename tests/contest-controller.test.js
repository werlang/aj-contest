import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createContestController } from '../src/contest-controller.js';

function createSnapshot() {
    return {
        problems: [{ id: 1, title: 'A + B' }],
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
    let promptTeamCredentials;
    let resolveBaseUrl;
    let sessionApi;
    let setContext;
    let showErrorMessage;
    let treeProvider;

    beforeEach(() => {
        context = { id: 'extension-context' };
        outputChannel = {
            appendLine: vi.fn(),
        };
        promptTeamCredentials = vi.fn();
        resolveBaseUrl = vi.fn(() => 'https://api.autojudge.test');
        sessionApi = {
            clearStoredSession: vi.fn(),
            loginAndLoadContest: vi.fn(),
            restoreContestSession: vi.fn(),
        };
        setContext = vi.fn();
        showErrorMessage = vi.fn();
        treeProvider = {
            setSnapshot: vi.fn(),
        };
    });

    it('logs in with prompted credentials and pushes the snapshot into the tree', async () => {
        const snapshot = createSnapshot();
        promptTeamCredentials.mockResolvedValue({ password: '123456', teamId: 'teamhash9' });
        sessionApi.loginAndLoadContest.mockResolvedValue(snapshot);

        const controller = createContestController({
            context,
            outputChannel,
            promptTeamCredentials,
            resolveBaseUrl,
            sessionApi,
            setContext,
            showErrorMessage,
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
        expect(setContext).toHaveBeenCalledWith('autojudgeContest.state', 'loggedIn');
        expect(showErrorMessage).not.toHaveBeenCalled();
        expect(result).toEqual(snapshot);
    });

    it('restores a saved session when refresh is invoked', async () => {
        const snapshot = createSnapshot();
        sessionApi.restoreContestSession.mockResolvedValue(snapshot);

        const controller = createContestController({
            context,
            outputChannel,
            promptTeamCredentials,
            resolveBaseUrl,
            sessionApi,
            setContext,
            showErrorMessage,
            treeProvider,
        });

        const result = await controller.refreshTree();

        expect(sessionApi.restoreContestSession).toHaveBeenCalledWith({
            baseUrl: 'https://api.autojudge.test',
            context,
        });
        expect(treeProvider.setSnapshot).toHaveBeenCalledWith(snapshot);
        expect(setContext).toHaveBeenCalledWith('autojudgeContest.state', 'loggedIn');
        expect(result).toEqual(snapshot);
    });

    it('logs out by clearing storage and resetting the tree', async () => {
        const controller = createContestController({
            context,
            outputChannel,
            promptTeamCredentials,
            resolveBaseUrl,
            sessionApi,
            setContext,
            showErrorMessage,
            treeProvider,
        });

        await controller.logoutTeam();

        expect(sessionApi.clearStoredSession).toHaveBeenCalledWith(context);
        expect(treeProvider.setSnapshot).toHaveBeenCalledWith(null);
        expect(setContext).toHaveBeenCalledWith('autojudgeContest.state', 'loggedOut');
    });
});