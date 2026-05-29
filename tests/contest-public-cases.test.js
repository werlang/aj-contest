import { describe, expect, it } from 'vitest';

import { extractPublicCases } from '../src/contest-public-cases.js';

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
});