import { describe, expect, it } from 'vitest';
import { ContestTreeProvider } from '../src/contest-tree-provider.js';
import { COMMANDS, TREE_CONTEXT } from '../src/constants.js';

describe('contest tree provider', () => {
    it('shows a login action while no contest snapshot is loaded', () => {
        const provider = new ContestTreeProvider();

        expect(provider.getChildren()).toEqual([
            expect.objectContaining({
                command: expect.objectContaining({
                    command: COMMANDS.LOGIN_TEAM,
                }),
                contextValue: TREE_CONTEXT.LOGIN,
                label: 'Login to AutoJudge',
            }),
        ]);
    });

    it('renders the contest header, problems, and per-problem submissions after login', () => {
        const provider = new ContestTreeProvider();

        provider.setSnapshot({
            problems: [
                { id: 1, hash: 'prob-a', order: 1, title: 'A + B' },
                { id: 2, hash: 'prob-b', order: 2, title: 'Binary Search' },
            ],
            submissions: [
                {
                    id: 11,
                    status: 'WRONG_ANSWER',
                    submittedAt: '2026-05-28T03:00:00.000Z',
                    problem: { id: 1, title: 'A + B' },
                },
                {
                    id: 12,
                    status: 'ACCEPTED',
                    submittedAt: '2026-05-28T03:10:00.000Z',
                    problem: { id: 1, title: 'A + B' },
                },
            ],
            team: {
                contest: {
                    id: 4,
                    name: 'Regional Final',
                },
                name: 'Bits',
            },
            token: 'jwt-token',
        });

        const rootChildren = provider.getChildren();

        expect(rootChildren).toEqual([
            expect.objectContaining({
                label: 'Regional Final',
            }),
            expect.objectContaining({
                contextValue: TREE_CONTEXT.PROBLEM,
                description: '2 submissions',
                label: 'A + B',
            }),
            expect.objectContaining({
                contextValue: TREE_CONTEXT.PROBLEM,
                description: '0 submissions',
                label: 'Binary Search',
            }),
        ]);

        const problemChildren = provider.getChildren(rootChildren[1]);
        expect(problemChildren).toEqual([
            expect.objectContaining({
                command: expect.objectContaining({
                    command: COMMANDS.OPEN_SUBMISSION,
                }),
                contextValue: TREE_CONTEXT.SUBMISSION,
                description: 'ACCEPTED',
                label: '#12',
            }),
            expect.objectContaining({
                description: 'WRONG_ANSWER',
                label: '#11',
            }),
        ]);
    });
});