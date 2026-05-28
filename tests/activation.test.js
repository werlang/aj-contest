import path from 'path';
import { fileURLToPath } from 'url';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const subscriptions = [];
const registeredCommands = [];
const createdTreeViews = [];

const createOutputChannel = vi.fn(() => ({
    appendLine: vi.fn(),
    clear: vi.fn(),
    dispose: vi.fn(),
    show: vi.fn(),
}));

const registerCommand = vi.fn((command, callback) => {
    registeredCommands.push({ command, callback });
    return { dispose: vi.fn() };
});

const createTreeView = vi.fn((viewId, options) => {
    createdTreeViews.push({ viewId, options });
    return { dispose: vi.fn() };
});

vi.mock('vscode', () => ({
    commands: {
        registerCommand,
    },
    window: {
        createOutputChannel,
        createTreeView,
    },
}), { virtual: true });

let extensionModule;

beforeAll(async () => {
    extensionModule = await import('../src/extension.js');
});

beforeEach(() => {
    subscriptions.length = 0;
    registeredCommands.length = 0;
    createdTreeViews.length = 0;
    createOutputChannel.mockClear();
    registerCommand.mockClear();
    createTreeView.mockClear();
});

describe('contest extension activation', () => {
    it('creates the contest output channel and tree view, then registers contest commands', async () => {
        const context = { subscriptions };

        await extensionModule.activate(context);

        expect(createOutputChannel).toHaveBeenCalledWith('AutoJudge Contest');
        expect(createTreeView).toHaveBeenCalledWith('autojudgeContest.explorer', expect.objectContaining({
            showCollapseAll: true,
            treeDataProvider: expect.any(Object),
        }));
        expect(registeredCommands.map(({ command }) => command)).toEqual([
            'autojudgeContest.loginTeam',
            'autojudgeContest.logoutTeam',
            'autojudgeContest.refreshTree',
            'autojudgeContest.openProblem',
            'autojudgeContest.submitActiveFile',
            'autojudgeContest.exportPublicCases',
            'autojudgeContest.openSubmission',
        ]);
        expect(context.subscriptions).toHaveLength(9);
    });

    it('exports a deactivate function', () => {
        expect(typeof extensionModule.deactivate).toBe('function');
    });
});

describe('contest manifest contract', () => {
    it('declares the sidebar container, contest view, and contest settings', async () => {
        const packagePath = path.resolve(
            path.dirname(fileURLToPath(import.meta.url)),
            '..',
            'package.json',
        );
        const manifest = JSON.parse(await import('node:fs/promises').then(fs => fs.readFile(packagePath, 'utf8')));

        expect(manifest.name).toBe('autojudge-contest');
        expect(manifest.main).toBe('./src/extension.js');
        expect(manifest.contributes.viewsContainers.activitybar).toEqual(expect.arrayContaining([
            expect.objectContaining({
                id: 'autojudgeContest',
                title: 'AutoJudge Contest',
            }),
        ]));
        expect(manifest.contributes.views.autojudgeContest).toEqual(expect.arrayContaining([
            expect.objectContaining({
                id: 'autojudgeContest.explorer',
                name: 'Contest',
            }),
        ]));
        expect(manifest.contributes.commands.map(command => command.command)).toEqual(expect.arrayContaining([
            'autojudgeContest.loginTeam',
            'autojudgeContest.logoutTeam',
            'autojudgeContest.refreshTree',
            'autojudgeContest.openProblem',
            'autojudgeContest.submitActiveFile',
            'autojudgeContest.exportPublicCases',
            'autojudgeContest.openSubmission',
        ]));
        expect(manifest.contributes.configuration.properties).toEqual(expect.objectContaining({
            'autojudgeContest.baseUrl': expect.any(Object),
            'autojudgeContest.pollIntervalMs': expect.any(Object),
        }));
    });
});