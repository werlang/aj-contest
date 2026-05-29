import * as vscode from 'vscode';
import { registerContestCommands } from './commands/contest-commands.js';
import { CONTEST_VIEW_ID, CONTEXT_KEYS, TEAMS_VIEW_ID } from './constants.js';
import { ContestTreeProvider } from './providers/contest-tree-provider.js';
import { TeamsStandingsProvider } from './providers/teams-tree-provider.js';

/**
 * Activate the AutoJudge Contest extension and register the sidebar surface.
 * @param {import('vscode').ExtensionContext} context
 */
export async function activate(context) {
    const outputChannel = vscode.window.createOutputChannel('AutoJudge Contest');
    const treeProvider = new ContestTreeProvider();
    const teamsStandingsProvider = new TeamsStandingsProvider();
    await vscode.commands.executeCommand('setContext', CONTEXT_KEYS.STATE, 'loggedOut');
    const treeView = vscode.window.createTreeView(CONTEST_VIEW_ID, {
        showCollapseAll: true,
        treeDataProvider: treeProvider,
    });
    const teamsView = vscode.window.createTreeView(TEAMS_VIEW_ID, {
        showCollapseAll: true,
        treeDataProvider: teamsStandingsProvider,
    });

    const commandDisposables = registerContestCommands({
        context,
        teamsStandingsProvider,
        treeProvider,
        outputChannel,
    });

    context.subscriptions.push(outputChannel, treeProvider, treeView, teamsView, ...commandDisposables);
}

/**
 * Deactivate the extension.
 */
export function deactivate() {}
