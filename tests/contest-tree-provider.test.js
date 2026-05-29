import { describe, expect, it, vi } from 'vitest';

vi.mock('vscode', () => ({
    ThemeColor: class ThemeColor {
        constructor(id) {
            this.id = id;
        }
    },
    ThemeIcon: class ThemeIcon {
        constructor(id, color) {
            this.id = id;
            this.color = color;
        }
    },
}), { virtual: true });

import { ContestTreeProvider } from '../src/contest-tree-provider.js';
import { TREE_CONTEXT } from '../src/constants.js';

describe('contest tree provider', () => {
    it('returns an empty tree while no contest snapshot is loaded so the welcome action can render', () => {
        const provider = new ContestTreeProvider();

        expect(provider.getChildren()).toEqual([]);
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
                contextValue: TREE_CONTEXT.SUBMISSION,
                description: 'Accepted',
                iconPath: expect.objectContaining({
                    color: expect.objectContaining({
                        id: 'testing.iconPassed',
                    }),
                    id: 'pass-filled',
                }),
                label: '#12',
            }),
            expect.objectContaining({
                description: 'Wrong Answer',
                iconPath: expect.objectContaining({
                    color: expect.objectContaining({
                        id: 'testing.iconFailed',
                    }),
                    id: 'error',
                }),
                label: '#11',
            }),
        ]);
    });
});