import { describe, expect, it } from 'vitest';

import { extractPublicCases } from '../src/workspace/contest-public-cases.js';

describe('contest public testcase extraction', () => {
    it('reads paired input/output arrays from the problem payload', () => {
        expect(extractPublicCases({
            input: ['1 2\n'],
            output: ['3\n'],
        })).toEqual([
            {
                input: '1 2\n',
                output: '3\n',
            },
        ]);
    });

    it('ignores legacy publicCases objects that are no longer read from the runtime payload', () => {
        expect(extractPublicCases({
            publicCases: [
                {
                    input: '',
                    output: '',
                },
            ],
        })).toEqual([]);
    });

    it('builds one exported pair from top-level API input and output fields', () => {
        expect(extractPublicCases({
            id: 10,
            title: 'A + B',
            input: '1 2\n',
            output: '3\n',
        })).toEqual([
            {
                input: '1 2\n',
                output: '3\n',
            },
        ]);
    });

    it('ignores empty-string top-level API input and output fields', () => {
        expect(extractPublicCases({
            id: 12,
            title: 'Echo',
            input: '',
            output: '',
        })).toEqual([]);
    });

    it('ignores malformed top-level API fields without crashing', () => {
        expect(extractPublicCases({
            id: 11,
            title: 'Broken sample',
            input: { text: '1 2\n' },
            output: '3\n',
        })).toEqual([]);
    });

    it('ignores unsupported generic testcase arrays', () => {
        expect(extractPublicCases({
            testcases: [
                {
                    input: '1\n',
                    output: '1\n',
                    public: true,
                },
                {
                    input: '2\n',
                    output: '4\n',
                    public: false,
                },
            ],
        })).toEqual([]);
    });

    it('falls back to top-level API fields when legacy publicCases are also present', () => {
        expect(extractPublicCases({
            input: 'fallback input\n',
            output: 'fallback output\n',
            publicCases: [
                {
                    input: '1 2\n',
                    output: '3\n',
                },
            ],
        })).toEqual([
            {
                input: 'fallback input\n',
                output: 'fallback output\n',
            },
        ]);
    });

    it('parses JSON-encoded input and output arrays from API fields', () => {
        expect(extractPublicCases({
            input: '["1 2\\n", "4 5\\n"]',
            output: '["3\\n", "9\\n"]',
        })).toEqual([
            {
                input: '1 2\n',
                output: '3\n',
            },
            {
                input: '4 5\n',
                output: '9\n',
            },
        ]);
    });
});