import * as vscode from 'vscode';
import { registerContestCommands } from './commands.js';
import { CONTEST_VIEW_ID } from './constants.js';
import { ContestTreeProvider } from './contest-tree-provider.js';

/**
 * Activate the AutoJudge Contest extension and register the sidebar surface.
 * @param {import('vscode').ExtensionContext} context
 */
export function activate(context) {
    const outputChannel = vscode.window.createOutputChannel('AutoJudge Contest');
    const treeProvider = new ContestTreeProvider();
    const treeView = vscode.window.createTreeView(CONTEST_VIEW_ID, {
        showCollapseAll: true,
        treeDataProvider: treeProvider,
    });

    const commandDisposables = registerContestCommands({
        context,
        treeProvider,
        outputChannel,
    });

    context.subscriptions.push(outputChannel, treeView, ...commandDisposables);
}

/**
 * Deactivate the extension.
 */
export function deactivate() {}
