import path from 'path';
import * as vscode from 'vscode';
import { SUPPORTED_EXTENSIONS } from './config.js';
import { resolveConfiguredPathUri } from './path-utils.js';

const textEncoder = new TextEncoder();

/**
 * Own workspace-facing file and editor behavior for contest submissions and
 * testcase-file workflows.
 */
export class ContestSubmissionWorkspace {
    /**
     * Read the active saved source file that will be submitted.
     * @returns {Promise<{ filename: string, sourceCode: string, uri: import('vscode').Uri }>}
     */
    async readActiveSourceFile() {
        const document = this.requireActiveSourceDocument();

        return {
            filename: path.basename(document.fileName),
            sourceCode: document.getText() || ' ',
            uri: document.uri,
        };
    }

    /**
     * Export public testcase pairs into the maintained AutoJudge testcase layout.
     * @param {object} problem
     * @param {{ input: string, output: string }[]} publicCases
     * @returns {Promise<{ destinationUri: import('vscode').Uri, writtenPairs: { inputUri: import('vscode').Uri, outputUri: import('vscode').Uri }[] }>}
     */
    async exportPublicCases(problem, publicCases) {
        const { destinationUri } = await this.resolveTestcaseDirectory();
        await vscode.workspace.fs.createDirectory(destinationUri);

        const writtenPairs = [];
        for (const [index, testcase] of publicCases.entries()) {
            const baseName = `${getProblemFileStem(problem)}-public-${String(index + 1).padStart(2, '0')}`;
            const inputUri = vscode.Uri.file(path.join(destinationUri.fsPath, `${baseName}.in`));
            const outputUri = vscode.Uri.file(path.join(destinationUri.fsPath, `${baseName}.out`));
            await writeUtf8File(inputUri, testcase.input);
            await writeUtf8File(outputUri, testcase.output);
            writtenPairs.push({ inputUri, outputUri });
        }

        return {
            destinationUri,
            writtenPairs,
        };
    }

    /**
     * Create an empty testcase pair that matches the AutoJudge base extension layout.
     * @param {object} problem
     * @returns {Promise<{ destinationUri: import('vscode').Uri, inputUri: import('vscode').Uri, outputUri: import('vscode').Uri }>}
     */
    async createTestCases(problem) {
        const { destinationUri } = await this.resolveTestcaseDirectory();
        await vscode.workspace.fs.createDirectory(destinationUri);

        const nextIndex = await this.getNextCustomCaseIndex(destinationUri, problem);
        const baseName = `${getProblemFileStem(problem)}-custom-${String(nextIndex).padStart(2, '0')}`;
        const inputUri = vscode.Uri.file(path.join(destinationUri.fsPath, `${baseName}.in`));
        const outputUri = vscode.Uri.file(path.join(destinationUri.fsPath, `${baseName}.out`));
        await writeUtf8File(inputUri, '');
        await writeUtf8File(outputUri, '');

        return {
            destinationUri,
            inputUri,
            outputUri,
        };
    }

    /**
     * Resolve the testcase directory using the same `autojudge.testcasePath`
     * convention as the maintained base extension.
     * @returns {Promise<{ destinationUri: import('vscode').Uri, sourceUri: import('vscode').Uri }>}
     */
    async resolveTestcaseDirectory() {
        const document = this.requireActiveSourceDocument();
        const configuredTestcasePath = vscode.workspace.getConfiguration('autojudge').get('testcasePath', '').trim();
        const destinationUri = configuredTestcasePath
            ? resolveConfiguredPathUri(vscode, document.uri, configuredTestcasePath, 'autojudge.testcasePath')
            : vscode.Uri.file(path.dirname(document.uri.fsPath));

        return {
            destinationUri,
            sourceUri: document.uri,
        };
    }

    /**
     * Pick the next available custom testcase index for the problem.
     * @param {import('vscode').Uri} destinationUri
     * @param {object} problem
     * @returns {Promise<number>}
     */
    async getNextCustomCaseIndex(destinationUri, problem) {
        const prefix = `${getProblemFileStem(problem)}-custom-`;
        const entries = await this.readDirectory(destinationUri);
        const usedIndices = entries
            .map(([name]) => name)
            .filter(name => name.startsWith(prefix) && name.endsWith('.in'))
            .map(name => Number(name.slice(prefix.length, -'.in'.length)))
            .filter(Number.isFinite);

        let nextIndex = 1;
        while (usedIndices.includes(nextIndex)) {
            nextIndex += 1;
        }

        return nextIndex;
    }

    /**
     * Read directory contents and treat missing folders as empty.
     * @param {import('vscode').Uri} uri
     * @returns {Promise<[string, import('vscode').FileType][]>}
     */
    async readDirectory(uri) {
        try {
            return await vscode.workspace.fs.readDirectory(uri);
        }
        catch {
            return [];
        }
    }

    /**
     * Require the active editor to point at a saved supported source file.
     * @returns {import('vscode').TextDocument}
     */
    requireActiveSourceDocument() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('Open a saved source file before using contest submissions.');
        }

        const document = editor.document;
        if (document.isUntitled || document.uri.scheme !== 'file') {
            throw new Error('AutoJudge Contest only supports saved files on disk.');
        }

        const extension = path.extname(document.fileName).toLowerCase();
        if (!SUPPORTED_EXTENSIONS.includes(extension)) {
            throw new Error(`Unsupported AutoJudge file extension: ${extension || '(none)'}.`);
        }

        return document;
    }
}

/**
 * Write UTF-8 text to a workspace file.
 * @param {import('vscode').Uri} uri
 * @param {string} content
 * @returns {Promise<void>}
 */
async function writeUtf8File(uri, content) {
    await vscode.workspace.fs.writeFile(uri, textEncoder.encode(content));
}

/**
 * Build a stable testcase filename stem for the selected contest problem.
 * @param {object} problem
 * @returns {string}
 */
function getProblemFileStem(problem) {
    const rawStem = problem?.hash?.toString().trim() || `problem-${problem?.id ?? 'unknown'}`;
    const normalizedStem = rawStem.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return normalizedStem || `problem-${problem?.id ?? 'unknown'}`;
}