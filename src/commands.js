import * as vscode from 'vscode';
import { normalizeBaseUrl } from './contest-api.js';
import { createContestController } from './contest-controller.js';
import * as contestSession from './contest-session.js';
import { COMMANDS } from './constants.js';

/**
 * Register the initial contest commands while the deeper auth and submission
 * workflows are implemented incrementally.
 * @param {object} options
 * @param {import('vscode').ExtensionContext} options.context
 * @param {import('./contest-tree-provider.js').ContestTreeProvider} options.treeProvider
 * @param {import('vscode').OutputChannel} options.outputChannel
 * @returns {import('vscode').Disposable[]}
 */
export function registerContestCommands({ context, treeProvider, outputChannel }) {
    const controller = createContestController({
        context,
        outputChannel,
        promptTeamCredentials: async () => {
            const teamId = await vscode.window.showInputBox({
                ignoreFocusOut: true,
                placeHolder: 'team-hash-or-id',
                prompt: 'Enter the AutoJudge contest team id or hash.',
                title: 'AutoJudge Contest Login',
            });

            if (!teamId) {
                return null;
            }

            const password = await vscode.window.showInputBox({
                ignoreFocusOut: true,
                password: true,
                placeHolder: '123456',
                prompt: 'Enter the AutoJudge team password.',
                title: 'AutoJudge Contest Login',
            });

            if (!password) {
                return null;
            }

            return { password, teamId };
        },
        resolveBaseUrl: () => normalizeBaseUrl(
            vscode.workspace.getConfiguration('autojudgeContest').get('baseUrl', 'https://api.autojudge.io')
        ),
        sessionApi: contestSession,
        setContext: (key, value) => vscode.commands.executeCommand('setContext', key, value),
        showErrorMessage: (message) => vscode.window.showErrorMessage(message),
        treeProvider,
    });

    const showPlaceholder = async (message) => {
        outputChannel.appendLine(message);
        await vscode.window.showInformationMessage(message);
    };

    return [
        vscode.commands.registerCommand(COMMANDS.LOGIN_TEAM, () => controller.loginTeam()),
        vscode.commands.registerCommand(COMMANDS.LOGOUT_TEAM, () => controller.logoutTeam()),
        vscode.commands.registerCommand(COMMANDS.REFRESH_TREE, () => controller.refreshTree()),
        vscode.commands.registerCommand(COMMANDS.OPEN_PROBLEM, async () => {
            await showPlaceholder('Problem preview is not implemented yet.');
        }),
        vscode.commands.registerCommand(COMMANDS.SUBMIT_ACTIVE_FILE, async () => {
            await showPlaceholder('Active-file submission is not implemented yet.');
        }),
        vscode.commands.registerCommand(COMMANDS.EXPORT_PUBLIC_CASES, async () => {
            await showPlaceholder('Public testcase export is not implemented yet.');
        }),
        vscode.commands.registerCommand(COMMANDS.OPEN_SUBMISSION, async () => {
            await showPlaceholder('Submission detail is not implemented yet.');
        }),
    ];
}