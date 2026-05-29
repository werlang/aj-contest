import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const vscodeState = vi.hoisted(() => {
    let activeTextEditor = null;
    let testcasePath = '';

    return {
        createDirectory: vi.fn(),
        readDirectory: vi.fn(),
        writeFile: vi.fn(),
        getActiveTextEditor() {
            return activeTextEditor;
        },
        getTestcasePath() {
            return testcasePath;
        },
        setActiveTextEditor(editor) {
            activeTextEditor = editor;
        },
        setTestcasePath(value) {
            testcasePath = value;
        },
    };
});

vi.mock('vscode', () => ({
    FileType: {
        File: 1,
        Directory: 2,
    },
    Uri: {
        file: fsPath => ({
            fsPath: path.normalize(fsPath),
            scheme: 'file',
        }),
    },
    window: {
        get activeTextEditor() {
            return vscodeState.getActiveTextEditor();
        },
    },
    workspace: {
        fs: {
            createDirectory: vscodeState.createDirectory,
            readDirectory: vscodeState.readDirectory,
            writeFile: vscodeState.writeFile,
        },
        getConfiguration: () => ({
            get: (_key, fallbackValue = '') => {
                const value = vscodeState.getTestcasePath();
                return value === '' ? fallbackValue : value;
            },
        }),
    },
}), { virtual: true });

import { ContestSubmissionWorkspace } from '../src/contest-submission-workspace.js';

function createActiveEditor(filePath) {
    const normalizedPath = path.normalize(filePath);

    return {
        document: {
            fileName: normalizedPath,
            getText: () => '#include <iostream>\n',
            isUntitled: false,
            uri: {
                fsPath: normalizedPath,
                scheme: 'file',
            },
        },
    };
}

function getWrittenText(callIndex) {
    return Buffer.from(vscodeState.writeFile.mock.calls[callIndex][1]).toString('utf8');
}

describe('contest submission workspace', () => {
    beforeEach(() => {
        vscodeState.createDirectory.mockReset();
        vscodeState.readDirectory.mockReset();
        vscodeState.writeFile.mockReset();
        vscodeState.readDirectory.mockResolvedValue([]);
        vscodeState.setTestcasePath('');
        vscodeState.setActiveTextEditor(createActiveEditor('/workspace/src/main.cpp'));
    });

    it('exports public cases as numbered .in/.out files in the active file directory by default', async () => {
        const workspace = new ContestSubmissionWorkspace();

        const result = await workspace.exportPublicCases(
            { hash: 'Prob A', id: 1 },
            [
                { input: '1 2\n', output: '3\n' },
                { input: '4 5\n', output: '9\n' },
            ],
        );

        const destinationPath = path.normalize('/workspace/src');
        expect(vscodeState.createDirectory).toHaveBeenCalledWith(expect.objectContaining({
            fsPath: destinationPath,
        }));
        expect(vscodeState.writeFile.mock.calls.map(([uri]) => uri.fsPath)).toEqual([
            path.join(destinationPath, 'prob-a-public-01.in'),
            path.join(destinationPath, 'prob-a-public-01.out'),
            path.join(destinationPath, 'prob-a-public-02.in'),
            path.join(destinationPath, 'prob-a-public-02.out'),
        ]);
        expect(getWrittenText(0)).toBe('1 2\n');
        expect(getWrittenText(1)).toBe('3\n');
        expect(getWrittenText(2)).toBe('4 5\n');
        expect(getWrittenText(3)).toBe('9\n');
        expect(result).toEqual({
            destinationUri: expect.objectContaining({ fsPath: destinationPath }),
            writtenPairs: [
                {
                    inputUri: expect.objectContaining({ fsPath: path.join(destinationPath, 'prob-a-public-01.in') }),
                    outputUri: expect.objectContaining({ fsPath: path.join(destinationPath, 'prob-a-public-01.out') }),
                },
                {
                    inputUri: expect.objectContaining({ fsPath: path.join(destinationPath, 'prob-a-public-02.in') }),
                    outputUri: expect.objectContaining({ fsPath: path.join(destinationPath, 'prob-a-public-02.out') }),
                },
            ],
        });
    });

    it('creates the next custom testcase pair in the configured testcase directory', async () => {
        vscodeState.setTestcasePath('../cases');
        vscodeState.readDirectory.mockResolvedValue([
            ['prob-a-custom-01.in', 1],
            ['prob-a-custom-01.out', 1],
            ['prob-a-custom-02.in', 1],
            ['notes.txt', 1],
        ]);

        const workspace = new ContestSubmissionWorkspace();
        const result = await workspace.createTestCases({ hash: 'Prob A', id: 1 });

        const destinationPath = path.normalize('/workspace/cases');
        expect(vscodeState.createDirectory).toHaveBeenCalledWith(expect.objectContaining({
            fsPath: destinationPath,
        }));
        expect(vscodeState.readDirectory).toHaveBeenCalledWith(expect.objectContaining({
            fsPath: destinationPath,
        }));
        expect(vscodeState.writeFile.mock.calls.map(([uri]) => uri.fsPath)).toEqual([
            path.join(destinationPath, 'prob-a-custom-03.in'),
            path.join(destinationPath, 'prob-a-custom-03.out'),
        ]);
        expect(getWrittenText(0)).toBe('');
        expect(getWrittenText(1)).toBe('');
        expect(result).toEqual({
            destinationUri: expect.objectContaining({ fsPath: destinationPath }),
            inputUri: expect.objectContaining({ fsPath: path.join(destinationPath, 'prob-a-custom-03.in') }),
            outputUri: expect.objectContaining({ fsPath: path.join(destinationPath, 'prob-a-custom-03.out') }),
        });
    });

    it('skips existing 3-digit custom testcase numbers when allocating the next pair', async () => {
        vscodeState.setTestcasePath('../cases');
        vscodeState.readDirectory.mockResolvedValue([
            ...Array.from({ length: 100 }, (_value, index) => {
                const caseNumber = String(index + 1).padStart(2, '0');
                return [`prob-a-custom-${caseNumber}.in`, 1];
            }),
            ['prob-a-custom-99.out', 1],
            ['prob-a-custom-100.out', 1],
        ]);

        const workspace = new ContestSubmissionWorkspace();
        const result = await workspace.createTestCases({ hash: 'Prob A', id: 1 });

        const destinationPath = path.normalize('/workspace/cases');
        expect(vscodeState.writeFile.mock.calls.map(([uri]) => uri.fsPath)).toEqual([
            path.join(destinationPath, 'prob-a-custom-101.in'),
            path.join(destinationPath, 'prob-a-custom-101.out'),
        ]);
        expect(result).toEqual({
            destinationUri: expect.objectContaining({ fsPath: destinationPath }),
            inputUri: expect.objectContaining({ fsPath: path.join(destinationPath, 'prob-a-custom-101.in') }),
            outputUri: expect.objectContaining({ fsPath: path.join(destinationPath, 'prob-a-custom-101.out') }),
        });
    });
});