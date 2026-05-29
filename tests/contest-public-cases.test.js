import { describe, expect, it } from 'vitest';

import { extractPublicCases } from '../src/workspace/contest-public-cases.js';

describe('contest public testcase extraction', () => {
    it('reads explicit publicCases arrays from the problem payload', () => {
        expect(extractPublicCases({
            publicCases: [
                {
                    input: '1 2\n',
                    output: '3\n',
                },
            ],
        })).toEqual([
            {
                input: '1 2\n',
                output: '3\n',
            },
        ]);
    });

    it('treats empty-string explicit public case objects as valid sample content', () => {
        expect(extractPublicCases({
            publicCases: [
                {
                    input: '',
                    output: '',
                },
            ],
        })).toEqual([
            {
                input: '',
                output: '',
            },
        ]);
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

    it('treats empty-string top-level API input and output fields as valid sample content', () => {
        expect(extractPublicCases({
            id: 12,
            title: 'Echo',
            input: '',
            output: '',
        })).toEqual([
            {
                input: '',
                output: '',
            },
        ]);
    });

    it('ignores malformed top-level API fields without crashing', () => {
        expect(extractPublicCases({
            id: 11,
            title: 'Broken sample',
            input: { text: '1 2\n' },
            output: '3\n',
        })).toEqual([]);
    });

    it('filters generic testcase arrays down to public entries only', () => {
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
        })).toEqual([
            {
                input: '1\n',
                output: '1\n',
            },
        ]);
    });

    it('prefers explicit public-case collections over mixed top-level API fields', () => {
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
                input: '1 2\n',
                output: '3\n',
            },
        ]);
    });

    it('keeps explicit empty-string public cases ahead of mixed top-level fallback fields', () => {
        expect(extractPublicCases({
            input: 'fallback input\n',
            output: 'fallback output\n',
            publicCases: [
                {
                    input: '',
                    output: '',
                },
            ],
        })).toEqual([
            {
                input: '',
                output: '',
            },
        ]);
    });
});