import * as vscode from 'vscode';
import { ContestSubmissionWorkspace } from './contest-submission-workspace.js';
import { normalizeBaseUrl } from './contest-api.js';
import { createContestController } from './contest-controller.js';
import * as contestSession from './contest-session.js';
import { COMMANDS } from './constants.js';

/**
 * Register contest commands and keep the multi-step contest behavior inside the
 * controller rather than in VS Code command glue.
 * @param {object} options
 * @param {import('vscode').ExtensionContext} options.context
 * @param {import('./submissions-tree-provider.js').SubmissionsViewProvider} options.submissionsViewProvider
 * @param {import('./contest-tree-provider.js').ContestTreeProvider} options.treeProvider
 * @param {import('vscode').OutputChannel} options.outputChannel
 * @returns {import('vscode').Disposable[]}
 */
export function registerContestCommands({ context, submissionsViewProvider, treeProvider, outputChannel }) {
    const submissionWorkspace = new ContestSubmissionWorkspace();
    const controller = createContestController({
        context,
        openTextDocument: (options) => vscode.workspace.openTextDocument(options),
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
        showInformationMessage: (message) => vscode.window.showInformationMessage(message),
        showTextDocument: (document, options) => vscode.window.showTextDocument(document, options),
        showErrorMessage: (message) => vscode.window.showErrorMessage(message),
        submissionWorkspace,
        submissionsViewProvider,
        treeProvider,
    });

    return [
        vscode.commands.registerCommand(COMMANDS.LOGIN_TEAM, () => controller.loginTeam()),
        vscode.commands.registerCommand(COMMANDS.LOGOUT_TEAM, () => controller.logoutTeam()),
        vscode.commands.registerCommand(COMMANDS.REFRESH_TREE, () => controller.refreshTree()),
        vscode.commands.registerCommand(COMMANDS.OPEN_PROBLEM, (item) => controller.openProblem(item?.problem ?? item)),
        vscode.commands.registerCommand(COMMANDS.SUBMIT_ACTIVE_FILE, (item) => controller.submitActiveFile(item?.problem ?? item)),
        vscode.commands.registerCommand(COMMANDS.EXPORT_PUBLIC_CASES, (item) => controller.exportPublicCases(item?.problem ?? item)),
        vscode.commands.registerCommand(COMMANDS.OPEN_SUBMISSION, (item) => controller.openSubmission(item?.submission ?? item)),
        vscode.commands.registerCommand(COMMANDS.CREATE_TEST_CASES, (item) => controller.createTestCases(item?.problem ?? item)),
        vscode.commands.registerCommand(COMMANDS.SELECT_SUBMISSION_PROBLEM, (item) => controller.selectSubmissionProblem(item?.problem ?? item)),
    ];
}