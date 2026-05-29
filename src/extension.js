import * as vscode from 'vscode';
import { registerContestCommands } from './commands.js';
import { CONTEST_VIEW_ID, CONTEXT_KEYS, SUBMISSIONS_VIEW_ID } from './constants.js';
import { ContestTreeProvider } from './contest-tree-provider.js';
import { SubmissionsViewProvider } from './submissions-tree-provider.js';

/**
 * Activate the AutoJudge Contest extension and register the sidebar surface.
 * @param {import('vscode').ExtensionContext} context
 */
export async function activate(context) {
    const outputChannel = vscode.window.createOutputChannel('AutoJudge Contest');
    const treeProvider = new ContestTreeProvider();
    const submissionsViewProvider = new SubmissionsViewProvider();
    await vscode.commands.executeCommand('setContext', CONTEXT_KEYS.STATE, 'loggedOut');
    await vscode.commands.executeCommand('setContext', CONTEXT_KEYS.HAS_SELECTED_SUBMISSION_PROBLEM, false);
    const treeView = vscode.window.createTreeView(CONTEST_VIEW_ID, {
        showCollapseAll: true,
        treeDataProvider: treeProvider,
    });
    const submissionsView = vscode.window.createTreeView(SUBMISSIONS_VIEW_ID, {
        showCollapseAll: true,
        treeDataProvider: submissionsViewProvider,
    });

    const commandDisposables = registerContestCommands({
        context,
        submissionsViewProvider,
        treeProvider,
        outputChannel,
    });

    context.subscriptions.push(outputChannel, treeView, submissionsView, ...commandDisposables);
}

/**
 * Deactivate the extension.
 */
export function deactivate() {}
